import { PrismaClient } from '@prisma/client';

export interface Notification {
  id: bigint;
  user_id: bigint;
  notification_type: string;
  content: string;
  read_status: boolean;
  created_at: Date;
  event_id: bigint;
}

export interface CreateNotificationDTO {
  user_id: bigint;
  notification_type: string;
  content: string;
  event_id: bigint;
}

export interface UpdateNotificationDTO {
  read_status?: boolean;
} 