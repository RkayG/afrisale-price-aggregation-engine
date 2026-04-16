"use client"

import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase"
import { ArrowLeft, Save, TrendingDown, DollarSign, Percent, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ProductPricingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [product, setProduct] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [supplierPrices, setSupplierPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProductDetails()
  }, [id])

  async function fetchProductDetails() {
    setLoading(true)
    
    // 1. Fetch Product and its Config
    const { data: pData } = await supabase
      .from("products")
      .select("*, pricing_config(*)")
      .eq("id", id)
      .single()
    
    // 2. Fetch All Supplier Prices for this product
    const { data: sData } = await supabase
      .from("supplier_prices")
      .select("*, suppliers(name)")
      .eq("product_id", id)

    setProduct(pData)
    setConfig(pData.pricing_config || { margin_type: 'percentage', margin_value: 15.00, override_price: null })
    setSupplierPrices(sData || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from("pricing_config")
      .upsert({
        product_id: id,
        ...config,
        updated_at: new Date().toISOString()
      })

    if (!error) {
      alert("Pricing configuration updated!")
      fetchProductDetails() // Refresh to see trigger results
    }
    setSaving(false)
  }

  if (loading) return <div className="p-12 text-center animate-pulse text-brand-slate">Loading product logic...</div>

  const lowestPrice = supplierPrices.length > 0 
    ? Math.min(...supplierPrices.map(sp => Number(sp.price))) 
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-brand-slate hover:text-brand-red transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Inventory
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xs font-black text-brand-red bg-brand-pink px-3 py-1 rounded-full">{product.ref_no}</span>
            <h1 className="text-3xl font-black text-brand-maroon">{product.name}</h1>
          </div>
          <p className="text-brand-slate/60 text-sm max-w-xl">{product.description || "No description provided."}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Pricing Config Form */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-brand-red-subtle shadow-xl shadow-brand-red/5">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-2xl bg-brand-red-subtle flex items-center justify-center text-brand-red">
               <TrendingDown size={20} />
             </div>
             <h2 className="text-xl font-bold text-brand-maroon">Pricing Control</h2>
           </div>

           <form onSubmit={handleSave} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em]">Margin Strategy</label>
                <div className="grid grid-cols-2 gap-2 bg-brand-gray p-1 rounded-2xl">
                   <button 
                    type="button"
                    onClick={() => setConfig({...config, margin_type: 'percentage'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${config.margin_type === 'percentage' ? 'bg-white shadow-md text-brand-red' : 'text-brand-slate/50 hover:text-brand-slate'}`}
                   >
                     <Percent size={16} /> Percentage
                   </button>
                   <button 
                    type="button"
                    onClick={() => setConfig({...config, margin_type: 'fixed'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${config.margin_type === 'fixed' ? 'bg-white shadow-md text-brand-red' : 'text-brand-slate/50 hover:text-brand-slate'}`}
                   >
                     <DollarSign size={16} /> Fixed Amount
                   </button>
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em]">Margin Value</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-6 pr-12 py-4 bg-brand-gray border border-transparent focus:border-brand-red/20 focus:bg-white rounded-2xl outline-none font-black text-brand-maroon text-lg transition-all"
                        value={config.margin_value}
                        onChange={(e) => setConfig({...config, margin_value: e.target.value})}
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-brand-slate/30">
                        {config.margin_type === 'percentage' ? '%' : '$'}
                      </div>
                   </div>
                </div>

                <div className="relative py-4">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-red-subtle"></div></div>
                   <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] font-black text-brand-slate/30 uppercase tracking-[0.2em]">OR</span></div>
                </div>

                <div className="space-y-2 group">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em]">Manual Override Price</label>
                     {config.override_price && <button type="button" onClick={() => setConfig({...config, override_price: null})} className="text-[8px] font-black text-brand-red">CLEAR</button>}
                   </div>
                   <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="Ignored unless set"
                        className="w-full pl-10 pr-6 py-4 bg-brand-pink/20 border border-brand-red/10 focus:border-brand-red/50 rounded-2xl outline-none font-black text-brand-red text-lg transition-all"
                        value={config.override_price || ""}
                        onChange={(e) => setConfig({...config, override_price: e.target.value})}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/30" size={18} />
                   </div>
                   <p className="text-[9px] text-brand-red/60 italic font-medium">Entering an override will ignore both the lowest supplier price and the margin calculation.</p>
                </div>
             </div>

             <button 
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-brand-red text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-maroon transition-all shadow-xl shadow-brand-red/20 active:scale-95 disabled:opacity-50"
             >
               {saving ? "Updating pricing engine..." : "Save Pricing Logic"}
             </button>
           </form>
        </section>

        {/* Right Col: Cost Breakdown */}
        <div className="space-y-6">
           <section className="bg-brand-maroon p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
             <p className="text-[10px] font-black text-brand-red-subtle/50 uppercase tracking-widest mb-4">Calculated Benchmark</p>
             <div className="space-y-1">
                <p className="text-xs text-brand-red-subtle font-medium">Current Lowest Supplier Cost</p>
                <h3 className="text-4xl font-black">${lowestPrice.toFixed(2)}</h3>
             </div>
           </section>

           <section className="bg-white p-8 rounded-[2.5rem] border border-brand-red-subtle shadow-md">
             <h3 className="text-xs font-black text-brand-slate uppercase tracking-widest mb-6">Supplier Submissions</h3>
             <div className="space-y-4">
               {supplierPrices.length === 0 ? (
                 <div className="bg-brand-gray p-4 rounded-xl border border-dashed border-brand-red-subtle text-center text-[10px] font-bold text-brand-slate/40">
                   Waiting for supplier submissions...
                 </div>
               ) : (
                 supplierPrices.map((sp) => (
                   <div key={sp.id} className="flex justify-between items-center p-4 bg-brand-gray rounded-2xl border border-transparent hover:border-brand-red/10 transition-all">
                     <span className="text-sm font-bold text-brand-maroon">{sp.suppliers.name}</span>
                     <span className="text-sm font-black text-brand-slate">${Number(sp.price).toFixed(2)}</span>
                   </div>
                 ))
               )}
             </div>
           </section>

           <div className="p-6 bg-brand-red-subtle/30 rounded-3xl border border-brand-red/10 flex gap-4">
              <AlertCircle className="text-brand-red flex-shrink-0" size={20} />
              <p className="text-[10px] text-brand-maroon font-medium leading-relaxed">
                Changes saved here will trigger a background job in Supabase to recalculate the final price across all buyer-facing portals instantly.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
