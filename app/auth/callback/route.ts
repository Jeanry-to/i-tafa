import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const mode = requestUrl.searchParams.get('mode')

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_callback`,
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } =
    await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error(
      'Erreur exchangeCodeForSession:',
      error,
    )

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_callback`,
    )
  }

  /*
   * Les redirections explicites comme le reset du mot de passe
   * restent prioritaires.
   *
   * Exception :
   * /client + mode=register correspond à la nouvelle inscription
   * Google et doit passer par l'étape de choix du pseudo.
   */
  if (
    next &&
    next.startsWith('/') &&
    next !== '/client' &&
    next !== '/admin'
  ) {
    return NextResponse.redirect(
      `${requestUrl.origin}${next}`,
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_callback`,
    )
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select(
        'role, is_super_admin, full_name, pseudo',
      )
      .eq('id', user.id)
      .maybeSingle()

  if (profileError) {
    console.error(
      'Erreur récupération profil Google:',
      profileError,
    )

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_callback`,
    )
  }

  /*
   * Admin / super-admin :
   * toujours accès à l'espace admin.
   */
  if (
    profile?.role === 'admin' ||
    profile?.is_super_admin
  ) {
    return NextResponse.redirect(
      `${requestUrl.origin}/admin`,
    )
  }

  /*
   * Vérifie si ce compte Google possède déjà un client.
   */
  const { data: existingClient, error: clientCheckError } =
    await supabase
      .from('clients')
      .select('id, status')
      .eq('profile_id', user.id)
      .maybeSingle()

  if (clientCheckError) {
    console.error(
      'Erreur vérification client Google:',
      clientCheckError,
    )

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_callback`,
    )
  }

  /*
   * ============================================================
   * NOUVELLE INSCRIPTION GOOGLE
   * ============================================================
   *
   * On ne crée PAS automatiquement le client ici.
   *
   * L'utilisateur retourne sur /login avec sa session Google
   * toujours active et doit choisir son pseudo.
   */
  if (mode === 'register') {
    /*
     * Si le compte possède déjà un client, ce n'est pas une
     * nouvelle inscription.
     */
    if (existingClient) {
      if (existingClient.status === 'en_attente') {
        await supabase.auth.signOut()

        return NextResponse.redirect(
          `${requestUrl.origin}/login?pending=1`,
        )
      }

      if (existingClient.status === 'suspendu') {
        await supabase.auth.signOut()

        return NextResponse.redirect(
          `${requestUrl.origin}/login?suspended=1`,
        )
      }

      return NextResponse.redirect(
        `${requestUrl.origin}/client`,
      )
    }

    /*
     * On complète uniquement le nom venant de Google.
     * Le pseudo sera choisi par l'utilisateur dans l'étape
     * suivante.
     */
    const googleName =
      (user.user_metadata?.full_name as
        | string
        | undefined) ??
      (user.user_metadata?.name as
        | string
        | undefined) ??
      user.email?.split('@')[0] ??
      'Client'

    if (profile && !profile.full_name) {
      const { error: updateError } =
        await supabase
          .from('profiles')
          .update({
            full_name: googleName,
          })
          .eq('id', user.id)

      if (updateError) {
        console.error(
          'Erreur mise à jour profil Google:',
          updateError,
        )

        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=auth_callback`,
        )
      }
    }

    /*
     * IMPORTANT :
     * On garde la session Google active.
     *
     * L'écran /login?google=register affichera maintenant
     * l'étape "Choisir votre pseudo i-tafa".
     */
    return NextResponse.redirect(
      `${requestUrl.origin}/login?google=register`,
    )
  }

  /*
   * ============================================================
   * CONNEXION GOOGLE NORMALE
   * ============================================================
   *
   * Le bouton "Continuer avec Google" reste une connexion,
   * pas une inscription.
   */

  /*
   * Si aucun client n'existe pour ce compte Google, on conserve
   * le comportement de sécurité actuel : on ne laisse pas entrer
   * directement dans i-tafa.
   *
   * L'utilisateur doit passer par l'inscription Google.
   */
  if (!existingClient) {
    await supabase.auth.signOut()

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=google_not_registered`,
    )
  }

  /*
   * Compte en attente.
   */
  if (existingClient.status === 'en_attente') {
    await supabase.auth.signOut()

    return NextResponse.redirect(
      `${requestUrl.origin}/login?pending=1`,
    )
  }

  /*
   * Compte suspendu.
   */
  if (existingClient.status === 'suspendu') {
    await supabase.auth.signOut()

    return NextResponse.redirect(
      `${requestUrl.origin}/login?suspended=1`,
    )
  }

  /*
   * Compte actif.
   */
  return NextResponse.redirect(
    `${requestUrl.origin}/client`,
  )
}