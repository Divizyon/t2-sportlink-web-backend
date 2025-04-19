import { PrismaClient } from '@prisma/client';

export interface Sport {
  id: bigint;
  name: string;
  description: string;
  icon: string;
}

export interface CreateSportDTO {
  name: string;
  description: string;
  icon: string;
}

export interface UpdateSportDTO {
  name?: string;
  description?: string;
  icon?: string;
} 