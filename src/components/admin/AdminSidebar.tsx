"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Users, LogOut, LayoutGrid } from "lucide-react"

interface SidebarProps {
  handleLogout: () => Promise<void>
}

export function AdminSidebar({ handleLogout }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: LayoutGrid },
    { label: "Suppliers", href: "/admin/suppliers", icon: Users },
  ]

  return (
    <aside className="w-64 bg-white border-r border-brand-red-subtle flex flex-col fixed inset-y-0 shadow-sm z-30">
      <div className="p-6 border-b border-brand-red-subtle">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform shadow-md">
            <Package size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-brand-maroon">Afrisale</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                  : "text-brand-slate hover:bg-brand-pink hover:text-brand-red"
              }`}
            >
              <item.icon 
                size={20} 
                className={`transition-transform ${isActive ? "" : "group-hover:scale-110"}`} 
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-brand-red-subtle">
        <form action={handleLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-brand-slate hover:bg-brand-red-subtle hover:text-brand-maroon rounded-xl transition-all group"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
