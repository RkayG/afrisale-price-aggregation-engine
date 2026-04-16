"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Plus, Search, MoreVertical, Copy, Check, Mail, ExternalLink, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/Modal"

interface Supplier {
  id: string
  name: string
  contact: string
  access_token: string
  created_at: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    setLoading(true)
    const { data } = await supabase.from("suppliers").select("*").order("name")
    if (data) setSuppliers(data)
    setLoading(false)
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await supabase.from("suppliers").insert([newSupplier])
    if (!error) {
      setIsModalOpen(false)
      setNewSupplier({ name: "", contact: "" })
      fetchSuppliers()
    }
    setIsSubmitting(false)
  }

  const copyToClipboard = (token: string, id: string) => {
    const url = `${window.location.origin}/portal/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-brand-maroon">Supplier Directory</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl hover:bg-brand-maroon transition-colors shadow-md text-sm font-medium"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-3xl border border-brand-red-subtle animate-pulse" />
          ))
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-brand-red/30 text-brand-slate/60">
            No suppliers registered yet.
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-6 rounded-3xl border border-brand-red-subtle shadow-sm hover:shadow-xl hover:border-brand-red/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-pink flex items-center justify-center text-brand-red font-bold text-lg">
                  {supplier.name.charAt(0)}
                </div>
                <button className="p-2 text-brand-slate hover:bg-brand-pink rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="font-bold text-brand-maroon text-lg truncate">{supplier.name}</h3>
              <p className="text-brand-slate/70 text-sm mb-6 flex items-center gap-2">
                <Mail size={14} />
                {supplier.contact || "No contact info"}
              </p>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-brand-slate/40 uppercase tracking-widest">Access Link</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(supplier.access_token, supplier.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-gray hover:bg-brand-red-subtle text-brand-slate hover:text-brand-red border border-transparent hover:border-brand-red/20 rounded-xl text-xs font-bold transition-all"
                  >
                    {copiedId === supplier.id ? (
                      <><Check size={14} /> Copied!</>
                    ) : (
                      <><Copy size={14} /> Copy Portal Link</>
                    )}
                  </button>
                  <a
                    href={`/portal/${supplier.access_token}`}
                    target="_blank"
                    className="p-2.5 bg-brand-gray hover:bg-brand-red-subtle text-brand-slate hover:text-brand-red rounded-xl transition-all"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Supplier">
        <form onSubmit={handleAddSupplier} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">Supplier Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Gbadebo"
              className="w-full px-4 py-2.5 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red/50 transition-all text-sm"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">Contact Email / Phone (Optional)</label>
            <input
              type="text"
              placeholder="e.g. gbadebo@gmail.com"
              className="w-full px-4 py-2.5 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red/50 transition-all text-sm"
              value={newSupplier.contact}
              onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
            />
          </div>
          <p className="text-xs text-brand-slate/60 bg-brand-pink/50 p-3 rounded-xl border border-brand-red/10 mt-4 leading-relaxed">
            Registering a supplier generates a unique security token. You can share the portal link with them once registered.
          </p>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-brand-red-subtle text-brand-slate font-medium rounded-xl hover:bg-brand-gray transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-brand-red text-white font-medium rounded-xl hover:bg-brand-maroon transition-colors shadow-lg shadow-brand-red/20 disabled:opacity-50">
              {isSubmitting ? "Registering..." : "Add Supplier"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
