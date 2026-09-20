import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

const getIssuer = () => process.env.JWT_ISSUER || 'expense-tracker';
const getAudience = () => process.env.JWT_AUDIENCE || 'expense-tracker-api';

export async function requireAuth(req, res, next) {
  try {
let token = req.cookies?.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader) {
      const match = authHeader.match(/^bearer\s+(.+)$/i);
      if (match) token = match[1].trim();
    }
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: getIssuer(),
      audience: getAudience(),
    });
    if (!payload?.user_id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { user_id: payload.user_id },
      select: { token_version: true },
    });
    if (!user || user.token_version !== payload.tv) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = { user_id: payload.user_id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}