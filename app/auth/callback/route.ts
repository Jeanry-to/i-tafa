import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  const redirectPath =
    next && next.startsWith("/")
      ? next
      : "/admin"

  if (code) {
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
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options,
                )
              },
            )
          },
        },
      },
    )

    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      )

    if (error) {
      console.error(
        "Erreur exchangeCodeForSession:",
        error,
      )

      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback`,
      )
    }
  }

  return NextResponse.redirect(
    `${requestUrl.origin}${redirectPath}`,
  )
}