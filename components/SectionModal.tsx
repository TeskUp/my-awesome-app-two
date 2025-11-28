'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Section } from '@/services/sectionApi'

interface SectionModalProps {
  section: Section | null
  courseId: string
  onSave: (section: { title: string; order: number }) => void
  onClose: () => void
}

export default function SectionModal({ 
  section, 
  courseId,
  onSave, 
  onClose 
}: SectionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    order: 0,
  })

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || '',
        order: section.order || 0,
      })
    } else {
      setFormData({
        title: '',
        order: 0,
      })
    }
  }, [section])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || formData.title.trim() === '') {
      alert('Please enter a title')
      return
    }
    
    onSave({
      title: formData.title.trim(),
      order: formData.order || 0,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">
            {section ? 'Edit Section' : 'Add New Section'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                placeholder="Section title (e.g., Week 1 - Basics)"
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">Order determines the display sequence (lower numbers appear first)</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-5 border-t border-purple-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/30 hover:shadow-purple-800/40 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Section
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

