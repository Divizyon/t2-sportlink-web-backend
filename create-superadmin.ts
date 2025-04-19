import { PrismaClient } from './src/generated/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
    try {
        // Check if a superadmin already exists
        const existingSuperAdmin = await prisma.admin.findFirst({
            where: { role: 'superadmin' }
        });

        if (existingSuperAdmin) {
            console.log('A superadmin already exists!');
            return;
        }

        // Define superadmin details
        const username = 'superadmin';
        const email = 'admin@sportlink.com';
        const password = 'SuperAdmin123!';

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create the superadmin account
        const superadmin = await prisma.admin.create({
            data: {
                username,
                email,
                passwordHash,
                role: 'superadmin',
                isActive: true,
                profile: {
                    create: {
                        firstName: 'Super',
                        lastName: 'Admin',
                    }
                }
            },
            include: {
                profile: true
            }
        });

        console.log('Superadmin created successfully:', {
            id: superadmin.id,
            username: superadmin.username,
            role: superadmin.role
        });
    } catch (error) {
        console.error('Error creating superadmin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute the function
createSuperAdmin(); 