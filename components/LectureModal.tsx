'use client'

import { useState, useEffect } from 'react'
import { X, Save, Video, Image as ImageIcon, Clock, Lock, Unlock } from 'lucide-react'
import { Lecture } from '@/services/lectureApi'

interface LectureModalProps {
  lecture: Lecture | null
  sectionId: string
  onSave: (lecture: {
    title: string
    description: string
    durationSeconds: number
    order: number
    isLocked: boolean
    translationAvailable: boolean
    videoUrl?: string
    videoFile?: File
    thumbnailFile?: File
  }) => void
  onClose: () => void
}

export default function LectureModal({ 
  lecture, 
  sectionId,
  onSave, 
  onClose 
}: LectureModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationSeconds: 0,
    order: 0,
    isLocked: false,
    translationAvailable: false,
    videoUrl: '',
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  useEffect(() => {
    if (lecture) {
      setFormData({
        title: lecture.title || '',
        description: lecture.description || '',
        durationSeconds: lecture.durationSeconds || 0,
        order: lecture.order || 0,
        isLocked: lecture.isLocked ?? false,
        translationAvailable: lecture.translationAvailable ?? false,
        videoUrl: lecture.videoUrl || '',
      })
      setThumbnailPreview(lecture.thumbnailUrl || '')
    } else {
      setFormData({
        title: '',
        description: '',
        durationSeconds: 0,
        order: 0,
        isLocked: false,
        translationAvailable: false,
        videoUrl: '',
      })
      setThumbnailPreview('')
    }
    setVideoFile(null)
    setThumbnailFile(null)
  }, [lecture])

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
    }
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return parseInt(duration) || 0
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
    
    if (!videoFile && !formData.videoUrl) {
      alert('Please provide either a video file or video URL')
      return
    }
    
    onSave({
      title: formData.title.trim(),
      description: formData.description.trim(),
      durationSeconds: formData.durationSeconds,
      order: formData.order || 0,
      isLocked: formData.isLocked,
      translationAvailable: formData.translationAvailable,
      videoUrl: formData.videoUrl || undefined,
      videoFile: videoFile || undefined,
      thumbnailFile: thumbnailFile || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-[900px] max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">
            {lecture ? 'Edit Lecture' : 'Add New Lecture'}
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
                  placeholder="Lecture title"
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
                  placeholder="Lecture description"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (seconds) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.durationSeconds}
                  onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Current: {formatDuration(formData.durationSeconds)}
                </p>
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
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Video URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Video className="w-4 h-4 inline mr-1" />
                  Video URL
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-gray-500">OR upload video file below</p>
              </div>

              {/* Video File */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Video className="w-4 h-4 inline mr-1" />
                  Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                />
                {videoFile && (
                  <p className="mt-1 text-xs text-green-600">Selected: {videoFile.name}</p>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Thumbnail
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                />
                {thumbnailPreview && (
                  <div className="mt-3 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-32 object-cover bg-gray-50"
                      onError={() => setThumbnailPreview('')}
                    />
                  </div>
                )}
              </div>

              {/* Is Locked */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isLocked}
                    onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-2">
                    {formData.isLocked ? (
                      <Lock className="w-4 h-4 text-red-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                      Locked
                    </span>
                  </div>
                </label>
              </div>

              {/* Translation Available */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.translationAvailable}
                    onChange={(e) => setFormData({ ...formData, translationAvailable: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Translation Available
                  </span>
                </label>
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
              Save Lecture
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

