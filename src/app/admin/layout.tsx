import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { LayoutDashboard, Package, Users, Settings, LogOut } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Suppliers", href: "/admin/suppliers", icon: Users },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-brand-gray font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-brand-red-subtle flex flex-col fixed inset-y-0 shadow-sm">
        <div className="p-6 border-b border-brand-red-subtle">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform shadow-md">
              <Package size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-brand-maroon">Afrisale Eng</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-brand-slate hover:bg-brand-pink hover:text-brand-red rounded-xl transition-all duration-200 group"
            >
              <item.icon size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-red-subtle">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-brand-slate hover:bg-brand-red-subtle hover:text-brand-maroon rounded-xl transition-all group">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-brand-maroon">Admin Dashboard</h1>
            <p className="text-brand-slate/70 text-sm">Real-time price aggregation management</p>
          </div>
          <div className="flex items-center gap-4">
             {/* Simple Admin Profile placeholder */}
             <div className="w-10 h-10 rounded-full bg-brand-red-subtle flex items-center justify-center text-brand-red font-bold border border-brand-red/10">
               AD
             </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
