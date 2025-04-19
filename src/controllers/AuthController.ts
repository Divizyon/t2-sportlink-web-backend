import { Request, Response } from 'express';
import { findUserByEmail, createUser } from '../services/userService';
import { RegisterDTO, LoginDTO, ResetPasswordDTO } from '../types/auth.types';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userData: RegisterDTO = req.body;
        
        // Check if user already exists
        const existingUser = await findUserByEmail(userData.email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email zaten kullanımda' });
        }
        
        // Create new user
        const newUser = await createUser(userData);
        
        // Create JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
        );
        
        return res.status(201).json({
            message: 'Kullanıcı başarıyla kaydedildi',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        return res.status(500).json({ error: 'Kayıt işlemi başarısız oldu' });
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password }: LoginDTO = req.body;
        
        // Find user by email
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
        );
        
        return res.status(200).json({
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        return res.status(500).json({ error: 'Giriş başarısız oldu' });
    }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
    try {
        return res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
        const resetData: ResetPasswordDTO = req.body;
        
        // Burada şifre sıfırlama işlemi yapılacak
        // Örnek: Email gönderilmesi, token oluşturulması vb.
        
        return res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
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
        // ...
        
        return res.status(200).json({ user: req.user });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}; 