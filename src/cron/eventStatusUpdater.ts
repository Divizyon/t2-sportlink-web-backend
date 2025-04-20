import { EventService } from '../services/EventService';
import cron from 'node-cron';

const eventService = new EventService();

/**
 * Updates the status of pending events that have expired
 * Sets them to inactive if their event date has passed
 */
export const updateExpiredPendingEvents = async () => {
    try {
        console.log('[Cron] Running updateExpiredPendingEvents job');
        const result = await eventService.updateExpiredPendingEvents();

        if (result.success) {
            console.log(`[Cron] Successfully updated ${result.count} expired pending events`);
        } else {
            console.error('[Cron] Failed to update expired pending events:', result.error);
        }
    } catch (error) {
        console.error('[Cron] Error in updateExpiredPendingEvents cron job:', error);
    }
};

/**
 * Setup cron jobs for event status updates
 * Run once a day at midnight
 */
export const setupEventCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', updateExpiredPendingEvents);

    console.log('Event status update cron jobs scheduled');
}; 