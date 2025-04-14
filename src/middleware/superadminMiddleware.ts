import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const superadminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is required' });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization type' });
    }

    try {
        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get admin details
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('role')
            .eq('id', user.id)
            .single();

        if (adminError || !adminData) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        if (adminData.role !== 'superadmin') {
            return res.status(403).json({ error: 'Superadmin access required' });
        }

        // Add user data to request object
        (req as any).user = {
            id: user.id,
            role: adminData.role
        };
        
        next();
    } catch (error) {
        console.error('Error in superadminMiddleware:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}; 