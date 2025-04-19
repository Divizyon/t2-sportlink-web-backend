import { supabase, supabaseAdmin } from '../config/supabase';
import { RegisterDTO, LoginDTO, AuthResponse, ResetPasswordDTO } from '../types/auth.types';
import { DatabaseService } from './DatabaseService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

export class AuthService {
    private databaseService: DatabaseService;
    private prisma: PrismaClient;

    constructor() {
        this.databaseService = new DatabaseService();
        this.prisma = new PrismaClient();
    }

    async register(data: RegisterDTO): Promise<AuthResponse> {
        try {
            console.log('Starting registration process for:', data.email);

            // Email ile kullanıcı var mı kontrol et
            const existingUser = await this.prisma.users.findFirst({
                where: {
                    OR: [
                        { email: data.email },
                        { username: data.username }
                    ]
                }
            });

            if (existingUser) {
                return {
                    user: {} as Partial<User>,
                    token: '',
                    message: existingUser.email === data.email ? 
                        'Bu email adresi zaten kullanımda' : 
                        'Bu kullanıcı adı zaten kullanımda',
                    error: existingUser.email === data.email ? 
                        'Bu email adresi zaten kullanımda' : 
                        'Bu kullanıcı adı zaten kullanımda'
                };
            }

            // Şifreyi hash'le
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // Supabase ile kullanıcı kaydı (email doğrulama gerekli)
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        username: data.username || data.email.split('@')[0]
                    },
                    emailRedirectTo: `${process.env.FRONTEND_URL}/email-confirmed`
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

            // Users tablosuna kayıt
            try {
                const newUser = await this.prisma.users.create({
                    data: {
                        username: data.username || data.email.split('@')[0],
                        email: data.email,
                        password: hashedPassword, // Hash'lenmiş şifreyi kaydet
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        phone: data.phone || '',
                        profile_picture: data.profile_picture || '',
                        default_location_latitude: data.default_location_latitude || 0,
                        default_location_longitude: data.default_location_longitude || 0,
                        role: data.role || 'user'
                    }
                });
                console.log('User created in database:', newUser);
                
                return {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username,
                        first_name: newUser.first_name,
                        last_name: newUser.last_name,
                        role: newUser.role
                    } as Partial<User>,
                    token: '', // Email onaylanana kadar token vermiyoruz
                    message: 'Kullanıcı kaydı başarılı. Email adresinize gönderilen link ile hesabınızı onaylamanız gerekmektedir.'
                };
                
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Veritabanı hatası durumunda Supabase kaydını da sil
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                throw new Error('Veritabanı kaydı oluşturulamadı');
            }

        } catch (error: any) {
            console.error('Registration process error:', error);
            return {
                user: {} as Partial<User>,
                token: '',
                message: 'Kullanıcı kaydı başarısız',
                error: error.message
            };
        }
    }

    async login(credentials: LoginDTO): Promise<AuthResponse> {
        try {
            console.log('Login attempt for:', credentials.email);
            
            // Kullanıcı email ile veya username ile giriş yapabilir
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isEmail = emailRegex.test(credentials.email);
            
            // Kullanıcıyı veritabanında bul (email veya username ile)
            const user = await this.prisma.users.findFirst({
                where: isEmail 
                    ? { email: credentials.email } 
                    : { username: credentials.email }
            });
            
            if (!user) {
                return {
                    user: {} as Partial<User>,
                    token: '',
                    message: 'Kullanıcı bulunamadı',
                    error: 'Kullanıcı bulunamadı'
                };
            }
            
            // Şifreyi kontrol et
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                return {
                    user: {} as Partial<User>,
                    token: '',
                    message: 'Hatalı şifre',
                    error: 'Hatalı şifre'
                };
            }
            
            // Supabase'de email doğrulama durumunu kontrol et
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: credentials.password
            });
            
            if (error) {
                // Email doğrulama hatası kontrolü
                if (error.message.includes('Email not confirmed') || error.message.includes('Email not verified')) {
                    return {
                        user: {} as Partial<User>,
                        token: '',
                        message: 'Email adresinizi doğrulamanız gerekmektedir',
                        error: 'Email adresinizi doğrulamanız gerekmektedir. Lütfen email kutunuzu kontrol edin.'
                    };
                }
                
                console.error('Login error:', error);
                return {
                    user: {} as Partial<User>,
                    token: '',
                    message: 'Giriş başarısız',
                    error: error.message
                };
            }
            
            // JWT token oluştur
            const token = jwt.sign(
                { 
                    userId: user.id.toString(), 
                    email: user.email, 
                    role: user.role 
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '7d' }
            );
            
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone,
                    profile_picture: user.profile_picture,
                    role: user.role
                } as Partial<User>,
                token,
                message: 'Giriş başarılı'
            };
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                user: {} as Partial<User>,
                token: '',
                message: 'Giriş başarısız',
                error: error.message
            };
        }
    }

    // Şifre sıfırlama e-postası gönderme
    async resetPassword(data: ResetPasswordDTO): Promise<{ error?: string }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${process.env.FRONTEND_URL}/reset-password`
            });
            
            if (error) throw error;
            return {};
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // Diğer metodlar aynen kalabilir...
    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
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

    // Email onaylama durumunu yeniden gönderme
    async resendEmailConfirmation(email: string): Promise<{ error?: string }> {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${process.env.FRONTEND_URL}/email-confirmed`
                }
            });
            
            if (error) throw error;
            return { };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async getUserRole(email: string): Promise<{ role?: string; error?: string }> {
        try {
            const userData = await this.prisma.users.findFirst({
                where: { email },
                select: { role: true }
            });

            if (!userData) {
                return { error: 'Kullanıcı bulunamadı' };
            }

            return { role: userData.role };
        } catch (error: any) {
            console.error('Error fetching user role:', error);
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

    async registerAdmin(data: RegisterDTO, role: 'admin' | 'superadmin' = 'admin'): Promise<AuthResponse> {
        try {
            console.log(`Starting ${role} registration process for:`, data.email);

            // Email ile kullanıcı var mı kontrol et
            const existingUser = await this.prisma.users.findFirst({
                where: {
                    OR: [
                        { email: data.email },
                        { username: data.username }
                    ]
                }
            });

            if (existingUser) {
                return {
                    user: {},
                    token: '',
                    message: existingUser.email === data.email ? 
                        'Bu email adresi zaten kullanımda' : 
                        'Bu kullanıcı adı zaten kullanımda',
                    error: existingUser.email === data.email ? 
                        'Bu email adresi zaten kullanımda' : 
                        'Bu kullanıcı adı zaten kullanımda'
                };
            }

            // Kullanıcı kaydı
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.first_name,
                        username: data.username || data.email.split('@')[0],
                        role: role
                    }
                }
            });

            console.log('Admin registration response:', {
                success: !!authData?.user,
                error: error?.message,
                userId: authData?.user?.id,
                role: role
            });

            if (error) {
                console.error('Registration error:', error);
                throw error;
            }

            if (!authData?.user) {
                throw new Error('No user data returned');
            }

            // Şifreyi hash'le
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // Users tablosuna admin olarak kayıt
            try {
                const newUser = await this.prisma.users.create({
                    data: {
                        username: data.username || data.email.split('@')[0],
                        email: data.email,
                        password: hashedPassword, // Hash'lenmiş şifreyi kaydet
                        first_name: data.first_name || '',
                        last_name: '',
                        phone: '',
                        profile_picture: '',
                        default_location_latitude: 0,
                        default_location_longitude: 0,
                        role: role // admin veya superadmin olarak kaydet
                    }
                });
                console.log(`${role.toUpperCase()} user created in database:`, newUser);
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Veritabanı hatası durumunda Supabase kaydını da sil
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error('Veritabanı kaydı oluşturulamadı');
            }

            // Profil oluştur
            console.log(`Creating profile for ${role}:`, authData.user.id);
            const { data: profile, error: profileError } = await this.databaseService.createProfile(
                authData.user.id,
                {
                    full_name: data.first_name + ' ' + data.last_name,
                }
            );

            if (profileError) {
                console.error('Profile creation error:', profileError);
            } else {
                console.log('Profile created successfully:', profile);
            }

            return {
                user: {
                    id: authData.user?.id ? BigInt(authData.user.id) : undefined,
                    email: authData.user?.email,
                    username: authData.user?.user_metadata?.username,
                    role: authData.user?.user_metadata?.role
                } as Partial<User>,
                token: authData.session?.access_token || '',
                message: 'Admin kaydı başarılı'
            };
        } catch (error: any) {
            console.error('Admin registration process error:', error);
            return {
                user: {},
                token: '',
                message: 'Admin registration process error',
                error: error.message
            };
        }
    }
} 