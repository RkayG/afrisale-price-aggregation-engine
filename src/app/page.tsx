"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Search, Tag, Package, Info, RefreshCcw } from "lucide-react"

export default function PublicPriceList() {
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchPrices()

    // Setup Realtime Subscription
    const channel = supabase
      .channel('public_prices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'final_prices' }, () => {
        fetchPrices()
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  async function fetchPrices() {
    // We join products with final_prices
    const { data } = await supabase
      .from("products")
      .select(`
        id,
        ref_no,
        name,
        category,
        description,
        final_prices (
          final_price
        )
      `)
      .order("name", { ascending: true })

    if (data) setPrices(data)
    setLoading(false)
  }

  const filteredPrices = prices.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f9f9f9] selection:bg-brand-red selection:text-white">
      {/* Header / Hero */}
      <header className="bg-white border-b border-brand-red-subtle shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-6 border-l-4 border-brand-red h-24 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-brand-maroon tracking-tight">AFRISALE <span className="text-brand-red">PRICING</span></h1>
            <p className="text-[10px] font-bold text-brand-slate/40 uppercase tracking-[0.2em] mt-1">Live Master Inventory & Daily Rates</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-bold text-brand-slate uppercase tracking-widest leading-none">Status</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-xs font-bold text-brand-slate">LIVE CONNECTED</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Search & Stats */}
        <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
           <div className="relative w-full md:w-2/3 max-w-xl">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-slate/30" size={20} />
             <input 
               type="text" 
               placeholder="Search product inventory..."
               className="w-full pl-16 pr-6 py-5 bg-white border border-brand-red-subtle rounded-[2rem] outline-none focus:ring-4 focus:ring-brand-red/5 transition-all text-sm shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           <button 
             onClick={fetchPrices} 
             className="flex items-center gap-2 text-xs font-bold text-brand-red bg-brand-pink px-6 py-4 rounded-full border border-brand-red/10 active:scale-95 transition-transform"
           >
             <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
             UPDATE PRICES
           </button>
        </div>

        {/* Pricing List Table */}
        <div className="bg-white rounded-[2.5rem] border border-brand-red-subtle shadow-2xl shadow-brand-red/5 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-brand-gray/50 border-b border-brand-red-subtle">
                   <th className="px-8 py-6 text-[10px] font-black text-brand-maroon uppercase tracking-widest">Reference</th>
                   <th className="px-8 py-6 text-[10px] font-black text-brand-maroon uppercase tracking-widest">Inventory Item</th>
                   <th className="px-8 py-6 text-[10px] font-black text-brand-maroon uppercase tracking-widest">Category</th>
                   <th className="px-8 py-6 text-[10px] font-black text-brand-maroon uppercase tracking-widest text-right">Selling Rate</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-brand-red-subtle/40">
                 {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                     <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-8 py-8"><div className="h-8 bg-brand-gray rounded-2xl w-full" /></td>
                     </tr>
                   ))
                 ) : filteredPrices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-brand-slate/40 font-medium">
                        No inventory matches your search.
                      </td>
                    </tr>
                 ) : (
                   filteredPrices.map((item) => {
                     const finalPrice = item.final_prices?.[0]?.final_price
                     return (
                       <tr key={item.id} className="hover:bg-brand-pink/10 transition-colors group">
                         <td className="px-8 py-8">
                           <span className="font-mono text-xs font-black text-brand-red border border-brand-red/10 bg-brand-pink/50 px-3 py-1.5 rounded-full">
                             {item.ref_no}
                           </span>
                         </td>
                         <td className="px-8 py-8">
                            <div className="font-bold text-brand-maroon text-lg group-hover:translate-x-1 transition-transform">{item.name}</div>
                            {item.description && <div className="text-xs text-brand-slate/50 mt-1 flex items-center gap-1"><Info size={12}/> {item.description}</div>}
                         </td>
                         <td className="px-8 py-8">
                           <span className="text-xs font-bold text-brand-slate py-1.5 px-3 bg-brand-gray border border-brand-red-subtle rounded-lg">
                             {item.category || "General"}
                           </span>
                         </td>
                         <td className="px-8 py-8 text-right">
                           <div className="inline-flex flex-col items-end">
                              <span className="text-xs font-black text-brand-red tracking-widest mb-1 opacity-50 uppercase">Final Price</span>
                              <span className="text-3xl font-black text-brand-maroon tabular-nums">
                                {finalPrice ? `$${Number(finalPrice).toFixed(2)}` : "TBA"}
                              </span>
                           </div>
                         </td>
                       </tr>
                     )
                   })
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 p-8 bg-white border border-brand-red-subtle rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
                <Tag size={20} />
             </div>
             <div>
                <h4 className="font-bold text-brand-maroon">Aggregated Daily Rates</h4>
                <p className="text-xs text-brand-slate/60 max-w-md">Our prices are automatically calculated based on daily supplier cost and optimized for local market competitiveness.</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="text-center px-6 border-r border-brand-red-subtle">
                <p className="text-[10px] font-black text-brand-slate uppercase tracking-widest">Active SKUs</p>
                <p className="text-xl font-black text-brand-maroon">{prices.length}</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
