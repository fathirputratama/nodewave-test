'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { createTodoSchema, markTodoSchema } from '@/lib/schemas/todo';
import { CreateTodo, MarkTodo, Todo } from '@/types/todo';
import api from '@/lib/api/axios';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { useAuthStore } from '@/lib/store/auth';

interface TodoResponse {
  content: {
    entries: Todo[];
    totalData: number;
    totalPage: number;
  };
  message: string;
  errors: string[];
}

interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}

export default function CreateTodoForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, role, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    } else if (role === 'ADMIN') {
      router.push('/todos');
    }
  }, [token, role, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTodo>({
    resolver: zodResolver(createTodoSchema),
  });

  const { data: todoData, isLoading } = useQuery<TodoResponse>({
    queryKey: ['todos', currentPage],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        orderKey: 'createdAt',
        orderRule: 'asc',
      });
      const response = await api.get(`/todos?${queryParams}`);
      return response.data;
    },
    enabled: !!token && role === 'USER',
    select: (data) => {
      const sortedTodos = [...data.content.entries].sort((a, b) => {
        if (a.isDone !== b.isDone) {
          return a.isDone ? -1 : 1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      return { ...data, content: { ...data.content, entries: sortedTodos } };
    },
  });

  const todos = todoData?.content.entries || [];
  const totalPage = todoData?.content.totalPage || 1;

  // Mutasi untuk membuat todo baru
  const createTodoMutation = useMutation({
    mutationFn: async (data: CreateTodo) => {
      const response = await api.post('/todos', data);
      return response.data.content;
    },
    onSuccess: () => {
      toast.success('Todo berhasil dibuat!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (totalPage > 1) {
        setCurrentPage(totalPage);
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan';
      console.error('Error membuat todo:', error.response?.data || error.message);
      setError('Gagal membuat todo. Silakan coba lagi.');
      toast.error(`Gagal membuat todo: ${errorMessage}`);
    },
  });

  // Mutasi untuk mark todo sebagai done/undone
  const markTodoMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: MarkTodo['action'] }) => {
      const validatedAction = markTodoSchema.parse({ action });
      const response = await api.put(`/todos/${id}/mark`, validatedAction);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Status todo berhasil diubah!');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan';
      console.error('Error mengubah status todo:', error.response?.data || error.message);
      toast.error(`Gagal mengubah status todo: ${errorMessage}`);
    },
  });

  // Mutasi untuk menghapus todo
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/todos/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Todo berhasil dihapus!');
      setSelectedTodos([]);
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      // Kembali ke halaman sebelumnya jika halaman saat ini kosong
      if (todos.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan';
      console.error('Error menghapus todo:', error.response?.data || error.message);
      toast.error(`Gagal menghapus todo: ${errorMessage}`);
    },
  });

  const onSubmit = (data: CreateTodo) => {
    setError(null);
    createTodoMutation.mutate(data);
  };

  const handleMarkTodo = (todo: Todo) => {
    const newAction = todo.isDone ? 'UNDONE' : 'DONE';
    const confirmMessage = `Apakah Anda yakin ingin menandai "${todo.item}" sebagai ${
      newAction === 'DONE' ? 'selesai' : 'belum selesai'
    }?`;
    if (confirm(confirmMessage)) {
      markTodoMutation.mutate({ id: todo.id, action: newAction });
    }
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedTodos((prev) =>
      prev.includes(id) ? prev.filter((todoId) => todoId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedTodos.length === 0) {
      toast.error('Pilih setidaknya satu todo untuk dihapus.');
      return;
    }
    const confirmMessage = `Apakah Anda yakin ingin menghapus ${selectedTodos.length} todo yang dipilih?`;
    if (confirm(confirmMessage)) {
      selectedTodos.forEach((id) => deleteTodoMutation.mutate(id));
    }
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      logout();
      router.push('/auth/login');
    }
  };

  const getPaginationButtons = () => {
    const buttons: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPage <= maxButtons) {
      for (let i = 1; i <= totalPage; i++) {
        buttons.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      const end = Math.min(totalPage, start + maxButtons - 1);

      if (start > 1) {
        buttons.push(1);
        if (start > 2) buttons.push('...');
      }

      for (let i = start; i <= end; i++) {
        buttons.push(i);
      }

      if (end < totalPage) {
        if (end < totalPage - 1) buttons.push('...');
        buttons.push(totalPage);
      }
    }

    return buttons;
  };

  if (!token || role === 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">To Do</h1>
      <div className="bg-white rounded-xl shadow-md px-6 py-12 w-full max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start space-x-2 mb-6">
          <div className="w-full">
            <Label className="mb-2">Add a new task</Label>
            <div className="w-full flex gap-2">
              <input
                id="item"
                type="text"
                placeholder="Add a new task"
                {...register('item')}
                className="w-full border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0 rounded-none"
              />
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                disabled={createTodoMutation.isPending}
              >
                Add Todo
              </Button>
            </div>
          </div>
        </form>
        {errors.item && <p className="text-red-500 text-sm mb-2">{errors.item.message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* List Todo */}
        <div className="space-y-2">
          {isLoading ? (
            <p>Loading todos...</p>
          ) : todos.length > 0 ? (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between border-b py-2 px-1"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTodos.includes(todo.id)}
                    onCheckedChange={() => handleCheckboxChange(todo.id)}
                  />
                  <span
                    className={clsx(
                      'font-medium',
                      todo.isDone && 'line-through text-gray-400'
                    )}
                  >
                    {todo.item}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMarkTodo(todo)}
                  className={clsx(
                    'rounded-full border',
                    todo.isDone
                      ? 'border-red-500 text-red-500 hover:bg-red-100'
                      : 'border-green-600 text-green-600 hover:bg-green-100'
                  )}
                >
                  {todo.isDone ? '✕' : '✓'}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No todos available.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gray-300"
              >
                Previous
              </Button>
              {getPaginationButtons().map((page, index) => (
                <Button
                  key={index}
                  variant={page === currentPage ? 'default' : 'outline'}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={typeof page !== 'number'}
                  className={clsx(
                    page === currentPage ? 'bg-blue-500 text-white' : 'border-gray-300',
                    typeof page !== 'number' && 'cursor-default'
                  )}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPage, prev + 1))}
                disabled={currentPage === totalPage}
                className="border-gray-300"
              >
                Next
              </Button>
            </div>
            <p className="text-sm text-gray-500">
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedTodos.length === 0 || deleteTodoMutation.isPending}
            className="bg-red-500 hover:bg-red-600 flex justify-start"
          >
            {deleteTodoMutation.isPending ? 'Deleting...' : 'Delete Selected'}
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-red-600 text-red-600 hover:bg-red-100"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}