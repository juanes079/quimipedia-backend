import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.gasto.deleteMany();
  await prisma.ingrediente.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.materiaPrima.deleteMany();

  console.log('Base de datos limpia. Usuarios conservados.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
