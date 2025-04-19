import { PrismaClient } from '@prisma/client';

export interface UserRating {
  id: bigint;
  rated_user_id: bigint;
  rating_user_id: bigint;
  rating_value: number;
  review_text: string;
  created_at: Date;
}

export interface CreateUserRatingDTO {
  rated_user_id: bigint;
  rating_user_id: bigint;
  rating_value: number;
  review_text: string;
}

export interface UpdateUserRatingDTO {
  rating_value?: number;
  review_text?: string;
} 