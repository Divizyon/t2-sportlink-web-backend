import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRole } from '../types/user';

const prisma = new PrismaClient();

class AdminController {
    /**
     * Tüm kullanıcıları listeler (sayfalama ile)
     */
    async listAllUsers(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // Kullanıcıları ve toplam sayısını al
            const [users, total] = await Promise.all([
                prisma.users.findMany({
                    skip,
                    take: limit,
                    orderBy: {
                        created_at: 'desc'
                    },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                        role: true,
                        created_at: true,
                        updated_at: true
                    }
                }),
                prisma.users.count()
            ]);

            // BigInt id'leri string'e çevir
            const formattedUsers = users.map(user => ({
                ...user,
                id: user.id.toString()
            }));

            return res.status(200).json({
                success: true,
                data: {
                    users: formattedUsers,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error: any) {
            console.error('Kullanıcı listeleme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcılar listelenirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Belirli bir kullanıcının detaylarını getirir
     */
    async getUserDetails(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            const user = await prisma.users.findUnique({
                where: {
                    id: BigInt(userId)
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    role: true,
                    phone: true,
                    profile_picture: true,
                    default_location_latitude: true,
                    default_location_longitude: true,
                    created_at: true,
                    updated_at: true
                }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            // BigInt id'yi string'e çevir
            const formattedUser = {
                ...user,
                id: user.id.toString()
            };

            return res.status(200).json({
                success: true,
                data: formattedUser
            });
        } catch (error: any) {
            console.error('Kullanıcı detayları hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcı detayları alınırken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Kullanıcı rolünü günceller
     */
    async updateUserRole(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const { role } = req.body;

            // Rol doğrulama
            if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçerli bir rol belirtmelisiniz (user, admin, superadmin)'
                });
            }

            // Kullanıcının var olup olmadığını kontrol et
            const userExists = await prisma.users.findUnique({
                where: { id: BigInt(userId) }
            });

            if (!userExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            // Kullanıcının rolünü güncelle
            const updatedUser = await prisma.users.update({
                where: { id: BigInt(userId) },
                data: { role },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    updated_at: true
                }
            });

            // BigInt id'yi string'e çevir
            const formattedUser = {
                ...updatedUser,
                id: updatedUser.id.toString()
            };

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı rolü başarıyla güncellendi',
                data: formattedUser
            });
        } catch (error: any) {
            console.error('Kullanıcı rolü güncelleme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcı rolü güncellenirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Yeni kullanıcı oluşturur
     */
    async createUser(req: Request, res: Response) {
        try {
            const { email, password, username, first_name, last_name, phone, role = 'user' } = req.body;

            // Gerekli alanların kontrolü
            if (!email || !password || !username) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, şifre ve kullanıcı adı zorunludur'
                });
            }

            // Email kontrolü
            const userExists = await prisma.users.findFirst({
                where: {
                    OR: [
                        { email },
                        { username }
                    ]
                }
            });

            if (userExists) {
                const field = userExists.email === email ? 'email' : 'kullanıcı adı';
                return res.status(400).json({
                    success: false,
                    message: `Bu ${field} zaten kullanılıyor`
                });
            }

            // Şifreyi hashle
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Kullanıcıyı oluştur
            const newUser = await prisma.users.create({
                data: {
                    email,
                    password: hashedPassword,
                    username,
                    first_name: first_name || '',
                    last_name: last_name || '',
                    phone: phone || '',
                    profile_picture: '',
                    default_location_latitude: 0,
                    default_location_longitude: 0,
                    role: role as UserRole
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    role: true,
                    created_at: true
                }
            });

            // BigInt id'yi string'e çevir
            const formattedUser = {
                ...newUser,
                id: newUser.id.toString()
            };

            return res.status(201).json({
                success: true,
                message: 'Kullanıcı başarıyla oluşturuldu',
                data: formattedUser
            });
        } catch (error: any) {
            console.error('Kullanıcı oluşturma hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcı oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Kullanıcı siler
     */
    async deleteUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;

            // Kullanıcının var olup olmadığını kontrol et
            const user = await prisma.users.findUnique({
                where: { id: BigInt(userId) }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            // İlişkisel verileri kontrol et
            const hasRelatedData = await checkUserRelations(BigInt(userId));
            if (hasRelatedData) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu kullanıcıya bağlı veriler bulunduğu için silinemez'
                });
            }

            // Kullanıcıyı sil
            await prisma.users.delete({
                where: { id: BigInt(userId) }
            });

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı başarıyla silindi'
            });
        } catch (error: any) {
            console.error('Kullanıcı silme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcı silinirken bir hata oluştu',
                error: error.message
            });
        }
    }
}

/**
 * Kullanıcının ilişkili verilerini kontrol eder
 */
async function checkUserRelations(userId: bigint): Promise<boolean> {
    try {
        // Etkinlik katılımcıları
        const eventParticipant = await prisma.event_Participants.findFirst({
            where: { user_id: userId }
        });
        if (eventParticipant) return true;

        // Kullanıcının oluşturduğu etkinlikler
        const createdEvent = await prisma.events.findFirst({
            where: { creator_id: userId }
        });
        if (createdEvent) return true;

        // Kullanıcı değerlendirmeleri
        const userRating = await prisma.user_Ratings.findFirst({
            where: {
                OR: [
                    { rated_user_id: userId },
                    { rating_user_id: userId }
                ]
            }
        });
        if (userRating) return true;

        // Etkinlik değerlendirmeleri
        const eventRating = await prisma.event_Ratings.findFirst({
            where: { user_id: userId }
        });
        if (eventRating) return true;

        // Bildirimler
        const notification = await prisma.notifications.findFirst({
            where: { user_id: userId }
        });
        if (notification) return true;

        // Raporlar
        const report = await prisma.reports.findFirst({
            where: {
                OR: [
                    { reporter_id: userId },
                    { reported_id: userId }
                ]
            }
        });
        if (report) return true;

        // Admin logları
        const adminLog = await prisma.admin_Logs.findFirst({
            where: { admin_id: userId }
        });
        if (adminLog) return true;

        return false;
    } catch (error) {
        console.error('İlişkili veri kontrolü hatası:', error);
        return false;
    }
}

export default AdminController; 