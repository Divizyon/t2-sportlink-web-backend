import { supabase, supabaseAdmin } from '../config/supabase';
import { RegisterDTO, LoginDTO, AuthResponse, ResetPasswordDTO } from '../types/auth.types';
import { DatabaseService } from './DatabaseService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { User } from '../models/User';

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

            // Kullanıcı kaydı
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.first_name,
                        username: data.username || data.email.split('@')[0]
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

            // Şifreyi hash'le
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // Users tablosuna kayıt
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
                        role: 'user'
                    }
                });
                console.log('User created in database:', newUser);
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Veritabanı hatası durumunda Supabase kaydını da sil
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error('Veritabanı kaydı oluşturulamadı');
            }

            // Profil oluştur
            console.log('Creating profile for user:', authData.user.id);
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
                message: 'Kullanıcı kaydı başarılı'
            };
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

    async login(username: string, password: string): Promise<AuthResponse> {
        try {
            console.log('Login attempt for:', username);
            
            // Kontrol et: Eğer username bir email formatında ise doğrudan kullan
            // Değilse, önce username ile kullanıcıyı bul ve email adresini al
            let email = username;
            let dbUser = null;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            // Kullanıcıyı veritabanında bul (email veya username ile)
            try {
                if (emailRegex.test(username)) {
                    // Email ile kullanıcıyı bul
                    dbUser = await this.prisma.users.findFirst({
                        where: { email: username }
                    });
                } else {
                    // Username ile kullanıcıyı bul
                    dbUser = await this.prisma.users.findFirst({
                        where: { username: username }
                    });
                }
                
                if (!dbUser) {
                    return {
                        user: {},
                        token: '',
                        message: 'Kullanıcı bulunamadı',
                        error: 'Kullanıcı bulunamadı'
                    };
                }
                
                // Kullanıcı rolünü kontrol et - Sadece admin veya superadmin giriş yapabilir
                if (dbUser.role !== 'admin' && dbUser.role !== 'superadmin') {
                    return {
                        user: {},
                        token: '',
                        message: 'Bu hesaba erişim yetkiniz bulunmamaktadır',
                        error: 'Bu hesaba erişim yetkiniz bulunmamaktadır. Sadece yöneticiler giriş yapabilir.'
                    };
                }
                
                email = dbUser.email;
                
                // Veritabanındaki şifreyi kontrol et (eğer şifre varsa)
                if (dbUser.password && dbUser.password !== '') {
                    const passwordMatch = await bcrypt.compare(password, dbUser.password);
                    if (!passwordMatch) {
                        return {
                            user: {},
                            token: '',
                            message: 'Hatalı şifre',
                            error: 'Hatalı şifre'
                        };
                    }
                }
            } catch (dbError) {
                console.error('Database user lookup error:', dbError);
                // Veritabanı hatası durumunda sadece Supabase doğrulamasına devam et
            }
            
            // Supabase ile giriş yap
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
                        user: {
                            id: newAuthData.user?.id ? BigInt(newAuthData.user.id) : undefined,
                            email: newAuthData.user?.email,
                            username: newAuthData.user?.user_metadata?.username,
                            role: newAuthData.user?.user_metadata?.role
                        } as Partial<User>,
                        token: newAuthData.session?.access_token || '',
                        message: 'Giriş başarılı'
                    };
                } catch (adminError: any) {
                    console.error('Admin operation error:', adminError);
                    throw adminError;
                }
            }

            if (error) {
                console.error('Login error:', error);
                if (error.message === 'Email not confirmed') {
                    return {
                        user: {},
                        token: '',
                        message: 'Email adresinizi doğrulamanız gerekmektedir',
                        error: 'Email adresinizi doğrulamanız gerekmektedir. Lütfen email kutunuzu kontrol edin.'
                    };
                }
                
                // Eğer Supabase Auth hatası varsa ama veritabanı doğrulaması başarılıysa
                // ve veritabanında geçerli bir şifre varsa, manuel oturum açabiliriz
                if (dbUser && dbUser.password && dbUser.password !== '') {
                    // Role kontrolü tekrar - Sadece admin veya superadmin
                    if (dbUser.role !== 'admin' && dbUser.role !== 'superadmin') {
                        return {
                            user: {},
                            token: '',
                            message: 'Bu hesaba erişim yetkiniz bulunmamaktadır',
                            error: 'Bu hesaba erişim yetkiniz bulunmamaktadır. Sadece yöneticiler giriş yapabilir.'
                        };
                    }
                    
                    // Bu durumda sadece veritabanı doğrulamasına dayanarak bir oturum döndür
                    // NOT: Bu basitleştirilmiş bir yaklaşımdır, ideal olarak JWT token oluşturmanız gerekebilir
                    return {
                        user: {
                            id: dbUser.id,
                            email: dbUser.email,
                            username: dbUser.username,
                            role: dbUser.role
                        } as unknown as Partial<User>,
                        token: 'MANUAL_AUTH_TOKEN_' + Date.now(),
                        message: 'Manuel giriş başarılı'
                    };
                }
                
                throw error;
            }

            if (!data?.user) {
                throw new Error('No user data returned');
            }
            
            // Supabase Auth başarılı olsa bile, role kontrolü yapmak için kullanıcıyı DB'den kontrol et
            if (dbUser && dbUser.role !== 'admin' && dbUser.role !== 'superadmin') {
                // Supabase oturumunu sonlandır
                await supabase.auth.signOut();
                
                return {
                    user: {},
                    token: '',
                    message: 'Bu hesaba erişim yetkiniz bulunmamaktadır',
                    error: 'Bu hesaba erişim yetkiniz bulunmamaktadır. Sadece yöneticiler giriş yapabilir.'
                };
            }

            return {
                user: {
                    id: data.user?.id ? BigInt(data.user.id) : undefined,
                    email: data.user?.email,
                    username: data.user?.user_metadata?.username,
                    role: data.user?.user_metadata?.role
                } as Partial<User>,
                token: data.session?.access_token || '',
                message: 'Giriş başarılı'
            };
        } catch (error: any) {
            console.error('Login process error:', error);
            return { 
                user: {} as Partial<User>, 
                token: '', 
                message: 'Giriş başarısız',
                error: error.message 
            };
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