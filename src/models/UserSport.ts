import { PrismaClient } from '@prisma/client';

export interface UserSport {
  user_id: bigint;
  sport_id: bigint;
  skill_level: string;
}

export interface CreateUserSportDTO {
  user_id: bigint;
  sport_id: bigint;
  skill_level: string;
}

export interface UpdateUserSportDTO {
  skill_level?: string;
} 