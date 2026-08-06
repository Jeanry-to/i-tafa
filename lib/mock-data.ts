export const BRAND = {
  name: 'i-tafa',
  owner: 'Sarobidy',
  mvolaNumber: '034 12 345 67',
}

/** Identifiants de l'administrateur (prototype). */
export const ADMIN = {
  name: 'Sarobidy',
  email: 'admin@i-tafa.mg',
  password: 'admin',
}

/** Retourne true si les identifiants correspondent au compte administrateur. */
export function isAdminLogin(identifier: string, password?: string) {
  const id = identifier.trim().toLowerCase()
  const matchesId = id === ADMIN.email.toLowerCase() || id === 'admin'
  if (password === undefined) return matchesId
  return matchesId && password === ADMIN.password
}

export type ClientStatus = 'actif' | 'suspendu'

export type Client = {
  id: string
  name: string
  phone: string
  address: string
  status: ClientStatus
  joinedAt: string
  lastMessage: string
  unread: number
  socials: {
    facebook?: string
    whatsapp?: string
    instagram?: string
  }
}

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Miora Rakoto',
    phone: '+261 34 11 223 44',
    address: 'Lot II M 45, Analakely, Antananarivo',
    status: 'actif',
    joinedAt: '12 janv. 2026',
    lastMessage: 'Merci beaucoup pour votre aide !',
    unread: 2,
    socials: {
      facebook: 'https://facebook.com/miora.rakoto',
      whatsapp: 'https://wa.me/261341122344',
      instagram: 'https://instagram.com/miora.rk',
    },
  },
  {
    id: 'c2',
    name: 'Tojo Andriamana',
    phone: '+261 33 55 667 88',
    address: 'Ambohipo, Antananarivo',
    status: 'actif',
    joinedAt: '03 févr. 2026',
    lastMessage: "J'ai bien reçu le fichier, merci.",
    unread: 0,
    socials: {
      facebook: 'https://facebook.com/tojo.a',
      whatsapp: 'https://wa.me/261335566788',
    },
  },
  {
    id: 'c3',
    name: 'Hanta Ravelo',
    phone: '+261 32 44 556 67',
    address: 'Tanjombato, Antananarivo',
    status: 'suspendu',
    joinedAt: '28 déc. 2025',
    lastMessage: 'Bonjour, avez-vous une minute ?',
    unread: 1,
    socials: {
      instagram: 'https://instagram.com/hanta.rv',
      whatsapp: 'https://wa.me/261324455667',
    },
  },
  {
    id: 'c4',
    name: 'Fanja Randria',
    phone: '+261 34 99 001 22',
    address: 'Ivandry, Antananarivo',
    status: 'actif',
    joinedAt: '18 févr. 2026',
    lastMessage: 'Parfait, à bientôt.',
    unread: 0,
    socials: {
      facebook: 'https://facebook.com/fanja.r',
    },
  },
]

export type ChatMessage = {
  id: string
  from: 'client' | 'admin'
  text?: string
  attachment?: { type: 'image' | 'video' | 'file'; name: string }
  time: string
}

export const privateThread: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'm1', from: 'admin', text: 'Bonjour Miora, bienvenue sur i-tafa !', time: '09:02' },
    { id: 'm2', from: 'client', text: 'Bonjour, merci ! Comment je commence ?', time: '09:05' },
    { id: 'm3', from: 'admin', text: 'Je vous envoie le guide tout de suite.', time: '09:06' },
    { id: 'm4', from: 'admin', attachment: { type: 'file', name: 'guide-demarrage.pdf' }, time: '09:06' },
    { id: 'm5', from: 'client', text: 'Merci beaucoup pour votre aide !', time: '09:10' },
  ],
  c2: [
    { id: 'm1', from: 'client', text: 'Bonjour, vous avez le document ?', time: 'Hier' },
    { id: 'm2', from: 'admin', attachment: { type: 'image', name: 'apercu.jpg' }, time: 'Hier' },
    { id: 'm3', from: 'client', text: "J'ai bien reçu le fichier, merci.", time: 'Hier' },
  ],
  c3: [{ id: 'm1', from: 'client', text: 'Bonjour, avez-vous une minute ?', time: '08:30' }],
  c4: [
    { id: 'm1', from: 'admin', text: 'Votre demande est traitée.', time: 'Lun.' },
    { id: 'm2', from: 'client', text: 'Parfait, à bientôt.', time: 'Lun.' },
  ],
}

export type Announcement = {
  id: string
  title: string
  body: string
  date: string
  attachment?: { type: 'image' | 'video'; name: string }
}

export const announcements: Announcement[] = [
  {
    id: 'a1',
    title: 'Nouveaux horaires de disponibilité',
    body: "À partir de lundi prochain, je serai disponible du lundi au samedi, de 8h à 18h. Les messages envoyés en dehors de ces horaires seront traités le jour ouvré suivant.",
    date: "Aujourd'hui · 07:45",
  },
  {
    id: 'a2',
    title: 'Mise à jour du service',
    body: "Une nouvelle option de partage de fichiers est désormais active dans vos discussions privées. Vous pouvez envoyer photos, vidéos et documents directement.",
    date: 'Hier · 16:20',
    attachment: { type: 'image', name: 'annonce-service.jpg' },
  },
  {
    id: 'a3',
    title: 'Bienvenue sur i-tafa',
    body: "Merci de votre confiance. Consultez le règlement général ci-dessous et n'hésitez pas à me contacter via votre discussion privée.",
    date: '20 févr. 2026',
  },
]

export const rules: string[] = [
  'Le respect mutuel est obligatoire dans toutes les discussions.',
  'Un seul appareil connecté par compte à la fois pour votre sécurité.',
  'Aucun partage de contenu illégal, offensant ou frauduleux.',
  'Les paiements se font uniquement via le numéro Mvola officiel indiqué.',
  "Toute violation des règles peut entraîner une suspension ou suppression immédiate du compte.",
]

export const currentClient = {
  name: 'Miora Rakoto',
  email: 'miora.rakoto@email.mg',
  phone: '+261 34 11 223 44',
  address: 'Lot II M 45, Analakely, Antananarivo',
  device: 'iPhone 13 · Antananarivo',
}
