import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

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
