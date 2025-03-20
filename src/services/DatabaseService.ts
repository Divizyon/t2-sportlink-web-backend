import { supabase } from '../config/supabase';
import { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type UsersTable = Tables['users']['Row'];
type ProfilesTable = Tables['profiles']['Row'];

export class DatabaseService {
    // Kullanıcı profili oluşturma
    async createProfile(userId: string, data: Partial<ProfilesTable>): Promise<{ data: ProfilesTable | null; error: any }> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .insert([
                    {
                        user_id: userId,
                        ...data
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return { data: profile, error: null };
        } catch (error: any) {
            console.error('Error creating profile:', error);
            return { data: null, error: error.message };
        }
    }

    // Kullanıcı profili getirme
    async getProfile(userId: string): Promise<{ data: ProfilesTable | null; error: any }> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            return { data: profile, error: null };
        } catch (error: any) {
            console.error('Error getting profile:', error);
            return { data: null, error: error.message };
        }
    }

    // Kullanıcı profili güncelleme
    async updateProfile(userId: string, data: Partial<ProfilesTable>): Promise<{ data: ProfilesTable | null; error: any }> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .update(data)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;

            return { data: profile, error: null };
        } catch (error: any) {
            console.error('Error updating profile:', error);
            return { data: null, error: error.message };
        }
    }

    // Kullanıcı bilgilerini getirme
    async getUser(userId: string): Promise<{ data: UsersTable | null; error: any }> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            return { data: user, error: null };
        } catch (error: any) {
            console.error('Error getting user:', error);
            return { data: null, error: error.message };
        }
    }

    // Kullanıcı bilgilerini güncelleme
    async updateUser(userId: string, data: Partial<UsersTable>): Promise<{ data: UsersTable | null; error: any }> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .update(data)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return { data: user, error: null };
        } catch (error: any) {
            console.error('Error updating user:', error);
            return { data: null, error: error.message };
        }
    }
} 