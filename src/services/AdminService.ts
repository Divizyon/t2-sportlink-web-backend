import { PrismaClient } from '@prisma/client';
import { UpdateAdminProfileDTO } from '../models/Admin';

const prisma = new PrismaClient();

export class AdminService {
    /**
     * Admin kullanıcının kendi profilini güncellemesini sağlar
     * Not: role alanı güncellenmez, sadece kişisel bilgiler
     * 
     * @param userId Güncellenecek admin kullanıcının ID'si
     * @param data Güncellenecek profil bilgileri
     * @returns Güncellenmiş admin bilgileri veya hata
     */
    async updateAdminProfile(userId: bigint, data: UpdateAdminProfileDTO) {
        try {
            // Kullanıcının var olup olmadığını kontrol et
            const existingUser = await prisma.users.findUnique({
                where: {
                    id: userId
                }
            });

            if (!existingUser) {
                return { 
                    success: false, 
                    error: 'Kullanıcı bulunamadı',
                    data: null 
                };
            }
            
            // Admin veya superadmin rolü kontrolü
            if (existingUser.role !== 'admin' && existingUser.role !== 'superadmin') {
                return {
                    success: false,
                    error: 'Bu işlem için admin yetkisi gerekiyor',
                    data: null
                };
            }

            // Email değişiyorsa, bu email'in başka bir kullanıcı tarafından kullanılmadığına emin ol
            if (data.email && data.email !== existingUser.email) {
                const emailExists = await prisma.users.findFirst({
                    where: {
                        email: data.email,
                        id: {
                            not: userId
                        }
                    }
                });

                if (emailExists) {
                    return { 
                        success: false, 
                        error: 'Bu email adresi zaten başka bir kullanıcı tarafından kullanılıyor',
                        data: null 
                    };
                }
            }

            // Profil güncellemesi yap
            const updatedAdmin = await prisma.users.update({
                where: {
                    id: userId
                },
                data: {
                    ...(data.email && { email: data.email }),
                    ...(data.first_name && { first_name: data.first_name }),
                    ...(data.last_name && { last_name: data.last_name }),
                    ...(data.phone && { phone: data.phone }),
                    ...(data.profile_picture && { profile_picture: data.profile_picture })
                }
            });

            // Güncellenmiş kullanıcıyı döndür
            return { 
                success: true, 
                error: null,
                data: {
                    id: updatedAdmin.id.toString(),
                    username: updatedAdmin.username,
                    email: updatedAdmin.email,
                    first_name: updatedAdmin.first_name,
                    last_name: updatedAdmin.last_name,
                    phone: updatedAdmin.phone,
                    profile_picture: updatedAdmin.profile_picture,
                    role: updatedAdmin.role
                }
            };
        } catch (error: any) {
            console.error('Admin profili güncellenirken hata oluştu:', error);
            return { 
                success: false, 
                error: error.message || 'Admin profili güncellenirken bir hata oluştu',
                data: null 
            };
        }
    }
} 