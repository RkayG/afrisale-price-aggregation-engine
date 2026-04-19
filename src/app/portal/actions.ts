"use server"

import { createClient } from "@/lib/supabase-server"

export async function verifySupplier(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("access_token", token)
    .single()

  if (error || !data) {
    throw new Error("Invalid or expired access link.")
  }
  return data
}

export async function getPortalData(supplierId: string) {
  const supabase = await createClient()

  const [categoriesRes, productsRes, pricesRes] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("id, ref_no, name, description, category_id").order("ref_no"),
    supabase.from("supplier_prices").select("product_id, price").eq("supplier_id", supplierId)
  ])

  const initialPrices: Record<string, string> = {}
  pricesRes.data?.forEach(row => {
    initialPrices[row.product_id] = row.price.toString()
  })

  return {
    categories: categoriesRes.data || [],
    products: productsRes.data || [],
    initialPrices
  }
}

export async function upsertSupplierPrice(supplierId: string, productId: string, price: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("supplier_prices")
    .upsert({
      supplier_id: supplierId,
      product_id: productId,
      price: price,
      updated_at: new Date().toISOString()
    }, { onConflict: "supplier_id,product_id" })

  if (error) throw error
  return { success: true }
}
