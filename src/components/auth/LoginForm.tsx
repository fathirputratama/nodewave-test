'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { loginSchema } from '@/lib/schemas/auth';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/axios';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput"
import Link from 'next/link';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

type LoginSchema = z.infer<typeof loginSchema>;

interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}
export default function LoginForm() {
  const { token, setAuth } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Arahkan ke /todos jika sudah login
  useEffect(() => {
    if (token) {
      router.push('/todos');
    }
  }, [token, router]);

const form = useForm<LoginSchema>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: '',
    password: '',
  },
});

const loginMutation = useMutation({
  mutationFn: async (data: LoginSchema) => {
    const response = await api.post('/login', data);
    return response.data;
    },
    onSuccess: (data) => {
      if (data.content?.token && data.content?.user?.role) {
        setAuth(data.content.token, data.content.user.role);
        toast.success('Login berhasil!');
        router.push('/todos');
      } else {
        setError('Token atau role tidak ditemukan dalam respons');
        toast.error('Login gagal: Token atau role tidak ditemukan');
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.data?.errors?.[0]) ||
        'Email atau password salah';
      console.error('Error login:', error.response?.data || error.message);
      setError(errorMessage);
      toast.error(`Login gagal: ${errorMessage}`);
    },
  });

  const onSubmit = (data: LoginSchema) => {
    setError(null);
    loginMutation.mutate(data);
  };

  if (token) {
    return null; // Hindari render form jika sudah login
  }

  return (
    <Form {...form}>
  <div className="min-h-screen w-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center mb-4 text-gray-700">Login</h1>
      <p className="text-sm text-center text-gray-500 mb-12">
        Just sign in if you have an account in here. Enjoy our Website
      </p>
    <div className="w-full max-w-md p-10 bg-white shadow-md ">

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  type="email"
                  label="Your Email / Username"
                  error={!!form.formState.errors.email}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  {...field}
                  type="password"
                  label="Enter Password"
                  error={!!form.formState.errors.password}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center text-sm text-gray-600">
          <label className="inline-flex items-center">
            <input type="checkbox" className="form-checkbox mr-2" />
            Remember Me
          </label>
          <a href="#" className="text-blue-600 hover:underline text-sm">
            Forgot Password
          </a>
        </div>

        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Memproses...' : 'Login'}
        </Button>

        <p className="text-center text-xs text-gray-500 mt-2">
          Don&apos;t have an account yet?{' '}
         <Link href="/auth/register" className="text-blue-600 hover:underline">
         Register
         </Link>
        </p>
      </form>
    </div>
  </div>
</Form>

  );
}