import { Request, Response } from 'express';
import { findUserByEmail, createUser } from '../services/userService';
import { RegisterDTO, LoginDTO, ResetPasswordDTO } from '../types/auth.types';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/authService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// BigInt için JSON serializer düzeltmesi
// Bu, BigInt değerleri string'e dönüştürmek için JSON.stringify'ı extend eder
(BigInt.prototype as any).toJSON = function() {
    return this.toString();
};

// AuthService instance oluştur
const authService = new AuthService();

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userData: RegisterDTO = req.body;
        
        // AuthService ile kullanıcı kaydı yap
        const result = await authService.register(userData);
        
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        
        return res.status(201).json({
            message: result.message,
            token: result.token,
            user: result.user
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        return res.status(500).json({ error: 'Kayıt işlemi başarısız oldu' });
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const loginData: LoginDTO = req.body;
        
        if (!loginData.email || !loginData.password) {
            return res.status(400).json({ error: 'Email/kullanıcı adı ve şifre gereklidir' });
        }
        
        // AuthService'i kullanarak giriş yap
        const result = await authService.login(loginData);
        
        if (result.error) {
            return res.status(401).json({ error: result.error });
        }
        
        return res.status(200).json({
            message: 'Giriş başarılı',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        return res.status(500).json({ error: 'Giriş başarısız oldu' });
    }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
    try {
        await authService.logout();
        return res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
        const resetData: ResetPasswordDTO = req.body;
        
        const result = await authService.resetPassword(resetData);
        
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        
        return res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const resendEmailConfirmation = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email adresi gereklidir' });
        }
        
        const result = await authService.resendEmailConfirmation(email);
        
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        
        return res.status(200).json({ message: 'Doğrulama e-postası tekrar gönderildi' });
    } catch (error: any) {
        console.error('Email onaylama hatası:', error);
        return res.status(500).json({ error: 'Email onaylama işlemi başarısız oldu' });
    }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        // @ts-ignore
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        
        // Get user from database
        const user = await prisma.users.findUnique({
            where: { id: BigInt(userId) },
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
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        // BigInt id'yi string'e çevir
        const formattedUser = {
            ...user,
            id: user.id.toString()
        };
        
        return res.status(200).json({
            status: 'success',
            data: {
                user: formattedUser
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const registerAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
        // @ts-ignore - request.user yetkilendirme middleware'i tarafından eklenir
        const currentUser = req.user;
        
        // Sadece superadmin rolüne sahip kullanıcılar admin ekleyebilir
        if (!currentUser || currentUser.role !== 'superadmin') {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece superadmin admin ekleyebilir.' });
        }
        
        const userData: RegisterDTO = req.body;
        
        // Admin kullanıcıyı AuthService aracılığıyla oluştur
        const result = await authService.registerAdmin(userData);
        
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        
        return res.status(201).json({
            message: 'Admin kullanıcı başarıyla kaydedildi',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        console.error('Admin kayıt hatası:', error);
        return res.status(500).json({ error: 'Kayıt işlemi başarısız oldu' });
    }
}; 