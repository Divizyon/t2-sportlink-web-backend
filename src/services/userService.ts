import prisma from '../config/prisma';
import { User } from '@prisma/client';

export interface CreateUserData {
  email: string;
  passwordHash?: string;
  authProvider?: string;
  authId?: string;
  profile?: {
    firstName: string;
    lastName: string;
    bio?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    birthDate?: Date;
    gender?: string;
  };
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  authProvider?: string;
  authId?: string;
}

export class UserService {
  /**
   * Create a new user with an optional profile
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          authProvider: data.authProvider,
          authId: data.authId,
          ...(data.profile && {
            profile: {
              create: {
                firstName: data.profile.firstName,
                lastName: data.profile.lastName,
                bio: data.profile.bio,
                avatarUrl: data.profile.avatarUrl,
                phoneNumber: data.profile.phoneNumber,
                birthDate: data.profile.birthDate,
                gender: data.profile.gender
              }
            }
          })
        },
        include: {
          profile: true
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
  async findUserById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true
        }
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true
        }
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
        include: {
          profile: true
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<User> {
    try {
      return await prisma.user.delete({
        where: { id },
        include: {
          profile: true
        }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * List all users with pagination
   */
  async listUsers(page = 1, pageSize = 10): Promise<{ users: User[]; total: number }> {
    try {
      const skip = (page - 1) * pageSize;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: pageSize,
          include: {
            profile: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.user.count()
      ]);

      return { users, total };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }
} 