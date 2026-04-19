"use server"

import { createClient } from "@/lib/supabase-server"

export async function getPublicPrices() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      ref_no,
      name,
      category,
      description,
      final_prices:final_prices!product_id (
        final_price,
        updated_at
      )
    `)
    .order("name", { ascending: true })

  if (error) throw error
  return data || []
}
