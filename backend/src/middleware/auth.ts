import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthRequest extends Request {
  user?: User;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      // Add other user properties if needed
    } as User;

    return next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
}