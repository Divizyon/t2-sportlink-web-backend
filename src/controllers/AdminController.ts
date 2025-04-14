import { Request, Response } from 'express';
import { AdminModel } from '../models/Admin';
import { AdminService } from '../services/AdminService';

export class AdminController {
  static async register(req: Request, res: Response) {
    try {
      console.log('Register request received:', req.body);
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            username: !username ? 'Username is required' : undefined,
            email: !email ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      console.log('Creating admin with:', { username, email, role });
      const admin = await AdminModel.createAdmin(username, email, password, role);
      
      console.log('Admin created successfully:', admin);
      res.status(201).json({
        message: 'Admin created successfully',
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error: any) {
      console.error('Error in admin registration:', error);
      
      // Supabase auth error handling
      if (error.message?.includes('User already registered')) {
        return res.status(409).json({ 
          error: 'Email already registered',
          message: 'An admin with this email already exists'
        });
      }

      // General error response
      res.status(500).json({ 
        error: 'Failed to create admin',
        message: error.message || 'An unexpected error occurred',
        details: error
      });
    }
  }

  static async loginAdmin(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            username: !username ? 'Username is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
      }

      console.log('Attempting login with username:', username);
      const result = await AdminService.loginAdmin(username, password);
      
      console.log('Login successful for:', username);
      res.json({
        message: 'Login successful',
        admin: {
          id: result.admin.id,
          username: result.admin.username,
          role: result.admin.role
        },
        token: result.token
      });
    } catch (error: any) {
      console.error('Error in loginAdmin:', error);
      res.status(401).json({ 
        error: 'Authentication failed',
        message: error.message || 'Invalid username or password'
      });
    }
  }

  static async getAllAdmins(req: Request, res: Response) {
    try {
      const admins = await AdminService.getAllAdmins();
      res.json(admins);
    } catch (error: any) {
      console.error('Error in getAllAdmins:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const admin = await AdminService.updateAdmin(id, updates);
      res.json(admin);
    } catch (error: any) {
      console.error('Error in updateAdmin:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await AdminService.deleteAdmin(id);
      res.status(204).send(); // No content response for successful deletion
    } catch (error: any) {
      console.error('Error in deleteAdmin:', error);
      res.status(500).json({ error: error.message });
    }
  }
} 