import { Router } from 'express';
import { signup, login, logout, logoutAll, sessions, me, refresh, googleAuth, googleCallback, requestVerification, verifyEmail } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateSignup, validateLogin } from '../middleware/validate.js';

const router = Router();

router.use(authLimiter);

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAll);
router.get('/sessions', requireAuth, sessions);
router.get('/me', requireAuth, me);
router.post('/request-verification', requireAuth, requestVerification);
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;