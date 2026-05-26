import { Router } from 'express';
import { registro, login, perfil, olvidasteContrasena, restablecerContrasena } from '../controllers/auth.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/registro',               registro);
router.post('/login',                  login);
router.get('/perfil',                  verificarToken, perfil);
router.post('/olvidaste-contrasena',   olvidasteContrasena);
router.post('/restablecer-contrasena', restablecerContrasena);

export default router;
