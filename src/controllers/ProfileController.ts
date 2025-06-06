import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';

export class ProfileController {
    private databaseService: DatabaseService;

    constructor() {
        this.databaseService = new DatabaseService();
    }

    getProfile = async (req: Request, res: Response): Promise<Response> => {
        try {
            // @ts-ignore
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { data, error } = await this.databaseService.getProfile(String(userId));
            if (error) {
                return res.status(400).json({ error });
            }

            return res.json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    updateProfile = async (req: Request, res: Response): Promise<Response> => {
        try {
            // @ts-ignore
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { data, error } = await this.databaseService.updateProfile(String(userId), req.body);
            if (error) {
                return res.status(400).json({ error });
            }

            return res.json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
} 