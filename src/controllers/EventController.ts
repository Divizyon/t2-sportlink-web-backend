import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { AuthService } from '../services/AuthService';

export class EventController {
    private eventService: EventService;
    private authService: AuthService;

    constructor() {
        this.eventService = new EventService();
        this.authService = new AuthService();
    }

    /**
     * Create a new event
     */
    async createEvent(req: Request, res: Response) {
        try {
            const { title, description, event_date, start_time, end_time, location_name,
                location_latitude, location_longitude, max_participants, sport_id, status } = req.body;

            // Validate required fields
            if (!title || !description || !event_date || !start_time || !end_time || !location_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Get user from request
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            // Create event
            const { data, error } = await this.eventService.createEvent({
                title,
                description,
                event_date,
                start_time,
                end_time,
                location_name,
                location_latitude,
                location_longitude,
                max_participants,
                sport_id,
                status: status || 'active',
                creator_id: userId
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data,
            });
        } catch (error: any) {
            console.error('Error in createEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create event',
                error: error.message,
            });
        }
    }

    /**
     * Update an existing event
     */
    async updateEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, description, event_date, start_time, end_time, location_name,
                location_latitude, location_longitude, max_participants, sport_id, status } = req.body;

            // Get user from request
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            // Check if event exists and user is authorized
            const eventResult = await this.eventService.findEventById(id);
            if (eventResult.error || !eventResult.data) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found',
                });
            }

            // Check if user is creator
            if (eventResult.data.creator_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this event',
                });
            }

            // Update event
            const { data, error } = await this.eventService.updateEvent(id, {
                ...(title && { title }),
                ...(description && { description }),
                ...(event_date && { event_date }),
                ...(start_time && { start_time }),
                ...(end_time && { end_time }),
                ...(location_name && { location_name }),
                ...(location_latitude !== undefined && { location_latitude }),
                ...(location_longitude !== undefined && { location_longitude }),
                ...(max_participants !== undefined && { max_participants }),
                ...(sport_id && { sport_id }),
                ...(status && { status }),
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Event updated successfully',
                data,
            });
        } catch (error: any) {
            console.error('Error in updateEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update event',
                error: error.message,
            });
        }
    }

    /**
     * Delete an event
     */
    async deleteEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get user from request
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            // Check if event exists and user is authorized
            const eventResult = await this.eventService.findEventById(id);
            if (eventResult.error || !eventResult.data) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found',
                });
            }

            // Check if user is creator
            if (eventResult.data.creator_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to delete this event',
                });
            }

            // Delete event
            const { success, error } = await this.eventService.deleteEvent(id);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to delete event',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Event deleted successfully',
            });
        } catch (error: any) {
            console.error('Error in deleteEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete event',
                error: error.message,
            });
        }
    }

    /**
     * Get event by ID
     */
    async getEventById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { data, error } = await this.eventService.findEventById(id);

            if (error || !data) {
                return res.status(404).json({
                    success: false,
                    message: error || 'Event not found',
                });
            }

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            console.error('Error in getEventById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve event',
                error: error.message,
            });
        }
    }

    /**
     * Get event by slug
     */
    async getEventBySlug(req: Request, res: Response) {
        try {
            const { slug } = req.params;

            const { data, error } = await this.eventService.findEventBySlug(slug);

            if (error || !data) {
                return res.status(404).json({
                    success: false,
                    message: error || 'Event not found',
                });
            }

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            console.error('Error in getEventBySlug controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve event',
                error: error.message,
            });
        }
    }

    /**
     * List events
     */
    async listEvents(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const activeOnly = req.query.activeOnly === 'true';

            const { data, error, count } = await this.eventService.listEvents(page, limit, activeOnly);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            // Calculate pagination metadata
            const totalPages = count ? Math.ceil(count / limit) : 0;
            const hasMore = page < totalPages;

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages,
                    hasMore,
                },
            });
        } catch (error: any) {
            console.error('Error in listEvents controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to list events',
                error: error.message,
            });
        }
    }

    /**
     * Get upcoming events
     */
    async getUpcomingEvents(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 5;

            const { data, error } = await this.eventService.getUpcomingEvents(limit);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            console.error('Error in getUpcomingEvents controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve upcoming events',
                error: error.message,
            });
        }
    }

    /**
     * Join an event
     */
    async joinEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get user from request
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, error } = await this.eventService.joinEvent(id, userId);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to join event',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Successfully joined event',
            });
        } catch (error: any) {
            console.error('Error in joinEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to join event',
                error: error.message,
            });
        }
    }

    /**
     * Leave an event
     */
    async leaveEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get user from request
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, error } = await this.eventService.leaveEvent(id, userId);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to leave event',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Successfully left event',
            });
        } catch (error: any) {
            console.error('Error in leaveEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to leave event',
                error: error.message,
            });
        }
    }
} 