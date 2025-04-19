import { PrismaClient } from '@prisma/client';

export interface User {
  id: bigint;
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture: string;
  default_location_latitude: number;
  default_location_longitude: number;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture?: string;
  default_location_latitude: number;
  default_location_longitude: number;
  role?: 'admin' | 'user' | 'coach';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_picture?: string;
  default_location_latitude?: number;
  default_location_longitude?: number;
} 