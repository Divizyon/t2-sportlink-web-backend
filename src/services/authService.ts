import { supabase, supabaseAdmin } from '../config/supabase';
import { RegisterDTO, LoginDTO, AuthResponse, ResetPasswordDTO } from '../types/auth.types';
import { DatabaseService } from './DatabaseService';

export class AuthService {
    private databaseService: DatabaseService;

    constructor() {
        this.databaseService = new DatabaseService();
    }

    async register(data: RegisterDTO): Promise<AuthResponse> {
        try {
            console.log('Starting registration process for:', data.email);
            
            // Önce kullanıcı var mı kontrol et
            const { data: existingUser } = await supabase.auth.getUser();
            if (existingUser?.user) {
                return {
                    user: null,
                    session: null,
                    error: 'User already exists'
                };
            }

            // Kullanıcı kaydı
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name
                    }
                }
            });

            console.log('Registration response:', {
                success: !!authData?.user,
                error: error?.message,
                userId: authData?.user?.id
            });

            if (error) {
                console.error('Registration error:', error);
                throw error;
            }

            if (!authData?.user) {
                throw new Error('No user data returned');
            }

            // Profil oluştur
            console.log('Creating profile for user:', authData.user.id);
            const { data: profile, error: profileError } = await this.databaseService.createProfile(
                authData.user.id,
                {
                    full_name: data.name
                }
            );

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Profil oluşturma hatası olsa bile kullanıcı kaydını tamamla
            } else {
                console.log('Profile created successfully:', profile);
            }

            return {
                user: authData.user,
                session: authData.session
            };
        } catch (error: any) {
            console.error('Registration process error:', error);
            return {
                user: null,
                session: null,
                error: error.message
            };
        }
    }

    async login(email: string, password: string): Promise<{ user: any; session: any; error?: string }> {
        try {
            console.log('Login attempt for:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            console.log('Login response:', {
                success: !!data,
                error: error?.message,
                userId: data?.user?.id
            });

            // Email doğrulama hatasını bypass et
            if (error && error.message === 'Email not confirmed') {
                console.log('Bypassing email confirmation...');
                
                try {
                    // Önce kullanıcıyı bul
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    
                    if (userError || !user) {
                        throw userError || new Error('User not found');
                    }

                    // Email'i doğrudan doğrula
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                        user.id,
                        { email_confirm: true }
                    );

                    if (updateError) {
                        throw updateError;
                    }

                    // Tekrar giriş dene
                    const { data: newAuthData, error: newAuthError } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });

                    if (newAuthError) {
                        throw newAuthError;
                    }

                    return {
                        user: newAuthData.user,
                        session: newAuthData.session
                    };
                } catch (adminError: any) {
                    console.error('Admin operation error:', adminError);
                    throw adminError;
                }
            }

            if (error) {
                console.error('Login error:', error);
                throw error;
            }

            if (!data?.user) {
                throw new Error('No user data returned');
            }

            return {
                user: data.user,
                session: data.session
            };
        } catch (error: any) {
            console.error('Login process error:', error);
            return { user: null, session: null, error: error.message };
        }
    }

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async resetPassword(data: ResetPasswordDTO): Promise<{ error?: string }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email);
            if (error) throw error;
            return {};
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { user };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async checkUserExists(email: string): Promise<{ exists: boolean; error?: string }> {
        try {
            console.log('Checking if user exists:', email);
            const { data, error } = await supabase.auth.admin.listUsers();
            
            if (error) {
                console.error('Error checking user:', error);
                throw error;
            }

            const userExists = data.users.some(user => user.email === email);
            console.log('User exists check result:', { email, exists: userExists });
            
            return { exists: userExists };
        } catch (error: any) {
            console.error('Check user exists error:', error);
            return { exists: false, error: error.message };
        }
    }
} 