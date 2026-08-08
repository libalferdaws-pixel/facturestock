'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Package, Truck,
  ClipboardList, FileCheck, Menu, X, ChevronRight,
  CreditCard, RotateCcw, ShoppingCart, BarChart2,
  Settings, UserCog, LogOut, ShoppingBag, ChevronDown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'

const navGroups = [
  {
    label: 'Principal', labelAr: 'الرئيسي',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Tableau de bord', labelAr: 'لوحة القيادة' },
      { href: '/rapports', icon: BarChart2, label: 'Rapports', labelAr: 'التقارير' },
    ]
  },
  {
    label: 'Ventes', labelAr: 'المبيعات',
    items: [
      { href: '/caisse', icon: ShoppingCart, label: 'Caisse / POS', labelAr: 'نقطة البيع' },
      { href: '/factures', icon: FileText, label: 'Factures', labelAr: 'الفواتير' },
      { href: '/devis', icon: FileCheck, label: 'Devis', labelAr: 'عروض الأسعار' },
      { href: '/paiements', icon: CreditCard, label: 'Paiements', labelAr: 'المدفوعات' },
      { href: '/avoirs', icon: RotateCcw, label: 'Avoirs / Retours', labelAr: 'الأرصدة' },
    ]
  },
  {
    label: 'Achats', labelAr: 'المشتريات',
    items: [
      { href: '/achats', icon: ShoppingBag, label: 'Commandes achat', labelAr: 'طلبات الشراء' },
      { href: '/bons-livraison', icon: ClipboardList, label: 'Bons livraison', labelAr: 'وصولات الاستلام' },
    ]
  },
  {
    label: 'Tiers & Stock', labelAr: 'الشركاء',
    items: [
      { href: '/clients', icon: Users, label: 'Clients', labelAr: 'الزبائن' },
      { href: '/fournisseurs', icon: Truck, label: 'Fournisseurs', labelAr: 'الموردون' },
      { href: '/produits', icon: Package, label: 'Produits / Stock', labelAr: 'المنتجات' },
    ]
  },
  {
    label: 'Administration', labelAr: 'الإدارة',
    items: [
      { href: '/utilisateurs', icon: UserCog, label: 'Utilisateurs', labelAr: 'المستخدمون' },
      { href: '/parametres', icon: Settings, label: 'Paramètres', labelAr: 'الإعدادات' },
    ]
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ nom: string; role: string } | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('fs_user')
    if (u) setUser(JSON.parse(u))
  }, [])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    localStorage.removeItem('fs_user')
    localStorage.removeItem('fs_token')
    router.push('/login')
  }

  function NavItems({ onNav }: { onNav?: () => void }) {
    return (
      <>
        {navGroups.map(group => (
          <div key={group.label} className="mb-3">
            <p className="text-[10px] uppercase text-slate-500 font-semibold px-3 mb-1 tracking-wider">
              {group.label}
            </p>
            {group.items.map(({ href, icon: Icon, label, labelAr }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link key={href} href={href} onClick={onNav}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all',
                    active
                      ? 'bg-primary text-white'
                      : 'text-slate-400 hover:bg-sidebar-accent hover:text-white'
                  )}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 leading-tight">
                    <span className="text-sm font-medium block">{label}</span>
                    <span className={cn('text-[10px]', active ? 'text-blue-200' : 'text-slate-600')} dir="rtl">{labelAr}</span>
                  </div>
                  {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </Link>
              )
            })}
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar text-sidebar-foreground flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">F</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">FactureStock</p>
            <p className="text-[10px] text-slate-400">Pro — Maroc</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <NavItems />
        </nav>
        {user && (
          <div className="px-3 py-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[120px]">{user.nom}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <button onClick={logout} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Déconnexion">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold">F</span>
                </div>
                <p className="font-bold text-white">FactureStock</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 overflow-y-auto">
              <NavItems onNav={() => setOpen(false)} />
            </nav>
            {user && (
              <div className="px-3 py-3 border-t border-sidebar-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{user.nom}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
                <button onClick={logout} className="p-1.5 text-slate-500 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <button onClick={() => setOpen(true)} className="text-slate-300"><Menu className="w-5 h-5" /></button>
          <p className="font-bold text-white text-sm">FactureStock</p>
          <div className="w-5" />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
