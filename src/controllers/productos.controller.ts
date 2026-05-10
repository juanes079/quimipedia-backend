import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export async function listar(_req: Request, res: Response, next: NextFunction) {
  try {
    const productos = await prisma.producto.findMany({
      include: { ingredientes: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(productos);
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: Number(req.params.id) },
      include: { ingredientes: true },
    });
    if (!producto) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    res.json(producto);
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombre, tipo, color, stock, precioVenta, ingredientes } = req.body;
    if (!nombre?.trim() || !tipo?.trim()) {
      res.status(400).json({ error: 'nombre y tipo son requeridos' }); return;
    }
    const producto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(), tipo: tipo.trim(),
        color: color ?? '#3b82f6',
        stock: stock ?? 0,
        precioVenta: precioVenta ?? null,
        ingredientes: { create: ingredientes ?? [] },
      },
      include: { ingredientes: true },
    });
    res.status(201).json(producto);
  } catch (e) { next(e); }
}

export async function actualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { nombre, tipo, color, stock, precioVenta, ingredientes } = req.body;

    const existe = await prisma.producto.findUnique({ where: { id } });
    if (!existe) { res.status(404).json({ error: 'Producto no encontrado' }); return; }

    await prisma.ingrediente.deleteMany({ where: { productoId: id } });

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(tipo  && { tipo: tipo.trim() }),
        ...(color !== undefined && { color }),
        ...(stock !== undefined && { stock }),
        ...(precioVenta !== undefined && { precioVenta }),
        ...(ingredientes && { ingredientes: { create: ingredientes } }),
      },
      include: { ingredientes: true },
    });
    res.json(producto);
  } catch (e) { next(e); }
}

export async function eliminar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const existe = await prisma.producto.findUnique({ where: { id } });
    if (!existe) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    await prisma.producto.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function actualizarStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      res.status(400).json({ error: 'stock debe ser un número >= 0' }); return;
    }
    const producto = await prisma.producto.update({
      where: { id },
      data: { stock },
      include: { ingredientes: true },
    });
    res.json(producto);
  } catch (e) { next(e); }
}
