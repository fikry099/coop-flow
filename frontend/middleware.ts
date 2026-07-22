import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  const roleRoutes: Record<string, string> = {
    'admin-lapangan': '/dashboard/admin-lapangan',
    'petugas-koperasi': '/dashboard/admin-koprasi',
    'dinas-pertanian': '/dashboard/dinas-pertanian',
    'kemenko-pangan': '/dashboard/kemenko-pangan',
    'petani': '/dashboard/petani',
  };

  // Ambil URL dashboard sesuai role pengguna (fallback ke login jika role tidak valid)
  const targetDashboard = (userRole && roleRoutes[userRole]) ? roleRoutes[userRole] : '/auth/login';

  // 1. Jika pengguna mengakses root ('/') atau '/dashboard' persis
  if (pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard/') {
    if (token && userRole && roleRoutes[userRole]) {
      return NextResponse.redirect(new URL(roleRoutes[userRole], request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Jika pengguna SUDAH login tetapi mencoba buka halaman auth (misal: /auth/login)
  if (token && pathname.startsWith('/auth')) {
    if (userRole && roleRoutes[userRole]) {
      return NextResponse.redirect(new URL(roleRoutes[userRole], request.url));
    }
    // Jika ada token tapi role tidak valid, arahkan ke login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 3. Jika BELUM login tetapi mencoba mengakses halaman /dashboard/...
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 4. Validasi Role Access (Proteksi agar user tidak bisa buka dashboard role lain)
  if (token && pathname.startsWith('/dashboard/')) {
    if (userRole && roleRoutes[userRole]) {
      const currentRoleFolder = pathname.split('/')[2];
      const expectedRoleFolder = roleRoutes[userRole].split('/')[2];

      if (currentRoleFolder !== expectedRoleFolder) {
        return NextResponse.redirect(new URL(roleRoutes[userRole], request.url));
      }
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

// WAJIB: Masukkan '/' di matcher agar halaman utama ikut diproses oleh middleware
export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
};