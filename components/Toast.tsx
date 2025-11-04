'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
    error: <XCircle className="w-6 h-6 text-red-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
    warning: <AlertCircle className="w-6 h-6 text-orange-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-orange-50 border-orange-200',
  }

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-orange-800',
  }

  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border-2 ${bgColors[type]} ${textColors[type]} min-w-[320px] max-w-md animate-slide-in z-[10000] backdrop-blur-sm`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 font-medium text-sm">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-white/50 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
