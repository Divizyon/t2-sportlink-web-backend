import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Yetkilendirme başarısız. Token bulunamadı.' });
        }

        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
        }

        // @ts-ignore
        req.user = user;
        next();
    } catch (error: any) {
        res.status(401).json({ error: 'Yetkilendirme başarısız.' });
    }
};

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

      // Get user role from the database
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !data) {
        return res.status(401).json({
          status: 'error',
          message: 'Kullanıcı bulunamadı.'
        });
      }

      // Check if user role is allowed
      if (!roles.includes(data.role)) {
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

// Add user property to Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
} 