import { Admin, AdminModel } from '../models/Admin';
import { supabase } from '../config/supabase';

export class AdminService {
  static async createAdmin(username: string, email: string, password: string, role: 'admin' | 'superadmin' = 'admin'): Promise<Admin> {
    try {
      // Check if admin already exists
      const existingAdmin = await AdminModel.getAdminByEmail(email);
      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }

      // Create new admin
      const admin = await AdminModel.createAdmin(username, email, password, role);
      return admin;
    } catch (error) {
      console.error('Error in AdminService.createAdmin:', error);
      throw error;
    }
  }

  static async loginAdmin(username: string, password: string): Promise<{ admin: Admin; token: string }> {
    try {
      // First get admin by username to find email
      console.log('Finding admin by username:', username);
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

      if (adminError) {
        console.error('Error finding admin by username:', adminError);
        throw new Error('Invalid username or password');
      }

      if (!adminData) {
        throw new Error('Admin not found');
      }

      console.log('Found admin with email:', adminData.email);

      // Authenticate with Supabase using email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminData.email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Invalid username or password');
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      return {
        admin: {
          id: adminData.id,
          username: adminData.username,
          email: adminData.email,
          role: adminData.role,
          createdAt: new Date(adminData.created_at),
          updatedAt: new Date(adminData.updated_at)
        },
        token: authData.session?.access_token || ''
      };
    } catch (error) {
      console.error('Error in AdminService.loginAdmin:', error);
      throw error;
    }
  }

  static async getAllAdmins(): Promise<Admin[]> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*');

      if (error) throw error;

      return data.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: new Date(admin.created_at),
        updatedAt: new Date(admin.updated_at)
      }));
    } catch (error) {
      console.error('Error in AdminService.getAllAdmins:', error);
      throw error;
    }
  }

  static async updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Admin not found');

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in AdminService.updateAdmin:', error);
      throw error;
    }
  }

  static async deleteAdmin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error in AdminService.deleteAdmin:', error);
      throw error;
    }
  }
} 