import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  async function handleLogout() {
    "use server"
    const cookieStore = await cookies()
    cookieStore.delete("admin_access_token")
    redirect("/")
  }

  return (
    <div className="flex min-h-screen bg-brand-gray font-sans">
      <AdminSidebar handleLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-brand-maroon">Admin Dashboard</h1>
            <p className="text-brand-slate/70 text-sm">Inventory & Price Management</p>
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
