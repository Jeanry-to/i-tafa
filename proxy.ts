import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Vérifie la session Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // =====================================================
  // PROTECTION DE /admin
  // =====================================================

  if (pathname.startsWith('/admin')) {
    // Pas connecté
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // Récupère le rôle depuis profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Profil introuvable
    if (error || !profile) {
      return NextResponse.redirect(
        new URL('/client', request.url)
      )
    }

    // Client ou autre rôle = interdit
    if (profile.role !== 'admin') {
      return NextResponse.redirect(
        new URL('/client', request.url)
      )
    }
  }

  // =====================================================
  // PROTECTION DE /client
  // =====================================================

  if (pathname.startsWith('/client')) {
    // Pas connecté
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // Récupère le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      )
    }

    // Admin = espace admin
    if (profile.role === 'admin') {
      return NextResponse.redirect(
        new URL('/admin', request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
  ],
}