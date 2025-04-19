import { PrismaClient } from '@prisma/client';

export interface EventRating {
  id: bigint;
  event_id: bigint;
  user_id: bigint;
  rating: number;
  review: string;
  created_at: Date;
}

export interface CreateEventRatingDTO {
  event_id: bigint;
  user_id: bigint;
  rating: number;
  review: string;
}

export interface UpdateEventRatingDTO {
  rating?: number;
  review?: string;
} 