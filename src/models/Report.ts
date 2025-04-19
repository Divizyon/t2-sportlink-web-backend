import { PrismaClient } from '@prisma/client';

export interface Report {
  id: bigint;
  reporter_id: bigint;
  reported_id: bigint;
  event_id: bigint;
  report_reason: string;
  report_date: Date;
  status: string;
  admin_notes?: string;
}

export interface CreateReportDTO {
  reporter_id: bigint;
  reported_id: bigint;
  event_id: bigint;
  report_reason: string;
  status: string;
}

export interface UpdateReportDTO {
  status?: string;
  admin_notes?: string;
} 