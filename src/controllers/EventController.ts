import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { AuthService } from '../services/authService';

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
            console.log('Received create event request:', req.body);

            const { title, description, event_date, start_time, end_time, location_name,
                location_latitude, location_longitude, max_participants, sport_id } = req.body;

            // Validate required fields
            if (!title || !description || !event_date || !start_time || !end_time || !location_name) {
                console.log('Missing required fields:', { title, description, event_date, start_time, end_time, location_name });
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }

            // Get user from request
            const userId = req.user?.userId;
            console.log('User ID creating event:', userId);

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
                sport_id: BigInt(sport_id),
                status: 'active', // This will be overridden in service
                approval_status: 'pending', // This will be set in service
                creator_id: BigInt(userId)
            });

            if (error) {
                console.error('Error in createEvent call:', error);
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            console.log('Event created successfully:', data);
            return res.status(201).json({
                success: true,
                message: 'Event created successfully and awaiting admin approval',
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
            const userId = req.user?.userId;
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

            // Check if user is creator - convert both to string for comparison
            if (eventResult.data.creator_id.toString() !== userId.toString()) {
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
            const userId = req.user?.userId;
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

            // Check if user is creator - convert both to string for comparison
            if (eventResult.data.creator_id.toString() !== userId.toString()) {
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
            console.log(`Received join request for event ID: ${id}`);

            // Get user from request
            const userId = req.user?.userId;
            console.log(`User ID attempting to join: ${userId}`);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, error } = await this.eventService.joinEvent(id, userId.toString());

            if (!success) {
                console.log(`Join event failed: ${error}`);
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to join event',
                });
            }

            console.log(`User ${userId} successfully joined event ${id}`);
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
            console.log(`Received leave request for event ID: ${id}`);

            // Get user from request
            const userId = req.user?.userId;
            console.log(`User ID attempting to leave: ${userId}`);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, error } = await this.eventService.leaveEvent(id, userId.toString());

            if (!success) {
                console.log(`Leave event failed: ${error}`);
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to leave event',
                });
            }

            console.log(`User ${userId} successfully left event ${id}`);
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

    /**
     * Get all pending events for admin approval
     */
    async getPendingEvents(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Get admin ID from request
            const adminId = req.user?.userId;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { data, error } = await this.eventService.getPendingEvents(page, limit);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                success: true,
                ...data,
            });
        } catch (error: any) {
            console.error('Error in getPendingEvents controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get pending events',
                error: error.message,
            });
        }
    }

    /**
     * Approve an event
     */
    async approveEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get admin ID from request
            const adminId = req.user?.userId;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, error } = await this.eventService.approveEvent(id, adminId.toString());

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to approve event',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Event approved successfully',
            });
        } catch (error: any) {
            console.error('Error in approveEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to approve event',
                error: error.message,
            });
        }
    }

    /**
     * Reject an event
     */
    async rejectEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Get admin ID from request
            const adminId = req.user?.userId;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, error } = await this.eventService.rejectEvent(id, adminId.toString(), reason);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to reject event',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Event rejected successfully',
            });
        } catch (error: any) {
            console.error('Error in rejectEvent controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to reject event',
                error: error.message,
            });
        }
    }

    /**
     * Check and update expired pending events
     */
    async updateExpiredPendingEvents(req: Request, res: Response) {
        try {
            // Get admin ID from request
            const adminId = req.user?.userId;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { success, count, error } = await this.eventService.updateExpiredPendingEvents();

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Failed to update expired pending events',
                });
            }

            return res.status(200).json({
                success: true,
                message: `Updated ${count} expired pending events`,
                count,
            });
        } catch (error: any) {
            console.error('Error in updateExpiredPendingEvents controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update expired pending events',
                error: error.message,
            });
        }
    }

    /**
     * Kullanıcının katıldığı etkinlikleri getir
     */
    async getUserEvents(req: Request, res: Response) {
        try {
            // URL'den kullanıcı ID'sini al, eğer belirtilmemişse kendi ID'sini kullan
            const userId = req.params.userId || req.user?.userId;
            console.log(`Fetching events for user ID: ${userId}`);

            // Kullanıcı kontrolü
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli',
                });
            }

            // Sayfalama parametrelerini al
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Servis metodu ile etkinlikleri getir
            const { data, error } = await this.eventService.getUserEvents(userId.toString(), page, limit);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                status: 'success',
                data,
            });
        } catch (error: any) {
            console.error('Kullanıcı etkinlikleri alınırken hata:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Kullanıcının etkinlikleri getirilirken hata oluştu',
                error: error.message,
            });
        }
    }

    /**
     * Kullanıcının oluşturduğu etkinlikleri getir
     */
    async getUserCreatedEvents(req: Request, res: Response) {
        try {
            // URL'den kullanıcı ID'sini al, eğer belirtilmemişse kendi ID'sini kullan
            const userId = req.params.userId || req.user?.userId;
            console.log(`Fetching created events for user ID: ${userId}`);

            // Kullanıcı kontrolü
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli',
                });
            }

            // Sayfalama parametrelerini al
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Servis metodu ile etkinlikleri getir
            const { data, error } = await this.eventService.getUserCreatedEvents(userId.toString(), page, limit);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error,
                });
            }

            return res.status(200).json({
                status: 'success',
                data,
            });
        } catch (error: any) {
            console.error('Kullanıcının oluşturduğu etkinlikler alınırken hata:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Kullanıcının oluşturduğu etkinlikler getirilirken hata oluştu',
                error: error.message,
            });
        }
    }
} 