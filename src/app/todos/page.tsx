'use client';

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from "@/lib/store/auth";
import api from "@/lib/api/axios";
import { Todo } from "@/types/todo";
import { ChevronDown, Home, ChevronRight, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AxiosError } from "axios";

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

export default function TodosPage() {
  const { token, role, logout } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const todosPerPage = 10;

  useEffect(() => {
    setHydrated(true);
  }, []);

    useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push('/auth/login');
    } else if (role !== 'ADMIN') {
      router.push('/todos/new');
    }
  }, [hydrated, token, role, router]);

  const buildQueryParams = () => {
    const filters: Record<string, boolean> = {};
    if (statusFilter !== 'all') {
      filters.isDone = statusFilter === 'success';
    }
    const searchFilters: Record<string, string> = {};
    if (searchQuery) {
      searchFilters.item = searchQuery;
    }
    const queryParams = new URLSearchParams();
    if (Object.keys(searchFilters).length > 0) {
      queryParams.append('searchFilters', JSON.stringify(searchFilters));
    }
    if (Object.keys(filters).length > 0) {
      queryParams.append('filters', JSON.stringify(filters));
    }
    queryParams.append('page', currentPage.toString());
    queryParams.append('rows', todosPerPage.toString());
    return queryParams.toString();
  };

  const { data, isLoading, error } = useQuery<TodoResponse>({
    queryKey: ['todos', searchQuery, statusFilter, currentPage],
    queryFn: async () => {
      const queryString = buildQueryParams();
      try {
        const response = await api.get(`/todos?${queryString}`);
        return response.data;
      } catch (err) {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan';
        console.error('Error fetching todos:', error.response?.data || error.message);
        toast.error(`Gagal memuat todo: ${errorMessage}`);
        throw error;
      }
    },
    enabled: hydrated && !!token && role === 'ADMIN',
  });

  const todos = data?.content.entries || [];
  const totalPage = data?.content.totalPage || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); 
  };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }
  };

  const handleFilter = (status: 'all' | 'success' | 'pending') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPage) {
      setCurrentPage(page);
    }
  };

  const getPaginationButtons = () => {
    const buttons: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPage <= maxButtons) {
      return Array.from({ length: totalPage }, (_, i) => i + 1);
    }

    buttons.push(1);

    if (currentPage > 3) {
      buttons.push('...');
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPage - 1, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    if (currentPage < totalPage - 2) {
      buttons.push('...');
    }

    if (totalPage > 1) {
      buttons.push(totalPage);
    }

    return buttons;
  };

   if (!hydrated || !token || role !== 'ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Daftar Todo</h1>
        <p>Memuat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Daftar Todo</h1>
        <p className="text-red-500">Gagal memuat todo: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-white border-r">
        <div className="p-4 text-lg font-semibold">Nodewave</div>
        <nav className="px-2">
          <button className="flex items-center w-full px-3 py-2 mb-2 text-sm font-medium text-left rounded-lg bg-muted">
            <Home className="w-4 h-4 mr-2" />
            To do
          </button>
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
          <header className="fixed top-0 left-64 right-0 z-50 flex items-center justify-end h-14 px-6 border-b bg-white">

          <div className="flex items-center space-x-2 ">
            <span className="text-sm font-medium">Admin</span>
             <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                logout();
                router.push("/auth/login");
              }}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 bg-white mt-14">
          <h1 className="text-2xl font-semibold mb-4">To Do</h1>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
               <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  placeholder="Search by todo item"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-64 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">Search</Button>
              </form>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-sm font-normal text-muted-foreground border border-input bg-white hover:bg-muted rounded-md"
                  >
                    Filter by Status: {statusFilter === 'all' ? 'All' : statusFilter === 'success' ? 'Success' : 'Pending'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilter('success')}>Success</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilter('pending')}>Pending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>To do</TableHead>
                  <TableHead>Statue</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todos.map((todo)=>(
                  <TableRow key={todo.id}>
                  <TableCell className="font-medium">{todo.userId}</TableCell>
                  <TableCell className="font-medium">{todo.item}</TableCell>
                  <TableCell>
                      {todo.isDone ? (
                        <Badge className="bg-green-500 hover:bg-green-500 text-white">Success</Badge>
                      ) : (
                        <Badge className="bg-red-500 hover:bg-red-500 text-white">Pending</Badge>
                      )}
                    </TableCell>
                  <TableCell>{format(new Date(todo.createdAt), "dd MMMM yyyy", { locale: id })}</TableCell>
                  <TableCell>{format(new Date(todo.updatedAt), "dd MMMM yyyy", { locale: id })}</TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
             {todos.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">No todos available.</p>
            )}

              <div className="flex justify-end mt-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-8 h-8 px-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {getPaginationButtons().map((page, index) => (
                  <Button
                    key={`${page}-${index}`}
                    variant={typeof page === 'number' && page === currentPage ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full w-8 h-8 px-0"
                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                    disabled={typeof page === 'string'}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-8 h-8 px-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}