import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  // Jika sudah login
  if (token) {
    // Pengguna dengan role USER diarahkan ke /todos/new jika mencoba akses / atau /auth/*
    if (role === 'USER' && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth'))) {
      return NextResponse.redirect(new URL('/todos/new', request.url));
    }
    // Pengguna dengan role USER dilarang akses /todos (admin page)
    if (role === 'USER' && request.nextUrl.pathname === '/todos') {
      return NextResponse.redirect(new URL('/todos/new', request.url));
    }
    // Pengguna dengan role ADMIN diarahkan ke /todos jika mencoba akses / atau /auth/*
    if (role === 'ADMIN' && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth'))) {
      return NextResponse.redirect(new URL('/todos', request.url));
    }
  } else {
    // Jika belum login, arahkan ke /auth/login untuk rute /todos atau /todos/*
    if (request.nextUrl.pathname.startsWith('/todos')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/todos/:path*', '/auth/:path*'],
};