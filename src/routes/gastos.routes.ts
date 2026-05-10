import { Router } from 'express';
import { listar, obtener, crear, actualizar, eliminar, totalGastos } from '../controllers/gastos.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verificarToken);

router.get('/total',  totalGastos);
router.get('/',       listar);
router.get('/:id',    obtener);
router.post('/',      crear);
router.put('/:id',    actualizar);
router.delete('/:id', eliminar);

export default router;
