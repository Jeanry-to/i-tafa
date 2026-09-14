export type Locale = 'fr' | 'mg' | 'en'
export type LocalePreference = Locale | 'auto'

export const LOCALES: { value: LocalePreference; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'mg', label: 'Malagasy' },
  { value: 'en', label: 'English' },
  { value: 'auto', label: 'Automatique (langue du client)' },
]

// Determine la locale effective a utiliser pour l'affichage, en fonction de
// la preference choisie par l'Admin. Si "auto", on essaie de deviner la
// langue du visiteur via son navigateur.
export function resolveLocale(preference: LocalePreference): Locale {
  if (preference === 'fr' || preference === 'mg' || preference === 'en') {
    return preference
  }
  if (typeof navigator === 'undefined') return 'fr'
  const browserLang = navigator.language?.toLowerCase() ?? ''
  if (browserLang.startsWith('mg')) return 'mg'
  if (browserLang.startsWith('en')) return 'en'
  return 'fr'
}

// Dictionnaire plat : cle -> traduction. Ajoutez de nouvelles cles ici au fur
// et a mesure que vous traduisez d'autres parties de l'application.
export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    'chat.header.title': 'Un assistant à votre écoute',
    'chat.header.subtitle': 'Réponse généralement immédiate',
    'chat.empty.text': 'Posez votre question, ou choisissez-en une ci-dessous pour démarrer.',
    'chat.suggestion.1': 'Comment fonctionne le paiement MVola ?',
    'chat.suggestion.2': "Comment fonctionne l'abonnement ?",
    'chat.suggestion.3': 'Comment créer mon compte ?',
    'chat.input.placeholder': 'Écrivez votre message...',
    'chat.error': "Je n'arrive pas à répondre pour le moment. Merci de réessayer dans un instant ou de contacter directement notre équipe.",
    'chat.launcher.open': "Ouvrir l'assistant",
    'chat.launcher.close': "Fermer l'assistant",
    'language.label': 'Langue',
  },
  mg: {
    'chat.header.title': 'Mpanampy vonona hihaino anao',
    'chat.header.subtitle': 'Valiny haingana amin\u2019ny ankapobeny',
    'chat.empty.text': 'Apetraho ny fanontanianao, na misafidiana anankiray etsy ambany hanombohana.',
    'chat.suggestion.1': 'Ahoana ny fandoavam-bola amin\u2019ny MVola?',
    'chat.suggestion.2': 'Ahoana ny fomba fiasan\u2019ny fandraisana anjara?',
    'chat.suggestion.3': 'Ahoana no famoronana kaonty?',
    'chat.input.placeholder': 'Soraty eto ny hafatrao...',
    'chat.error': 'Tsy afaka mamaly aho amin\u2019izao fotoana izao. Andramo indray afaka kelikely na antsoy mivantana ny ekipanay.',
    'chat.launcher.open': 'Sokafy ny mpanampy',
    'chat.launcher.close': 'Akatony ny mpanampy',
    'language.label': 'Fiteny',
  },
  en: {
    'chat.header.title': 'An assistant at your service',
    'chat.header.subtitle': 'Usually replies instantly',
    'chat.empty.text': 'Ask your question, or pick one below to get started.',
    'chat.suggestion.1': 'How does MVola payment work?',
    'chat.suggestion.2': 'How does the subscription work?',
    'chat.suggestion.3': 'How do I create my account?',
    'chat.input.placeholder': 'Type your message...',
    'chat.error': "I can't answer right now. Please try again shortly or contact our team directly.",
    'chat.launcher.open': 'Open the assistant',
    'chat.launcher.close': 'Close the assistant',
    'language.label': 'Language',
  },
}
