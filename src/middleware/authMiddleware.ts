import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../services/userService';
import { supabase } from '../config/supabase';

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
    console.log('Auth Headers:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return res.status(401).json({ 
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Token not provided after Bearer');
      return res.status(401).json({ 
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    console.log('Token received:', token.substring(0, 15) + '...');
    
    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
        userId: string;
        email: string;
        role: string;
      };
      
      console.log('Token decoded successfully:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      });

      // Kullanıcıyı kontrol et
      const user = await findUserById(BigInt(decoded.userId));
      console.log('User lookup result:', { userFound: !!user });
      
      if (!user) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Kullanıcı bulunamadı.'
        });
      }

      // Request nesnesine kullanıcı bilgilerini ekle
      req.user = {
        userId: BigInt(decoded.userId),
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      console.error('Token verification error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown error type',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      return res.status(401).json({ 
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }
  } catch (error) {
    console.error('Authentication general error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return res.status(401).json({ 
      status: 'error',
      message: 'Kullanıcı bulunamadı.'
    });
  }
};

// Auth uyumluluğu için eskiden protect adıyla kullanılan middleware'i de export edelim
export const protect = authenticate;

// Admin rolü kontrolü
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log('req.user', req.user);
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
      console.log('restrictTo middleware called with roles:', roles);
      
      if (!req.user) {
        console.log('No user in request');
        return res.status(401).json({
          status: 'error',
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
        });
      }
      
      console.log('User from request:', {
        userId: req.user.userId.toString(),
        role: req.user.role
      });

      // Kullanıcı rolünü doğrudan request'ten al
      if (!roles.includes(req.user.role)) {
        console.log('User role not authorized:', {
          userRole: req.user.role,
          allowedRoles: roles
        });
        
        return res.status(403).json({
          status: 'error',
          message: 'Bu işlemi gerçekleştirmek için yetkiniz yok.'
        });
      }

      console.log('User authorized for action');
      next();
    } catch (error) {
      console.error('Role restriction error:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(500).json({
        status: 'error',
        message: 'Yetkilendirme sırasında bir hata oluştu.'
      });
    }
  };
}; 