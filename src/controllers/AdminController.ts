import { Request, Response } from 'express';
import { AdminService, CreateAdminData, UpdateAdminData } from '../services/AdminService';

const adminService = new AdminService();

export class AdminController {
    /**
     * Yeni admin kullanıcı kaydı
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const userData: CreateAdminData = {
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                role: req.body.role,
                profile: req.body.profile
            };

            // Kullanıcı adı ile admin var mı kontrol et
            const existingAdmin = await adminService.findAdminByUsername(userData.username);
            if (existingAdmin) {
                res.status(400).json({
                    success: false,
                    message: 'Bu kullanıcı adı zaten kullanılıyor'
                });
                return;
            }

            // Email ile kontrol et (eğer email varsa)
            if (userData.email) {
                const existingAdminByEmail = await adminService.findAdminByEmail(userData.email);
                if (existingAdminByEmail) {
                    res.status(400).json({
                        success: false,
                        message: 'Bu e-posta adresi zaten kullanılıyor'
                    });
                    return;
                }
            }

            const admin = await adminService.createAdmin(userData);

            // Hassas bilgileri temizle
            const { passwordHash, ...cleanAdmin } = admin;

            res.status(201).json({
                success: true,
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Kayıt işlemi sırasında bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Admin girişi
     */
    async login(req: Request, res: Response): Promise<void> {
        try {

            // Frontend'den gelen 'username' parametresini al
            const { username, password } = req.body;


            if (!username) {
                res.status(400).json({
                    success: false,
                    message: 'Kullanıcı adı zorunludur'
                });
                return;
            }

            const result = await adminService.login(username, password);

            console.log('Login result:', result.success ? 'Success' : 'Failed', result.message || '');

            if (!result.success) {
                res.status(401).json({
                    success: false,
                    message: result.message || 'Giriş başarısız'
                });
                return;
            }

            // Determine dashboard permissions based on role
            const isDashboardAdmin = !!result.admin;
            const canCreateAdmins = result.admin?.role === 'superadmin';

            res.status(200).json({
                success: true,
                token: result.token,
                admin: result.admin,
                dashboardAccess: {
                    hasAccess: isDashboardAdmin,
                    canCreateAdmins: canCreateAdmins
                }
            });
        } catch (error: any) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Giriş sırasında bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Admin profilini getir
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            // req.admin.id, auth middleware'den gelecek
            const adminId = (req as any).admin?.id;

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication failed'
                });
                return;
            }

            const admin = await adminService.findAdminById(adminId);

            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
                return;
            }

            // Hassas bilgileri temizle
            const { passwordHash, ...cleanAdmin } = admin;

            res.status(200).json({
                success: true,
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching profile',
                error: error.message
            });
        }
    }

    /**
     * Admin profilini güncelle
     */
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            // req.admin.id, auth middleware'den gelecek
            const adminId = (req as any).admin?.id;

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication failed'
                });
                return;
            }

            const profileData = req.body;

            const updatedProfile = await adminService.updateAdminProfile(adminId, profileData);

            if (!updatedProfile) {
                res.status(404).json({
                    success: false,
                    message: 'Profile update failed'
                });
                return;
            }

            // Hassas bilgileri temizle
            const { passwordHash, ...cleanAdmin } = updatedProfile;

            res.status(200).json({
                success: true,
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating profile',
                error: error.message
            });
        }
    }

    /**
     * Tüm adminleri listele (sadece admin yetkili kullanıcılar için)
     */
    async getAllAdmins(req: Request, res: Response): Promise<void> {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
            const requesterRole = (req as any).admin?.role;

            const { admins, total } = await adminService.listAdmins(page, pageSize);

            // Filter out superadmins if requester is not a superadmin
            let filteredAdmins = admins;
            if (requesterRole !== 'superadmin') {
                filteredAdmins = admins.filter(admin => admin.role !== 'superadmin');
            }

            // Hassas bilgileri temizle
            const cleanAdmins = filteredAdmins.map(admin => {
                const { passwordHash, ...cleanAdmin } = admin;
                return cleanAdmin;
            });

            res.status(200).json({
                success: true,
                data: cleanAdmins,
                meta: {
                    total: requesterRole === 'superadmin' ? total : total - (total - filteredAdmins.length),
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching admins',
                error: error.message
            });
        }
    }

    /**
     * Admin bilgilerini güncelle (sadece admin yetkili kullanıcılar için)
     */
    async updateAdmin(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updaterRole = (req as any).admin?.role;
            const updaterId = (req as any).admin?.id;

            // Check if the admin exists
            const existingAdmin = await adminService.findAdminById(id);
            if (!existingAdmin) {
                res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
                return;
            }

            // If not superadmin, prevent updating superadmins or changing roles
            if (updaterRole !== 'superadmin') {
                if (existingAdmin.role === 'superadmin' && existingAdmin.id !== updaterId) {
                    res.status(403).json({
                        success: false,
                        message: 'You cannot modify a superadmin account'
                    });
                    return;
                }

                // If trying to change role but not superadmin
                if (req.body.role && req.body.role !== existingAdmin.role) {
                    res.status(403).json({
                        success: false,
                        message: 'Only superadmins can change roles'
                    });
                    return;
                }
            }

            // Admins can only update certain fields for themselves if not superadmin
            if (updaterRole !== 'superadmin' && id !== updaterId) {
                res.status(403).json({
                    success: false,
                    message: 'You can only update your own account'
                });
                return;
            }

            const adminData: UpdateAdminData = {
                username: req.body.username,
                email: req.body.email,
                role: req.body.role,
                isActive: req.body.isActive,
                password: req.body.password
            };

            // Check if username is changing and already in use
            if (adminData.username && adminData.username !== existingAdmin.username) {
                const adminWithSameUsername = await adminService.findAdminByUsername(adminData.username);
                if (adminWithSameUsername && adminWithSameUsername.id !== id) {
                    res.status(400).json({
                        success: false,
                        message: 'Bu kullanıcı adı zaten kullanılıyor'
                    });
                    return;
                }
            }

            // Check if email is changing and already in use
            if (adminData.email && adminData.email !== existingAdmin.email) {
                const adminWithSameEmail = await adminService.findAdminByEmail(adminData.email);
                if (adminWithSameEmail && adminWithSameEmail.id !== id) {
                    res.status(400).json({
                        success: false,
                        message: 'Bu e-posta adresi zaten kullanılıyor'
                    });
                    return;
                }
            }

            const updatedAdmin = await adminService.updateAdmin(id, adminData, updaterRole);

            // Hassas bilgileri temizle
            const { passwordHash, ...cleanAdmin } = updatedAdmin;

            res.status(200).json({
                success: true,
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(error.message.includes('superadmin') ? 403 : 500).json({
                success: false,
                message: error.message || 'An error occurred while updating the admin',
            });
        }
    }

    /**
     * Admin sil (sadece admin yetkili kullanıcılar için)
     */
    async deleteAdmin(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const deleterRole = (req as any).admin?.role;
            const deleterId = (req as any).admin?.id;

            // Prevent self-deletion
            if (id === deleterId) {
                res.status(400).json({
                    success: false,
                    message: 'You cannot delete your own account'
                });
                return;
            }

            // Delete admin
            const result = await adminService.deleteAdmin(id, deleterRole);

            if (!result.success) {
                res.status(result.message?.includes('superadmin') ? 403 : 404).json({
                    success: false,
                    message: result.message || 'Admin deletion failed'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Admin successfully deleted'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while deleting the admin',
                error: error.message
            });
        }
    }

    /**
     * Create initial superadmin account if none exists
     */
    async createInitialSuperAdmin(req: Request, res: Response): Promise<void> {
        try {
            // Check if we already have a superadmin
            const hasSuperAdmin = await adminService.hasSuperAdmin();

            if (hasSuperAdmin) {
                res.status(400).json({
                    success: false,
                    message: 'A superadmin already exists'
                });
                return;
            }

            const { username, password, email } = req.body;

            if (!username || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
                return;
            }

            // Create superadmin
            const superAdmin = await adminService.createInitialSuperAdmin(username, password, email);

            if (!superAdmin) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create initial superadmin'
                });
                return;
            }

            // Remove sensitive information
            const { passwordHash, ...cleanAdmin } = superAdmin;

            res.status(201).json({
                success: true,
                message: 'Initial superadmin created successfully',
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while creating the initial superadmin',
                error: error.message
            });
        }
    }

    /**
     * Create new admin (superadmin only)
     */
    async createAdmin(req: Request, res: Response): Promise<void> {
        try {
            // Get the role of the admin making this request
            const creatorRole = (req as any).admin?.role;

            const userData: CreateAdminData = {
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                role: req.body.role,
                isActive: req.body.isActive,
                profile: req.body.profile
            };

            // Check if username is already in use
            const existingAdminByUsername = await adminService.findAdminByUsername(userData.username);
            if (existingAdminByUsername) {
                res.status(400).json({
                    success: false,
                    message: 'Bu kullanıcı adı zaten kullanılıyor'
                });
                return;
            }

            // Check if email is already in use (if provided)
            if (userData.email) {
                const existingAdminByEmail = await adminService.findAdminByEmail(userData.email);
                if (existingAdminByEmail) {
                    res.status(400).json({
                        success: false,
                        message: 'Bu e-posta adresi zaten kullanılıyor'
                    });
                    return;
                }
            }

            // Create the admin
            const admin = await adminService.createAdmin(userData, creatorRole);

            // Remove sensitive information
            const { passwordHash, ...cleanAdmin } = admin;

            res.status(201).json({
                success: true,
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(error.message.includes('superadmin') ? 403 : 500).json({
                success: false,
                message: error.message || 'An error occurred while creating the admin'
            });
        }
    }

    /**
     * Get admin by ID (admin and superadmin only)
     */
    async getAdminById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const requesterRole = (req as any).admin?.role;
            const requesterId = (req as any).admin?.id;

            const admin = await adminService.findAdminById(id);

            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
                return;
            }

            // If not a superadmin, prevent access to superadmin details
            if (requesterRole !== 'superadmin' && admin.role === 'superadmin' && admin.id !== requesterId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }

            // Remove sensitive information
            const { passwordHash, ...cleanAdmin } = admin;

            res.status(200).json({
                success: true,
                data: cleanAdmin
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching admin',
                error: error.message
            });
        }
    }

    /**
     * Get admin's dashboard permissions
     */
    async getDashboardPermissions(req: Request, res: Response): Promise<void> {
        try {
            const adminId = (req as any).admin?.id;
            const adminRole = (req as any).admin?.role;

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication failed'
                });
                return;
            }

            const admin = await adminService.findAdminById(adminId);

            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
                return;
            }

            // Determine dashboard permissions based on role
            const permissions = {
                hasAccess: true, // All admins have dashboard access
                canCreateAdmins: admin.role === 'superadmin'
            };

            res.status(200).json({
                success: true,
                dashboardAccess: permissions
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching dashboard permissions',
                error: error.message
            });
        }
    }
} 