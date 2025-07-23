'use client';

// Halaman utama yang menampilkan form registrasi, mengarahkan ke /todos atau /todos/new berdasarkan role.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import RegisterForm from '@/components/auth/RegisterForm';

export default function HomePage() {
  const { token, role } = useAuthStore();
  const router = useRouter();

  // Arahkan berdasarkan role
  useEffect(() => {
    if (token) {
      if (role === 'ADMIN') {
        router.push('/todos');
      } else {
        router.push('/todos/new');
      }
    }
  }, [token, role, router]);

  if (token) {
    return null; // Hindari render form jika sudah login
  }

  return (
      <RegisterForm />
  );
}