import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import productosRoutes from './routes/productos.routes';
import materiasPrimasRoutes from './routes/materias-primas.routes';
import gastosRoutes from './routes/gastos.routes';
import usuariosRoutes from './routes/usuarios.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/materias-primas', materiasPrimasRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use(errorHandler);

export default app;
