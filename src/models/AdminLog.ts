import { PrismaClient } from '@prisma/client';

export interface AdminLog {
  id: bigint;
  admin_id: bigint;
  action_type: string;
  description: string;
  created_at: Date;
}

export interface CreateAdminLogDTO {
  admin_id: bigint;
  action_type: string;
  description: string;
} 