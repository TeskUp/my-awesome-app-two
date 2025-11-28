'use client'

import { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Save, DollarSign, BookOpen, Users, Globe } from 'lucide-react'
import { CourseItem } from '@/app/courses/page'
import { LEVEL_OPTIONS, getDefaultLanguageId, getLanguageId, TEST_IDS } from '@/services/courseApi'

interface CourseModalProps {
  course: CourseItem | null
  categories?: Array<{ id: string; name: string }>
  teachers?: Array<{ id: string; name: string }>
  onSave: (course: CourseItem, imageFile?: File | string) => void
  onClose: () => void
}

export default function CourseModal({ 
  course, 
  categories = [], 
  teachers = [],
  onSave, 
  onClose 
}: CourseModalProps) {
  // Default IDs - using provided IDs
  const DEFAULT_CATEGORY_ID = TEST_IDS.CATEGORY_ID_PROGRAMMING || '19ba8521-54d8-4f01-8935-6bac2e73011d' // programming (default)
  const DEFAULT_TEACHER_ID = TEST_IDS.TEACHER_ID || 'eb5342da-b48b-4085-73cf-08de2dbbd0d8' // ahmet yilmaz (default)
  const DEFAULT_LANGUAGE_ID = TEST_IDS.USED_LANGUAGE_ID_ENGLISH || 'b2c3d4e5-2345-6789-abcd-ef0123456789' // Provided language ID

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isFree: false,
    price: '0',
    categoryId: '',
    levelId: 'Beginner',
    teacherIds: [] as string[],
    usedLanguageId: DEFAULT_LANGUAGE_ID,
    durationMinutes: '',
    rating: '5',
  })
  const [imagePreview, setImagePreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (course) {
      // Get English detail if available
      const englishDetail = course.details?.find(d => 
        d.languageId === 'English' || 
        d.languageId === DEFAULT_LANGUAGE_ID ||
        d.languageId === getDefaultLanguageId() ||
        d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789'
      ) || course.details?.[0]
      
      // Get title and description - prioritize details, then course object, but exclude "Untitled" and "No Title"
      // Backend-dən gələn title və description birbaşa istifadə olunur
      const titleFromDetail = englishDetail?.title && englishDetail.title !== 'Untitled' && englishDetail.title !== 'No Title'
        ? englishDetail.title
        : ''
      const titleFromCourse = course.title && course.title.trim() !== '' && course.title !== 'Untitled' && course.title !== 'No Title'
        ? course.title.trim()
        : ''
      const finalTitle = titleFromDetail || titleFromCourse || ''
      
      const descFromDetail = englishDetail?.description && englishDetail.description !== 'No Description'
        ? englishDetail.description
        : ''
      const descFromCourse = course.description && course.description.trim() !== '' && course.description !== 'No Description'
        ? course.description.trim()
        : ''
      const finalDescription = descFromDetail || descFromCourse || ''
      
      console.log('CourseModal - Setting form data:')
      console.log('  course.title:', course.title)
      console.log('  titleFromDetail:', titleFromDetail)
      console.log('  titleFromCourse:', titleFromCourse)
      console.log('  finalTitle:', finalTitle)
      console.log('  course.description:', course.description)
      console.log('  descFromDetail:', descFromDetail)
      console.log('  descFromCourse:', descFromCourse)
      console.log('  finalDescription:', finalDescription)
      
      setFormData({
        title: finalTitle,
        description: finalDescription,
        isFree: course.isFree ?? false,
        price: course.price?.toString() || '0',
        categoryId: course.categoryId || '',
        levelId: course.levelId || 'Beginner',
        teacherIds: course.teacherIds || [],
        usedLanguageId: course.usedLanguageId || DEFAULT_LANGUAGE_ID,
        durationMinutes: (course as any).durationMinutes?.toString?.() || (course as any).durationHours ? Math.round((course as any).durationHours * 60).toString() : '',
        rating: (course as any).rating?.toString?.() || '5',
      })
      setImagePreview(course.imageUrl || '')
      setImageFile(null)
    } else {
      // For new course, use Swagger-compatible defaults
      setFormData({
        title: '',
        description: '',
        isFree: true, // Default to free course (matches Swagger example)
        price: '0',
        categoryId: categories.length > 0 ? categories[0].id : DEFAULT_CATEGORY_ID,
        levelId: 'Beginner',
        teacherIds: teachers.length > 0 ? [teachers[0].id] : [], // Default to first teacher
        usedLanguageId: DEFAULT_LANGUAGE_ID,
        durationMinutes: '',
        rating: '5', // Default rating (matches Swagger example)
      })
      setImagePreview('')
      setImageFile(null)
    }
  }, [course, categories])

  const handleImageChange = (url: string) => {
    setFormData({ ...formData })
    setImagePreview(url)
    setImageFile(null)
  }

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
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

  const handleTeacherToggle = (teacherId: string) => {
    setFormData({
      ...formData,
      teacherIds: formData.teacherIds.includes(teacherId)
        ? formData.teacherIds.filter(id => id !== teacherId)
        : [...formData.teacherIds, teacherId]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || formData.title.trim() === '') {
      alert('Please enter a title')
      return
    }
    
    if (!formData.description || formData.description.trim() === '') {
      alert('Please enter a description')
      return
    }
    
    if (!formData.categoryId) {
      alert('Please select a category')
      return
    }
    
    // Validate category ID is a valid UUID (not placeholder ID like '1', '2')
    if (!formData.categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      alert('Invalid category ID. Please select a valid category.')
      return
    }
    
    // Validate teacher IDs are valid UUIDs
    if (!formData.teacherIds || formData.teacherIds.length === 0) {
      alert('Please select at least one teacher')
      return
    }
    
    // Validate all teacher IDs are valid UUIDs (not placeholder IDs like '1', '2')
    const invalidTeacherIds = formData.teacherIds.filter(id => !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
    if (invalidTeacherIds.length > 0) {
      alert(`Invalid teacher IDs: ${invalidTeacherIds.join(', ')}. Please select valid teachers.`)
      return
    }

    // Create Details array with English detail
    // Backend expects languageId as UUID, not language name
    const details = [{
      title: formData.title.trim(),
      description: formData.description.trim(),
      languageId: DEFAULT_LANGUAGE_ID // Use UUID instead of 'English'
    }]

    const courseItem: CourseItem = {
      id: course?.id || '',
      title: formData.title.trim(),
      description: formData.description.trim(),
      driveLink: '', // Not in Swagger - removed from form
      isFree: formData.isFree,
      price: parseFloat(formData.price) || 0,
      imageUrl: imagePreview || '',
      usedLanguageId: formData.usedLanguageId,
      categoryId: formData.categoryId,
      levelId: formData.levelId,
      teacherIds: formData.teacherIds,
      details: details,
      createdAt: course?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      durationMinutes: formData.durationMinutes ? Math.round(parseFloat(formData.durationMinutes) || 0) : undefined,
      rating: formData.rating ? parseFloat(formData.rating) || 0 : undefined,
    }
    
    const imageData = imageFile || (imagePreview && !imagePreview.startsWith('data:') ? imagePreview : undefined)
    onSave(courseItem, imageData)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-[1000px] max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">
            {course ? 'Edit Course' : 'Add New Course'}
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
                  placeholder="Course title"
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
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all resize-none"
                  placeholder="Course description"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  required
                  value={formData.levelId}
                  onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                >
                  {LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teachers */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Teachers *
                </label>
                <div className="max-h-32 overflow-y-auto border-2 border-gray-200 rounded-xl p-2">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-gray-500">No teachers found</p>
                  ) : (
                    teachers.map((teacher) => (
                      <label key={teacher.id} className="flex items-center gap-2 p-2 hover:bg-purple-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.teacherIds.includes(teacher.id)}
                          onChange={() => handleTeacherToggle(teacher.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{teacher.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Language *
                </label>
                <select
                  required
                  value={formData.usedLanguageId}
                  onChange={(e) => setFormData({ ...formData, usedLanguageId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                >
                  <option value="b2c3d4e5-2345-6789-abcd-ef0123456789">English</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Image
                </label>
                
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
                      <p className="text-xs text-gray-500">PNG, JPG, GIF max 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileInputChange}
                    />
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-3 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-contain bg-gray-50"
                      onError={() => setImagePreview('')}
                    />
                  </div>
                )}
              </div>

              {/* Is Free */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isFree: e.target.checked,
                        price: e.target.checked ? '0' : formData.price,
                      })
                    }
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Free Course</span>
                </label>
              </div>

              {/* Price */}
              {!formData.isFree && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={!formData.isFree}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                    placeholder="0"
                  />
                </div>
              )}

              {/* Backend sahələrinə uyğun əlavə kurs məlumatları */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Course Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all text-sm"
                    placeholder="350"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all text-sm"
                    placeholder="4.9"
                  />
                </div>
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

