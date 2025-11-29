'use client'

import { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Calendar, User, Clock, Tag, Save } from 'lucide-react'
import { NewsItem } from '@/app/page'

interface NewsModalProps {
  news: NewsItem | null
  categories?: string[]
  onSave: (news: NewsItem, imageFile?: File | string) => void
  onClose: () => void
}

export default function NewsModal({
  news,
  // Fallback siyahı: psychology / programming / proqramlasdirma
  categories = ['psychology', 'programming', 'proqramlasdirma'],
  onSave,
  onClose,
}: NewsModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    image: '',
    tags: '',
    author: 'Teskup Team',
    readTime: '5',
  })
  const [imagePreview, setImagePreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (news) {
      console.log('NewsModal: Setting form data from news:', news)
      console.log('  - Title:', news.title)
      console.log('  - Description:', news.description)
      console.log('  - Category:', news.category)
      
      setFormData({
        title: news.title || '',
        description: news.description || '',
        category: news.category?.trim() || 'News', // Default to 'News' if empty
        image: news.image || '',
        tags: news.tags?.join(', ') || '',
        author: news.author || 'Teskup Team',
        readTime: news.readTime?.toString() || '5',
      })
      setImagePreview(news.image || '')
      setImageFile(null)
      
      console.log('NewsModal: Form data set:', {
        title: news.title || '',
        description: news.description || '',
        category: news.category?.trim() || 'News',
      })
    } else {
      // Yeni xəbər üçün default kateqoriya: siyahının ilk elementi (psychology)
      const defaultCategory = categories[0] || 'psychology'
      setFormData({
        title: '',
        description: '',
        category: defaultCategory,
        image: '',
        tags: '',
        author: 'Teskup Team',
        readTime: '5',
      })
      setImagePreview('')
      setImageFile(null)
    }
  }, [news])

  const handleImageChange = (url: string) => {
    setFormData({ ...formData, image: url })
    setImagePreview(url)
    setImageFile(null) // Clear file when URL is used
  }

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setFormData({ ...formData, image: result })
        setImagePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title || formData.title.trim() === '') {
      alert('Please enter a title')
      return
    }
    
    if (!formData.description || formData.description.trim() === '') {
      alert('Please enter a description')
      return
    }
    
    // Ensure category is set, default to ilk kateqoriya (məs: psychology) əgər boşdursa
    const categoryToUse = formData.category?.trim() || categories[0] || ''
    
    // Update formData with normalized category
    if (!formData.category || formData.category.trim() === '') {
      setFormData({ ...formData, category: categories[0] || 'psychology' })
    }
    
    // Validate that image is provided
    if (!formData.image) {
      alert('Please upload an image or enter an image URL')
      return
    }

    console.log('NewsModal: Submitting form data:', {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: categoryToUse,
      author: formData.author.trim(),
      tags: formData.tags,
      readTime: formData.readTime,
    })
    
    const newsItem: NewsItem = {
      id: news?.id || Date.now().toString(),
      title: formData.title.trim(), // Trim title
      description: formData.description.trim(), // Trim description
      category: categoryToUse, // Use normalized category
      image: formData.image,
      tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      author: formData.author.trim() || 'Teskup Team',
      readTime: parseInt(formData.readTime) || 5,
      createdAt: news?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: news?.views || 0,
      comments: news?.comments || 0,
    }
    
    console.log('=== NewsModal: Created newsItem ===')
    console.log('Title:', newsItem.title)
    console.log('Description:', newsItem.description)
    console.log('Category:', newsItem.category)
    console.log('Author:', newsItem.author)
    console.log('Tags:', newsItem.tags)
    console.log('===================================')
    // Pass image file if available, otherwise pass image URL/base64 string
    const imageData = imageFile || formData.image
    onSave(newsItem, imageData)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-[1000px] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-8 py-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {news ? 'Edit News Article' : 'Add New News Article'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - No scroll, all content visible */}
        <form onSubmit={handleSubmit} className="p-8 overflow-visible">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
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
                  placeholder="Enter news title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all resize-none"
                  placeholder="Enter news description"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category || categories[0] || ''}
                  onChange={(e) => {
                    const selectedCategory = e.target.value || 'News'
                    console.log('Category selected:', selectedCategory)
                    setFormData({ ...formData, category: selectedCategory })
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                >
                      {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                      ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                  placeholder="#react, #javascript, #frontend"
                />
              </div>
            </div>

                         {/* Right Column */}
             <div className="space-y-5">
               {/* Image Upload */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   <ImageIcon className="w-4 h-4 inline mr-1" />
                   Image *
                 </label>
                 
                 {/* File Upload */}
                 <div className="mb-3">
                   <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isDragging
                        ? 'border-purple-500 bg-purple-100/70'
                        : 'border-purple-200 bg-purple-50/60 hover:bg-purple-100/60'
                     }`}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                   >
                     <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className={`w-10 h-10 mb-2 ${isDragging ? 'text-purple-600' : 'text-purple-400'}`} />
                       <p className="mb-2 text-sm text-gray-500">
                         <span className="font-semibold">Click to upload</span> or drag and drop
                       </p>
                       <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                     </div>
                     <input
                       type="file"
                       className="hidden"
                       accept="image/*"
                       onChange={handleFileInputChange}
                     />
                   </label>
                 </div>

                 {/* Or Divider */}
                 <div className="relative mb-3">
                   <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-gray-300"></div>
                   </div>
                   <div className="relative flex justify-center text-sm">
                     <span className="px-2 bg-white text-gray-500">OR</span>
                   </div>
                 </div>

                 {/* URL Input */}
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleImageChange(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                   placeholder="Enter image URL"
                 />
                 
                 {/* Image Preview */}
                 {imagePreview && (
                   <div className="mt-3 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                     <img
                       src={imagePreview}
                       alt="Preview"
                       className="w-full h-24 object-contain bg-gray-50"
                       onError={() => setImagePreview('')}
                     />
                   </div>
                 )}
               </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Author
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                  placeholder="Teskup Team"
                />
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Read Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                  placeholder="5"
                />
              </div>
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
              Save News
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
