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

  // Verifie la session Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // =====================================================
  // PROTECTION DE /admin
  // =====================================================

  if (pathname.startsWith('/admin')) {
    // Pas connecte
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // Recupere le role et le statut super admin depuis profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('id', user.id)
      .single()

    // Profil introuvable
    if (error || !profile) {
      return NextResponse.redirect(
        new URL('/client', request.url)
      )
    }

    const isAllowed = profile.role === 'admin' || profile.is_super_admin === true

    // Ni admin ni super admin = interdit
    if (!isAllowed) {
      return NextResponse.redirect(
        new URL('/client', request.url)
      )
    }
  }

  // =====================================================
  // PROTECTION DE /client
  // =====================================================

  if (pathname.startsWith('/client')) {
    // Pas connecte
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // Recupere le role et le statut super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      )
    }

    // Admin ou super admin = espace admin
    if (profile.role === 'admin' || profile.is_super_admin === true) {
      return NextResponse.redirect(
        new URL('/admin', request.url)
      )
    }

    // Verifie le statut du client (actif uniquement)
    const { data: clientRow } = await supabase
      .from('clients')
      .select('status')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!clientRow || clientRow.status !== 'actif') {
      return NextResponse.redirect(
        new URL('/', request.url)
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



