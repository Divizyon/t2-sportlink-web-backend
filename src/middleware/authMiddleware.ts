import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../services/userService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kullanıcı doğrulama için Express Request tipini genişletelim
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: bigint;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Geçersiz token formatı' });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      userId: bigint;
      email: string;
      role: string;
    };

    // Kullanıcıyı kontrol et
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Request nesnesine kullanıcı bilgilerini ekle
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Yetkilendirme başarısız' });
  }
};

// Auth uyumluluğu için eskiden protect adıyla kullanılan middleware'i de export edelim
export const protect = authenticate;

// Admin rolü kontrolü
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekiyor' });
  }
  next();
};

// Admin rolü kontrolü için kısa yol middleware
export const adminOnly = isAdmin;

// Middleware to restrict access to certain roles
export const restrictTo = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
        });
      }
      
      // Get user role from the database using Prisma
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId as bigint },
        select: { role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Kullanıcı bulunamadı.'
        });
      }

      // Check if user role is allowed
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Bu işlemi gerçekleştirmek için yetkiniz yok.'
        });
      }

      next();
    } catch (error) {
      console.error('Role restriction error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Yetkilendirme sırasında bir hata oluştu.'
      });
    }
  };
}; 