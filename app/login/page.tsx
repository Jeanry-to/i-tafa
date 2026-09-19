"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError("Email ou mot de passe incorrect.")
      return
    }

    router.push("/admin")
    router.refresh()
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage("Compte cree. Verifiez votre email pour confirmer votre inscription.")
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Panneau gauche */}
      <div className="hidden md:flex md:w-1/2 bg-[#0d1f1a] text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg">
            i
          </div>
          <span className="text-xl font-semibold">i-tafa</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Restez connecte a votre service, en toute confiance.
          </h1>
          <p className="text-gray-300 mb-10">
            i-tafa reunit paiement Mvola, messagerie privee et annonces dans un
            espace simple et securise, gere par Sarobidy.
          </p>

          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">🛡</div>
              <div>
                <p className="font-semibold">Connexion securisee</p>
                <p className="text-sm text-gray-400">Compte Google ou identifiant, session limitee a un seul appareil.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">💬</div>
              <div>
                <p className="font-semibold">Messagerie directe</p>
                <p className="text-sm text-gray-400">Discussion privee avec Sarobidy et annonces officielles.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">📱</div>
              <div>
                <p className="font-semibold">Paiement Mvola</p>
                <p className="text-sm text-gray-400">Payez, entrez la reference, accedez immediatement au service.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">(c) 2026 i-tafa - Titulaire du compte : Sarobidy</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center bg-[#f7fdf5] p-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-1">Bienvenue</h2>
          <p className="text-gray-600 mb-6">
            Connectez-vous ou creez votre compte pour acceder a i-tafa.
          </p>

          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab("login"); setError(""); setMessage("") }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === "login" ? "bg-white shadow text-black" : "text-gray-500"}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setTab("signup"); setError(""); setMessage("") }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === "signup" ? "bg-white shadow text-black" : "text-gray-500"}`}
            >
              Inscription
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 mb-4 hover:bg-gray-50 transition"
          >
            <span className="font-bold text-lg">G</span>
            <span>Continuer avec Google</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Identifiant ou e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Mot de passe</label>
                {tab === "login" && (
                  <a href="#" className="text-xs text-purple-600 hover:underline">Mot de passe oublie ?</a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {tab === "login" && (
              <div className="flex gap-2 bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm text-gray-700">
                <span>🔒</span>
                <span>Acces limite a 1 appareil : une nouvelle connexion deconnecte automatiquement l&apos;ancien appareil.</span>
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Chargement..." : tab === "login" ? "Se connecter" : "Creer mon compte"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
