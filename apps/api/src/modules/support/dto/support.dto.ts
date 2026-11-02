import { z } from 'zod';

export const CreateTicketDtoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export const UpdateTicketDtoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export const UpdateTicketStatusDtoSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED']),
});

export const CreateSessionDtoSchema = z.object({
  workspaceId: z.string().uuid(),
  ticketId: z.string().uuid().optional(),
  reason: z.string().min(1, 'Reason is required'),
  scope: z.string().min(1, 'Scope is required'),
  expiresAt: z.string().datetime().optional(),
});

export type CreateTicketDto = z.infer<typeof CreateTicketDtoSchema>;
export type UpdateTicketDto = z.infer<typeof UpdateTicketDtoSchema>;
export type UpdateTicketStatusDto = z.infer<typeof UpdateTicketStatusDtoSchema>;
export type CreateSessionDto = z.infer<typeof CreateSessionDtoSchema>;
