import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const router = Router();

function verificarClaveInterna(req: Request, res: Response, next: NextFunction): void {
  const clave = req.headers['x-internal-key'];
  const claveEsperada = process.env.INTERNAL_API_KEY || 'qp-internal-key-2025';
  if (!clave || clave !== claveEsperada) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  next();
}

router.post('/crear-interno', verificarClaveInterna, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, nombre } = req.body;

    if (!email?.trim() || !password || !nombre?.trim()) {
      res.status(400).json({ error: 'email, password y nombre son requeridos' });
      return;
    }

    const existe = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existe) {
      res.status(409).json({ error: 'El email ya está registrado en QuimiPedia' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email.trim().toLowerCase(), password: hash, nombre: nombre.trim() },
    });

    res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (e) { next(e); }
});

export default router;
