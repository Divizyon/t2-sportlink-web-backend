import { supabase } from '../config/supabase';
import { generateSlug } from '../utils/stringUtils';

interface Event {
    id?: string;
    title: string;
    slug?: string;
    description: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location_name: string;
    location_latitude?: number;
    location_longitude?: number;
    max_participants?: number;
    status?: 'active' | 'cancelled' | 'completed';
    sport_id?: string;
    creator_id: string;
    created_at?: string;
    updated_at?: string;
}

export class EventService {
    private readonly TABLE_NAME = 'events';
    private readonly PARTICIPANTS_TABLE = 'event_participants';

    /**
     * Create a new event
     */
    async createEvent(data: Partial<Event>) {
        try {
            // Generate slug from title
            if (data.title) {
                data.slug = generateSlug(data.title);
            }

            // Set timestamps
            const now = new Date().toISOString();
            data.created_at = now;
            data.updated_at = now;

            // Insert event into database
            const { data: insertedEvent, error } = await supabase
                .from(this.TABLE_NAME)
                .insert(data)
                .select('*')
                .single();

            if (error) {
                console.error('Error creating event:', error);
                return { error: error.message };
            }

            return { data: insertedEvent, error: null };
        } catch (error: any) {
            console.error('Unexpected error in createEvent service:', error);
            return { error: error.message || 'Failed to create event', data: null };
        }
    }

    /**
     * Update an existing event
     */
    async updateEvent(id: string, data: Partial<Event>) {
        try {
            // Generate new slug if title changes
            if (data.title) {
                data.slug = generateSlug(data.title);
            }

            // Update timestamp
            data.updated_at = new Date().toISOString();

            // Update event in database
            const { data: updatedEvent, error } = await supabase
                .from(this.TABLE_NAME)
                .update(data)
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                console.error('Error updating event:', error);
                return { error: error.message };
            }

            return { data: updatedEvent, error: null };
        } catch (error: any) {
            console.error('Unexpected error in updateEvent service:', error);
            return { error: error.message || 'Failed to update event', data: null };
        }
    }

    /**
     * Delete an event
     */
    async deleteEvent(id: string) {
        try {
            // Delete event from database
            const { error } = await supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting event:', error);
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Unexpected error in deleteEvent service:', error);
            return { success: false, error: error.message || 'Failed to delete event' };
        }
    }

    /**
     * Find an event by ID
     */
    async findEventById(id: string) {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    creator:creator_id(id, username, profile_image),
                    sport:sport_id(id, name, icon),
                    participants:${this.PARTICIPANTS_TABLE}(
                        id,
                        user_id,
                        role,
                        user:user_id(id, username, profile_image)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error finding event by ID:', error);
                return { error: error.message, data: null };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('Unexpected error in findEventById service:', error);
            return { error: error.message || 'Failed to find event', data: null };
        }
    }

    /**
     * Find an event by slug
     */
    async findEventBySlug(slug: string) {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    creator:creator_id(id, username, profile_image),
                    sport:sport_id(id, name, icon),
                    participants:${this.PARTICIPANTS_TABLE}(
                        id,
                        user_id,
                        role,
                        user:user_id(id, username, profile_image)
                    )
                `)
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Error finding event by slug:', error);
                return { error: error.message, data: null };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('Unexpected error in findEventBySlug service:', error);
            return { error: error.message || 'Failed to find event', data: null };
        }
    }

    /**
     * List events with pagination
     */
    async listEvents(page: number, limit: number, activeOnly: boolean) {
        try {
            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            // Build query
            let query = supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    creator:creator_id(id, username, profile_image),
                    sport:sport_id(id, name, icon),
                    participants:${this.PARTICIPANTS_TABLE}(id, user_id, role)
                `, { count: 'exact' });

            // Filter by status if activeOnly is true
            if (activeOnly) {
                query = query.eq('status', 'active');
            }

            // Add pagination
            query = query.order('event_date', { ascending: true })
                .range(offset, offset + limit - 1);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                console.error('Error listing events:', error);
                return { error: error.message, data: null, count: 0 };
            }

            return { data, error: null, count };
        } catch (error: any) {
            console.error('Unexpected error in listEvents service:', error);
            return { error: error.message || 'Failed to list events', data: null, count: 0 };
        }
    }

    /**
     * Get upcoming events
     */
    async getUpcomingEvents(limit: number) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    creator:creator_id(id, username, profile_image),
                    sport:sport_id(id, name, icon),
                    participants:${this.PARTICIPANTS_TABLE}(id)
                `)
                .eq('status', 'active')
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(limit);

            if (error) {
                console.error('Error getting upcoming events:', error);
                return { error: error.message, data: null };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('Unexpected error in getUpcomingEvents service:', error);
            return { error: error.message || 'Failed to get upcoming events', data: null };
        }
    }

    /**
     * Join an event
     */
    async joinEvent(eventId: string, userId: string, role: string = 'participant') {
        try {
            // Check if already joined
            const { data: existingParticipant, error: checkError } = await supabase
                .from(this.PARTICIPANTS_TABLE)
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking existing participant:', checkError);
                return { success: false, error: checkError.message };
            }

            if (existingParticipant) {
                return { success: false, error: 'You are already participating in this event' };
            }

            // Check if event has reached max participants
            const { data, error: eventError } = await supabase
                .from(this.TABLE_NAME)
                .select('max_participants, participants:' + this.PARTICIPANTS_TABLE + '(id)')
                .eq('id', eventId)
                .single();

            if (eventError) {
                console.error('Error checking event capacity:', eventError);
                return { success: false, error: eventError.message };
            }

            // Type safety with any
            const eventData = data as any;
            if (eventData &&
                typeof eventData.max_participants === 'number' &&
                Array.isArray(eventData.participants) &&
                eventData.max_participants > 0 &&
                eventData.participants.length >= eventData.max_participants) {
                return { success: false, error: 'This event has reached maximum capacity' };
            }

            // Join event
            const { error: joinError } = await supabase
                .from(this.PARTICIPANTS_TABLE)
                .insert({
                    event_id: eventId,
                    user_id: userId,
                    role,
                    joined_at: new Date().toISOString()
                });

            if (joinError) {
                console.error('Error joining event:', joinError);
                return { success: false, error: joinError.message };
            }

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Unexpected error in joinEvent service:', error);
            return { success: false, error: error.message || 'Failed to join event' };
        }
    }

    /**
     * Leave an event
     */
    async leaveEvent(eventId: string, userId: string) {
        try {
            // Check if user is a participant
            const { data: participant, error: checkError } = await supabase
                .from(this.PARTICIPANTS_TABLE)
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking participant:', checkError);
                return { success: false, error: checkError.message };
            }

            if (!participant) {
                return { success: false, error: 'You are not participating in this event' };
            }

            // Delete participation record
            const { error: leaveError } = await supabase
                .from(this.PARTICIPANTS_TABLE)
                .delete()
                .eq('event_id', eventId)
                .eq('user_id', userId);

            if (leaveError) {
                console.error('Error leaving event:', leaveError);
                return { success: false, error: leaveError.message };
            }

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Unexpected error in leaveEvent service:', error);
            return { success: false, error: error.message || 'Failed to leave event' };
        }
    }
} 