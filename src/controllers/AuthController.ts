import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RegisterDTO, LoginDTO, ResetPasswordDTO } from '../types/auth.types';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public register = async (req: Request, res: Response): Promise<Response> => {
        try {
            console.log('Register request received:', req.body);
            
            const registerData: RegisterDTO = req.body;
            
            // Email formatı kontrolü
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(registerData.email)) {
                return res.status(400).json({ 
                    error: 'Geçersiz email formatı',
                    details: 'Lütfen geçerli bir email adresi giriniz'
                });
            }

            // Şifre kontrolü
            if (!registerData.password || registerData.password.length < 6) {
                return res.status(400).json({ 
                    error: 'Geçersiz şifre',
                    details: 'Şifre en az 6 karakter olmalıdır'
                });
            }

            console.log('Validations passed, attempting registration...');
            
            const result = await this.authService.register(registerData);
            
            console.log('Registration result:', result);
            
            if (result.error) {
                return res.status(400).json({ 
                    error: result.error,
                    details: 'Kayıt işlemi başarısız'
                });
            }

            return res.status(201).json(result);
        } catch (error: any) {
            console.error('Registration error:', error);
            return res.status(500).json({ 
                error: error.message,
                details: 'Sunucu hatası oluştu'
            });
        }
    }

    public login = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { username, password } = req.body;
            const result = await this.authService.login(username, password);

            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            return res.json({
                user: result.user,
                session: result.session
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    public logout = async (req: Request, res: Response): Promise<Response> => {
        try {
            await this.authService.logout();
            return res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    public resetPassword = async (req: Request, res: Response): Promise<Response> => {
        try {
            const resetData: ResetPasswordDTO = req.body;
            const result = await this.authService.resetPassword(resetData);

            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    public getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const result = await this.authService.getCurrentUser();

            if (result.error) {
                return res.status(401).json({ error: result.error });
            }

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
} 