"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { AlertTriangle, Search, LayoutGrid, X, ArrowUp } from "lucide-react"
import { getPublicPrices } from "./actions"

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
    try {
      const data = await getPublicPrices()
      setPrices(data)

      // Find the most recent update time
      const latest = data.reduce((acc: any, curr: any) => {
        const entry = Array.isArray(curr.final_prices) ? curr.final_prices[0] : curr.final_prices
        const date = entry?.updated_at
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
    } catch (err) {

    } finally {
      setLoading(false)
    }
  }

  const filteredPrices = prices
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ref_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.ref_no.localeCompare(b.ref_no, undefined, { numeric: true, sensitivity: 'base' }))

  // Group by category
  const groupedPrices = filteredPrices.reduce((acc: any, item: any) => {
    const cat = item.category || "GENERAL"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const categories = Object.keys(groupedPrices).sort()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white font-sans text-brand-maroon pb-20 relative">
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
            <div key={category} id={category} className="mb-10 overflow-hidden border border-[#a32e2e]">
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
                      const finalEntry = Array.isArray(item.final_prices) ? item.final_prices[0] : item.final_prices
                      const finalPrice = finalEntry?.final_price
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


      </div>

      {/* Sticky Flowing Footer Banner */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .flowing-marquee {
          display: flex;
          white-space: nowrap;
          animation: marquee 30s linear infinite;
        }
      `}</style>

      <div className="fixed bottom-0 left-0 right-0 bg-brand-pink text-primary py-3 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-white/10 overflow-hidden">
        <div className="flowing-marquee items-center gap-12 md:gap-24 lg:gap-32  text-xs md:text-xs ">
          <span className="flex-shrink-0">All prices are negotiable. Contact us at afrisaledistributors.com | Tel: +44 7440 701994</span>
          <span className="flex-shrink-0">All prices are negotiable. Contact us at afrisaledistributors.com | Tel: +44 7440 701994</span>
          <span className="flex-shrink-0">All prices are negotiable. Contact us at afrisaledistributors.com | Tel: +44 7440 701994</span>
          <span className="flex-shrink-0">All prices are negotiable. Contact us at afrisaledistributors.com | Tel: +44 7440 701994</span>
        </div>
      </div>

      {/* Floating Category Widget - Moved up to avoid footer overlap */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-20 right-8 w-14 h-14 bg-[#a32e2e] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
      >
        <LayoutGrid size={24} />
      </button>

      {/* Scroll to Top - Moved up to avoid footer overlap */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 left-8 w-12 h-12 bg-white text-[#a32e2e] border-2 border-[#a32e2e] rounded-full flex items-center justify-center shadow-xl hover:bg-[#fcecec] transition-all z-40 hidden md:flex"
      >
        <ArrowUp size={20} />
      </button>

      {/* Category Overlay Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-brand-maroon/90 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 inset-y-0 w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#a32e2e] text-white sticky top-0">
              <h2 className="font-black uppercase tracking-widest text-sm">Jump to Category</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToSection(cat)}
                  className="w-full text-left px-6 py-4 rounded-2xl hover:bg-[#fcecec] text-brand-maroon group transition-all outline-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wide text-xs">{cat}</span>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-brand-red">{groupedPrices[cat].length} Items</span>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
