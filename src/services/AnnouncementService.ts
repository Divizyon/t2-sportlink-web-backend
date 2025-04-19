import { supabase } from '../config/supabase';
import { generateSlug } from '../utils/stringUtils';

interface Announcement {
    id: string;
    title: string;
    slug: string;
    content: string;
    published: boolean;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string | null;
}

export class AnnouncementService {
    /**
     * Creates a new announcement
     * 
     * @param data Announcement data
     * @returns The created announcement or error
     */
    async createAnnouncement(data: Partial<Announcement>): Promise<{ data: Announcement | null; error: any }> {
        try {
            // Generate slug from title
            const slug = generateSlug(data.title || '');

            const { data: announcement, error } = await supabase
                .from('announcements')
                .insert([
                    {
                        ...data,
                        slug,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return { data: announcement, error: null };
        } catch (error: any) {
            console.error('Error creating announcement:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Updates an existing announcement
     * 
     * @param id Announcement ID
     * @param data Updated announcement data
     * @returns The updated announcement or error
     */
    async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<{ data: Announcement | null; error: any }> {
        try {
            const updateData: any = { ...data, updated_at: new Date().toISOString() };

            // Generate new slug if title changed
            if (data.title) {
                updateData.slug = generateSlug(data.title);
            }

            const { data: announcement, error } = await supabase
                .from('announcements')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { data: announcement, error: null };
        } catch (error: any) {
            console.error('Error updating announcement:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Deletes an announcement
     * 
     * @param id Announcement ID
     * @returns Success status or error
     */
    async deleteAnnouncement(id: string): Promise<{ success: boolean; error: any }> {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error deleting announcement:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Finds an announcement by ID
     * 
     * @param id Announcement ID
     * @returns The announcement or null if not found
     */
    async findAnnouncementById(id: string): Promise<{ data: Announcement | null; error: any }> {
        try {
            const { data: announcement, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { data: announcement, error: null };
        } catch (error: any) {
            console.error('Error finding announcement:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Finds an announcement by slug
     * 
     * @param slug Announcement slug
     * @returns The announcement or null if not found
     */
    async findAnnouncementBySlug(slug: string): Promise<{ data: Announcement | null; error: any }> {
        try {
            const { data: announcement, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { data: announcement, error: null };
        } catch (error: any) {
            console.error('Error finding announcement by slug:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Lists announcements with pagination
     * 
     * @param page Page number
     * @param limit Items per page
     * @param isPublishedOnly Filter for published announcements only
     * @returns List of announcements and total count
     */
    async listAnnouncements(page: number = 1, limit: number = 10, isPublishedOnly: boolean = false): Promise<{ data: Announcement[]; count: number; error: any }> {
        try {
            const offset = (page - 1) * limit;

            let query = supabase
                .from('announcements')
                .select('*', { count: 'exact' });

            if (isPublishedOnly) {
                query = query.eq('published', true);
            }

            const { data: announcements, count, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: announcements as Announcement[],
                count: count || 0,
                error: null
            };
        } catch (error: any) {
            console.error('Error listing announcements:', error);
            return { data: [], count: 0, error: error.message };
        }
    }

    /**
     * Gets currently active announcements
     * (published and within date range if dates are specified)
     * 
     * @returns List of active announcements
     */
    async getActiveAnnouncements(): Promise<{ data: Announcement[]; error: any }> {
        try {
            const now = new Date().toISOString();

            const { data: announcements, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('published', true)
                .or(`start_date.is.null,start_date.lte.${now}`)
                .or(`end_date.is.null,end_date.gte.${now}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { data: announcements as Announcement[], error: null };
        } catch (error: any) {
            console.error('Error getting active announcements:', error);
            return { data: [], error: error.message };
        }
    }
} 