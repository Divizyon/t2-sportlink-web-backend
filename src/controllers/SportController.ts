import { Request, Response } from 'express';
import { SportService } from '../services/SportService';

export class SportController {
    private sportService: SportService;

    constructor() {
        this.sportService = new SportService();
    }

    /**
     * Create a new sport
     */
    async createSport(req: Request, res: Response) {
        try {
            console.log('Received create sport request:', req.body);
            
            const { name, description, icon } = req.body;

            // Validate required fields
            if (!name || !description || !icon) {
                console.log('Missing required fields:', { name, description, icon });
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Create sport
            const { data, error } = await this.sportService.createSport({
                name,
                description,
                icon
            });

            if (error) {
                console.error('Error in createSport call:', error);
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            console.log('Sport created successfully:', data);
            return res.status(201).json({
                success: true,
                message: 'Sport created successfully',
                data,
            });
        } catch (error: any) {
            console.error('Error in createSport controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create sport',
                error: error.message,
            });
        }
    }

    /**
     * Get all sports
     */
    async getAllSports(req: Request, res: Response) {
        try {
            // Desteklenen filtreleme seçenekleri
            const { name, sortBy, order } = req.query;
            
            // Filtreleri service'e iletmek için hazırla
            const filters = {
                ...(name && { name: String(name) }),
                sortBy: sortBy ? String(sortBy) : 'name',
                order: order === 'desc' ? 'desc' : 'asc' as 'asc' | 'desc'  // Tür dönüşümü
            };

            // Filtreleri kullanarak sporları getir
            const { data, error } = await this.sportService.getAllSports(filters);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            console.error('Error in getAllSports controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve sports',
                error: error.message,
            });
        }
    }

    /**
     * Get sport by ID
     */
    async getSportById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { data, error } = await this.sportService.getSportById(id);

            if (error || !data) {
                return res.status(404).json({
                    success: false,
                    message: error || 'Sport not found',
                });
            }

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            console.error('Error in getSportById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve sport',
                error: error.message,
            });
        }
    }

    /**
     * Update sport
     */
    async updateSport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, icon } = req.body;

            // Validate if any field provided
            if (!name && !description && !icon) {
                return res.status(400).json({
                    success: false,
                    message: 'No update fields provided',
                });
            }

            // Update sport
            const { data, error } = await this.sportService.updateSport(id, {
                ...(name && { name }),
                ...(description && { description }),
                ...(icon && { icon }),
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Sport updated successfully',
                data,
            });
        } catch (error: any) {
            console.error('Error in updateSport controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update sport',
                error: error.message,
            });
        }
    }

    /**
     * Delete sport
     */
    async deleteSport(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { success, error } = await this.sportService.deleteSport(id);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to delete sport',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Sport deleted successfully',
            });
        } catch (error: any) {
            console.error('Error in deleteSport controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete sport',
                error: error.message,
            });
        }
    }
}
