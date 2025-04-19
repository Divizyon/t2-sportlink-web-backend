import { supabase } from '../config/supabase';
import { generateSlug } from '../utils/stringUtils';

interface Event {
    id: string;
    title: string;
    slug: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    max_participants: number | null;
    created_at: string;
    updated_at: string | null;
}

export class EventService {
    /**
     * Creates a new event
     * 
     * @param data Event data
     * @returns The created event or error
     */
    async createEvent(data: Partial<Event>): Promise<{ data: Event | null; error: any }> {
        try {
            // Generate slug from title
            const slug = generateSlug(data.title || '');

            const { data: event, error } = await supabase
                .from('events')
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

            return { data: event, error: null };
        } catch (error: any) {
            console.error('Error creating event:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Updates an existing event
     * 
     * @param id Event ID
     * @param data Updated event data
     * @returns The updated event or error
     */
    async updateEvent(id: string, data: Partial<Event>): Promise<{ data: Event | null; error: any }> {
        try {
            const updateData: any = { ...data, updated_at: new Date().toISOString() };

            // Generate new slug if title changed
            if (data.title) {
                updateData.slug = generateSlug(data.title);
            }

            const { data: event, error } = await supabase
                .from('events')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { data: event, error: null };
        } catch (error: any) {
            console.error('Error updating event:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Deletes an event
     * 
     * @param id Event ID
     * @returns Success status or error
     */
    async deleteEvent(id: string): Promise<{ success: boolean; error: any }> {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error deleting event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Finds an event by ID
     * 
     * @param id Event ID
     * @returns The event or null if not found
     */
    async findEventById(id: string): Promise<{ data: Event | null; error: any }> {
        try {
            const { data: event, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { data: event, error: null };
        } catch (error: any) {
            console.error('Error finding event:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Finds an event by slug
     * 
     * @param slug Event slug
     * @returns The event or null if not found
     */
    async findEventBySlug(slug: string): Promise<{ data: Event | null; error: any }> {
        try {
            const { data: event, error } = await supabase
                .from('events')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { data: event, error: null };
        } catch (error: any) {
            console.error('Error finding event by slug:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Lists events with pagination
     * 
     * @param page Page number
     * @param limit Items per page
     * @param activeOnly Filter for active events only
     * @returns List of events and total count
     */
    async listEvents(page: number = 1, limit: number = 10, activeOnly: boolean = false): Promise<{ data: Event[]; count: number; error: any }> {
        try {
            const offset = (page - 1) * limit;

            let query = supabase
                .from('events')
                .select('*', { count: 'exact' });

            if (activeOnly) {
                query = query.eq('is_active', true);
            }

            const { data: events, count, error } = await query
                .order('start_date', { ascending: true })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: events as Event[],
                count: count || 0,
                error: null
            };
        } catch (error: any) {
            console.error('Error listing events:', error);
            return { data: [], count: 0, error: error.message };
        }
    }

    /**
     * Gets upcoming events
     * 
     * @param limit Number of events to return
     * @returns List of upcoming events
     */
    async getUpcomingEvents(limit: number = 5): Promise<{ data: Event[]; error: any }> {
        try {
            const now = new Date().toISOString();

            const { data: events, error } = await supabase
                .from('events')
                .select('*')
                .eq('is_active', true)
                .gte('start_date', now)
                .order('start_date', { ascending: true })
                .limit(limit);

            if (error) throw error;

            return { data: events as Event[], error: null };
        } catch (error: any) {
            console.error('Error getting upcoming events:', error);
            return { data: [], error: error.message };
        }
    }
} 