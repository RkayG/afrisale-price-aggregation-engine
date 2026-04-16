"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Save, RefreshCw, AlertTriangle, ShieldCheck, Zap } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    default_margin_type: "percentage",
    default_margin_value: 15.00,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    // We'll use the 'app_settings' table we planned to add
    // Since it's a singleton, we just get the first row
    const { data } = await supabase.from("app_settings").select("*").single()
    if (data) {
      setSettings({
        default_margin_type: data.default_margin_type,
        default_margin_value: data.default_margin_value,
      })
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from("app_settings")
      .upsert({ id: 1, ...settings })

    if (error) {
       alert("Error saving settings. Make sure 'app_settings' table exists.")
    } else {
       alert("Global settings updated!")
    }
    setSaving(false)
  }

  if (loading) return <div className="p-12 text-center animate-pulse text-brand-slate">Loading system configuration...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-brand-maroon">System Settings</h1>
        <p className="text-brand-slate/60">Configure global defaults for the aggregation engine.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pricing Defaults */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-brand-red-subtle shadow-xl shadow-brand-red/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-pink flex items-center justify-center text-brand-red">
              <Zap size={20} />
            </div>
            <h2 className="text-xl font-bold text-brand-maroon">Global Pricing Defaults</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest">Default Margin Type</label>
              <select 
                className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-bold text-brand-maroon"
                value={settings.default_margin_type}
                onChange={(e) => setSettings({...settings, default_margin_type: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest">Default Margin Value</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full px-4 py-3 bg-brand-gray border border-brand-red-subtle rounded-xl outline-none focus:border-brand-red transition-all font-black text-brand-maroon"
                value={settings.default_margin_value}
                onChange={(e) => setSettings({...settings, default_margin_value: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>

        {/* Engine Security */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-brand-red-subtle shadow-sm opacity-60 pointer-events-none">
          <div className="flex items-center gap-3 mb-4 text-brand-slate">
            <ShieldCheck size={20} />
            <h2 className="font-bold">Security & Auth (Coming Soon)</h2>
          </div>
          <p className="text-xs">Advanced RLS and API key management will be configurable here.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-4 bg-brand-red text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-maroon transition-all shadow-xl shadow-brand-red/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "Synchronizing..." : "Save Configuration"}
          </button>
        </div>
      </form>

      <div className="p-6 bg-brand-red-subtle/30 rounded-3xl border border-brand-red/10 flex gap-4">
        <AlertTriangle className="text-brand-red flex-shrink-0" size={20} />
        <p className="text-[11px] text-brand-maroon font-medium leading-relaxed">
          Warning: Changing global defaults will trigger a full environment-wide recalculation. 
          Existing per-product overrides will be preserved.
        </p>
      </div>
    </div>
  )
}
