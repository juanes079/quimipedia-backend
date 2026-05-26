import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Mailjet from 'node-mailjet';
import prisma from '../lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _mj: any = null;
const getMj = () => {
  if (!_mj) _mj = new Mailjet({ apiKey: process.env.MAILJET_API_KEY ?? '', apiSecret: process.env.MAILJET_SECRET_KEY ?? '' });
  return _mj;
};

async function enviarCorreoReset(to: string, nombre: string, link: string): Promise<void> {
  if (!process.env.MAILJET_API_KEY) {
    console.warn('⚠️  MAILJET_API_KEY no configurada — correo NO enviado a:', to);
    return;
  }
  try {
    await getMj().post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: { Email: process.env.EMAIL_USER ?? 'noreply@quimipedia.app', Name: 'QuimiPedia' },
        To:   [{ Email: to }],
        Subject: '🧪 Recupera tu contraseña — QuimiPedia',
        HTMLPart: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#10b981;">🧪 QuimiPedia</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${link}" style="background:#10b981;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
                Restablecer contraseña
              </a>
            </div>
            <p style="color:#718096;font-size:13px;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.</p>
            <p style="color:#a0aec0;font-size:12px;">O copia este link: ${link}</p>
          </div>
        `
      }]
    });
    console.log('✅ Correo de reset enviado a:', to);
  } catch (e: any) {
    console.error('❌ Error enviando correo a', to, '—', e?.response?.body ?? e.message);
    throw e;
  }
}

function generarToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
}

export async function registro(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, nombre } = req.body;
    if (!email?.trim() || !password || !nombre?.trim()) {
      res.status(400).json({ error: 'email, password y nombre son requeridos' }); return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' }); return;
    }

    const existe = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existe) { res.status(409).json({ error: 'El email ya está registrado' }); return; }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email.trim().toLowerCase(), password: hash, nombre: nombre.trim() },
    });

    res.status(201).json({
      token: generarToken(user.id),
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (e) { next(e); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'email y password son requeridos' }); return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) { res.status(401).json({ error: 'Credenciales incorrectas' }); return; }

    const valido = await bcrypt.compare(password, user.password);
    if (!valido) { res.status(401).json({ error: 'Credenciales incorrectas' }); return; }

    const token = generarToken(user.id);
    res.json({
      success: true,
      token,
      usuario: {
        id:           user.id,
        email:        user.email,
        nombre:       user.nombre,
        rol:          'ADMIN',
        empresaNombre: 'QuimiPedia',
        permisos:     []
      }
    });
  } catch (e) { next(e); }
}

export async function perfil(req: Request & { userId?: number }, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, nombre: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json(user);
  } catch (e) { next(e); }
}

export async function olvidasteContrasena(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email?.trim()) { res.status(400).json({ error: 'El correo es requerido' }); return; }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      res.json({ mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.' }); return;
    }

    const token  = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data:  { resetToken: token, resetTokenExpira: expira },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://quimipedia-frontend.vercel.app';
    const link        = `${frontendUrl}/restablecer-contrasena?token=${token}`;

    await enviarCorreoReset(user.email, user.nombre, link);

    res.json({ mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
  } catch (e) { next(e); }
}

export async function restablecerContrasena(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, nuevaContrasena } = req.body;
    if (!token || !nuevaContrasena) {
      res.status(400).json({ error: 'Token y nueva contraseña son requeridos' }); return;
    }
    if (nuevaContrasena.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' }); return;
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpira: { gt: new Date() } },
    });

    if (!user) { res.status(400).json({ error: 'El enlace es inválido o ha expirado' }); return; }

    await prisma.user.update({
      where: { id: user.id },
      data:  {
        password:        await bcrypt.hash(nuevaContrasena.trim(), 10),
        resetToken:      null,
        resetTokenExpira: null,
      },
    });

    res.json({ mensaje: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
  } catch (e) { next(e); }
}
