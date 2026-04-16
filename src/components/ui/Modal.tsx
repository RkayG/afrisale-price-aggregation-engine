"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-maroon/20 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div 
        ref={modalRef}
        className={cn(
          "relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-brand-red-subtle animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden",
          className
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-brand-red-subtle bg-brand-gray/30">
          <h2 className="text-xl font-bold text-brand-maroon">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-brand-slate hover:bg-brand-red-subtle hover:text-brand-red rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
