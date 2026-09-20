import { Router } from 'express';
import { signup, login, logout, logoutAll, sessions, me, refresh, googleAuth, googleCallback } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSignup, validateLogin } from '../middleware/validate.js';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAll);
router.get('/sessions', requireAuth, sessions);
router.get('/me', requireAuth, me);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;