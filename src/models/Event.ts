import { PrismaClient } from '@prisma/client';

export interface Event {
  id: bigint;
  creator_id: bigint;
  sport_id: bigint;
  title: string;
  description: string;
  event_date: Date;
  start_time: Date;
  end_time: Date;
  location_name: string;
  location_latitude: number;
  location_longitude: number;
  max_participants: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEventDTO {
  creator_id: bigint;
  sport_id: bigint;
  title: string;
  description: string;
  event_date: Date;
  start_time: Date;
  end_time: Date;
  location_name: string;
  location_latitude: number;
  location_longitude: number;
  max_participants: number;
  status: string;
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  event_date?: Date;
  start_time?: Date;
  end_time?: Date;
  location_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  max_participants?: number;
  status?: string;
} 