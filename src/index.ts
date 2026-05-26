import 'dotenv/config';
import bcrypt from 'bcryptjs';
import app from './app';
import prisma from './lib/prisma';

const PORT = process.env.PORT ?? 3000;

async function inicializarAdmin() {
  const existe = await prisma.user.findUnique({ where: { email: 'admin@quimipedia.com' } });
  if (!existe) {
    await prisma.user.create({
      data: {
        email:    'admin@quimipedia.com',
        password: await bcrypt.hash('admin123', 10),
        nombre:   'Administrador',
      },
    });
    console.log('✅ Usuario admin creado');
  }
}

inicializarAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`QuimiPedia API corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Error iniciando servidor:', e);
    process.exit(1);
  });
