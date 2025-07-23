import { z } from 'zod';
import { createTodoSchema, markTodoSchema } from '@/lib/schemas/todo';

export type CreateTodo = z.infer<typeof createTodoSchema>;
export type MarkTodo = z.infer<typeof markTodoSchema>;

export interface Todo {
  id: string;
  item: string;
  userId: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}