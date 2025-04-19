import { PrismaClient } from '@prisma/client';

export interface EventParticipant {
  event_id: bigint;
  user_id: bigint;
  joined_at: Date;
  role: string;
}

export interface CreateEventParticipantDTO {
  event_id: bigint;
  user_id: bigint;
  role: string;
}

export interface UpdateEventParticipantDTO {
  role?: string;
} 