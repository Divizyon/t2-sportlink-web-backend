import { PrismaClient } from '@prisma/client';

// Create a test client
const prisma = new PrismaClient();

// Print available properties
console.log("Available Prisma client properties:");
console.log(Object.keys(prisma));

// Export for use
export default prisma; 