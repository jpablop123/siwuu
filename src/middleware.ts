import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Middleware de autenticación y autorización.
 *
 * Optimización clave (Pilar 2):
 * El rol del usuario se lee de user.app_metadata.rol, que Supabase
 * popula desde auth.users.raw_app_meta_data. Este campo se mantiene
 * sincronizado con public.profiles.rol via el trigger on_profile_rol_change
 * (migración 011). Así eliminamos el query extra a la tabla profiles
 * en cada request a /admin/*, pasando de 2 DB calls a 1.
 *
 * getUser() ya hace 1 llamada al servidor de auth para validar el JWT
 * de forma segura. El app_metadata viene incluido en esa misma respuesta.
 */

/** Roles de aplicación válidos — sincronizados con RolUsuario en database.ts */
type AppRol = 'admin' | 'cliente'

/**
 * Type guard estricto: devuelve true solo si el rol en app_metadata
 * es exactamente 'admin'. Cualquier otro valor (undefined, null, string
 * arbitrario) se trata como cliente sin privilegios.
 */
function isAdmin(user: User): boolean {
  const rol = user.app_metadata?.rol
  return (rol satisfies AppRol | undefined) === 'admin'
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  const necesitaAuth =
    pathname.startsWith('/cuenta') ||
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/registro' ||
    pathname === '/recuperar-password'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rutas públicas: refrescar token si existe y salir rápido
  if (!necesitaAuth) {
    await supabase.auth.getSession()
    return supabaseResponse
  }

  // 1 sola llamada al servidor — valida JWT + devuelve app_metadata
  const { data: { user } } = await supabase.auth.getUser()

  // ── Rutas de auth: redirigir si ya autenticado ──────────────────────
  if (pathname === '/login' || pathname === '/registro' || pathname === '/recuperar-password') {
    if (user) {
      return NextResponse.redirect(
        new URL(isAdmin(user) ? '/admin' : '/cuenta', request.url)
      )
    }
    return supabaseResponse
  }

  // ── /cuenta/*: requiere auth ────────────────────────────────────────
  if (pathname.startsWith('/cuenta')) {
    if (!user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── /admin/*: requiere auth + rol admin ────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!isAdmin(user)) {
      return NextResponse.redirect(new URL('/cuenta', request.url))
    }

    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/wompi|api/auth/logout|api/auth/check-email|api/exchange-rate).*)',
  ],
}
