'use client';

// Halaman untuk menampilkan form pembuatan todo.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import CreateTodoForm from '@/components/todos/CreateTodoForm';

export default function CreateTodoPage() {
 const { token, role } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (!token) {
        router.push('/auth/login');
      } else if (role === 'ADMIN') {
        router.push('/todos');
      }
    }
  }, [hydrated, token, role, router]);

  if (!hydrated || !token || role === 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <CreateTodoForm />
    </div>
  );
}