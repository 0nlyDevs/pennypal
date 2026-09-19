import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader) {
      const match = authHeader.match(/^bearer\s+(.+)$/i);
      if (match) {
        token = match[1].trim();
      }
    }

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.user_id) return res.status(401).json({ error: 'Unauthorized' });

    req.user = { user_id: payload.user_id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
