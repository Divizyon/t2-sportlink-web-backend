import prisma from '../config/prisma';
import { Users } from '@prisma/client';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture?: string;
  default_location_latitude?: number;
  default_location_longitude?: number;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_picture?: string;
  default_location_latitude?: number;
  default_location_longitude?: number;
  role?: string;
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<Users> {
    try {
      return await prisma.users.create({
        data: {
          email: data.email,
          username: data.username,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          profile_picture: data.profile_picture || '',
          default_location_latitude: data.default_location_latitude || 0,
          default_location_longitude: data.default_location_longitude || 0,
          role: data.role || 'user'
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   */
  async findUserById(id: string): Promise<Users | null> {
    try {
      return await prisma.users.findUnique({
        where: { id: BigInt(id) }
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string): Promise<Users | null> {
    try {
      return await prisma.users.findFirst({
        where: { email }
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<Users> {
    try {
      return await prisma.users.update({
        where: { id: BigInt(id) },
        data
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<Users> {
    try {
      return await prisma.users.delete({
        where: { id: BigInt(id) }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * List all users with pagination
   */
  async listUsers(page = 1, pageSize = 10): Promise<{ users: Users[]; total: number }> {
    try {
      const skip = (page - 1) * pageSize;

      const [users, total] = await Promise.all([
        prisma.users.findMany({
          skip,
          take: pageSize,
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.users.count()
      ]);

      return { users, total };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }
} 