import { Request, Response } from 'express';
import { NewsService } from '../services/NewsService';

const newsService = new NewsService();

interface News {
    id?: string;
    title: string;
    content: string;
    source_url: string;
    image_url: string;
    published_date: Date;
    sport_id: string;
    created_at?: string;
    updated_at?: string;
}

export class NewsController {
    /**
     * Create a new news article
     */
    async createNews(req: Request, res: Response): Promise<void> {
        try {
            // Get admin ID from auth middleware
            const adminId = (req as any).admin?.id;

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication failed'
                });
                return;
            }

            const newsData: Partial<News> = {
                title: req.body.title,
                content: req.body.content,
                image_url: req.body.image || req.body.imageUrl,
                published_date: req.body.publishDate || req.body.publishedAt || new Date(),
                source_url: req.body.source_url || '',
                sport_id: req.body.sport_id
            };

            const result = await newsService.createNews(newsData);

            if (result.error) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }

            res.status(201).json({
                success: true,
                data: result.data
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error creating news article',
                error: error.message
            });
        }
    }

    /**
     * Update a news article
     */
    async updateNews(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Check if news exists
            const existingNews = await newsService.findNewsById(id);
            if (existingNews.error || !existingNews.data) {
                res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
                return;
            }

            const newsData: Partial<News> = {
                title: req.body.title,
                content: req.body.content,
                image_url: req.body.image || req.body.imageUrl,
                published_date: req.body.publishDate || req.body.publishedAt,
                source_url: req.body.source_url,
                sport_id: req.body.sport_id
            };

            const result = await newsService.updateNews(id, newsData);

            if (result.error) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating news article',
                error: error.message
            });
        }
    }

    /**
     * Delete a news article
     */
    async deleteNews(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Check if news exists
            const existingNews = await newsService.findNewsById(id);
            if (existingNews.error || !existingNews.data) {
                res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
                return;
            }

            const result = await newsService.deleteNews(id);

            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'News article successfully deleted'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error deleting news article',
                error: error.message
            });
        }
    }

    /**
     * Get news article by ID (admin and public)
     */
    async getNewsById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const result = await newsService.findNewsById(id);

            if (result.error || !result.data) {
                res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving news article',
                error: error.message
            });
        }
    }

    /**
     * Get news list with pagination (admin and public)
     */
    async getNewsList(req: Request, res: Response): Promise<void> {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const sport_id = req.query.sport_id as string | undefined;

            const result = await newsService.listNews(page, limit, sport_id);

            if (result.error) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.data,
                meta: {
                    total: result.count || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((result.count || 0) / limit)
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving news list',
                error: error.message
            });
        }
    }

    /**
     * Get recent news articles
     */
    async getRecentNews(req: Request, res: Response): Promise<void> {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
            const sport_id = req.query.sport_id as string | undefined;

            const result = await newsService.getRecentNews(limit, sport_id);

            if (result.error) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving recent news',
                error: error.message
            });
        }
    }

    /**
     * Search news articles
     */
    async searchNews(req: Request, res: Response): Promise<void> {
        try {
            const searchTerm = req.query.q as string;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

            if (!searchTerm) {
                res.status(400).json({
                    success: false,
                    message: 'Search term is required'
                });
                return;
            }

            const result = await newsService.searchNews(searchTerm, limit);

            if (result.error) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error searching news articles',
                error: error.message
            });
        }
    }
} 