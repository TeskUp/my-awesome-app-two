'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const colors = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-500',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const colorScheme = colors[type]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 ${colorScheme.bg} border-b-2 ${colorScheme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${colorScheme.bg} border-2 ${colorScheme.border}`}>
              <AlertTriangle className={`w-5 h-5 ${colorScheme.icon}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 ${colorScheme.button} rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
