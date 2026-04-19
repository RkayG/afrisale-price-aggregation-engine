"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Edit2, Trash2, Save, Loader2, Percent, DollarSign, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { getProductsData, upsertProduct, deleteProduct as deleteProductAction } from "../actions"

interface Product {
  id: string
  ref_no: string
  name: string
  category: string
  category_id: string
  description: string
  created_at: string
  pricing_config?: any[]
  categories?: { name: string }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    id: "",
    ref_no: "",
    name: "",
    category_id: "",
    description: "",
    margin_type: "percentage",
    margin_value: "15",
    override_price: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { products, categories } = await getProductsData()
      setProducts(products)
      setCategories(categories)
    } catch (err) {
      return;
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setIsEditing(false)
    setFormData({
      id: "",
      ref_no: "",
      name: "",
      category_id: "",
      description: "",
      margin_type: "percentage",
      margin_value: "15",
      override_price: ""
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (product: any) => {
    setIsEditing(true)
    const config = product.pricing_config?.[0] || {}
    setFormData({
      id: product.id,
      ref_no: product.ref_no,
      name: product.name,
      category_id: product.category_id || "",
      description: product.description || "",
      margin_type: config.margin_type || "percentage",
      margin_value: config.margin_value ? config.margin_value.toString() : "15",
      override_price: config.override_price ? config.override_price.toString() : ""
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const productPayload: any = {
      ref_no: formData.ref_no,
      name: formData.name,
      category_id: formData.category_id || null,
      description: formData.description
    }
    if (isEditing) productPayload.id = formData.id

    const configPayload = {
      margin_type: formData.margin_type,
      margin_value: parseFloat(formData.margin_value),
      override_price: formData.override_price ? parseFloat(formData.override_price) : null
    }

    try {
      await upsertProduct(productPayload, configPayload)
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      alert("Error saving product.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure? This will remove the product and all associated price submissions.")) return
    try {
      await deleteProductAction(id)
      fetchData()
    } catch (err) {
      alert("Error deleting product.")
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategoryId === "" || p.category_id === selectedCategoryId
    return matchesSearch && matchesCategory
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset to page 1 when searching or filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategoryId])

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-brand-red-subtle shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/50" size={18} />
          <input
            type="text"
            placeholder="Search by ref or name..."
            className="w-full pl-10 pr-4 py-2 bg-brand-gray border border-transparent focus:border-brand-red/30 focus:bg-white rounded-xl outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-xl hover:bg-brand-maroon transition-colors shadow-md shadow-brand-red/20 text-sm font-black uppercase tracking-widest"
          >
            <Plus size={18} />
            Add Product
          </button>

          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/50 pointer-events-none" size={16} />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="appearance-none w-full pl-10 pr-8 py-2.5 bg-brand-gray border border-transparent focus:border-brand-red/30 focus:bg-white rounded-xl outline-none transition-all text-xs font-bold text-brand-slate cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[2rem] border border-brand-red-subtle shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-gray/50 border-b border-brand-red-subtle ">
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-[0.2em] w-16">S/N</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-[0.2em]">Ref No</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-[0.2em]">Product Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-[0.2em]">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-[0.2em]">Profit Margin</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-red-subtle/30">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center animate-pulse text-brand-slate font-bold">Synchronizing...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-brand-slate/40 font-bold">No products found.</td></tr>
              ) : (
                paginatedProducts.map((product, index) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + index
                  const config = product.pricing_config?.[0]
                  return (
                    <tr key={product.id} className="hover:bg-brand-pink/10 group transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-brand-slate/40">{actualIndex + 1}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-xs text-brand-red bg-brand-pink px-2.5 py-1 rounded-full uppercase tracking-widest">{product.ref_no}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-maroon">{product.name}</td>
                      <td className="px-6 py-4 text-brand-slate text-xs font-medium uppercase tracking-tighter">
                        {product.categories?.name || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`${config?.override_price ? 'text-brand-red' : 'text-brand-slate'} text-xs font-black`}>
                            {config?.override_price ? `$${config.override_price} (Override)` : `${config?.margin_value || 15}${config?.margin_type === 'percentage' ? '%' : ' Fixed'}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 text-brand-slate hover:text-brand-red hover:bg-brand-red-subtle rounded-xl transition-all"
                            title="Edit Product & Pricing"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-brand-slate hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > itemsPerPage && (
          <div className="p-4 bg-brand-gray/30 border-t border-brand-red-subtle flex items-center justify-between">
            <p className="text-xs font-bold text-brand-slate/50 uppercase tracking-widest">
              Showing <span className="text-brand-maroon">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-brand-maroon">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="text-brand-maroon">{filteredProducts.length}</span> products
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 bg-white border border-brand-red-subtle rounded-xl text-brand-slate hover:text-brand-red hover:bg-brand-pink disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-slate transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  const isCurrent = currentPage === pageNum

                  if (totalPages > 5 && (pageNum > 1 && pageNum < totalPages && Math.abs(pageNum - currentPage) > 1)) {
                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1">...</span>
                    return null
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${isCurrent
                        ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                        : "bg-white text-brand-slate hover:bg-brand-red-subtle border border-brand-red-subtle"
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 bg-white border border-brand-red-subtle rounded-xl text-brand-slate hover:text-brand-red hover:bg-brand-pink disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-slate transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Modify Product & Pricing" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-brand-maroon uppercase tracking-widest opacity-60">Ref No</label>
              <input
                required
                type="text"
                placeholder="e.g. BE001"
                className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-bold"
                value={formData.ref_no}
                onChange={(e) => setFormData({ ...formData, ref_no: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-brand-maroon uppercase tracking-widest opacity-60">Category</label>
              <select
                className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-bold"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-brand-maroon uppercase tracking-widest opacity-60">Product Name</label>
            <input
              required
              type="text"
              placeholder="Enter product name..."
              className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-bold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-brand-maroon uppercase tracking-widest opacity-60">Description</label>
            <textarea
              placeholder="Optional description..."
              className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-medium text-sm min-h-[80px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Pricing Config Section */}
          <div className="pt-4 border-t border-brand-red-subtle/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={14} className="text-brand-red" />
              <h3 className="text-sm font-black text-brand-maroon uppercase tracking-widest">Pricing Strategy</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest opacity-60">Margin Type</label>
                <select
                  className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-bold"
                  value={formData.margin_type}
                  onChange={(e) => setFormData({ ...formData, margin_type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest opacity-60">Margin Value</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-black"
                  value={formData.margin_value}
                  onChange={(e) => setFormData({ ...formData, margin_value: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest opacity-60">Manual Price Override</label>
                {formData.override_price && <button type="button" onClick={() => setFormData({ ...formData, override_price: "" })} className="text-[8px] font-black text-brand-red underline">RESET</button>}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter fixed price to ignore calculations"
                  className="w-full pl-10 pr-4 py-3 bg-brand-pink/20 border border-brand-red/10 rounded-xl outline-none focus:border-brand-red/40 font-black text-brand-red active:bg-white focus:bg-white"
                  value={formData.override_price}
                  onChange={(e) => setFormData({ ...formData, override_price: e.target.value })}
                />
                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/40" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-4 bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-maroon transition-all shadow-xl shadow-brand-red/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
