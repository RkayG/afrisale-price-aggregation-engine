"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { AlertTriangle, Search } from "lucide-react"

export default function PublicPriceList() {
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

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
    const { data } = await supabase
      .from("products")
      .select(`
        id,
        ref_no,
        name,
        category,
        description,
        final_prices (
          final_price,
          updated_at
        )
      `)
      .order("name", { ascending: true })

    if (data) {
      setPrices(data)
      // Find the most recent update time
      const latest = data.reduce((acc: any, curr: any) => {
        const date = curr.final_prices?.[0]?.updated_at
        if (!date) return acc
        return !acc || new Date(date) > new Date(acc) ? date : acc
      }, null)

      if (latest) {
        setLastUpdated(new Date(latest).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))
      }
    }
    setLoading(false)
  }

  const filteredPrices = prices.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group by category
  const groupedPrices = filteredPrices.reduce((acc: any, item: any) => {
    const cat = item.category || "GENERAL"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white font-sans text-brand-maroon pb-20">
      {/* Top Banner */}
      <div className="bg-[#a32e2e] text-white text-center py-4 px-6 shadow-md">
        <h1 className="text-3xl font-black tracking-tight uppercase">AFRISALE DISTRIBUTORS</h1>
      </div>

      <div className="bg-[#c23b3b] text-white text-[10px] md:text-sm text-center py-2 px-6 italic font-medium">
        Wholesale Price List | Office 016, 6-8 Longmarket, Canterbury CT1 2JS | Tel: +44 7440 701994
      </div>

      {/* Warning Row */}
      <div className="bg-[#f0f0f0] border-y border-gray-300 py-2 px-6 flex flex-col md:flex-row items-center justify-center gap-2 text-[10px] md:text-xs font-bold text-[#a32e2e]">
        <AlertTriangle size={14} />
        <span>Prices are updated weekly. Please check back regularly or contact us for the latest rates.</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          {/* Search Input for digital convenience */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/40" size={14} />
            <input
              type="text"
              placeholder="Filter list..."
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-red/30 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {lastUpdated && <div className="text-[10px] italic text-gray-500 ml-auto uppercase tracking-tighter">Last Updated: {lastUpdated}</div>}
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse font-bold text-gray-300">FETCHING PRICE LIST...</div>
        ) : filteredPrices.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No products found for "{searchTerm}"</div>
        ) : (
          Object.keys(groupedPrices).sort().map((category) => (
            <div key={category} className="mb-10 overflow-hidden border border-[#a32e2e]">
              {/* Category Header */}
              <div className="bg-[#a32e2e] text-white py-2 px-6 text-center font-black text-lg uppercase tracking-[0.1em]">
                {category}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#a32e2e] text-white border-b border-[#a32e2e]">
                      <th className="px-4 py-3 text-center text-xs font-black uppercase w-20 border-r border-white/20">Ref #</th>
                      <th className="px-6 py-3 text-left text-xs font-black uppercase border-r border-white/20">Product Name</th>
                      <th className="px-6 py-3 text-left text-xs font-black uppercase border-r border-white/20">Description / Sizes</th>
                      <th className="px-6 py-3 text-center text-xs font-black uppercase w-40">Wholesale Price (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedPrices[category].map((item: any, idx: number) => {
                      const finalPrice = item.final_prices?.[0]?.final_price
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#fcecec]"}>
                          <td className="px-4 py-3 text-center text-xs font-bold border-r border-gray-200">{item.ref_no}</td>
                          <td className="px-6 py-3 text-sm font-semibold border-r border-gray-200">{item.name}</td>
                          <td className="px-6 py-3 text-xs text-gray-600 border-r border-gray-200">{item.description || "-"}</td>
                          <td className="px-6 py-3 text-center text-sm font-black text-[#a32e2e]">
                            {finalPrice ? `£${Number(finalPrice).toFixed(2)}` : "TBA"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-[10px] md:text-sm font-bold text-[#c23b3b] space-y-1">
          <p>All prices are negotiable. Contact us at afrisaledistributors.com | Tel: +44 7440 701994</p>
        </div>
      </div>
    </div>
  )
}
