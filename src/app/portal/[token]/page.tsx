"use client"

import { useState, useEffect, useCallback, use } from "react"
import { Package, CheckCircle2, Save, Loader2, AlertCircle, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { verifySupplier, getPortalData, upsertSupplierPrice } from "../actions"

export default function SupplierPortal({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const token = resolvedParams.token
  const [supplier, setSupplier] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [originalPrices, setOriginalPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [categories, setCategories] = useState<any[]>([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Verify Supplier Token on the server
      const sData = await verifySupplier(token)
      setSupplier(sData)

      // 2. Fetch Products, Categories and Prices on the server
      const { categories, products, initialPrices } = await getPortalData(sData.id)

      // Format initial prices to 2 decimal places for consistent UI
      const formattedPrices: Record<string, string> = {}
      Object.entries(initialPrices).forEach(([id, price]) => {
        formattedPrices[id] = parseFloat(price).toFixed(2)
      })

      setCategories(categories)
      setProducts(products)
      setPrices(formattedPrices)
      setOriginalPrices(formattedPrices)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset pagination on filter
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategoryId])

  async function updatePrice(productId: string) {
    if (!supplier) return
    const price = prices[productId]
    const numPrice = parseFloat(price)
    
    if (isNaN(numPrice)) return
    if (numPrice < 0) {
      alert("Price cannot be negative. Please enter a valid price.")
      return
    }

    setSaving(productId)

    try {
      await upsertSupplierPrice(supplier.id, productId, numPrice)
      setOriginalPrices(prev => ({ ...prev, [productId]: price }))
      setTimeout(() => setSaving(null), 1000)
    } catch (error) {
      setSaving(null)
      alert("Error saving price. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gray flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          <p className="text-brand-slate font-medium">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-gray flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-brand-red shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-brand-red mx-auto mb-4" />
          <h1 className="text-xl font-bold text-brand-maroon mb-2">Access Denied</h1>
          <p className="text-brand-slate/70 mb-6">{error}</p>
          <p className="text-sm text-brand-slate/50">Please contact the Afrisale admin for a valid link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-gray pb-12 font-sans px-4 sm:px-6">
      {/* Portal Header */}
      <header className="max-w-3xl mx-auto py-8">
        <div className="bg-brand-maroon text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <Package size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Afrisale Supplier Portal</span>
          </div>
          <h1 className="text-3xl font-black mb-1">Welcome, {supplier?.name}</h1>
          <p className="text-brand-red-subtle/80 text-sm mb-6">Please update your current product pricing below.</p>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Submission Progress</span>
              <span>{Math.round((Object.keys(prices).length / products.length) * 100) || 0}% Complete</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-red transition-all duration-500 ease-out"
                style={{ width: `${(Object.keys(prices).length / products.length) * 100 || 0}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/30" size={18} />
          <input
            type="text"
            placeholder="Search by ref or name..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-brand-red-subtle  outline-none focus:border-brand-red/30 transition-all text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/30 pointer-events-none" size={16} />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="appearance-none w-full pl-10 pr-8 py-3 bg-white border border-brand-red-subtle outline-none focus:border-brand-red/30 transition-all text-xs font-bold text-brand-slate cursor-pointer shadow-sm"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      <main className="max-w-3xl mx-auto space-y-4">
        {(() => {
          const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategoryId === "" || p.category_id === selectedCategoryId
            return matchesSearch && matchesCategory
          })

          const totalPages = Math.ceil(filtered.length / itemsPerPage)
          const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

          if (filtered.length === 0) {
            return (
              <div className="text-center py-20 bg-white/50  border border-dashed border-brand-red-subtle">
                <p className="text-brand-slate/60 font-medium">No matches found for your criteria.</p>
              </div>
            )
          }

          return (
            <>
              {paginated.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-8 border border-brand-red-subtle shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black text-brand-red bg-brand-pink px-2.5 py-1 rounded-lg uppercase tracking-widest border border-brand-red/5">
                          {product.ref_no}
                        </span>
                        {product.category_id && categories.find(c => c.id === product.category_id) && (
                          <span className="text-[10px] font-bold text-brand-slate/60 bg-brand-gray px-2.5 py-1 rounded-lg uppercase tracking-tight">
                            {categories.find(c => c.id === product.category_id)?.name}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-xl text-brand-maroon tracking-tight leading-tight">
                        {product.name}
                      </h3>

                      <p className="text-sm text-brand-slate/70 leading-relaxed max-w-xl">
                        {product.description || "No description provided."}
                      </p>
                    </div>

                    <div className="w-full sm:w-56 shrink-0">
                      <label className="block text-[10px] font-black text-brand-slate/40 uppercase tracking-[0.2em] mb-2 px-1">
                        Supply Price (£)
                      </label>
                      <div className="relative group/input">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-maroon font-black text-lg">£</div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="w-full pl-10 pr-16 py-4 bg-brand-gray border-2 border-transparent focus:border-brand-red/20 focus:bg-white outline-none transition-all text-base font-bold text-brand-maroon placeholder:text-brand-slate/20"
                          value={prices[product.id] || ""}
                          onChange={(e) => setPrices({ ...prices, [product.id]: e.target.value })}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {saving === product.id ? (
                            <Loader2 className="w-5 h-5 text-brand-red animate-spin" />
                          ) : (prices[product.id] !== originalPrices[product.id]) ? (
                            <button
                              onClick={() => updatePrice(product.id)}
                              className="bg-brand-red text-white p-2 rounded-lg hover:bg-brand-maroon transition-all shadow-md group/btn"
                              title="Save Changes"
                            >
                              <Save size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                          ) : (prices[product.id] && prices[product.id] !== "") ? (
                            <CheckCircle2 className="w-5 h-5 text-[#81c408] animate-in zoom-in" />
                          ) : (
                            <Save className="w-5 h-5 text-brand-slate/10" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-[10px] font-black text-brand-slate/40 uppercase tracking-widest">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="p-2 bg-white border border-brand-red-subtle rounded-xl text-brand-slate disabled:opacity-30 transition-all hover:bg-brand-pink"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-2 bg-white border border-brand-red-subtle rounded-xl text-brand-slate disabled:opacity-30 transition-all hover:bg-brand-pink"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </main>


    </div>
  )
}
