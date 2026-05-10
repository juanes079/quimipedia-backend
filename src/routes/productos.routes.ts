import { Router } from 'express';
import { listar, obtener, crear, actualizar, eliminar, actualizarStock } from '../controllers/productos.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verificarToken);

router.get('/',           listar);
router.get('/:id',        obtener);
router.post('/',          crear);
router.put('/:id',        actualizar);
router.patch('/:id/stock', actualizarStock);
router.delete('/:id',     eliminar);

export default router;
