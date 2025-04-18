import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSlug } from '../utils/stringUtils';
import { supabase } from '../config/supabase';

const prisma = new PrismaClient();

interface Announcement {
    id: string;
    title: string;
    slug: string;
    content: string;
    published: boolean;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string | null;
}

// Admin interface definition
export interface Admin {
    id: string;
    username: string;
    email?: string | null;
    passwordHash: string;
    role: 'superadmin' | 'admin' | 'editor' | 'moderator';
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
    profile: AdminProfile | null;
}

// Admin profile interface
export interface AdminProfile {
    id: string;
    adminId: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string | null;
}

// Data for creating a new admin
export interface CreateAdminData {
    username: string;
    email?: string;
    password: string;
    role: 'superadmin' | 'admin' | 'editor' | 'moderator';
    isActive?: boolean;
    profile?: {
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
        bio?: string;
        phoneNumber?: string;
    };
}

// Data for updating an admin
export interface UpdateAdminData {
    username?: string;
    email?: string;
    password?: string;
    role?: 'superadmin' | 'admin' | 'editor' | 'moderator';
    isActive?: boolean;
}

// Login result interface
export interface LoginResult {
    success: boolean;
    message?: string;
    token?: string;
    admin?: Omit<Admin, 'passwordHash'>;
}

export class AdminService {
    /**
     * Creates a new admin user
     * 
     * @param data Admin data including username, email, password, role and profile
     * @param creatorRole Role of the admin creating this account
     * @returns The created admin
     */
    async createAdmin(data: CreateAdminData, creatorRole?: string): Promise<Admin> {
        try {
            // Only superadmin can create another superadmin
            if (data.role === 'superadmin' && creatorRole !== 'superadmin') {
                throw new Error('Only superadmin can create another superadmin account');
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(data.password, salt);

            try {
                // Create admin with Prisma transaction to ensure both admin and profile are created
                const admin = await prisma.$transaction(async (tx) => {
                    // Create admin
                    const newAdmin = await tx.admin.create({
                        data: {
                            username: data.username,
                            email: data.email || null,
                            passwordHash: passwordHash,
                            role: data.role,
                            isActive: data.isActive !== undefined ? data.isActive : true,
                            // Profile will be created via relation if provided
                            ...(data.profile ? {
                                profile: {
                                    create: {
                                        firstName: data.profile.firstName || '',
                                        lastName: data.profile.lastName || '',
                                        avatarUrl: data.profile.avatarUrl || null,
                                        bio: data.profile.bio || null,
                                        phoneNumber: data.profile.phoneNumber || null,
                                    }
                                }
                            } : {})
                        },
                        include: {
                            profile: true
                        }
                    });
                    
                    return newAdmin;
                });

                return this.mapAdminFromDb(admin);
            } catch (prismaError) {
                console.error('Error creating admin with Prisma:', prismaError);
                
                // Fallback to Supabase
                // Create admin in database
                const { data: admin, error } = await supabase
                    .from('Admin')
                    .insert({
                        username: data.username,
                        email: data.email || null,
                        password_hash: passwordHash,
                        role: data.role,
                        is_active: data.isActive !== undefined ? data.isActive : true,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Create profile if provided
                if (data.profile) {
                    const { error: profileError } = await supabase
                        .from('AdminProfile')
                        .insert({
                            admin_id: admin.id,
                            first_name: data.profile.firstName || '',
                            last_name: data.profile.lastName || '',
                            avatar_url: data.profile.avatarUrl || null,
                            bio: data.profile.bio || null,
                            phone_number: data.profile.phoneNumber || null,
                            created_at: new Date().toISOString()
                        });

                    if (profileError) throw profileError;
                }

                // Get complete admin with profile
                const { data: fullAdmin, error: fullAdminError } = await supabase
                    .from('Admin')
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .eq('id', admin.id)
                    .single();

                if (fullAdminError) throw fullAdminError;

                return this.mapAdminFromDb(fullAdmin);
            }
        } catch (error: any) {
            console.error('Error creating admin:', error);
            throw new Error(error.message || 'Failed to create admin account');
        }
    }

    /**
     * Admin login
     * 
     * @param username Username
     * @param password Admin password
     * @returns Login result with token and admin data
     */
    async login(username: string, password: string): Promise<LoginResult> {
        try {
            console.log(`Login denemesi: kullanıcı adı = "${username}"`);
            
            // Önce kullanıcıyı bulalım
            let admin;
            
            // Find admin by username with Prisma
            try {
                admin = await prisma.admin.findFirst({
                    where: { username },
                    include: { profile: true }
                });
                
                console.log(`Prisma ile admin bulundu mu: ${admin ? 'Evet' : 'Hayır'}`);
            } catch (prismaError) {
                console.error('Prisma ile admin aranırken hata:', prismaError);
                
                // Fallback to Supabase if Prisma fails
                const { data: adminData, error } = await supabase
                    .from('Admin')  // case-sensitive table name in Supabase
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .eq('username', username)
                    .single();
                    
                if (error) {
                    console.log(`Supabase ile admin aranırken hata: ${error.message}`);
                    return {
                        success: false,
                        message: 'Geçersiz kullanıcı adı veya şifre'
                    };
                }
                
                admin = adminData;
                console.log(`Supabase ile admin bulundu mu: ${admin ? 'Evet' : 'Hayır'}`);
            }
            
            if (!admin) {
                console.log('Admin bulunamadı, giriş başarısız.');
                return {
                    success: false,
                    message: 'Geçersiz kullanıcı adı veya şifre'
                };
            }

            // Debug: Admin bilgilerini logla
            console.log('Admin bulundu:', {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                isActive: admin.isActive !== undefined ? admin.isActive : admin.is_active
            });
            
            // Check if admin is active
            const isActive = admin.isActive !== undefined ? admin.isActive : admin.is_active;
            if (!isActive) {
                console.log('Admin hesabı aktif değil');
                return {
                    success: false,
                    message: 'Hesabınız aktif değil'
                };
            }

            // Şifre kontrolü
            console.log('Şifre kontrolü yapılıyor...');
            const storedHash = admin.passwordHash || admin.password_hash;
            console.log('Kayıtlı hash:', storedHash ? storedHash.substring(0, 10) + '...' : 'Yok');
            
            // bcrypt.compare, ilk parametrede düz metin şifreyi, ikinci parametrede hash değerini bekler
            let isPasswordValid = false;
            try {
                isPasswordValid = await bcrypt.compare(password, storedHash);
                console.log(`Şifre doğrulama sonucu: ${isPasswordValid ? 'Başarılı' : 'Başarısız'}`);
            } catch (bcryptError) {
                console.error('Şifre kontrolünde hata:', bcryptError);
                return {
                    success: false,
                    message: 'Giriş yapılırken bir hata oluştu'
                };
            }
            
            if (!isPasswordValid) {
                console.log('Şifre doğrulanamadı, giriş başarısız.');
                return {
                    success: false,
                    message: 'Geçersiz kullanıcı adı veya şifre'
                };
            }

            // Update last login using Prisma
            try {
                console.log('Son giriş zamanı Prisma ile güncelleniyor...');
                await prisma.admin.update({
                    where: { id: admin.id },
                    data: {
                        lastLogin: new Date(),
                        updatedAt: new Date()
                    }
                });
            } catch (updateError) {
                console.error('Son giriş zamanı Prisma ile güncellenirken hata:', updateError);
                
                // Fallback to Supabase
                try {
                    console.log('Son giriş zamanı Supabase ile güncelleniyor...');
                    await supabase
                        .from('Admin')
                        .update({
                            lastLogin: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        })
                        .eq('id', admin.id);
                } catch (supabaseError) {
                    console.error('Son giriş zamanı Supabase ile güncellenirken hata:', supabaseError);
                    // Bu hatayı yutuyoruz, giriş yine de başarılı sayılabilir
                }
            }

            // Generate JWT token
            console.log('JWT token oluşturuluyor...');
            const token = jwt.sign(
                { id: admin.id, username: admin.username, role: admin.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Map admin data without sensitive information
            const mappedAdmin = this.mapAdminFromDb(admin);
            const { passwordHash: _, ...adminWithoutPassword } = mappedAdmin;

            console.log('Giriş başarılı!');
            return {
                success: true,
                token,
                admin: adminWithoutPassword
            };
        } catch (error: any) {
            console.error('Giriş işlemi sırasında beklenmeyen hata:', error);
            return {
                success: false,
                message: 'Kimlik doğrulama başarısız'
            };
        }
    }

    /**
     * Finds an admin by ID
     * 
     * @param id Admin ID
     * @returns Admin data or null if not found
     */
    async findAdminById(id: string): Promise<Admin | null> {
        try {
            // Önce Prisma ile deneyelim
            try {
                const admin = await prisma.admin.findUnique({
                    where: { id },
                    include: { profile: true }
                });

                if (!admin) return null;
                
                return this.mapAdminFromDb(admin);
            } catch (prismaError) {
                console.error('Error finding admin by ID with Prisma:', prismaError);
                
                // Prisma başarısız olursa Supabase'e fallback
                const { data: admin, error } = await supabase
                    .from('Admin')
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .eq('id', id)
                    .single();

                if (error || !admin) return null;

                return this.mapAdminFromDb(admin);
            }
        } catch (error: any) {
            console.error('Error finding admin by ID:', error);
            return null;
        }
    }

    /**
     * Finds an admin by username
     * 
     * @param username Admin username
     * @returns Admin data or null if not found
     */
    async findAdminByUsername(username: string): Promise<Admin | null> {
        try {
            // Önce Prisma ile deneyelim
            try {
                const admin = await prisma.admin.findFirst({
                    where: { username },
                    include: { profile: true }
                });

                if (!admin) return null;
                
                return this.mapAdminFromDb(admin);
            } catch (prismaError) {
                console.error('Error finding admin by username with Prisma:', prismaError);
                
                // Prisma başarısız olursa Supabase'e fallback
                const { data: admin, error } = await supabase
                    .from('Admin')
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .eq('username', username)
                    .single();

                if (error || !admin) return null;

                return this.mapAdminFromDb(admin);
            }
        } catch (error: any) {
            console.error('Error finding admin by username:', error);
            return null;
        }
    }

    /**
     * Finds an admin by email
     * 
     * @param email Admin email
     * @returns Admin data or null if not found
     */
    async findAdminByEmail(email: string): Promise<Admin | null> {
        try {
            if (!email) return null;
            
            // Önce Prisma ile deneyelim
            try {
                const admin = await prisma.admin.findFirst({
                    where: { email },
                    include: { profile: true }
                });

                if (!admin) return null;
                
                return this.mapAdminFromDb(admin);
            } catch (prismaError) {
                console.error('Error finding admin by email with Prisma:', prismaError);
                
                // Prisma başarısız olursa Supabase'e fallback
                const { data: admin, error } = await supabase
                    .from('Admin')
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .eq('email', email)
                    .single();

                if (error || !admin) return null;

                return this.mapAdminFromDb(admin);
            }
        } catch (error: any) {
            console.error('Error finding admin by email:', error);
            return null;
        }
    }

    /**
     * Updates an admin
     * 
     * @param id Admin ID to update
     * @param data Updated admin data
     * @param updaterRole Role of the admin making the update
     * @returns Updated admin data
     */
    async updateAdmin(id: string, data: UpdateAdminData, updaterRole?: string): Promise<Admin> {
        try {
            // Check existing admin
            const existingAdmin = await this.findAdminById(id);
            if (!existingAdmin) {
                throw new Error('Admin not found');
            }

            // Only superadmin can change role to superadmin
            if (data.role === 'superadmin' && updaterRole !== 'superadmin') {
                throw new Error('Only superadmin can grant superadmin role');
            }

            // Prevent changing role of a superadmin if updater is not a superadmin
            if (existingAdmin.role === 'superadmin' && updaterRole !== 'superadmin') {
                throw new Error('Cannot modify a superadmin account');
            }

            const updateData: any = {};

            if (data.email) updateData.email = data.email;
            if (data.role) updateData.role = data.role;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;

            // If password provided, hash it
            if (data.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.passwordHash = await bcrypt.hash(data.password, salt);
            }

            try {
                // Update with Prisma
                const admin = await prisma.admin.update({
                    where: { id },
                    data: updateData,
                    include: { profile: true }
                });

                return this.mapAdminFromDb(admin);
            } catch (prismaError) {
                console.error('Error updating admin with Prisma:', prismaError);
                
                // Fallback to Supabase
                // Convert field names for Supabase
                const supabaseUpdateData: any = {};
                
                if (updateData.email) supabaseUpdateData.email = updateData.email;
                if (updateData.role) supabaseUpdateData.role = updateData.role;
                if (updateData.isActive !== undefined) supabaseUpdateData.is_active = updateData.isActive;
                if (updateData.passwordHash) supabaseUpdateData.password_hash = updateData.passwordHash;
                
                supabaseUpdateData.updated_at = new Date().toISOString();

                const { data: admin, error } = await supabase
                    .from('Admin')
                    .update(supabaseUpdateData)
                    .eq('id', id)
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .single();

                if (error) throw error;

                return this.mapAdminFromDb(admin);
            }
        } catch (error: any) {
            console.error('Error updating admin:', error);
            throw new Error(error.message || 'Failed to update admin');
        }
    }

    /**
     * Updates admin profile
     * 
     * @param adminId Admin ID
     * @param profileData Profile data to update
     * @returns Updated admin with profile
     */
    async updateAdminProfile(
        adminId: string,
        profileData: {
            firstName?: string;
            lastName?: string;
            avatarUrl?: string;
            bio?: string;
            phoneNumber?: string;
        }
    ): Promise<Admin | null> {
        try {
            // Check if admin exists
            const admin = await this.findAdminById(adminId);
            if (!admin) {
                throw new Error('Admin not found');
            }

            try {
                // Map profile data to database fields for Prisma
                const prismaUpdateData: any = {};

                if (profileData.firstName !== undefined) prismaUpdateData.firstName = profileData.firstName;
                if (profileData.lastName !== undefined) prismaUpdateData.lastName = profileData.lastName;
                if (profileData.avatarUrl !== undefined) prismaUpdateData.avatarUrl = profileData.avatarUrl;
                if (profileData.bio !== undefined) prismaUpdateData.bio = profileData.bio;
                if (profileData.phoneNumber !== undefined) prismaUpdateData.phoneNumber = profileData.phoneNumber;

                // Check if profile exists and update or create accordingly
                const existingProfile = await prisma.adminProfile.findUnique({
                    where: { adminId }
                });

                let updatedAdmin;

                if (existingProfile) {
                    // Update existing profile
                    await prisma.adminProfile.update({
                        where: { adminId },
                        data: prismaUpdateData
                    });
                    
                    updatedAdmin = await prisma.admin.findUnique({
                        where: { id: adminId },
                        include: { profile: true }
                    });
                } else {
                    // Create new profile
                    updatedAdmin = await prisma.admin.update({
                        where: { id: adminId },
                        data: {
                            profile: {
                                create: {
                                    firstName: profileData.firstName || '',
                                    lastName: profileData.lastName || '',
                                    avatarUrl: profileData.avatarUrl || null,
                                    bio: profileData.bio || null,
                                    phoneNumber: profileData.phoneNumber || null,
                                }
                            }
                        },
                        include: { profile: true }
                    });
                }

                if (!updatedAdmin) return null;

                return this.mapAdminFromDb(updatedAdmin);
            } catch (prismaError) {
                console.error('Error updating admin profile with Prisma:', prismaError);
                
                // Fallback to Supabase
                // Map profile data to database column names for Supabase
                const supabaseUpdateData: any = {
                    updated_at: new Date().toISOString()
                };

                if (profileData.firstName !== undefined) supabaseUpdateData.first_name = profileData.firstName;
                if (profileData.lastName !== undefined) supabaseUpdateData.last_name = profileData.lastName;
                if (profileData.avatarUrl !== undefined) supabaseUpdateData.avatar_url = profileData.avatarUrl;
                if (profileData.bio !== undefined) supabaseUpdateData.bio = profileData.bio;
                if (profileData.phoneNumber !== undefined) supabaseUpdateData.phone_number = profileData.phoneNumber;

                // Check if profile exists
                const { data: profileExists } = await supabase
                    .from('AdminProfile')
                    .select('id')
                    .eq('admin_id', adminId)
                    .single();

                if (profileExists) {
                    // Update existing profile
                    const { error } = await supabase
                        .from('AdminProfile')
                        .update(supabaseUpdateData)
                        .eq('admin_id', adminId);

                    if (error) throw error;
                } else {
                    // Create new profile
                    const { error } = await supabase
                        .from('AdminProfile')
                        .insert({
                            admin_id: adminId,
                            first_name: profileData.firstName || '',
                            last_name: profileData.lastName || '',
                            avatar_url: profileData.avatarUrl || null,
                            bio: profileData.bio || null,
                            phone_number: profileData.phoneNumber || null,
                            created_at: new Date().toISOString()
                        });

                    if (error) throw error;
                }

                // Get updated admin with profile
                const { data: updatedAdmin, error: adminError } = await supabase
                    .from('Admin')
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .eq('id', adminId)
                    .single();

                if (adminError || !updatedAdmin) return null;

                return this.mapAdminFromDb(updatedAdmin);
            }
        } catch (error: any) {
            console.error('Error updating admin profile:', error);
            throw new Error(error.message || 'Failed to update admin profile');
        }
    }

    /**
     * Deletes an admin
     * 
     * @param id Admin ID to delete
     * @param deleterRole Role of the admin performing the deletion
     * @returns Deleted admin
     */
    async deleteAdmin(id: string, deleterRole?: string): Promise<{ success: boolean; message?: string }> {
        try {
            // Check if admin exists
            const admin = await this.findAdminById(id);
            if (!admin) {
                return { success: false, message: 'Admin not found' };
            }

            // Prevent deletion of superadmin by non-superadmin
            if (admin.role === 'superadmin' && deleterRole !== 'superadmin') {
                return { success: false, message: 'Only superadmin can delete another superadmin account' };
            }

            try {
                // Delete admin with Prisma (cascade deletion will also remove profile)
                await prisma.admin.delete({
                    where: { id }
                });

                return { success: true };
            } catch (prismaError) {
                console.error('Error deleting admin with Prisma:', prismaError);
                
                // Fallback to Supabase
                const { error } = await supabase
                    .from('Admin')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                return { success: true };
            }
        } catch (error: any) {
            console.error('Error deleting admin:', error);
            return { success: false, message: error.message || 'Failed to delete admin' };
        }
    }

    /**
     * Lists all admins with pagination
     * 
     * @param page Page number
     * @param pageSize Items per page
     * @returns List of admins and total count
     */
    async listAdmins(page = 1, pageSize = 10): Promise<{ admins: Admin[]; total: number }> {
        try {
            const skip = (page - 1) * pageSize;

            try {
                // Get data with Prisma
                const total = await prisma.admin.count();
                const admins = await prisma.admin.findMany({
                    skip,
                    take: pageSize,
                    include: { profile: true }
                });

                return {
                    admins: admins.map(admin => this.mapAdminFromDb(admin)),
                    total
                };
            } catch (prismaError) {
                console.error('Error listing admins with Prisma:', prismaError);
                
                // Fallback to Supabase
                // Get total count
                const { count, error: countError } = await supabase
                    .from('Admin')
                    .select('*', { count: 'exact', head: true });

                if (countError) throw countError;

                // Get admins with pagination
                const { data: admins, error } = await supabase
                    .from('Admin')
                    .select(`
                        *,
                        profile:AdminProfile(*)
                    `)
                    .range(skip, skip + pageSize - 1);

                if (error) throw error;

                return {
                    admins: admins.map(admin => this.mapAdminFromDb(admin)),
                    total: count || 0
                };
            }
        } catch (error: any) {
            console.error('Error listing admins:', error);
            throw new Error(error.message || 'Failed to list admins');
        }
    }

    /**
     * Checks if at least one superadmin exists
     * 
     * @returns True if at least one superadmin exists
     */
    async hasSuperAdmin(): Promise<boolean> {
        try {
            try {
                // Check with Prisma
                const count = await prisma.admin.count({
                    where: {
                        role: 'superadmin',
                        isActive: true
                    }
                });

                return count > 0;
            } catch (prismaError) {
                console.error('Error checking for superadmin with Prisma:', prismaError);
                
                // Fallback to Supabase
                const { count, error } = await supabase
                    .from('Admin')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'superadmin')
                    .eq('is_active', true);

                if (error) throw error;

                return (count || 0) > 0;
            }
        } catch (error: any) {
            console.error('Error checking for superadmin:', error);
            return false;
        }
    }

    /**
     * Creates initial superadmin account if none exists
     * 
     * @param username Username for superadmin
     * @param password Password for superadmin
     * @param email Optional email for superadmin
     * @returns Created superadmin or null if failed
     */
    async createInitialSuperAdmin(username: string, password: string, email?: string): Promise<Admin | null> {
        try {
            // Check if we already have a superadmin
            const hasSuperAdmin = await this.hasSuperAdmin();
            if (hasSuperAdmin) {
                console.log('Superadmin already exists, cannot create initial superadmin');
                return null;
            }

            // Create superadmin
            const superadmin = await this.createAdmin({
                username,
                email,
                password,
                role: 'superadmin',
                isActive: true,
                profile: {
                    firstName: 'Super',
                    lastName: 'Admin'
                }
            });

            console.log('Initial superadmin created successfully');
            return superadmin;
        } catch (error: any) {
            console.error('Error creating initial superadmin:', error);
            return null;
        }
    }

    /**
     * Maps database admin object to Admin interface
     * 
     * @param dbAdmin Admin from database
     * @returns Mapped Admin object
     */
    private mapAdminFromDb(dbAdmin: any): Admin {
        // Handle both Prisma and Supabase field naming
        const createdAt = dbAdmin.createdAt || dbAdmin.created_at;
        const updatedAt = dbAdmin.updatedAt || dbAdmin.updated_at;
        
        return {
            id: dbAdmin.id,
            username: dbAdmin.username,
            email: dbAdmin.email,
            passwordHash: dbAdmin.passwordHash || dbAdmin.password_hash,
            role: dbAdmin.role,
            isActive: dbAdmin.isActive !== undefined ? dbAdmin.isActive : dbAdmin.is_active,
            createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
            updatedAt: updatedAt instanceof Date ? updatedAt?.toISOString() : updatedAt,
            profile: dbAdmin.profile ? {
                id: dbAdmin.profile.id,
                adminId: dbAdmin.profile.adminId || dbAdmin.profile.admin_id,
                firstName: dbAdmin.profile.firstName || dbAdmin.profile.first_name,
                lastName: dbAdmin.profile.lastName || dbAdmin.profile.last_name,
                avatarUrl: dbAdmin.profile.avatarUrl || dbAdmin.profile.avatar_url,
                bio: dbAdmin.profile.bio,
                phoneNumber: dbAdmin.profile.phoneNumber || dbAdmin.profile.phone_number,
                createdAt: dbAdmin.profile.createdAt instanceof Date 
                    ? dbAdmin.profile.createdAt.toISOString() 
                    : dbAdmin.profile.created_at,
                updatedAt: dbAdmin.profile.updatedAt instanceof Date 
                    ? dbAdmin.profile.updatedAt?.toISOString() 
                    : dbAdmin.profile.updated_at
            } : null
        };
    }
} 