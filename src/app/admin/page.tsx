"use client"

import { useState, useEffect } from "react"
import { Package, Users, Activity, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { getAdminMatrix } from "./actions"

export default function AdminDashboard() {
  const [data, setData] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [stats, setStats] = useState({ products: 0, suppliers: 0, updates: 0 })
  const [loading, setLoading] = useState(true)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchMatrix()
  }, [])

  async function fetchMatrix() {
    setLoading(true)
    try {
      const { products, suppliers } = await getAdminMatrix()
      setSuppliers(suppliers)
      setData(products)
      setStats({
        products: products.length,
        suppliers: suppliers.length,
        updates: 0
      })
    } catch (error) {
      return;
    } finally {
      setLoading(false)
    }
  }

  // Pagination Logic
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Products", value: stats.products, icon: Package, color: "text-brand-red", bg: "bg-brand-pink" },
          { label: "Suppliers", value: stats.suppliers, icon: Users, color: "text-brand-maroon", bg: "bg-brand-red-subtle/50" },
          { label: "Price Updates (24h)", value: 0, icon: Activity, color: "text-brand-slate", bg: "bg-brand-gray" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-brand-red-subtle shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-slate/50 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-brand-maroon">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* The Pricing Matrix */}
      <div className="bg-white rounded-[2rem] border border-brand-red-subtle shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-brand-red-subtle flex justify-between items-center bg-brand-gray/20">
          <div>
            <h2 className="text-lg font-bold text-brand-maroon">Pricing Comparison</h2>
            <p className="text-xs text-brand-slate/60">Live aggregation of all supplier submissions</p>
          </div>
          <button
            onClick={() => {
              setCurrentPage(1)
              fetchMatrix()
            }}
            className="p-2 text-brand-slate hover:bg-white rounded-xl transition-all hover:shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-gray/50 border-b border-brand-red-subtle">
                <th className="px-6 py-4 text-[10px] font-bold text-brand-maroon uppercase tracking-widest sticky left-0 bg-brand-gray/50 z-20 border-r border-brand-red-subtle/30 w-16 text-center">S/N</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-maroon uppercase tracking-widest sticky left-16 bg-brand-gray/50 z-20 border-r border-brand-red-subtle/30 min-w-[240px]">Product Info</th>
                {suppliers.map(s => (
                  <th key={s.id} className="px-6 py-4 text-[10px] font-bold text-brand-slate uppercase tracking-widest min-w-[120px] text-center">{s.name}</th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold text-brand-red uppercase tracking-widest min-w-[100px] text-center bg-brand-pink/30">Lowest</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-maroon uppercase tracking-widest min-w-[100px] text-center bg-brand-red-subtle/30">Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-red-subtle/50">
              {loading ? (
                <tr><td colSpan={suppliers.length + 4} className="p-12 text-center animate-pulse">Synchronizing pricing engine...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={suppliers.length + 4} className="p-12 text-center text-brand-slate/60">No data available.</td></tr>
              ) : (
                paginatedData.map((row, index) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + index
                  const finalEntry = Array.isArray(row.final_prices)
                    ? row.final_prices[0]
                    : row.final_prices

                  const lowest = finalEntry ? finalEntry.lowest_price : null
                  const final = finalEntry ? finalEntry.final_price : null

                  return (
                    <tr key={row.id} className="hover:bg-brand-gray/30 transition-colors group">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-brand-gray transition-colors border-r border-brand-red-subtle/30 text-center text-[10px] font-bold text-brand-slate/40">
                        {actualIndex + 1}
                      </td>
                      <td className="px-6 py-4 sticky left-16 bg-white group-hover:bg-brand-gray transition-colors border-r border-brand-red-subtle/30">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-brand-red bg-brand-pink px-1.5 py-0.5 rounded">{row.ref_no}</span>
                          <span className="text-sm font-bold text-brand-maroon truncate max-w-[140px]">{row.name}</span>
                        </div>
                      </td>

                      {suppliers.map(s => {
                        const sPrice = row.supplier_prices?.find((p: any) => p.supplier_id === s.id)
                        const isLowest = sPrice && lowest && Number(sPrice.price) === Number(lowest)

                        return (
                          <td key={s.id} className={`px-6 py-4 text-center text-sm font-medium ${isLowest ? "text-brand-red font-bold" : "text-brand-slate/50"}`}>
                            {sPrice ? (
                              <div className="flex flex-col items-center">
                                <span>${Number(sPrice.price).toFixed(2)}</span>
                                {isLowest && <div className="text-[8px] font-black uppercase text-brand-red mt-0.5">Winner</div>}
                              </div>
                            ) : "—"}
                          </td>
                        )
                      })}

                      <td className="px-6 py-4 text-center bg-brand-pink/10">
                        <span className="text-sm font-black text-brand-red">
                          {lowest !== null && lowest !== undefined ? `$${Number(lowest).toFixed(2)}` : "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center bg-brand-red-subtle/10">
                        <span className="text-base font-black text-brand-maroon">
                          {final !== null && final !== undefined ? `$${Number(final).toFixed(2)}` : "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data.length > itemsPerPage && (
          <div className="p-4 bg-brand-gray/30 border-t border-brand-red-subtle flex items-center justify-between">
            <p className="text-xs font-bold text-brand-slate/50 uppercase tracking-widest">
              Showing <span className="text-brand-maroon">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-brand-maroon">{Math.min(currentPage * itemsPerPage, data.length)}</span> of <span className="text-brand-maroon">{data.length}</span> products
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

                  // Show limited pages if there are too many
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
    </div>
  )
}
