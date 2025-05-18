import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, startOfMonth, endOfMonth, compareAsc } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Get dashboard overview statistics
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const oneMonthAgo = subMonths(now, 1);
        const twoMonthsAgo = subMonths(now, 2);

        // Count current month events
        const currentMonthEvents = await prisma.event.count({
            where: {
                created_at: {
                    gte: startOfMonth(now),
                    lte: now
                }
            }
        });

        // Count previous month events
        const prevMonthEvents = await prisma.event.count({
            where: {
                created_at: {
                    gte: startOfMonth(oneMonthAgo),
                    lte: endOfMonth(oneMonthAgo)
                }
            }
        });

        // Count current month news
        const currentMonthNews = await prisma.news.count({
            where: {
                created_at: {
                    gte: startOfMonth(now),
                    lte: now
                }
            }
        });

        // Count previous month news
        const prevMonthNews = await prisma.news.count({
            where: {
                created_at: {
                    gte: startOfMonth(oneMonthAgo),
                    lte: endOfMonth(oneMonthAgo)
                }
            }
        });

        // Count current month announcements
        const currentMonthAnnouncements = await prisma.announcement.count({
            where: {
                created_at: {
                    gte: startOfMonth(now),
                    lte: now
                }
            }
        });

        // Count previous month announcements
        const prevMonthAnnouncements = await prisma.announcement.count({
            where: {
                created_at: {
                    gte: startOfMonth(oneMonthAgo),
                    lte: endOfMonth(oneMonthAgo)
                }
            }
        });

        // Count users
        const totalUsers = await prisma.user.count();
        const prevMonthUsers = await prisma.user.count({
            where: {
                created_at: {
                    lt: startOfMonth(now)
                }
            }
        });

        // Calculate percentage changes
        const eventPercentage = prevMonthEvents === 0
            ? 100
            : Number((((currentMonthEvents - prevMonthEvents) / prevMonthEvents) * 100).toFixed(1));

        const newsPercentage = prevMonthNews === 0
            ? 100
            : Number((((currentMonthNews - prevMonthNews) / prevMonthNews) * 100).toFixed(1));

        const announcementPercentage = prevMonthAnnouncements === 0
            ? 100
            : Number((((currentMonthAnnouncements - prevMonthAnnouncements) / prevMonthAnnouncements) * 100).toFixed(1));

        const userPercentage = prevMonthUsers === 0
            ? 100
            : Number((((totalUsers - prevMonthUsers) / prevMonthUsers) * 100).toFixed(1));

        // Response data
        const stats = {
            events: currentMonthEvents,
            news: currentMonthNews,
            announcements: currentMonthAnnouncements,
            users: totalUsers,
            eventPercentage,
            newsPercentage,
            announcementPercentage,
            userPercentage
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
    }
};

/**
 * Get sport popularity statistics
 */
export const getSportPopularity = async (req: Request, res: Response) => {
    try {
        // Get all sports
        const sports = await prisma.sport.findMany();

        // Get count of sport occurrence in events
        const sportCounts = await Promise.all(
            sports.map(async (sport) => {
                const count = await prisma.event.count({
                    where: { sport_id: sport.id }
                });
                return { sportId: sport.id, sportName: sport.name, count };
            })
        );

        // Calculate percentages
        const totalEvents = sportCounts.reduce((sum, item) => sum + item.count, 0);
        const sportsPercentages: Record<string, number> = {};

        sportCounts.forEach(item => {
            const percentage = totalEvents === 0
                ? 0
                : Math.round((item.count / totalEvents) * 100);
            sportsPercentages[item.sportName.toLowerCase()] = percentage;
        });

        res.status(200).json({
            success: true,
            data: { sportsPercentages }
        });
    } catch (error) {
        console.error('Error getting sport popularity:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sport popularity data' });
    }
};

/**
 * Get sport events by date range
 */
export const getSportEventsByDateRange = async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;

        let startDate = from ? new Date(from as string) : subDays(new Date(), 6);
        let endDate = to ? new Date(to as string) : new Date();

        // Validate dates
        if (compareAsc(startDate, endDate) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }

        // Get all sports
        const sports = await prisma.sport.findMany();

        // Get events by date and sport
        const events = await prisma.event.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                sport: true
            }
        });

        // Group events by date
        const eventsByDate: Record<string, Record<string, number>> = {};

        // Initialize dates
        let current = new Date(startDate);
        while (current <= endDate) {
            const dateKey = current.toISOString().split('T')[0];
            const formattedDate = `${current.getDate().toString().padStart(2, '0')}.${(current.getMonth() + 1).toString().padStart(2, '0')}.${current.getFullYear()}`;

            eventsByDate[formattedDate] = {};
            sports.forEach(sport => {
                eventsByDate[formattedDate][sport.name] = 0;
            });

            current = new Date(current);
            current.setDate(current.getDate() + 1);
        }

        // Count events by date and sport
        events.forEach(event => {
            const eventDate = event.created_at;
            const formattedDate = `${eventDate.getDate().toString().padStart(2, '0')}.${(eventDate.getMonth() + 1).toString().padStart(2, '0')}.${eventDate.getFullYear()}`;

            if (eventsByDate[formattedDate]) {
                eventsByDate[formattedDate][event.sport.name] =
                    (eventsByDate[formattedDate][event.sport.name] || 0) + 1;
            }
        });

        // Convert to array for frontend
        const sportsByDate = Object.entries(eventsByDate).map(([date, sportCounts]) => ({
            date,
            ...sportCounts
        }));

        return res.status(200).json({
            success: true,
            data: { sportsByDate }
        });
    } catch (error) {
        console.error('Error getting sport events by date:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch sport events by date' });
    }
};

/**
 * Get latest events, news, and announcements
 */
export const getLatestItems = async (req: Request, res: Response) => {
    try {
        const { hours } = req.query;
        const timeFrame = hours ? parseInt(hours as string) : 24;

        const cutoffDate = subDays(new Date(), timeFrame / 24);

        // Get latest events
        const latestEvents = await prisma.event.findMany({
            where: {
                created_at: {
                    gte: cutoffDate
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        // Get latest news
        const latestNews = await prisma.news.findMany({
            where: {
                created_at: {
                    gte: cutoffDate
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        // Get latest announcements
        const latestAnnouncements = await prisma.announcement.findMany({
            where: {
                created_at: {
                    gte: cutoffDate
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        // Format events for response
        const formattedEvents = latestEvents.map(event => ({
            id: event.id,
            name: event.title,
            date: event.created_at.toISOString().split('T')[0]
        }));

        // Format news for response
        const formattedNews = latestNews.map(news => ({
            id: news.id,
            title: news.title,
            date: news.created_at.toISOString().split('T')[0]
        }));

        // Format announcements for response
        const formattedAnnouncements = latestAnnouncements.map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : '')
        }));

        res.status(200).json({
            success: true,
            data: {
                latestEvents: formattedEvents,
                latestNews: formattedNews,
                latestAnnouncements: formattedAnnouncements
            }
        });
    } catch (error) {
        console.error('Error getting latest items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch latest items' });
    }
};

/**
 * Get all dashboard data in one call
 */
export const getAllDashboardData = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const oneMonthAgo = subMonths(now, 1);
        const twoMonthsAgo = subMonths(now, 2);
        const last24Hours = subDays(now, 1);

        // Overview stats
        // Count current month events
        const currentMonthEvents = await prisma.event.count({
            where: {
                created_at: {
                    gte: startOfMonth(now),
                    lte: now
                }
            }
        });

        // Count previous month events
        const prevMonthEvents = await prisma.event.count({
            where: {
                created_at: {
                    gte: startOfMonth(oneMonthAgo),
                    lte: endOfMonth(oneMonthAgo)
                }
            }
        });

        // Count current month news
        const currentMonthNews = await prisma.news.count({
            where: {
                created_at: {
                    gte: startOfMonth(now),
                    lte: now
                }
            }
        });

        // Count previous month news
        const prevMonthNews = await prisma.news.count({
            where: {
                created_at: {
                    gte: startOfMonth(oneMonthAgo),
                    lte: endOfMonth(oneMonthAgo)
                }
            }
        });

        // Count current month announcements
        const currentMonthAnnouncements = await prisma.announcement.count({
            where: {
                created_at: {
                    gte: startOfMonth(now),
                    lte: now
                }
            }
        });

        // Count previous month announcements
        const prevMonthAnnouncements = await prisma.announcement.count({
            where: {
                created_at: {
                    gte: startOfMonth(oneMonthAgo),
                    lte: endOfMonth(oneMonthAgo)
                }
            }
        });

        // Count users
        const totalUsers = await prisma.user.count();
        const prevMonthUsers = await prisma.user.count({
            where: {
                created_at: {
                    lt: startOfMonth(now)
                }
            }
        });

        // Calculate percentage changes
        const eventPercentage = prevMonthEvents === 0
            ? 100
            : Number((((currentMonthEvents - prevMonthEvents) / prevMonthEvents) * 100).toFixed(1));

        const newsPercentage = prevMonthNews === 0
            ? 100
            : Number((((currentMonthNews - prevMonthNews) / prevMonthNews) * 100).toFixed(1));

        const announcementPercentage = prevMonthAnnouncements === 0
            ? 100
            : Number((((currentMonthAnnouncements - prevMonthAnnouncements) / prevMonthAnnouncements) * 100).toFixed(1));

        const userPercentage = prevMonthUsers === 0
            ? 100
            : Number((((totalUsers - prevMonthUsers) / prevMonthUsers) * 100).toFixed(1));

        // Sport popularity
        const sports = await prisma.sport.findMany();

        // Get count of sport occurrence in events
        const sportCounts = await Promise.all(
            sports.map(async (sport) => {
                const count = await prisma.event.count({
                    where: { sport_id: sport.id }
                });
                return { sportId: sport.id, sportName: sport.name, count };
            })
        );

        // Calculate percentages
        const totalEvents = sportCounts.reduce((sum, item) => sum + item.count, 0);
        const sportsPercentages: Record<string, number> = {};

        sportCounts.forEach(item => {
            const percentage = totalEvents === 0
                ? 0
                : Math.round((item.count / totalEvents) * 100);
            sportsPercentages[item.sportName.toLowerCase()] = percentage;
        });

        // Get latest events
        const latestEvents = await prisma.event.findMany({
            where: {
                created_at: {
                    gte: last24Hours
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        // Get latest news
        const latestNews = await prisma.news.findMany({
            where: {
                created_at: {
                    gte: last24Hours
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        // Get latest announcements
        const latestAnnouncements = await prisma.announcement.findMany({
            where: {
                created_at: {
                    gte: last24Hours
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10
        });

        // Format events for response
        const formattedEvents = latestEvents.map(event => ({
            id: event.id,
            name: event.title,
            date: event.created_at.toLocaleDateString('tr-TR')
        }));

        // Format news for response
        const formattedNews = latestNews.map(news => ({
            id: news.id,
            title: news.title,
            date: news.created_at.toLocaleDateString('tr-TR')
        }));

        // Format announcements for response
        const formattedAnnouncements = latestAnnouncements.map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : '')
        }));

        // Get events by date and sport for the last week
        const weekAgo = subDays(now, 6);

        // Get events by date and sport
        const weekEvents = await prisma.event.findMany({
            where: {
                created_at: {
                    gte: weekAgo,
                    lte: now
                }
            },
            include: {
                sport: true
            }
        });

        // Group events by date
        const eventsByDate: Record<string, Record<string, number>> = {};

        // Initialize dates
        let current = new Date(weekAgo);
        while (current <= now) {
            const dateKey = current.toISOString().split('T')[0];
            const formattedDate = `${current.getDate().toString().padStart(2, '0')}.${(current.getMonth() + 1).toString().padStart(2, '0')}.${current.getFullYear()}`;

            eventsByDate[formattedDate] = {};
            sports.forEach(sport => {
                eventsByDate[formattedDate][sport.name] = 0;
            });

            current = new Date(current);
            current.setDate(current.getDate() + 1);
        }

        // Count events by date and sport
        weekEvents.forEach(event => {
            const eventDate = event.created_at;
            const formattedDate = `${eventDate.getDate().toString().padStart(2, '0')}.${(eventDate.getMonth() + 1).toString().padStart(2, '0')}.${eventDate.getFullYear()}`;

            if (eventsByDate[formattedDate]) {
                eventsByDate[formattedDate][event.sport.name] =
                    (eventsByDate[formattedDate][event.sport.name] || 0) + 1;
            }
        });

        // Convert to array for frontend
        const sportsByDate = Object.entries(eventsByDate).map(([date, sportCounts]) => ({
            date,
            ...sportCounts
        }));

        // Combine all data
        const dashboardData = {
            events: currentMonthEvents,
            news: currentMonthNews,
            announcements: currentMonthAnnouncements,
            users: totalUsers,
            eventPercentage,
            newsPercentage,
            announcementPercentage,
            userPercentage,
            sportsPercentages,
            latestEvents: formattedEvents,
            latestNews: formattedNews,
            latestAnnouncements: formattedAnnouncements,
            sportsByDate
        };

        res.status(200).json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Error getting all dashboard data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
}; 