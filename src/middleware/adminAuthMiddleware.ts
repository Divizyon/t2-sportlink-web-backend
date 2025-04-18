import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AdminService } from '../services/AdminService';
import jwt from 'jsonwebtoken';

const adminService = new AdminService();

/**
 * Middleware to protect admin routes
 * Verifies JWT token and attaches admin object to request
 */
export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed. Token not found.'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

            // Find admin by ID
            const admin = await adminService.findAdminById(decoded.id);

            if (!admin) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. User is not an admin.'
                });
            }

            // Check if admin is active
            if (!admin.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin account is not active.'
                });
            }

            // Attach admin to request object
            (req as any).admin = {
                id: admin.id,
                username: admin.username,
                role: admin.role
            };

            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }
    } catch (error: any) {
        console.error('Admin authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

/**
 * Middleware to authorize specific admin roles
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const admin = (req as any).admin;

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!roles.includes(admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient privileges.'
            });
        }

        next();
    };
};

// Add superadmin check middleware
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;

    if (!admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (admin.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Superadmin privileges required.'
        });
    }

    next();
}; 