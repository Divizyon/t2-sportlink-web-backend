import { PrismaClient } from '@prisma/client';
import { User } from './User';

export interface Announcement {
    id: bigint;
    title: string;
    slug: string;
    content: string;
    published: boolean;
    start_date: Date | null;
    end_date: Date | null;
    creator_id: bigint | null;
    created_at: Date;
    updated_at: Date;
    creator?: User;
}

export interface CreateAnnouncementDTO {
    title: string;
    content: string;
    published?: boolean;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    creatorId?: bigint | string | null;
}

export interface UpdateAnnouncementDTO {
    title?: string;
    content?: string;
    published?: boolean;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
}

/**
 * Duyurunun aktif olup olmadığını kontrol eder
 * (yayında ve tarih aralığı içinde ise aktif kabul edilir)
 */
export function isAnnouncementActive(announcement: Announcement): boolean {
    if (!announcement.published) return false;

    const now = new Date();
    
    // Başlangıç tarihi varsa ve şu andan sonra ise aktif değil
    if (announcement.start_date && announcement.start_date > now) return false;
    
    // Bitiş tarihi varsa ve şu andan önce ise aktif değil
    if (announcement.end_date && announcement.end_date < now) return false;
    
    return true;
}

/**
 * Announcement nesnesini API yanıtı için formatlayan yardımcı fonksiyon
 */
export function formatAnnouncementResponse(announcement: Announcement): any {
    return {
        id: announcement.id.toString(),
        title: announcement.title,
        slug: announcement.slug,
        content: announcement.content,
        published: announcement.published,
        startDate: announcement.start_date,
        endDate: announcement.end_date,
        creatorId: announcement.creator_id ? announcement.creator_id.toString() : null,
        createdAt: announcement.created_at,
        updatedAt: announcement.updated_at,
        creator: announcement.creator
    };
} 