import { PrismaClient } from '@prisma/client';
import { Announcement, CreateAnnouncementDTO, UpdateAnnouncementDTO, formatAnnouncementResponse } from '../models/Announcement';
import { generateSlug } from '../utils/stringUtils';
import { User } from '../models/User';

const prisma = new PrismaClient();

export class AnnouncementService {
    /**
     * Yeni bir duyuru oluşturur
     * 
     * @param data Duyuru verileri
     * @returns Oluşturulan duyuru veya hata
     */
    async createAnnouncement(data: CreateAnnouncementDTO): Promise<{ data: Announcement | null; error: any }> {
        try {
            // Slug oluştur
            const slug = generateSlug(data.title);

            // Tarihleri işle
            const startDate = data.startDate ? new Date(data.startDate) : null;
            const endDate = data.endDate ? new Date(data.endDate) : null;

            // Creator ID'yi işle
            let creatorId: bigint | null = null;
            if (data.creatorId) {
                creatorId = typeof data.creatorId === 'string' 
                    ? BigInt(data.creatorId) 
                    : data.creatorId;
            }

            console.log('createAnnouncement - received published value:', data.published);

            // Duyuruyu oluştur - creator nesnesini include etme, sadece ID'yi kaydet
            const announcement = await prisma.announcements.create({
                data: {
                    title: data.title,
                    slug,
                    content: data.content,
                    published: typeof data.published === 'string' 
                        ? data.published === 'true' 
                        : Boolean(data.published || false),
                    start_date: startDate,
                    end_date: endDate,
                    creator_id: creatorId
                }
            });

            console.log('Created announcement with published:', announcement.published);

            return { data: announcement as Announcement, error: null };
        } catch (error: any) {
            console.error('Duyuru oluşturma hatası:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Var olan bir duyuruyu günceller
     * 
     * @param id Duyuru ID
     * @param data Güncellenecek veriler
     * @returns Güncellenen duyuru veya hata
     */
    async updateAnnouncement(
        id: string | bigint,
        data: UpdateAnnouncementDTO
    ): Promise<{ data: Announcement | null; error: any }> {
        try {
            // ID'yi BigInt'e dönüştür
            const announcementId = typeof id === 'string' ? BigInt(id) : id;

            // Duyurunun var olup olmadığını kontrol et
            const existingAnnouncement = await prisma.announcements.findUnique({
                where: { id: announcementId }
            });

            if (!existingAnnouncement) {
                return { data: null, error: 'Duyuru bulunamadı' };
            }

            console.log('updateAnnouncement - Existing announcement published:', existingAnnouncement.published);
            console.log('updateAnnouncement - Update published value:', data.published);

            // Güncelleme verilerini hazırla
            const updateData: any = {};
            
            // İçerik
            if (data.content !== undefined) {
                updateData.content = data.content;
            }
            
            // Yayın durumu
            if (data.published !== undefined) {
                // String olarak gelmiş olabilir, boolean'a dönüştür
                updateData.published = typeof data.published === 'string' 
                    ? data.published === 'true' 
                    : Boolean(data.published);
            }
            
            // Başlık ve slug
            if (data.title) {
                updateData.title = data.title;
                updateData.slug = generateSlug(data.title);
            }
            
            // Tarihler
            if (data.startDate !== undefined) {
                updateData.start_date = data.startDate ? new Date(data.startDate) : null;
            }
            
            if (data.endDate !== undefined) {
                updateData.end_date = data.endDate ? new Date(data.endDate) : null;
            }
            
            // Her zaman güncelleme tarihini ekle
            updateData.updated_at = new Date();

            console.log('updateAnnouncement - Final update data:', updateData);

            // Duyuruyu güncelle - creator bilgisini include etme
            const updatedAnnouncement = await prisma.announcements.update({
                where: { id: announcementId },
                data: updateData
            });

            console.log('updateAnnouncement - Updated announcement published:', updatedAnnouncement.published);

            return { data: updatedAnnouncement as Announcement, error: null };
        } catch (error: any) {
            console.error('Duyuru güncelleme hatası:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Bir duyuruyu siler
     * 
     * @param id Duyuru ID
     * @returns Başarı durumu veya hata
     */
    async deleteAnnouncement(id: string | bigint): Promise<{ success: boolean; error: any }> {
        try {
            // ID'yi BigInt'e dönüştür
            const announcementId = typeof id === 'string' ? BigInt(id) : id;

            // Duyurunun var olup olmadığını kontrol et
            const existingAnnouncement = await prisma.announcements.findUnique({
                where: { id: announcementId }
            });

            if (!existingAnnouncement) {
                return { success: false, error: 'Duyuru bulunamadı' };
            }

            // Duyuruyu sil
            await prisma.announcements.delete({
                where: { id: announcementId }
            });

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Duyuru silme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ID'ye göre duyuru bulur
     * 
     * @param id Duyuru ID
     * @returns Bulunan duyuru veya hata
     */
    async findAnnouncementById(id: string | bigint): Promise<{ data: Announcement | null; error: any }> {
        try {
            // ID'yi BigInt'e dönüştür
            const announcementId = typeof id === 'string' ? BigInt(id) : id;

            const announcement = await prisma.announcements.findUnique({
                where: { id: announcementId }
            });

            if (!announcement) {
                return { data: null, error: null };
            }

            return { data: announcement as Announcement, error: null };
        } catch (error: any) {
            console.error('Duyuru bulma hatası:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Slug'a göre duyuru bulur
     * 
     * @param slug Duyuru slug
     * @returns Bulunan duyuru veya hata
     */
    async findAnnouncementBySlug(slug: string): Promise<{ data: Announcement | null; error: any }> {
        try {
            const announcement = await prisma.announcements.findUnique({
                where: { slug }
            });

            if (!announcement) {
                return { data: null, error: null };
            }

            return { data: announcement as Announcement, error: null };
        } catch (error: any) {
            console.error('Slug ile duyuru bulma hatası:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Duyuruları sayfalı olarak listeler
     * 
     * @param page Sayfa numarası
     * @param limit Sayfa başı öğe sayısı
     * @param isPublishedOnly Sadece yayınlanmış olanları getir
     * @returns Duyuru listesi ve toplam sayı
     */
    async listAnnouncements(
        page: number = 1,
        limit: number = 10,
        isPublishedOnly: boolean = false
    ): Promise<{ data: Announcement[]; count: number; error: any }> {
        try {
            const skip = (page - 1) * limit;

            // Filtreleme koşulları
            const where: any = {};
            if (isPublishedOnly) {
                where.published = true;
            }

            // Toplam sayı
            const count = await prisma.announcements.count({ where });

            // Duyuruları getir - creator bilgisini include etme
            const announcements = await prisma.announcements.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            });

            return {
                data: announcements as Announcement[],
                count,
                error: null
            };
        } catch (error: any) {
            console.error('Duyuru listeleme hatası:', error);
            return { data: [], count: 0, error: error.message };
        }
    }

    /**
     * Aktif duyuruları getirir
     * (yayında ve tarih aralığında olanlar)
     * 
     * @returns Aktif duyuru listesi
     */
    async getActiveAnnouncements(): Promise<{ data: Announcement[]; error: any }> {
        try {
            const now = new Date();

            const announcements = await prisma.announcements.findMany({
                where: {
                    published: true,
                    AND: [
                        {
                            OR: [
                                { start_date: null },
                                { start_date: { lte: now } }
                            ]
                        },
                        {
                            OR: [
                                { end_date: null },
                                { end_date: { gte: now } }
                            ]
                        }
                    ]
                },
                orderBy: { created_at: 'desc' }
            });

            return { data: announcements as Announcement[], error: null };
        } catch (error: any) {
            console.error('Aktif duyuru getirme hatası:', error);
            return { data: [], error: error.message };
        }
    }
} 