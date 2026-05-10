import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export async function listar(_req: Request, res: Response, next: NextFunction) {
  try {
    const materias = await prisma.materiaPrima.findMany({ orderBy: { nombre: 'asc' } });
    res.json(materias);
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const mp = await prisma.materiaPrima.findUnique({ where: { id: Number(req.params.id) } });
    if (!mp) { res.status(404).json({ error: 'Materia prima no encontrada' }); return; }
    res.json(mp);
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombre, unidad, precioUnitario, stockActual, stockMinimo, proveedorId } = req.body;
    if (!nombre?.trim() || !unidad?.trim() || precioUnitario == null) {
      res.status(400).json({ error: 'nombre, unidad y precioUnitario son requeridos' }); return;
    }
    const mp = await prisma.materiaPrima.create({
      data: {
        nombre: nombre.trim(), unidad: unidad.trim(),
        precioUnitario, stockActual: stockActual ?? 0,
        stockMinimo: stockMinimo ?? 0,
        proveedorId: proveedorId ?? null,
      },
    });
    res.status(201).json(mp);
  } catch (e) { next(e); }
}

export async function actualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const existe = await prisma.materiaPrima.findUnique({ where: { id } });
    if (!existe) { res.status(404).json({ error: 'Materia prima no encontrada' }); return; }

    const { nombre, unidad, precioUnitario, stockActual, stockMinimo, proveedorId } = req.body;
    const mp = await prisma.materiaPrima.update({
      where: { id },
      data: {
        ...(nombre        !== undefined && { nombre: nombre.trim() }),
        ...(unidad        !== undefined && { unidad: unidad.trim() }),
        ...(precioUnitario !== undefined && { precioUnitario }),
        ...(stockActual   !== undefined && { stockActual }),
        ...(stockMinimo   !== undefined && { stockMinimo }),
        ...(proveedorId   !== undefined && { proveedorId }),
      },
    });
    res.json(mp);
  } catch (e) { next(e); }
}

export async function eliminar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const existe = await prisma.materiaPrima.findUnique({ where: { id } });
    if (!existe) { res.status(404).json({ error: 'Materia prima no encontrada' }); return; }
    await prisma.materiaPrima.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function stocksBajos(_req: Request, res: Response, next: NextFunction) {
  try {
    const todas = await prisma.materiaPrima.findMany({ orderBy: { nombre: 'asc' } });
    res.json(todas.filter(mp => mp.stockActual <= mp.stockMinimo));
  } catch (e) { next(e); }
}
