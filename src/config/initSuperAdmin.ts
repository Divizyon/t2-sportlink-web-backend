import { AdminService } from '../services/AdminService';
import dotenv from 'dotenv';
import { supabase } from './supabase';

// Load environment variables
dotenv.config();

// Default credentials if not provided in environment variables
const DEFAULT_SUPERADMIN_EMAIL = 'superadmin@sportlink.com';
const DEFAULT_SUPERADMIN_USERNAME = 'superadmin';
const DEFAULT_SUPERADMIN_PASSWORD = 'SuperAdmin123!';

/**
 * Initialize a superadmin account if none exists
 * This should be called when the application starts
 */
export const initSuperAdmin = async (): Promise<void> => {
    try {
        console.log("Starting superadmin initialization check...");

        // Skip initialization in development mode if needed
        if (process.env.SKIP_SUPERADMIN_INIT === 'true') {
            console.log('Skipping superadmin initialization (SKIP_SUPERADMIN_INIT=true)');
            return;
        }

        const adminService = new AdminService();

        // Check if superadmin exists
        console.log("Checking if superadmin already exists...");
        const hasSuperAdmin = await adminService.hasSuperAdmin();
        console.log(`Has existing superadmin: ${hasSuperAdmin}`);

        if (!hasSuperAdmin) {
            console.log('No superadmin account found. Creating initial superadmin...');

            // Get credentials from environment variables or use defaults
            const email = process.env.INITIAL_SUPERADMIN_EMAIL || DEFAULT_SUPERADMIN_EMAIL;
            const username = process.env.INITIAL_SUPERADMIN_USERNAME || DEFAULT_SUPERADMIN_USERNAME;
            const password = process.env.INITIAL_SUPERADMIN_PASSWORD || DEFAULT_SUPERADMIN_PASSWORD;

            console.log(`Using credentials - Email: ${email}, Username: ${username}, Password: ******`);

            // Create superadmin
            console.log("Calling createInitialSuperAdmin method...");
            const superAdmin = await adminService.createInitialSuperAdmin(username, password, email);

            if (superAdmin) {
                console.log(`Initial superadmin created successfully with email: ${email} and username: ${username}`);
                console.log('Superadmin details:', {
                    id: superAdmin.id,
                    email: superAdmin.email,
                    username: superAdmin.username,
                    role: superAdmin.role,
                    isActive: superAdmin.isActive
                });
                console.log('Please change the default password immediately after first login!');
            } else {
                console.error('Failed to create initial superadmin');
            }
        } else {
            console.log('Superadmin account already exists. Skipping initialization.');
        }
    } catch (error) {
        console.error('Error initializing superadmin:', error);
    }
};

// If this file is run directly, execute the initSuperAdmin function
if (require.main === module) {
    initSuperAdmin()
        .then(() => console.log('Superadmin initialization completed'))
        .catch(error => console.error('Superadmin initialization failed:', error));
} 