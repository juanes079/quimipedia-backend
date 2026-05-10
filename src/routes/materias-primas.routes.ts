import { Router } from 'express';
import { listar, obtener, crear, actualizar, eliminar, stocksBajos } from '../controllers/materias-primas.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verificarToken);

router.get('/stocks-bajos', stocksBajos);
router.get('/',       listar);
router.get('/:id',    obtener);
router.post('/',      crear);
router.put('/:id',    actualizar);
router.delete('/:id', eliminar);

export default router;
