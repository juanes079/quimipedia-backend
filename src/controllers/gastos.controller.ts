import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export async function listar(_req: Request, res: Response, next: NextFunction) {
  try {
    const gastos = await prisma.gasto.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(gastos);
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const gasto = await prisma.gasto.findUnique({ where: { id: Number(req.params.id) } });
    if (!gasto) { res.status(404).json({ error: 'Gasto no encontrado' }); return; }
    res.json(gasto);
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const { concepto, monto } = req.body;
    if (!concepto?.trim() || monto == null || monto <= 0) {
      res.status(400).json({ error: 'concepto y monto (> 0) son requeridos' }); return;
    }
    const gasto = await prisma.gasto.create({ data: { concepto: concepto.trim(), monto } });
    res.status(201).json(gasto);
  } catch (e) { next(e); }
}

export async function actualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const existe = await prisma.gasto.findUnique({ where: { id } });
    if (!existe) { res.status(404).json({ error: 'Gasto no encontrado' }); return; }

    const { concepto, monto } = req.body;
    if (monto !== undefined && monto <= 0) {
      res.status(400).json({ error: 'monto debe ser > 0' }); return;
    }
    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        ...(concepto !== undefined && { concepto: concepto.trim() }),
        ...(monto    !== undefined && { monto }),
      },
    });
    res.json(gasto);
  } catch (e) { next(e); }
}

export async function eliminar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const existe = await prisma.gasto.findUnique({ where: { id } });
    if (!existe) { res.status(404).json({ error: 'Gasto no encontrado' }); return; }
    await prisma.gasto.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function totalGastos(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await prisma.gasto.aggregate({ _sum: { monto: true } });
    res.json({ total: result._sum.monto ?? 0 });
  } catch (e) { next(e); }
}
