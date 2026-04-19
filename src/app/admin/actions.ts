"use server"

import { createClient } from "@/lib/supabase-server"

export async function getAdminMatrix() {
  const supabase = await createClient()
  
  // 1. Fetch Suppliers
  const { data: suppliers } = await supabase.from("suppliers").select("id, name")
  
  // 2. Fetch Products with joined data
  const { data: products, error } = await supabase
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

  if (error) throw error

  return {
    products: products || [],
    suppliers: suppliers || []
  }
}

// Categories Actions
export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").select("*").order("name")
  if (error) throw error
  return data || []
}

export async function upsertCategory(payload: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").upsert(payload, { onConflict: 'id' }).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) throw error
  return { success: true }
}

export async function upsertProduct(productPayload: any, configPayload: any) {
  const supabase = await createClient()
  
  // 1. Upsert Product
  const { data: product, error: pError } = await supabase
    .from("products")
    .upsert(productPayload, { onConflict: 'id' })
    .select()
    .single()
  
  if (pError) throw pError

  // 2. Upsert Pricing Config
  const { error: cError } = await supabase
    .from("pricing_config")
    .upsert({
      ...configPayload,
      product_id: product.id
    }, { onConflict: 'product_id' })

  if (cError) throw cError

  return product
}

export async function getProductsData() {
  const supabase = await createClient()
  
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from("products").select(`*, pricing_config(*), categories(name)`).order("ref_no"),
    supabase.from("categories").select("*").order("name")
  ])

  if (productsRes.error) throw productsRes.error
  if (categoriesRes.error) throw categoriesRes.error

  return {
    products: productsRes.data || [],
    categories: categoriesRes.data || []
  }
}

export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("suppliers").select("*").order("name")
  if (error) throw error
  return data || []
}

export async function addSupplier(payload: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("suppliers").insert([payload]).select().single()
  if (error) throw error
  return data
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("suppliers").delete().eq("id", id)
  if (error) throw error
  return { success: true }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("products").delete().eq("id", productId)
  if (error) throw error
  return { success: true }
}
