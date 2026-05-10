import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@quimipedia.com' },
    update: {},
    create: {
      email: 'admin@quimipedia.com',
      password: await bcrypt.hash('admin123', 10),
      nombre: 'Administrador',
    },
  });

  const materias = [
    { nombre: 'Agua Desionizada',      unidad: 'ml', precioUnitario: 0.05, stockActual: 5000, stockMinimo: 1000 },
    { nombre: 'Agua',                  unidad: 'ml', precioUnitario: 0.02, stockActual: 800,  stockMinimo: 2000 },
    { nombre: 'Texapon 70%',           unidad: 'gr', precioUnitario: 0.85, stockActual: 500,  stockMinimo: 200  },
    { nombre: 'ADBS 96%',              unidad: 'gr', precioUnitario: 1.15, stockActual: 300,  stockMinimo: 150  },
    { nombre: 'Glicerina',             unidad: 'gr', precioUnitario: 2.30, stockActual: 200,  stockMinimo: 100  },
    { nombre: 'Colorante Azul',        unidad: 'gr', precioUnitario: 0.10, stockActual: 15,   stockMinimo: 20   },
    { nombre: 'Espumante K',           unidad: 'gr', precioUnitario: 1.50, stockActual: 400,  stockMinimo: 100  },
    { nombre: 'Cera Carnauba',         unidad: 'gr', precioUnitario: 4.50, stockActual: 40,   stockMinimo: 50   },
    { nombre: 'Hipoclorito Sodio 13%', unidad: 'ml', precioUnitario: 0.45, stockActual: 600,  stockMinimo: 200  },
    { nombre: 'Soda Cáustica',         unidad: 'gr', precioUnitario: 0.80, stockActual: 80,   stockMinimo: 50   },
    { nombre: 'Tensoactivo NP9',       unidad: 'gr', precioUnitario: 1.20, stockActual: 250,  stockMinimo: 100  },
  ];

  for (const mp of materias) {
    await prisma.materiaPrima.upsert({
      where: { nombre: mp.nombre },
      update: mp,
      create: mp,
    });
  }

  const productos = [
    {
      nombre: 'Detercon Pro v2', tipo: 'Industrial', color: '#3b82f6', stock: 45, precioVenta: 250,
      ingredientes: [
        { nombre: 'Agua Desionizada', cantidad: 900, unidad: 'ml', precio: 0.05 },
        { nombre: 'Texapon 70%',      cantidad: 80,  unidad: 'gr', precio: 0.85 },
        { nombre: 'Colorante Azul',   cantidad: 2,   unidad: 'gr', precio: 0.10 },
      ],
    },
    {
      nombre: 'Lavaplatos Bio', tipo: 'Limpieza', color: '#10b981', stock: 120, precioVenta: 180,
      ingredientes: [
        { nombre: 'Agua',      cantidad: 850, unidad: 'ml', precio: 0.02 },
        { nombre: 'ADBS 96%',  cantidad: 100, unidad: 'gr', precio: 1.15 },
        { nombre: 'Glicerina', cantidad: 50,  unidad: 'gr', precio: 2.30 },
      ],
    },
  ];

  for (const p of productos) {
    const exists = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    if (!exists) {
      await prisma.producto.create({
        data: {
          nombre: p.nombre, tipo: p.tipo, color: p.color, stock: p.stock, precioVenta: p.precioVenta,
          ingredientes: { create: p.ingredientes },
        },
      });
    }
  }

  console.log('Seed completado.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
