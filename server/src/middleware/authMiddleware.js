import jwt from 'jsonwebtoken';
import db, { memDB, isDbConnected } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_neon_key_12345';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (isDbConnected()) {
        const [users] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
        if (users && users.length > 0) {
          req.user = users[0];
          return next();
        }
      }

      // In-Memory lookup
      const user = memDB.users.find(u => u.id === decoded.id);
      if (user) {
        req.user = { id: user.id, username: user.username, email: user.email };
        return next();
      }

      return res.status(401).json({ message: 'Not authorized, user not found' });
    } catch (error) {
      console.error('[Auth Middleware Error]', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
