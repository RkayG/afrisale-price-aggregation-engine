"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Plus, Search, Edit2, Trash2, Save, Loader2, FolderTree } from "lucide-react"
import { Modal } from "@/components/ui/Modal"

interface Category {
  id: string
  name: string
  slug: string
  description: string
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: ""
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (data) setCategories(data)
    setLoading(false)
  }

  const handleOpenAdd = () => {
    setIsEditing(false)
    setFormData({ id: "", name: "", description: "" })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setIsEditing(true)
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || ""
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    const payload = {
      name: formData.name,
      slug: slug,
      description: formData.description
    }

    try {
      if (isEditing) {
        await supabase.from("categories").update(payload).eq("id", formData.id)
      } else {
        await supabase.from("categories").insert([payload])
      }

      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      console.error(err)
      alert("Error saving category.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Are you sure? Products in this category will become uncategorized.")) return
    await supabase.from("categories").delete().eq("id", id)
    fetchCategories()
  }

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">


      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-brand-red-subtle shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/50" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-brand-gray border border-transparent focus:border-brand-red/30 focus:bg-white rounded-xl outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-xl hover:bg-brand-maroon transition-colors shadow-md shadow-brand-red/20 text-sm font-black uppercase tracking-widest"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-[2rem] border border-brand-red-subtle shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-gray/50 border-b border-brand-red-subtle">
              <th className="px-6 py-4 text-[10px] font-black text-brand-maroon uppercase tracking-widest w-16">S/N</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-maroon uppercase tracking-widest">Category Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-maroon uppercase tracking-widest">Slug</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-maroon uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-red-subtle/30">
            {loading ? (
              <tr><td colSpan={4} className="p-12 text-center animate-pulse font-bold text-brand-slate">Fetching categories...</td></tr>
            ) : filteredCategories.map((category, index) => (
              <tr key={category.id} className="hover:bg-brand-pink/10 transition-colors group">
                <td className="px-6 py-4 text-xs font-bold text-brand-slate/40">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FolderTree size={16} className="text-brand-red/40" />
                    <span className="font-bold text-brand-maroon">{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-brand-slate">{category.slug}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenEdit(category)} className="p-2 text-brand-slate hover:text-brand-red hover:bg-brand-red-subtle rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => deleteCategory(category.id)} className="p-2 text-brand-slate hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Category Details">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-brand-maroon uppercase tracking-widest">Category Name</label>
            <input
              required
              placeholder="e.g. Beverages"
              className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-bold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-brand-maroon uppercase tracking-widest">Description</label>
            <textarea
              placeholder="What belongs in this category?"
              className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all text-sm min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-red text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-maroon transition-all shadow-xl shadow-brand-red/20 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Category"}
          </button>
        </form>
      </Modal>
    </div>
  )
}
