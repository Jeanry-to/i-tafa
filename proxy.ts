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

  // =====================================================
  // VERIFICATION DE LA SESSION SUPABASE
  // =====================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  console.log(
    '[PROXY] pathname:',
    pathname,
    'user:',
    user?.id ?? 'AUCUN',
    'authError:',
    userError?.message ?? 'aucune'
  )

  // =====================================================
  // PROTECTION DE /admin
  // =====================================================

  if (pathname.startsWith('/admin')) {
    // Pas connecte
    if (!user) {
      console.log('[PROXY] /admin -> pas de session')

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // Recupere le role et le statut super admin
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('id', user.id)
      .single()

    console.log(
      '[PROXY] /admin -> profile:',
      profile,
      'error:',
      error?.message ?? 'aucune'
    )

    // Profil introuvable
    if (error || !profile) {
      return NextResponse.redirect(
        new URL('/client', request.url)
      )
    }

    const isAllowed =
      profile.role === 'admin' ||
      profile.is_super_admin === true

    // Ni admin ni super admin = interdit
    if (!isAllowed) {
      console.log(
        '[PROXY] /admin -> acces refuse pour role:',
        profile.role
      )

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
      console.log('[PROXY] /client -> pas de session')

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
    }

    // Recupere le profil
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role, is_super_admin')
        .eq('id', user.id)
        .single()

    console.log(
      '[PROXY] /client -> profile:',
      profile,
      'error:',
      profileError?.message ?? 'aucune'
    )

    if (!profile) {
      console.log('[PROXY] /client -> profil introuvable')

      return NextResponse.redirect(
        new URL('/login', request.url)
      )
    }

    // Admin ou super admin = espace admin
    if (
      profile.role === 'admin' ||
      profile.is_super_admin === true
    ) {
      console.log(
        '[PROXY] /client -> utilisateur admin -> /admin'
      )

      return NextResponse.redirect(
        new URL('/admin', request.url)
      )
    }

    // ===================================================
    // VERIFICATION DU CLIENT
    // ===================================================

    const { data: clientRow, error: clientError } =
      await supabase
        .from('clients')
        .select('status, suspended_until')
        .eq('profile_id', user.id)
        .maybeSingle()

    console.log(
      '[PROXY] /client -> clientRow:',
      clientRow,
      'error:',
      clientError?.message ?? 'aucune'
    )

    // Une suspension temporaire dont la date de fin est
    // passee ne doit plus bloquer l'acces
    const suspensionExpired =
      clientRow?.status === 'suspendu' &&
      !!clientRow.suspended_until &&
      new Date(clientRow.suspended_until).getTime() <=
        Date.now()

    const isActive =
      clientRow?.status === 'actif' || suspensionExpired

    // Le compte doit etre actif
    if (!clientRow || !isActive) {
      console.log(
        '[PROXY] /client -> acces refuse, clientRow:',
        clientRow
      )

      // Compte vraiment suspendu : on le signale a l'arrivee
      if (clientRow?.status === 'suspendu') {
        return NextResponse.redirect(
          new URL('/?suspended=1', request.url)
        )
      }

      return NextResponse.redirect(
        new URL('/', request.url)
      )
    }

    console.log(
      '[PROXY] /client -> acces autorise'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
  ],
}