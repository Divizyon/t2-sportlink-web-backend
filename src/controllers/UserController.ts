import { Request, Response } from 'express';
import * as userService from '../services/userService';

export class UserController {
    public getAllUsers = async (req: Request, res: Response): Promise<Response> => {
        try {
            const users = await userService.getAllUsers();
            
            return res.status(200).json({
                status: 'success',
                results: users.length,
                data: {
                    users
                }
            });
        } catch (error: any) {
            console.error('Get all users error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Kullanıcılar getirilirken bir hata oluştu.'
            });
        }
    }

    /**
     * Kullanıcı detaylarını getir
     * @route GET /api/users/:id
     */
    public getUserById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Kullanıcı bulunamadı.'
                });
            }
            
            return res.status(200).json({
                status: 'success',
                data: {
                    user
                }
            });
        } catch (error: any) {
            console.error('Get user by ID error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Kullanıcı getirilirken bir hata oluştu.'
            });
        }
    }

    /**
     * Kullanıcı bilgilerini güncelle
     * @route PUT /api/users/:id
     */
    public updateUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const updatedUser = await userService.updateUser(id, updates);
            
            if (!updatedUser) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Kullanıcı bulunamadı.'
                });
            }
            
            return res.status(200).json({
                status: 'success',
                data: {
                    user: updatedUser
                }
            });
        } catch (error: any) {
            console.error('Update user error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Kullanıcı güncellenirken bir hata oluştu.'
            });
        }
    }
} 