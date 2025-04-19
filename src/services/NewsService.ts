import { supabase } from '../config/supabase';
import { generateSlug } from '../utils/stringUtils';

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

export class NewsService {
    private readonly TABLE_NAME = 'news';

    /**
     * Create a new news article
     */
    async createNews(data: Partial<News>) {
        try {
            // Set timestamps
            const now = new Date().toISOString();
            data.created_at = now;
            data.updated_at = now;

            // Insert news into database
            const { data: insertedNews, error } = await supabase
                .from(this.TABLE_NAME)
                .insert(data)
                .select('*')
                .single();

            if (error) {
                console.error('Error creating news:', error);
                return { error: error.message };
            }

            return { data: insertedNews, error: null };
        } catch (error: any) {
            console.error('Unexpected error in createNews service:', error);
            return { error: error.message || 'Failed to create news', data: null };
        }
    }

    /**
     * Update an existing news article
     */
    async updateNews(id: string, data: Partial<News>) {
        try {
            // Update timestamp
            data.updated_at = new Date().toISOString();

            // Update news in database
            const { data: updatedNews, error } = await supabase
                .from(this.TABLE_NAME)
                .update(data)
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                console.error('Error updating news:', error);
                return { error: error.message };
            }

            return { data: updatedNews, error: null };
        } catch (error: any) {
            console.error('Unexpected error in updateNews service:', error);
            return { error: error.message || 'Failed to update news', data: null };
        }
    }

    /**
     * Delete a news article
     */
    async deleteNews(id: string) {
        try {
            // Delete news from database
            const { error } = await supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting news:', error);
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Unexpected error in deleteNews service:', error);
            return { success: false, error: error.message || 'Failed to delete news' };
        }
    }

    /**
     * Find a news article by ID
     */
    async findNewsById(id: string) {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    sport:sport_id(id, name, icon)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error finding news by ID:', error);
                return { error: error.message, data: null };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('Unexpected error in findNewsById service:', error);
            return { error: error.message || 'Failed to find news', data: null };
        }
    }

    /**
     * List news with pagination
     */
    async listNews(page: number, limit: number, sport_id?: string) {
        try {
            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            // Build query
            let query = supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    sport:sport_id(id, name, icon)
                `, { count: 'exact' });

            // Filter by sport if provided
            if (sport_id) {
                query = query.eq('sport_id', sport_id);
            }

            // Add pagination
            query = query.order('published_date', { ascending: false })
                .range(offset, offset + limit - 1);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                console.error('Error listing news:', error);
                return { error: error.message, data: null, count: 0 };
            }

            return { data, error: null, count };
        } catch (error: any) {
            console.error('Unexpected error in listNews service:', error);
            return { error: error.message || 'Failed to list news', data: null, count: 0 };
        }
    }

    /**
     * Get recent news
     */
    async getRecentNews(limit: number, sport_id?: string) {
        try {
            // Build query
            let query = supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    sport:sport_id(id, name, icon)
                `);

            // Filter by sport if provided
            if (sport_id) {
                query = query.eq('sport_id', sport_id);
            }

            // Add ordering and limit
            query = query.order('published_date', { ascending: false })
                .limit(limit);

            // Execute query
            const { data, error } = await query;

            if (error) {
                console.error('Error getting recent news:', error);
                return { error: error.message, data: null };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('Unexpected error in getRecentNews service:', error);
            return { error: error.message || 'Failed to get recent news', data: null };
        }
    }

    /**
     * Search news
     */
    async searchNews(searchTerm: string, limit: number = 10) {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    sport:sport_id(id, name, icon)
                `)
                .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
                .order('published_date', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error searching news:', error);
                return { error: error.message, data: null };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('Unexpected error in searchNews service:', error);
            return { error: error.message || 'Failed to search news', data: null };
        }
    }
} 