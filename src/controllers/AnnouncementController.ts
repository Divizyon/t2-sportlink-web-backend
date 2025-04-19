import { Request, Response } from 'express';
import { AnnouncementService } from '../services/AnnouncementService';

export class AnnouncementController {
    private announcementService: AnnouncementService;

    constructor() {
        this.announcementService = new AnnouncementService();
    }

    /**
     * Create a new announcement
     */
    createAnnouncement = async (req: Request, res: Response): Promise<void> => {
        try {
            const { title, content, published, start_date, end_date } = req.body;

            // Validate required fields
            if (!title || !content) {
                res.status(400).json({
                    success: false,
                    message: 'Title and content are required'
                });
                return;
            }

            // Create announcement
            const { data, error } = await this.announcementService.createAnnouncement({
                title,
                content,
                published: published !== undefined ? published : false,
                start_date: start_date || null,
                end_date: end_date || null
            });

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(201).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in createAnnouncement controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Update an existing announcement
     */
    updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { title, content, published, start_date, end_date } = req.body;

            // Check if the announcement exists
            const checkResult = await this.announcementService.findAnnouncementById(id);
            if (checkResult.error || !checkResult.data) {
                res.status(404).json({
                    success: false,
                    message: 'Announcement not found'
                });
                return;
            }

            // Update announcement
            const { data, error } = await this.announcementService.updateAnnouncement(id, {
                title,
                content,
                published,
                start_date,
                end_date
            });

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in updateAnnouncement controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Delete an announcement
     */
    deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Check if the announcement exists
            const checkResult = await this.announcementService.findAnnouncementById(id);
            if (checkResult.error || !checkResult.data) {
                res.status(404).json({
                    success: false,
                    message: 'Announcement not found'
                });
                return;
            }

            // Delete announcement
            const { success, error } = await this.announcementService.deleteAnnouncement(id);

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Announcement deleted successfully'
            });
        } catch (error: any) {
            console.error('Error in deleteAnnouncement controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get a single announcement by ID
     */
    getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { data, error } = await this.announcementService.findAnnouncementById(id);

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            if (!data) {
                res.status(404).json({
                    success: false,
                    message: 'Announcement not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in getAnnouncementById controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get a single announcement by slug
     */
    getAnnouncementBySlug = async (req: Request, res: Response): Promise<void> => {
        try {
            const { slug } = req.params;
            const { data, error } = await this.announcementService.findAnnouncementBySlug(slug);

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            if (!data) {
                res.status(404).json({
                    success: false,
                    message: 'Announcement not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in getAnnouncementBySlug controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * List announcements with pagination
     */
    listAnnouncements = async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const isPublishedOnly = req.query.published === 'true';

            const { data, count, error } = await this.announcementService.listAnnouncements(
                page,
                limit,
                isPublishedOnly
            );

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(200).json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error: any) {
            console.error('Error in listAnnouncements controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get active announcements
     */
    getActiveAnnouncements = async (req: Request, res: Response): Promise<void> => {
        try {
            const { data, error } = await this.announcementService.getActiveAnnouncements();

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in getActiveAnnouncements controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
} 