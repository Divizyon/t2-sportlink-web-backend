import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { supabase } from '../config/supabase';

const prisma = new PrismaClient();

// Express Request tipini genişlet
interface AuthRequest extends Request {
  user?: any; // Kullanıcı bilgilerini tutacak
}

// Global namespace ile Express.Request tipini genişlet (uyumluluk için)
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Kimlik doğrulama middleware'i
 * JWT tokenı doğrular ve kullanıcı bilgilerini request nesnesine ekler
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    let token;

    // Token'ı header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token yoksa yetkisiz hatası döndür
    if (!token) {
      return res.status(401).json({ message: 'Oturum açmanız gerekiyor' });
    }

    // JWT token'ı doğrula
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtPayload;
      
      // Kullanıcıyı veritabanından bul
      const user = await prisma.users.findUnique({
        where: { id: BigInt(decoded.userId) }
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      }

      // İsteğe bağlı olarak, Supabase session geçerliliğini de kontrol edebiliriz
      if (decoded.supabaseToken) {
        const { data, error } = await supabase.auth.getUser(decoded.supabaseToken);
        if (error || !data.user) {
          return res.status(401).json({ message: 'Oturumunuz sonlanmış, lütfen tekrar giriş yapın' });
        }
      }

      // Kullanıcı bilgilerini request nesnesine ekle
      req.user = user;
      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return res.status(401).json({ message: 'Geçersiz token, lütfen tekrar giriş yapın' });
    }
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Admin yetkisi kontrolü
 * Kullanıcının admin rolüne sahip olup olmadığını kontrol eder
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): any => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Oturum açmanız gerekiyor' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    next();
  } catch (error) {
    console.error('Admin yetki kontrolü hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * SuperAdmin yetkisi kontrolü
 * Kullanıcının superadmin rolüne sahip olup olmadığını kontrol eder
 */
export const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction): any => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Oturum açmanız gerekiyor' });
    }

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Bu işlem için superadmin yetkisi gerekiyor' });
    }

    next();
  } catch (error) {
    console.error('SuperAdmin yetki kontrolü hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Middleware to restrict access to certain roles
export const restrictTo = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
        });
      }

      // Kullanıcı rolünü kontrol et
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: 'Bu işlemi gerçekleştirmek için yetkiniz yok.'
        });
      }

      next();
    } catch (error) {
      console.error('Rol kontrolü hatası:', error);
      return res.status(500).json({
        message: 'Yetkilendirme sırasında bir hata oluştu.'
      });
    }
  };
}; 