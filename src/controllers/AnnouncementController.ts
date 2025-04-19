import { Request, Response } from 'express';
import { AnnouncementService } from '../services/AnnouncementService';
import { formatAnnouncementResponse } from '../models/Announcement';

export class AnnouncementController {
    private announcementService: AnnouncementService;

    constructor() {
        this.announcementService = new AnnouncementService();
    }

    /**
     * Yeni bir duyuru oluşturur
     */
    createAnnouncement = async (req: Request, res: Response) => {
        try {
            const { title, content, isPublished, startDate, endDate } = req.body;
            
            // Kullanıcı kimliğini token'dan al
            const creatorId = req.user?.userId;
            
            if (!creatorId) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Yetkilendirme hatası: Kullanıcı kimliği bulunamadı' 
                });
            }

            // isPublished parametresi ile published değerini belirle
            let published = false;
            if (isPublished !== undefined) {
                published = typeof isPublished === 'string' ? isPublished === 'true' : Boolean(isPublished);
            }

            const { data, error } = await this.announcementService.createAnnouncement({
                title,
                content,
                published,
                startDate: startDate || null,
                endDate: endDate || null,
                creatorId: creatorId // Auth middleware'inden gelen kullanıcı ID'si
            });

            if (error) {
                return res.status(500).json({ success: false, error });
            }

            return res.status(201).json({ 
                success: true, 
                data: data ? formatAnnouncementResponse(data) : null 
            });
        } catch (error: any) {
            console.error('Duyuru oluşturma hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Varolan bir duyuruyu günceller
     */
    updateAnnouncement = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { title, content, isPublished, startDate, endDate } = req.body;
            
            console.log('Güncellenecek değerler:', { isPublished });
            
            // Önce duyuruyu bulalım ve yetki kontrolü yapalım
            const existingAnnouncement = await this.announcementService.findAnnouncementById(id);
            
            if (!existingAnnouncement.data) {
                return res.status(404).json({ success: false, error: 'Duyuru bulunamadı' });
            }
            
            // Admin değilse ve kendi oluşturmadığı bir duyuruysa güncelleme yetkisi yok
            const isAdmin = req.user?.role === 'admin';
            const isCreator = existingAnnouncement.data.creator_id?.toString() === req.user?.userId.toString();
            
            if (!isAdmin && !isCreator) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Bu duyuruyu güncelleme yetkiniz bulunmamaktadır' 
                });
            }
            
            // isPublished parametresi ile published değerini belirle
            let published;
            if (isPublished !== undefined) {
                published = typeof isPublished === 'string' ? isPublished === 'true' : Boolean(isPublished);
            }
            
            const { data, error } = await this.announcementService.updateAnnouncement(
                id,
                {
                    title,
                    content,
                    published,
                    startDate,
                    endDate
                }
            );

            if (error) {
                if (error === 'Duyuru bulunamadı') {
                    return res.status(404).json({ success: false, error });
                }
                return res.status(500).json({ success: false, error });
            }

            return res.status(200).json({
                success: true,
                data: data ? formatAnnouncementResponse(data) : null
            });
        } catch (error: any) {
            console.error('Duyuru güncelleme hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Bir duyuruyu siler
     */
    deleteAnnouncement = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            // Önce duyuruyu bulalım ve yetki kontrolü yapalım
            const existingAnnouncement = await this.announcementService.findAnnouncementById(id);
            
            if (!existingAnnouncement.data) {
                return res.status(404).json({ success: false, error: 'Duyuru bulunamadı' });
            }
            
            // Admin değilse ve kendi oluşturmadığı bir duyuruysa silme yetkisi yok
            const isAdmin = req.user?.role === 'admin';
            const isCreator = existingAnnouncement.data.creator_id?.toString() === req.user?.userId.toString();
            
            if (!isAdmin && !isCreator) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Bu duyuruyu silme yetkiniz bulunmamaktadır' 
                });
            }

            const { success, error } = await this.announcementService.deleteAnnouncement(id);

            if (error) {
                if (error === 'Duyuru bulunamadı') {
                    return res.status(404).json({ success: false, error });
                }
                return res.status(500).json({ success: false, error });
            }

            return res.status(200).json({ success: true, message: 'Duyuru başarıyla silindi' });
        } catch (error: any) {
            console.error('Duyuru silme hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ID'ye göre duyuru getirir
     */
    getAnnouncementById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const { data, error } = await this.announcementService.findAnnouncementById(id);

            if (error) {
                return res.status(500).json({ success: false, error });
            }

            if (!data) {
                return res.status(404).json({ success: false, error: 'Duyuru bulunamadı' });
            }

            return res.status(200).json({
                success: true,
                data: formatAnnouncementResponse(data)
            });
        } catch (error: any) {
            console.error('Duyuru getirme hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Slug'a göre duyuru getirir
     */
    getAnnouncementBySlug = async (req: Request, res: Response) => {
        try {
            const { slug } = req.params;

            const { data, error } = await this.announcementService.findAnnouncementBySlug(slug);

            if (error) {
                return res.status(500).json({ success: false, error });
            }

            if (!data) {
                return res.status(404).json({ success: false, error: 'Duyuru bulunamadı' });
            }

            return res.status(200).json({
                success: true,
                data: formatAnnouncementResponse(data)
            });
        } catch (error: any) {
            console.error('Duyuru getirme hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Duyuruları sayfalı olarak listeler
     */
    listAnnouncements = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const isPublishedOnly = req.query.published === 'true';

            const { data, count, error } = await this.announcementService.listAnnouncements(
                page,
                pageSize,
                isPublishedOnly
            );

            if (error) {
                return res.status(500).json({ success: false, error });
            }

            return res.status(200).json({
                success: true,
                data: data.map(announcement => formatAnnouncementResponse(announcement)),
                pagination: {
                    page,
                    pageSize,
                    totalCount: count,
                    totalPages: Math.ceil(count / pageSize)
                }
            });
        } catch (error: any) {
            console.error('Duyuru listeleme hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Aktif duyuruları getirir (yayında ve tarih aralığında ise)
     */
    getActiveAnnouncements = async (req: Request, res: Response) => {
        try {
            const { data, error } = await this.announcementService.getActiveAnnouncements();

            if (error) {
                return res.status(500).json({ success: false, error });
            }

            return res.status(200).json({
                success: true,
                data: data.map(announcement => formatAnnouncementResponse(announcement))
            });
        } catch (error: any) {
            console.error('Aktif duyuru getirme hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
} 