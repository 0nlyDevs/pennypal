import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { refresh, logout, logoutAll, sessions, me } from '../controllers/session.controller.js';
import { requestVerification, verifyEmail } from '../controllers/verification.controller.js';
import { googleAuth, googleCallback } from '../controllers/oauth.controller.js';
import { mfaSetup, mfaVerify, mfaDisable, mfaLogin } from '../controllers/mfa.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateSignup, validateLogin } from '../middleware/validation/index.js';

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
router.get('/mfa/setup', requireAuth, mfaSetup);
router.post('/mfa/verify', requireAuth, mfaVerify);
router.post('/mfa/disable', requireAuth, mfaDisable);
router.post('/mfa/login', mfaLogin);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;