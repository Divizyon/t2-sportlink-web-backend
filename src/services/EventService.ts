import { supabase } from '../config/supabase';
import { generateSlug } from '../utils/stringUtils';
import { Event, CreateEventDTO, UpdateEventDTO } from '../models/Event';
import { PrismaClient } from '@prisma/client';

// Prisma istemcisi oluştur
const prisma = new PrismaClient();

export class EventService {
    private readonly TABLE_NAME = 'events';
    private readonly PARTICIPANTS_TABLE = 'event_participants';

    /**
     * Create a new event
     */
    async createEvent(data: CreateEventDTO) {
        try {
            console.log('Creating event with data:', JSON.stringify(data, null, 2));

            // Generate slug from title
            let eventData: any = { ...data };

            if (data.title) {
                eventData.slug = generateSlug(data.title);
            }

            // Set timestamps
            const now = new Date();

            // PrismaClient kullanarak etkinlik oluştur
            const insertedEvent = await prisma.events.create({
                data: {
                    title: data.title,
                    description: data.description,
                    event_date: new Date(data.event_date),
                    start_time: new Date(data.start_time),
                    end_time: new Date(data.end_time),
                    location_name: data.location_name,
                    location_latitude: data.location_latitude,
                    location_longitude: data.location_longitude,
                    max_participants: data.max_participants,
                    status: 'active', // Event is initially active but needs approval
                    approval_status: 'pending', // Event requires admin approval
                    creator_id: data.creator_id,
                    sport_id: data.sport_id,
                    created_at: now,
                    updated_at: now
                }
            });

            console.log('Event created successfully:', JSON.stringify(insertedEvent, null, 2));

            const formattedEvent = {
                ...insertedEvent,
                id: insertedEvent.id.toString(),
                creator_id: insertedEvent.creator_id.toString(),
                sport_id: insertedEvent.sport_id.toString()
            };

            return { data: formattedEvent, error: null };
        } catch (error: any) {
            console.error('Error in createEvent service:', error);
            return { error: error.message || 'Failed to create event', data: null };
        }
    }

    /**
     * Update an existing event
     */
    async updateEvent(id: string, data: UpdateEventDTO) {
        try {
            // Generate new slug if title changes
            let eventData: any = { ...data };

            if (data.title) {
                eventData.slug = generateSlug(data.title);
            }

            // Update timestamp
            eventData.updated_at = new Date().toISOString();

            // Update event in database
            const { data: updatedEvent, error } = await supabase
                .from(this.TABLE_NAME)
                .update(eventData)
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
     * Find an event by ID using Prisma
     */
    async findEventById(id: string) {
        try {
            // Prisma kullanarak etkinliği ve ilişkili verileri getir
            const event = await prisma.events.findUnique({
                where: {
                    id: BigInt(id)
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    sport: {
                        select: {
                            id: true,
                            name: true,
                            icon: true
                        }
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    profile_picture: true
                                }
                            }
                        }
                    }
                }
            });

            if (!event) {
                return { error: 'Event not found', data: null };
            }

            // İlişkileri olan event verisini düzgün şekilde dönüştürüp döndür
            return {
                data: {
                    ...event,
                    id: event.id.toString(),
                    creator_id: event.creator_id.toString(),
                    sport_id: event.sport_id.toString(),
                    creator: {
                        id: event.creator.id.toString(),
                        username: event.creator.username,
                        profile_image: event.creator.profile_picture
                    },
                    sport: {
                        id: event.sport.id.toString(),
                        name: event.sport.name,
                        icon: event.sport.icon
                    },
                    participants: event.participants.map((p: any) => ({
                        event_id: p.event_id.toString(),
                        user_id: p.user_id.toString(),
                        role: p.role,
                        user: p.user ? {
                            id: p.user.id.toString(),
                            username: p.user.username,
                            profile_image: p.user.profile_picture
                        } : null
                    }))
                },
                error: null
            };
        } catch (error: any) {
            console.error('Unexpected error in findEventById service:', error);
            return { error: error.message || 'Failed to find event', data: null };
        }
    }

    /**
     * Find an event by slug using Prisma
     */
    async findEventBySlug(slug: string) {
        try {
            // Prisma kullanarak etkinliği ve ilişkili verileri getir
            // Not: Prisma şemasında slug olmaması durumuna karşı title kullanabiliriz
            // veya slug eklemek için bir migrate yapılabilir
            const event = await prisma.events.findFirst({
                where: {
                    title: {
                        contains: slug.replace(/-/g, ' '), // Slugları tire ile ayırdıysak
                        mode: 'insensitive'
                    }
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    sport: {
                        select: {
                            id: true,
                            name: true,
                            icon: true
                        }
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    profile_picture: true
                                }
                            }
                        }
                    }
                }
            });

            if (!event) {
                return { error: 'Event not found', data: null };
            }

            // İlişkileri olan event verisini düzgün şekilde dönüştürüp döndür
            return {
                data: {
                    ...event,
                    id: event.id.toString(),
                    creator_id: event.creator_id.toString(),
                    sport_id: event.sport_id.toString(),
                    creator: {
                        id: event.creator.id.toString(),
                        username: event.creator.username,
                        profile_image: event.creator.profile_picture
                    },
                    sport: {
                        id: event.sport.id.toString(),
                        name: event.sport.name,
                        icon: event.sport.icon
                    },
                    participants: event.participants.map((p: any) => ({
                        event_id: p.event_id.toString(),
                        user_id: p.user_id.toString(),
                        role: p.role,
                        user: p.user ? {
                            id: p.user.id.toString(),
                            username: p.user.username,
                            profile_image: p.user.profile_picture
                        } : null
                    }))
                },
                error: null
            };
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
            // Hesapla başlangıç offseti
            const skip = (page - 1) * limit;

            // Filtreleme koşullarını oluştur
            const where = activeOnly ?
                {
                    status: 'active',
                    approval_status: 'approved'  // Only show approved events
                } : {};

            // Prisma ile verileri sorgula
            const events = await prisma.events.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    sport: {
                        select: {
                            id: true,
                            name: true,
                            icon: true
                        }
                    },
                    participants: true
                },
                orderBy: {
                    event_date: 'asc'
                },
                skip,
                take: limit
            });

            // Toplam kayıt sayısını getir
            const count = await prisma.events.count({ where });

            // BigInt'leri string'e dönüştür ve formatla
            const formattedEvents = events.map((event: any) => ({
                ...event,
                id: event.id.toString(),
                creator_id: event.creator_id.toString(),
                sport_id: event.sport_id.toString(),
                creator: {
                    id: event.creator.id.toString(),
                    username: event.creator.username,
                    profile_image: event.creator.profile_picture
                },
                sport: {
                    id: event.sport.id.toString(),
                    name: event.sport.name,
                    icon: event.sport.icon
                },
                participants: event.participants.map((p: any) => ({
                    event_id: p.event_id.toString(),
                    user_id: p.user_id.toString(),
                    role: p.role
                }))
            }));

            return { data: formattedEvents, error: null, count };
        } catch (error: any) {
            console.error('Unexpected error in listEvents service:', error);
            return { error: error.message || 'Failed to list events', data: null, count: 0 };
        }
    }

    /**
     * Get upcoming events using Prisma
     */
    async getUpcomingEvents(limit: number) {
        try {
            const today = new Date();

            // Prisma ile yaklaşan etkinlikleri sorgula
            const events = await prisma.events.findMany({
                where: {
                    status: 'active',
                    approval_status: 'approved',
                    event_date: {
                        gte: today
                    }
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    sport: {
                        select: {
                            id: true,
                            name: true,
                            icon: true
                        }
                    },
                    participants: true
                },
                orderBy: {
                    event_date: 'asc'
                },
                take: limit
            });

            // BigInt'leri string'e dönüştür ve formatla
            const formattedEvents = events.map((event: any) => ({
                ...event,
                id: event.id.toString(),
                creator_id: event.creator_id.toString(),
                sport_id: event.sport_id.toString(),
                creator: {
                    id: event.creator.id.toString(),
                    username: event.creator.username,
                    profile_image: event.creator.profile_picture
                },
                sport: {
                    id: event.sport.id.toString(),
                    name: event.sport.name,
                    icon: event.sport.icon
                },
                participants: event.participants.map((p: any) => ({
                    event_id: p.event_id.toString(),
                    user_id: p.user_id.toString(),
                    role: p.role
                }))
            }));

            return { data: formattedEvents, error: null };
        } catch (error: any) {
            console.error('Unexpected error in getUpcomingEvents service:', error);
            return { error: error.message || 'Failed to get upcoming events', data: null };
        }
    }

    /**
     * Join an event using Prisma
     */
    async joinEvent(eventId: string, userId: string, role: string = 'participant') {
        try {
            console.log(`User ${userId} attempting to join event ${eventId}`);

            // Check if user already joined
            const existingParticipant = await prisma.event_Participants.findUnique({
                where: {
                    event_id_user_id: {
                        event_id: BigInt(eventId),
                        user_id: BigInt(userId)
                    }
                }
            });

            if (existingParticipant) {
                console.log(`User ${userId} already joined event ${eventId}`);
                return { success: false, error: 'You are already participating in this event' };
            }

            // Check if event has reached max participants
            const event = await prisma.events.findUnique({
                where: {
                    id: BigInt(eventId)
                },
                include: {
                    participants: true
                }
            });

            if (!event) {
                console.log(`Event ${eventId} not found`);
                return { success: false, error: 'Event not found' };
            }

            // Check if event is approved
            if (event.approval_status !== 'approved') {
                console.log(`Event ${eventId} is not approved. Current status: ${event.approval_status}`);
                return { success: false, error: 'This event is not available for joining yet' };
            }

            // Check if event is active
            if (event.status !== 'active') {
                console.log(`Event ${eventId} is not active. Current status: ${event.status}`);
                return { success: false, error: 'This event is not available for joining' };
            }

            if (event.max_participants > 0 && event.participants.length >= event.max_participants) {
                console.log(`Event ${eventId} has reached maximum capacity`);
                return { success: false, error: 'This event has reached maximum capacity' };
            }

            // Join event
            const participant = await prisma.event_Participants.create({
                data: {
                    event_id: BigInt(eventId),
                    user_id: BigInt(userId),
                    role,
                    joined_at: new Date()
                }
            });

            console.log(`User ${userId} successfully joined event ${eventId}`);
            return { success: true, error: null };
        } catch (error: any) {
            console.error(`Error in joinEvent service: ${error.message}`, error);
            return { success: false, error: error.message || 'Failed to join event' };
        }
    }

    /**
     * Leave an event using Prisma
     */
    async leaveEvent(eventId: string, userId: string) {
        try {
            console.log(`User ${userId} attempting to leave event ${eventId}`);

            // Check if user is a participant
            const participant = await prisma.event_Participants.findUnique({
                where: {
                    event_id_user_id: {
                        event_id: BigInt(eventId),
                        user_id: BigInt(userId)
                    }
                }
            });

            if (!participant) {
                console.log(`User ${userId} is not participating in event ${eventId}`);
                return { success: false, error: 'You are not participating in this event' };
            }

            // Delete participation record
            await prisma.event_Participants.delete({
                where: {
                    event_id_user_id: {
                        event_id: BigInt(eventId),
                        user_id: BigInt(userId)
                    }
                }
            });

            console.log(`User ${userId} successfully left event ${eventId}`);
            return { success: true, error: null };
        } catch (error: any) {
            console.error(`Error in leaveEvent service: ${error.message}`, error);
            return { success: false, error: error.message || 'Failed to leave event' };
        }
    }

    /**
     * Get all pending events that need admin approval
     */
    async getPendingEvents(page: number = 1, limit: number = 10) {
        try {
            const offset = (page - 1) * limit;

            // Fetch events with approval_status = 'pending'
            const pendingEvents = await prisma.events.findMany({
                where: {
                    approval_status: 'pending'
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            profile_picture: true
                        }
                    },
                    sport: {
                        select: {
                            id: true,
                            name: true,
                            icon: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip: offset,
                take: limit
            });

            // Get total count of pending events
            const totalCount = await prisma.events.count({
                where: {
                    approval_status: 'pending'
                }
            });

            // Format events for response
            const formattedEvents = pendingEvents.map((event: any) => ({
                ...event,
                id: event.id.toString(),
                creator_id: event.creator_id.toString(),
                sport_id: event.sport_id.toString(),
                creator: {
                    id: event.creator.id.toString(),
                    username: event.creator.username,
                    profile_image: event.creator.profile_picture
                },
                sport: {
                    id: event.sport.id.toString(),
                    name: event.sport.name,
                    icon: event.sport.icon
                }
            }));

            return {
                data: {
                    events: formattedEvents,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        pages: Math.ceil(totalCount / limit)
                    }
                },
                error: null
            };
        } catch (error: any) {
            console.error('Error in getPendingEvents service:', error);
            return { error: error.message || 'Failed to get pending events', data: null };
        }
    }

    /**
     * Approve an event by admin
     */
    async approveEvent(id: string, adminId: string) {
        try {
            // Check if event exists
            const event = await prisma.events.findUnique({
                where: { id: BigInt(id) }
            });

            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            // Check if event is already approved or rejected
            if (event.approval_status !== 'pending') {
                return {
                    success: false,
                    error: `Event is already ${event.approval_status}`
                };
            }

            // Update event approval status
            await prisma.events.update({
                where: { id: BigInt(id) },
                data: {
                    approval_status: 'approved',
                    updated_at: new Date()
                }
            });

            // Log admin action
            await prisma.admin_Logs.create({
                data: {
                    admin_id: BigInt(adminId),
                    action_type: 'approve_event',
                    description: `Approved event #${id}`,
                    created_at: new Date()
                }
            });

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error in approveEvent service:', error);
            return { success: false, error: error.message || 'Failed to approve event' };
        }
    }

    /**
     * Reject an event by admin
     */
    async rejectEvent(id: string, adminId: string, reason: string = '') {
        try {
            // Check if event exists
            const event = await prisma.events.findUnique({
                where: { id: BigInt(id) }
            });

            if (!event) {
                return { success: false, error: 'Event not found' };
            }

            // Check if event is already approved or rejected
            if (event.approval_status !== 'pending') {
                return {
                    success: false,
                    error: `Event is already ${event.approval_status}`
                };
            }

            // Update event status and approval status
            await prisma.events.update({
                where: { id: BigInt(id) },
                data: {
                    approval_status: 'rejected',
                    status: 'inactive',
                    updated_at: new Date()
                }
            });

            // Log admin action
            await prisma.admin_Logs.create({
                data: {
                    admin_id: BigInt(adminId),
                    action_type: 'reject_event',
                    description: `Rejected event #${id}${reason ? `: ${reason}` : ''}`,
                    created_at: new Date()
                }
            });

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error in rejectEvent service:', error);
            return { success: false, error: error.message || 'Failed to reject event' };
        }
    }

    /**
     * Check and update expired pending events
     * This can be run on a schedule (e.g., once a day)
     */
    async updateExpiredPendingEvents() {
        try {
            const today = new Date();

            // Find pending events with past event dates
            const expiredEvents = await prisma.events.findMany({
                where: {
                    approval_status: 'pending',
                    event_date: {
                        lt: today
                    }
                }
            });

            if (expiredEvents.length === 0) {
                return { success: true, count: 0, error: null };
            }

            // Update expired events to inactive
            await prisma.events.updateMany({
                where: {
                    approval_status: 'pending',
                    event_date: {
                        lt: today
                    }
                },
                data: {
                    status: 'inactive',
                    updated_at: today
                }
            });

            return {
                success: true,
                count: expiredEvents.length,
                error: null
            };
        } catch (error: any) {
            console.error('Error in updateExpiredPendingEvents service:', error);
            return {
                success: false,
                count: 0,
                error: error.message || 'Failed to update expired pending events'
            };
        }
    }
} 