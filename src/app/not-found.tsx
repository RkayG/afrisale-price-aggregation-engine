import Link from "next/link"
import { Home, Search, AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-gray flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">


        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-7xl font-black text-brand-maroon tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold text-brand-slate">Item Not Found</h2>
          <p className="text-brand-slate/60 text-sm leading-relaxed max-w-[280px] mx-auto">
            The page or inventory reference you are looking for has been moved or doesn't exist.
          </p>
        </div>
      </div>
    </div>
  )
}
