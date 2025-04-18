import { Request, Response } from 'express';
import { NewsService, CreateNewsData, UpdateNewsData } from '../services/NewsService';

const newsService = new NewsService();

export class NewsController {
    /**
     * Yeni haber oluştur
     */
    async createNews(req: Request, res: Response): Promise<void> {
        try {
            // Admin ID'sini al (auth middleware'den gelecek)
            const adminId = (req as any).admin?.id;

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Yetkilendirme başarısız'
                });
                return;
            }

            const newsData: CreateNewsData = {
                title: req.body.title,
                content: req.body.content,
                imageUrl: req.body.image || req.body.imageUrl,
                isPublished: req.body.isPublished ?? false,
                publishedAt: req.body.publishDate || req.body.publishedAt,
                authorId: adminId,
                summary: req.body.summary || req.body.metaDescription,
                categoryIds: req.body.categoryIds
            };

            const news = await newsService.createNews(newsData);

            res.status(201).json({
                success: true,
                data: news
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Haber oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Haber güncelle
     */
    async updateNews(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Haber var mı kontrol et
            const existingNews = await newsService.findNewsById(id);
            if (!existingNews) {
                res.status(404).json({
                    success: false,
                    message: 'Haber bulunamadı'
                });
                return;
            }

            const newsData: UpdateNewsData = {
                title: req.body.title,
                content: req.body.content,
                imageUrl: req.body.image || req.body.imageUrl,
                isPublished: req.body.isPublished,
                publishedAt: req.body.publishDate || req.body.publishedAt,
                summary: req.body.summary || req.body.metaDescription,
                categoryIds: req.body.categoryIds
            };

            const updatedNews = await newsService.updateNews(id, newsData);

            res.status(200).json({
                success: true,
                data: updatedNews
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Haber güncellenirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Haberi sil
     */
    async deleteNews(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Haber var mı kontrol et
            const existingNews = await newsService.findNewsById(id);
            if (!existingNews) {
                res.status(404).json({
                    success: false,
                    message: 'Haber bulunamadı'
                });
                return;
            }

            await newsService.deleteNews(id);

            res.status(200).json({
                success: true,
                message: 'Haber başarıyla silindi'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Haber silinirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Haber detayını getir (admin ve public)
     */
    async getNewsById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const isAdmin = !!(req as any).admin?.id;

            const news = await newsService.findNewsById(id);

            if (!news) {
                res.status(404).json({
                    success: false,
                    message: 'Haber bulunamadı'
                });
                return;
            }

            // Admin değilse ve haber yayınlanmamışsa erişimi engelle
            if (!isAdmin && !news.isPublished) {
                res.status(403).json({
                    success: false,
                    message: 'Bu habere erişim izniniz yok'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: news
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Haber detayı getirilirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Haber listesini getir (admin ve public)
     */
    async getNewsList(req: Request, res: Response): Promise<void> {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
            const isAdmin = !!(req as any).admin?.id;

            const { news, total } = await newsService.listNews({
                page,
                pageSize,
                isPublished: isAdmin ? undefined : true
            });

            res.status(200).json({
                success: true,
                data: news,
                meta: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Haber listesi getirilirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * URL slug ile haber detayı getir (public)
     */
    async getNewsBySlug(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;
            const isAdmin = !!(req as any).admin?.id;

            const news = await newsService.findNewsBySlug(slug);

            if (!news) {
                res.status(404).json({
                    success: false,
                    message: 'Haber bulunamadı'
                });
                return;
            }

            // Admin değilse ve haber yayınlanmamışsa erişimi engelle
            if (!isAdmin && !news.isPublished) {
                res.status(403).json({
                    success: false,
                    message: 'Bu habere erişim izniniz yok'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: news
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Haber detayı getirilirken bir hata oluştu',
                error: error.message
            });
        }
    }
} 