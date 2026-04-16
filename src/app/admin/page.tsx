"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { TrendingDown, Package, Users, Activity, ExternalLink, RefreshCw } from "lucide-react"

export default function AdminDashboard() {
  const [data, setData] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [stats, setStats] = useState({ products: 0, suppliers: 0, updates: 0 })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchMatrix()
  }, [])

  async function fetchMatrix() {
    setLoading(true)
    
    // 1. Fetch Suppliers
    const { data: sData } = await supabase.from("suppliers").select("id, name")
    const suppliersList = sData || []
    setSuppliers(suppliersList)

    // 2. Fetch Matrix Data (Combine products, their supplier prices, and the calculated final price)
    const { data: pData, error: pError } = await supabase
      .from("products")
      .select(`
        id, 
        ref_no, 
        name,
        final_prices:final_prices!product_id(lowest_price, final_price),
        pricing_config:pricing_config!product_id(margin_type, margin_value, override_price),
        supplier_prices:supplier_prices!product_id(supplier_id, price)
      `)
      .order("ref_no")

    if (pError) {
      console.error("Supabase Matrix Error:", pError)
    }

    console.log("Matrix Data Raw:", pData) // CHECK THIS IN BROWSER CONSOLE (F12)
    setData(pData || [])
    
    // Stats calculation
    setStats({
      products: pData?.length || 0,
      suppliers: suppliersList.length || 0,
      updates: 0 // Could fetch from activity logs if implemented
    })

    setLoading(false)
  }

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
      <div className="bg-white rounded-3xl border border-brand-red-subtle shadow-sm overflow-hidden">
        <div className="p-6 border-b border-brand-red-subtle flex justify-between items-center bg-brand-gray/20">
          <div>
            <h2 className="text-lg font-bold text-brand-maroon">Pricing Comparison Matrix</h2>
            <p className="text-xs text-brand-slate/60">Live aggregation of all supplier submissions</p>
          </div>
          <button 
            onClick={fetchMatrix}
            className="p-2 text-brand-slate hover:bg-white rounded-xl transition-all hover:shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
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
                data.map((row, index) => {
                  // Safely extract from joined data (handles both Array and Object responses)
                  const finalEntry = Array.isArray(row.final_prices) 
                    ? row.final_prices[0] 
                    : row.final_prices

                  const lowest = finalEntry ? finalEntry.lowest_price : null
                  const final = finalEntry ? finalEntry.final_price : null

                  return (
                    <tr key={row.id} className="hover:bg-brand-gray/30 transition-colors group">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-brand-gray transition-colors border-r border-brand-red-subtle/30 text-center text-[10px] font-bold text-brand-slate/40">
                        {index + 1}
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
      </div>
    </div>
  )
}
