"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ArrowUpDown } from "lucide-react"

import { Modal } from "@/components/ui/Modal"

import Link from "next/link"

interface Product {
  id: string
  ref_no: string
  name: string
  category: string
  description: string
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    ref_no: "",
    name: "",
    category: "",
    description: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("ref_no", { ascending: true })

    if (data) setProducts(data)
    setLoading(false)
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Insert Product
      const { data: product, error: pError } = await supabase
        .from("products")
        .insert([newProduct])
        .select()
        .single()

      if (pError) throw pError

      // 2. Initialize Pricing Config (Default 15% margin)
      const { error: cError } = await supabase
        .from("pricing_config")
        .insert([{
          product_id: product.id,
          margin_type: "percentage",
          margin_value: 15.00
        }])

      if (cError) throw cError

      setIsModalOpen(false)
      setNewProduct({ ref_no: "", name: "", category: "", description: "" })
      fetchProducts()
    } catch (err) {
      console.error("Error adding product:", err)
      alert("Failed to add product. Check if ref_no is unique.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl hover:bg-brand-maroon transition-colors shadow-md shadow-brand-red/20 text-sm font-medium"
          >
            <Plus size={18} />
            Add Product
          </button>
          <button className="p-2 text-brand-slate hover:bg-brand-pink rounded-xl transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-brand-red-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-gray/50 border-b border-brand-red-subtle">
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-wider">Ref No</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-maroon uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-red-subtle/50">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center animate-pulse">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-brand-slate/60">No products found.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-pink/30 group">
                    <td className="px-6 py-4"><span className="font-mono font-bold text-brand-red bg-brand-pink px-2 py-1 rounded">{product.ref_no}</span></td>
                    <td className="px-6 py-4 font-medium text-brand-maroon">{product.name}</td>
                    <td className="px-6 py-4 text-brand-slate">{product.category}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/products/${product.id}`}
                          className="p-1.5 text-brand-slate hover:text-brand-red hover:bg-brand-red-subtle rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button className="p-1.5 text-brand-slate hover:text-brand-red hover:bg-brand-red-subtle rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Product"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">Ref No</label>
              <input 
                required
                type="text" 
                placeholder="e.g. BE001"
                className="w-full px-4 py-2.5 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red/50 transition-all text-sm"
                value={newProduct.ref_no}
                onChange={(e) => setNewProduct({...newProduct, ref_no: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">Category</label>
              <input 
                type="text" 
                placeholder="e.g. Beverages"
                className="w-full px-4 py-2.5 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red/50 transition-all text-sm"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">Product Name</label>
            <input 
              required
              type="text" 
              placeholder="Enter product name..."
              className="w-full px-4 py-2.5 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red/50 transition-all text-sm"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">Description</label>
            <textarea 
              placeholder="Optional description..."
              className="w-full px-4 py-2.5 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red/50 transition-all text-sm min-h-[100px]"
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-brand-red-subtle text-brand-slate font-medium rounded-xl hover:bg-brand-gray transition-colors"
             >
               Cancel
             </button>
             <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-brand-red text-white font-medium rounded-xl hover:bg-brand-maroon transition-colors shadow-lg shadow-brand-red/20 disabled:opacity-50"
             >
               {isSubmitting ? "Adding..." : "Save Product"}
             </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
