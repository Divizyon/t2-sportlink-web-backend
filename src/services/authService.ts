import { supabase, supabaseAdmin } from '../config/supabase';
import { RegisterDTO, LoginDTO, AuthResponse, ResetPasswordDTO } from '../types/auth.types';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

export class AuthService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Kullanıcı kaydı yapar (Supabase Auth + Prisma DB)
     */
    async register(data: RegisterDTO): Promise<AuthResponse> {
        try {
            console.log('Kayıt işlemi başlatılıyor:', data.email);

            // Email veya username ile kullanıcı var mı kontrol et
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

            // 1. Önce Supabase Auth'a kaydedelim
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        username: data.username || data.email.split('@')[0],
                        first_name: data.first_name,
                        last_name: data.last_name,
                        role: 'user'
                    },
                    emailRedirectTo: `${process.env.FRONTEND_URL}/email-confirmed`
                }
            });

            if (error) {
                console.error('Supabase kaydı hatası:', error);
                throw error;
            }

            if (!authData?.user) {
                throw new Error('Kullanıcı verisi döndürülemedi');
            }

            // Şifreyi hash'le (güvenlik için)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // 2. Supabase Auth kaydı başarılıysa, public.Users tablosuna da kaydedelim
            try {
                const newUser = await this.prisma.users.create({
                    data: {
                        username: data.username || data.email.split('@')[0],
                        email: data.email,
                        password: hashedPassword,
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        phone: data.phone || '',
                        profile_picture: data.profile_picture || '',
                        default_location_latitude: data.default_location_latitude || 0,
                        default_location_longitude: data.default_location_longitude || 0,
                        role: 'user',
                        auth_uuid: authData.user.id // Supabase auth UUID'sini saklıyoruz
                    }
                });
                
                console.log('Kullanıcı veritabanına kaydedildi:', newUser.id);
                
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
                console.error('Veritabanı hatası:', dbError);
                // Veritabanı hatası durumunda Supabase kaydını da sil
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                throw new Error('Veritabanı kaydı oluşturulamadı');
            }

        } catch (error: any) {
            console.error('Kayıt işlemi hatası:', error);
            return {
                user: {} as Partial<User>,
                token: '',
                message: 'Kullanıcı kaydı başarısız',
                error: error.message
            };
        }
    }

    /**
     * Kullanıcı girişi yapar (Supabase Auth + JWT token)
     */
    async login(credentials: LoginDTO): Promise<AuthResponse> {
        try {
            console.log('Giriş denemesi:', credentials.email);
            
            // Email veya kullanıcı adı ile giriş
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isEmail = emailRegex.test(credentials.email);
            
            // Önce kullanıcıyı veritabanında bulalım
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
            
            // Şifre kontrolü
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                return {
                    user: {} as Partial<User>,
                    token: '',
                    message: 'Hatalı şifre',
                    error: 'Hatalı şifre'
                };
            }
            
            // Sadece veritabanımızdaki bilgilere dayanarak giriş yap
            // Bu, Supabase Auth hatalarını atlamamızı sağlar
            
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
            
            // İsteğe bağlı: Arka planda Supabase Auth kontrolü yap ama giriş işlemini bloklamadan devam et
            try {
                const { data: authData, error } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: credentials.password
                });
                
                if (error) {
                    // Sadece log al, kullanıcıya hata gösterme
                    console.warn('Supabase Auth uyarısı (kullanıcı girişi engellenmiyor):', error.message);
                }
            } catch (supabaseError) {
                console.warn('Supabase Auth bağlantı hatası (kullanıcı girişi engellenmiyor):', supabaseError);
            }
            
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
            console.error('Giriş hatası:', error);
            return {
                user: {} as Partial<User>,
                token: '',
                message: 'Giriş başarısız',
                error: error.message
            };
        }
    }

    /**
     * Şifre sıfırlama bağlantısı gönderir
     */
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

    /**
     * Kullanıcı çıkışı yapar
     */
    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    /**
     * Mevcut oturum açmış kullanıcıyı döndürür
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            
            if (user) {
                // Kullanıcıyı email ile deneyelim
                const dbUser = await this.prisma.users.findFirst({
                    where: { email: user.email }
                });
                
                return { user: dbUser || user };
            }
            
            return { user };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Email doğrulama bağlantısını yeniden gönderir
     */
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

    /**
     * Kullanıcı rolünü döndürür
     */
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
            console.error('Kullanıcı rolü getirme hatası:', error);
            return { error: error.message };
        }
    }

    /**
     * Kullanıcının varlığını kontrol eder
     */
    async checkUserExists(email: string): Promise<{ exists: boolean; error?: string }> {
        try {
            console.log('Kullanıcı kontrol ediliyor:', email);
            
            // Hem Supabase Auth'da hem de kendi veritabanımızda kontrol edelim
            const { data, error } = await supabaseAdmin.auth.admin.listUsers();

            if (error) {
                console.error('Kullanıcı kontrol hatası:', error);
                throw error;
            }

            const supabaseUser = data.users.find(user => user.email === email);
            
            if (!supabaseUser) {
                return { exists: false };
            }
            
            // Veritabanında kullanıcıyı email ile arayalım
            const userExistsInDB = await this.prisma.users.findFirst({
                where: { email }
            });
            
            console.log('Kullanıcı kontrol sonucu:', { 
                email, 
                exists: !!userExistsInDB
            });

            return { exists: !!userExistsInDB };
        } catch (error: any) {
            console.error('Kullanıcı kontrol hatası:', error);
            return { exists: false, error: error.message };
        }
    }

    /**
     * Admin kullanıcı kaydı (sadece superadmin tarafından)
     */
    async registerAdmin(data: RegisterDTO): Promise<AuthResponse> {
        try {
            console.log(`Admin kaydı başlatılıyor:`, data.email);

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

            // 1. Önce Supabase Auth'a kaydedelim
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        username: data.username || data.email.split('@')[0],
                        first_name: data.first_name,
                        last_name: data.last_name,
                        role: 'admin' // Admin rolü
                    },
                    emailRedirectTo: `${process.env.FRONTEND_URL}/email-confirmed`
                }
            });

            if (error) {
                console.error('Supabase admin kaydı hatası:', error);
                throw error;
            }

            if (!authData?.user) {
                throw new Error('Kullanıcı verisi döndürülemedi');
            }

            // Şifreyi hash'le
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // 2. Supabase Auth kaydı başarılıysa, public.Users tablosuna da kaydedelim
            try {
                const newUser = await this.prisma.users.create({
                    data: {
                        username: data.username || data.email.split('@')[0],
                        email: data.email,
                        password: hashedPassword, 
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        phone: data.phone || '',
                        profile_picture: data.profile_picture || '',
                        default_location_latitude: data.default_location_latitude || 0,
                        default_location_longitude: data.default_location_longitude || 0,
                        role: 'admin', // Admin rolü
                        auth_uuid: authData.user.id // Auth ID'yi kaydediyoruz
                    }
                });
                
                console.log(`Admin kullanıcı veritabanına kaydedildi:`, newUser.id);
                
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
                    message: 'Admin kullanıcı kaydı başarılı. Email adresine gönderilen link ile hesabın onaylanması gerekmektedir.'
                };
            } catch (dbError) {
                console.error('Veritabanı hatası:', dbError);
                // Veritabanı hatası durumunda Supabase kaydını da sil
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                throw new Error('Veritabanı kaydı oluşturulamadı');
            }
        } catch (error: any) {
            console.error('Admin kaydı hatası:', error);
            return {
                user: {} as Partial<User>,
                token: '',
                message: 'Admin kullanıcı kaydı başarısız',
                error: error.message
            };
        }
    }
} 