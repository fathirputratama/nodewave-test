'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/axios';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { registerSchema } from '@/lib/schemas/auth';
import { z } from 'zod';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

type RegisterSchema = z.infer<typeof registerSchema>;

interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}

export default function RegisterForm() {
  const { token, setAuth } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Redirect jika sudah login
  useEffect(() => {
    if (token) {
      router.push('/todos');
    }
  }, [token, router]);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      phone: '',
      country: '',
      about: '',
    },
  });

  // Mutasi untuk registrasi
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; fullName: string; password: string }) => {
      const response = await api.post('/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.content?.token) {
        setAuth(data.content.token, 'USER');
        toast.success('Registrasi berhasil!');
        router.push('/todos');
      } else {
        setError('Token tidak ditemukan dalam respons');
        toast.error('Registrasi gagal: Token tidak ditemukan');
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan';
      console.error('Error registrasi:', error.response?.data || error.message);
      setError(`Gagal registrasi: ${errorMessage}`);
      toast.error(`Gagal registrasi: ${errorMessage}`);
    },
  });

  // Handler untuk submit form
  const onSubmit = (data: RegisterSchema) => {
    setError(null);
    const fullName = data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName;
    registerMutation.mutate({
      email: data.email,
      fullName,
      password: data.password,
    });
  };

  // Handler untuk tombol Login
  const handleLoginRedirect = () => {
    router.push('/auth/login');
  };

  if (token) {
    return null;
  }

  return (
    <Form {...form}>
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Register</h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Let’s Sign up first for enter into Square Website. Uh She Up!
        </p>

        <div className="w-full max-w-lg bg-white px-6 py-8 md:px-10 rounded-xl shadow-md">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput {...field} label="First Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput {...field} label="Last Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone Code, Phone Number & Country */}
            <div className="grid grid-cols-[auto_1fr_1fr] gap-4">
              <FormItem>
                <FormControl>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden max-w-[40px]">
                    <input
                      type="text"
                      value="+62"
                      readOnly
                      className="p-1 text-sm text-gray-600 outline-none"
                    />
                  </div>
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput {...field} label="Phone Number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput {...field} label="Your Country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput {...field} label="Mail Address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput {...field} label="Password" type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingLabelInput {...field} label="Confirm Password" type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* About */}
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                type="button"
                className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={handleLoginRedirect}
              >
                Login
              </Button>
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Memproses...' : 'Register'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Form>
  );
}