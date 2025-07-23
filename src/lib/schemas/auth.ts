import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password harus minimal 6 karakter'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Email tidak valid').min(1, 'Email diperlukan'),
    firstName: z.string().min(1, 'Nama depan diperlukan'),
    lastName: z.string().optional(),
    password: z.string().min(6, 'Password harus minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi kata sandi diperlukan'),
    phone: z.string().optional(),
    country: z.string().optional(),
    about: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Kata sandi dan konfirmasi kata sandi harus sama',
    path: ['confirmPassword'],
  });