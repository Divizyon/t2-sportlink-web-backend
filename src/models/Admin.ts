import { supabase } from '../config/supabase';

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}

export class AdminModel {
  static async createAdmin(username: string, email: string, password: string, role: 'admin' | 'superadmin' = 'admin'): Promise<Admin> {
    try {
      console.log('Starting admin creation process...');
      
      // First create auth user
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      if (!authData.user) {
        console.error('No user data returned from auth');
        throw new Error('Failed to create auth user: No user data returned');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Then create admin record
      console.log('Creating admin record...');
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          username,
          email,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (adminError) {
        console.error('Admin creation error:', adminError);
        throw new Error(`Admin creation error: ${adminError.message}`);
      }

      // Return the admin data
      return {
        id: authData.user.id,
        username,
        email,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error in createAdmin:', error);
      throw error;
    }
  }

  static async getAdminById(id: string): Promise<Admin | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  static async getAdminByEmail(email: string): Promise<Admin | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  static async getAllAdmins(): Promise<Admin[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(admin => ({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: new Date(admin.created_at),
      updatedAt: new Date(admin.updated_at)
    }));
  }

  static async updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin> {
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
  }

  static async deleteAdmin(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    return !error;
  }
} 