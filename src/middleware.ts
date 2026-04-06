import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  // Rutas que NO necesitan auth check → solo refrescar cookies
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

  // Rutas públicas: no gastar tiempo en getUser()
  if (!necesitaAuth) {
    // Refrescar token si existe (rápido, solo lee cookie)
    await supabase.auth.getSession()
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas de auth: si ya autenticado → redirigir según rol
  if (pathname === '/login' || pathname === '/registro' || pathname === '/recuperar-password') {
    if (user) {
      const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() { return [] },
            setAll() {},
          },
        }
      )
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single()
      return NextResponse.redirect(
        new URL(profile?.rol === 'admin' ? '/admin' : '/cuenta', request.url)
      )
    }
    return supabaseResponse
  }

  // Rutas /cuenta/*: requieren auth
  if (pathname.startsWith('/cuenta')) {
    if (!user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Rutas /admin/*: requieren auth + rol admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'admin') {
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
