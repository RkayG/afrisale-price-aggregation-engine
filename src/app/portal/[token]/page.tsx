"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { Package, CheckCircle2, Save, Loader2, AlertCircle } from "lucide-react"

export default function SupplierPortal({ params }: { params: { token: string } }) {
  const [supplier, setSupplier] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // 1. Verify Supplier Token
    const { data: sData, error: sError } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("access_token", params.token)
      .single()

    if (sError || !sData) {
      setError("Invalid or expired access link.")
      setLoading(false)
      return
    }
    setSupplier(sData)

    // 2. Fetch Products and existing prices for this supplier
    const { data: pData } = await supabase
      .from("products")
      .select(`
        id, 
        ref_no, 
        name, 
        description,
        supplier_prices(price)
      `)
      .order("ref_no")
    
    // Explicitly filter for this supplier's prices manually if needed, 
    // but better to do it in the select with a filter if Supabase supports it well on join
    const formattedData = pData?.map(p => {
       // Filter supplier_prices for the current supplier
       const sp = (p as any).supplier_prices?.find((sp: any) => true) // In our schema we'll only fetch the relevant ones if we add a where to the select
       return { ...p, price: sp?.price }
    }) || []

    const initialPrices: Record<string, string> = {}
    pData?.forEach(p => {
       // We need to fetch specific prices for this supplier. 
       // Updating the query logic below
    })

    // Re-fetching specifically for clarity
    const { data: priceData } = await supabase
        .from("supplier_prices")
        .select("product_id, price")
        .eq("supplier_id", sData.id)
    
    priceData?.forEach(row => {
        initialPrices[row.product_id] = row.price.toString()
    })

    setProducts(pData || [])
    setPrices(initialPrices)
    setLoading(false)
  }, [params.token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function updatePrice(productId: string, price: string) {
    if (!supplier) return
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return

    setSaving(productId)
    
    const { error } = await supabase
      .from("supplier_prices")
      .upsert({
        supplier_id: supplier.id,
        product_id: productId,
        price: numPrice,
        updated_at: new Date().toISOString()
      }, { onConflict: "supplier_id,product_id" })

    if (!error) {
      setPrices(prev => ({ ...prev, [productId]: price }))
      setTimeout(() => setSaving(null), 1000)
    } else {
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
        <div className="bg-brand-maroon text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <Package size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Supplier Portal</span>
          </div>
          <h1 className="text-3xl font-black mb-1">Welcome, {supplier?.name}</h1>
          <p className="text-brand-red-subtle/80 text-sm">Please update your current product pricing below.</p>
        </div>
      </header>

      {/* Product List */}
      <main className="max-w-3xl mx-auto space-y-4">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="bg-white p-6 rounded-3xl border border-brand-red-subtle shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-brand-red bg-brand-pink px-2 py-0.5 rounded uppercase">{product.ref_no}</span>
                  <h3 className="font-bold text-brand-maroon">{product.name}</h3>
                </div>
                <p className="text-xs text-brand-slate/60 line-clamp-2">{product.description}</p>
              </div>

              <div className="w-full sm:w-48 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/40 text-sm font-bold">$</div>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-10 pr-12 py-3 bg-brand-gray border border-transparent focus:border-brand-red/30 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-brand-maroon"
                  value={prices[product.id] || ""}
                  onChange={(e) => setPrices({ ...prices, [product.id]: e.target.value })}
                  onBlur={(e) => updatePrice(product.id, e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {saving === product.id ? (
                    <Loader2 className="w-5 h-5 text-brand-red animate-spin" />
                  ) : prices[product.id] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in" />
                  ) : (
                    <Save className="w-5 h-5 text-brand-slate/20" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-brand-red-subtle">
            <p className="text-brand-slate/60 font-medium">No products assigned yet.</p>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto mt-12 text-center">
         <p className="text-xs text-brand-slate/40 flex items-center justify-center gap-2">
           <CheckCircle2 size={14} className="text-brand-red" />
           Prices are automatically synchronized with the Afrisale master list.
         </p>
      </footer>
    </div>
  )
}
