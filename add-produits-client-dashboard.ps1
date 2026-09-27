$file = "C:\dev\i-tafa-live\components\client\client-dashboard.tsx"
$content = Get-Content $file -Raw

function Apply-Fix($content, $old, $new, $label) {
    if (-not $content.Contains($old)) {
        throw "Bloc introuvable : $label"
    }
    return $content.Replace($old, $new)
}

try {

# 1. Import de l'icone Package et du composant AdminProducts
$old1 = @'
import {
  LayoutDashboard,
  Loader2,
  Megaphone,
  MessageCircle,
  UserRound,
} from 'lucide-react'
import { AnnouncementsFeed } from '@/components/announcements-feed'
'@
$new1 = @'
import {
  LayoutDashboard,
  Loader2,
  Megaphone,
  MessageCircle,
  Package,
  UserRound,
} from 'lucide-react'
import { AdminProducts } from '@/components/admin/admin-products'
import { AnnouncementsFeed } from '@/components/announcements-feed'
'@
$content = Apply-Fix $content $old1 $new1 "import AdminProducts"

# 2. Ajout de l'item de navigation "Produits"
$old2 = @'
const baseNav: Omit<NavItem, 'badge'>[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'profil', label: 'Mon profil', icon: UserRound },
]
'@
$new2 = @'
const baseNav: Omit<NavItem, 'badge'>[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'produits', label: 'Produits & Services', icon: Package },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'profil', label: 'Mon profil', icon: UserRound },
]
'@
$content = Apply-Fix $content $old2 $new2 "ajout nav produits"

# 3. Ajout du titre pour la section produits
$old3 = @'
    annonces: { title: 'Annonces', subtitle: `Publications officielles de Admin.` },
'@
$new3 = @'
    annonces: { title: 'Annonces', subtitle: `Publications officielles de Admin.` },
    produits: { title: 'Produits & Services', subtitle: 'Gerez les produits et services proposes par votre boutique.' },
'@
$content = Apply-Fix $content $old3 $new3 "ajout titre produits"

# 4. Rendu du composant AdminProducts
$old4 = @'
        {active === 'annonces' && <AnnouncementsFeed />}
'@
$new4 = @'
        {active === 'annonces' && <AnnouncementsFeed />}
        {active === 'produits' && <AdminProducts />}
'@
$content = Apply-Fix $content $old4 $new4 "rendu AdminProducts"

Set-Content $file $content -Encoding UTF8 -NoNewline
Write-Host "Toutes les modifications ont ete appliquees avec succes." -ForegroundColor Green

} catch {
    Write-Host "ECHEC : $($_.Exception.Message)" -ForegroundColor Red
}