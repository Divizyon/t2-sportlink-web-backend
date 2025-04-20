import { Request, Response } from 'express';
import { SportService } from '../services/SportService';
import { CreateSportDTO, UpdateSportDTO } from '../models/Sport';

export class SportController {
    private sportService: SportService;

    constructor() {
        this.sportService = new SportService();
    }

    /**
     * Tüm sporları getir
     */
    async getAllSports(req: Request, res: Response) {
        try {
            const filters = {
                name: req.query.name as string,
                sortBy: req.query.sortBy as string,
                order: req.query.order as 'asc' | 'desc'
            };

            const { data, error } = await this.sportService.getAllSports(filters);

            if (error) {
                return res.status(400).json({ success: false, error });
            }

            return res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Controller Error - getAllSports:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Sporlar getirilirken bir hata oluştu' 
            });
        }
    }

    /**
     * ID'ye göre sporu getir
     */
    async getSportById(req: Request, res: Response) {
        try {
            const id = req.params.id;
            
            const { data, error } = await this.sportService.getSportById(id);

            if (error) {
                return res.status(404).json({ success: false, error });
            }

            return res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Controller Error - getSportById:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Spor getirilirken bir hata oluştu' 
            });
        }
    }

    /**
     * Yeni spor oluştur
     */
    async createSport(req: Request, res: Response) {
        try {
            const sportData: CreateSportDTO = {
                name: req.body.name,
                description: req.body.description,
                icon: req.body.icon
            };

            const { data, error } = await this.sportService.createSport(sportData);

            if (error) {
                return res.status(400).json({ success: false, error });
            }

            return res.status(201).json({ success: true, data });
        } catch (error: any) {
            console.error('Controller Error - createSport:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Spor oluşturulurken bir hata oluştu' 
            });
        }
    }

    /**
     * Sporu güncelle
     */
    async updateSport(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const updateData: UpdateSportDTO = req.body;

            const { data, error } = await this.sportService.updateSport(id, updateData);

            if (error) {
                return res.status(400).json({ success: false, error });
            }

            return res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Controller Error - updateSport:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Spor güncellenirken bir hata oluştu' 
            });
        }
    }

    /**
     * Sporu sil
     */
    async deleteSport(req: Request, res: Response) {
        try {
            const id = req.params.id;
            
            const { success, error } = await this.sportService.deleteSport(id);

            if (!success) {
                return res.status(400).json({ success: false, error });
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Spor başarıyla silindi' 
            });
        } catch (error: any) {
            console.error('Controller Error - deleteSport:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Spor silinirken bir hata oluştu' 
            });
        }
    }
}
