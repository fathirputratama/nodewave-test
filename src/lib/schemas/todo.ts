import { z } from 'zod';

export const createTodoSchema = z.object({
  item: z.string().min(1, 'Item wajib diisi'),
});

export const markTodoSchema = z.object({
  action: z.enum(['DONE', 'UNDONE']),
});
