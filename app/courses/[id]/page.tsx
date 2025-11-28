'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, BookOpen, Clock, Lock, Unlock, ChevronDown, ChevronUp, Video } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ToastContainer, { ToastMessage } from '@/components/ToastContainer'
import ConfirmModal from '@/components/ConfirmModal'
import SectionModal from '@/components/SectionModal'
import LectureModal from '@/components/LectureModal'
import { getCourseDetail, CourseResponse } from '@/services/courseApi'
import { createSection, updateSection, deleteSection, getAllSections, Section } from '@/services/sectionApi'
import { createLecture, updateLecture, deleteLecture, getAllLectures, Lecture } from '@/services/lectureApi'
import VideoPlayer from '@/components/VideoPlayer'
import { User, Tag, Award, DollarSign, Globe, Calendar } from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [lectures, setLectures] = useState<{ [sectionId: string]: Lecture[] }>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'section' | 'lecture'
    id: string | null
    title: string | null
  }>({
    isOpen: false,
    type: 'section',
    id: null,
    title: null,
  })
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [allLecturesList, setAllLecturesList] = useState<Lecture[]>([])
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0)
  const [courseInfo, setCourseInfo] = useState<{
    instructor?: { id: string; name?: string; email?: string }
    category?: string
  }>({})

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration: number = 3000) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])

  const loadCourseData = async () => {
    try {
      const courseData = await getCourseDetail(courseId)
      setCourse(courseData)
      
      // Load sections from backend
      try {
        const sectionsData = await getAllSections(courseId)
        const sortedSections = sectionsData.sort((a, b) => a.order - b.order)
        setSections(sortedSections)
        
        // Load lectures for each section
        const lecturesMap: { [sectionId: string]: Lecture[] } = {}
        const allLectures: Lecture[] = []
        
        for (const section of sortedSections) {
          try {
            const lecturesData = await getAllLectures(section.id)
            const sortedLectures = lecturesData.sort((a, b) => a.order - b.order)
            lecturesMap[section.id] = sortedLectures
            allLectures.push(...sortedLectures)
          } catch (lectureError) {
            console.error(`Error loading lectures for section ${section.id}:`, lectureError)
            lecturesMap[section.id] = []
          }
        }
        
        setLectures(lecturesMap)
        setAllLecturesList(allLectures)
      } catch (sectionError) {
        console.error('Error loading sections:', sectionError)
        setSections([])
        setLectures({})
        setAllLecturesList([])
      }
      
      // Load course info (instructor, category) from backend
      try {
        const response = await fetch(`https://teskup-production.up.railway.app/api/courses/${courseId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setCourseInfo({
            instructor: data.instructor,
            category: data.category || 'General',
          })
        }
      } catch (infoError) {
        console.error('Error loading course info:', infoError)
      }
    } catch (error: any) {
      console.error('Error loading course:', error)
      showToast(`Error loading course: ${error?.message}`, 'error')
    }
  }

  const toggleSection = async (sectionId: string) => {
    const isCurrentlyExpanded = expandedSections.has(sectionId)
    
    // Eğer section açılıyorsa ve lectures yüklenmemişse, yükle
    if (!isCurrentlyExpanded && !lectures[sectionId]) {
      try {
        const lecturesData = await getAllLectures(sectionId)
        const sortedLectures = lecturesData.sort((a, b) => a.order - b.order)
        setLectures((prev) => ({
          ...prev,
          [sectionId]: sortedLectures,
        }))
        setAllLecturesList((prev) => {
          const combined = [...prev, ...sortedLectures]
          return combined.sort((a, b) => {
            // Sort by section order first, then by lecture order
            const aSection = sections.find(s => s.id === a.sectionId)
            const bSection = sections.find(s => s.id === b.sectionId)
            if (aSection && bSection) {
              if (aSection.order !== bSection.order) {
                return aSection.order - bSection.order
              }
            }
            return a.order - b.order
          })
        })
      } catch (error) {
        console.error(`Error loading lectures for section ${sectionId}:`, error)
      }
    }
    
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const handleAddSection = () => {
    setEditingSection(null)
    setIsSectionModalOpen(true)
  }

  const handleEditSection = (section: Section) => {
    setEditingSection(section)
    setIsSectionModalOpen(true)
  }

  const handleSaveSection = async (sectionData: { title: string; order: number }) => {
    try {
      if (editingSection) {
        await updateSection({
          id: editingSection.id,
          title: sectionData.title,
          order: sectionData.order,
        })
        showToast('Section updated successfully!', 'success')
        setIsSectionModalOpen(false)
        setEditingSection(null)
        await loadCourseData()
      } else {
        const newSection = await createSection({
          courseId: courseId,
          title: sectionData.title,
          order: sectionData.order,
        })
        showToast('Section created successfully!', 'success')
        
        // Yeni section'ı sections listesine ekle
        const updatedSections = [...sections, newSection].sort((a, b) => a.order - b.order)
        setSections(updatedSections)
        
        // Yeni section'ı otomatik olarak aç
        setExpandedSections((prev) => {
          const newSet = new Set(prev)
          newSet.add(newSection.id)
          return newSet
        })
        
        // Yeni section için boş lecture listesi ekle
        setLectures((prev) => ({
          ...prev,
          [newSection.id]: [],
        }))
        
        setIsSectionModalOpen(false)
        setEditingSection(null)
        
        // Verileri backend'den yeniden yükle
        await loadCourseData()
      }
    } catch (error: any) {
      console.error('Error saving section:', error)
      showToast(error?.message || 'Error saving section', 'error')
    }
  }

  const handleDeleteSection = (section: Section) => {
    setConfirmModal({
      isOpen: true,
      type: 'section',
      id: section.id,
      title: section.title,
    })
  }

  const handleDeleteConfirm = async () => {
    if (confirmModal.id) {
      try {
        if (confirmModal.type === 'section') {
          await deleteSection(confirmModal.id)
          showToast('Section deleted successfully!', 'success')
          setSections((prev) => prev.filter((s) => s.id !== confirmModal.id))
        } else {
          await deleteLecture(confirmModal.id)
          showToast('Lecture deleted successfully!', 'success')
          // Remove from lectures state
          setLectures((prev) => {
            const newLectures = { ...prev }
            Object.keys(newLectures).forEach((sectionId) => {
              newLectures[sectionId] = newLectures[sectionId].filter((l) => l.id !== confirmModal.id)
            })
            return newLectures
          })
        }
        setConfirmModal({ isOpen: false, type: 'section', id: null, title: null })
        await loadCourseData()
      } catch (error: any) {
        console.error('Error deleting:', error)
        showToast(error?.message || 'Error deleting', 'error')
      }
    }
  }

  const handleAddLecture = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    setEditingLecture(null)
    setIsLectureModalOpen(true)
  }

  const handleEditLecture = (lecture: Lecture) => {
    setSelectedSectionId(lecture.sectionId)
    setEditingLecture(lecture)
    setIsLectureModalOpen(true)
  }

  const handleSaveLecture = async (lectureData: {
    title: string
    description: string
    durationSeconds: number
    order: number
    isLocked: boolean
    translationAvailable: boolean
    videoUrl?: string
    videoFile?: File
    thumbnailFile?: File
  }) => {
    try {
      if (editingLecture) {
        await updateLecture({
          id: editingLecture.id,
          sectionId: editingLecture.sectionId,
          ...lectureData,
        })
        showToast('Lecture updated successfully!', 'success')
      } else {
        const newLecture = await createLecture({
          sectionId: selectedSectionId,
          ...lectureData,
        })
        showToast('Lecture created successfully!', 'success')
        setLectures((prev) => {
          const sectionLectures = prev[selectedSectionId] || []
          return {
            ...prev,
            [selectedSectionId]: [...sectionLectures, newLecture].sort((a, b) => a.order - b.order),
          }
        })
      }
      setIsLectureModalOpen(false)
      setEditingLecture(null)
      setSelectedSectionId('')
      await loadCourseData()
    } catch (error: any) {
      console.error('Error saving lecture:', error)
      showToast(error?.message || 'Error saving lecture', 'error')
    }
  }

  const handleDeleteLecture = (lecture: Lecture) => {
    setConfirmModal({
      isOpen: true,
      type: 'lecture',
      id: lecture.id,
      title: lecture.title,
    })
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

  const handleLectureClick = (lecture: Lecture) => {
    if (lecture.isLocked || !lecture.videoUrl) {
      showToast('This lecture is locked or has no video', 'warning')
      return
    }
    
    const index = allLecturesList.findIndex(l => l.id === lecture.id)
    setCurrentLectureIndex(index >= 0 ? index : 0)
    setSelectedLecture(lecture)
  }

  const handleNextLecture = () => {
    if (currentLectureIndex < allLecturesList.length - 1) {
      const nextLecture = allLecturesList[currentLectureIndex + 1]
      setCurrentLectureIndex(currentLectureIndex + 1)
      setSelectedLecture(nextLecture)
    }
  }

  const handlePreviousLecture = () => {
    if (currentLectureIndex > 0) {
      const prevLecture = allLecturesList[currentLectureIndex - 1]
      setCurrentLectureIndex(currentLectureIndex - 1)
      setSelectedLecture(prevLecture)
    }
  }

  const handleCloseVideo = () => {
    setSelectedLecture(null)
  }

  // Calculate total course stats
  const totalLectures = allLecturesList.length
  const openLectures = allLecturesList.filter(l => !l.isLocked).length
  const totalDuration = allLecturesList.reduce((sum, l) => sum + (l.durationSeconds || 0), 0)

  if (!course) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-600">
        <Sidebar />
        <main className="flex-1 overflow-hidden ml-64 flex items-center justify-center">
          <div className="text-white text-xl">Loading course...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-600">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden ml-64">
        <div className="h-full overflow-y-auto p-8">
          <div className="flex gap-8">
            {/* Left Column - Sections */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push('/courses')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-4xl font-bold text-white">
                      Course Content
                    </h1>
                    <p className="mt-2 text-purple-100">{course.details?.[0]?.title || 'Course'}</p>
                    {totalLectures > 0 && (
                      <p className="mt-1 text-purple-200 text-sm">
                        {openLectures} / {totalLectures} dərs açıq
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleAddSection}
                  className="group relative px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/40 hover:shadow-purple-800/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Section
                </button>
              </div>

              {/* Sections List */}
              <div className="space-y-4">
            {sections.length === 0 ? (
              <div className="bg-gradient-to-br from-white/95 via-purple-50/90 to-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100/60 p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mb-4">
                  <BookOpen className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Sections Found</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first section</p>
                <button
                  onClick={handleAddSection}
                  className="px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-800/40 transition-all duration-300"
                >
                  Add Your First Section
                </button>
              </div>
            ) : (
              sections.map((section) => {
                const sectionLectures = lectures[section.id] || []
                const isExpanded = expandedSections.has(section.id)
                const totalDuration = sectionLectures.reduce((sum, l) => sum + (l.durationSeconds || 0), 0)
                
                return (
                  <div
                    key={section.id}
                    className="bg-gradient-to-br from-white/95 via-purple-50/90 to-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100/60 overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="p-6 border-b border-purple-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-purple-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-purple-600" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">SECTION</div>
                            <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {sectionLectures.length} lessons • {formatDuration(totalDuration)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddLecture(section.id)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Lecture
                          </button>
                          <button
                            onClick={() => handleEditSection(section)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section Lectures */}
                    {isExpanded && (
                      <div className="p-6 space-y-3">
                        {sectionLectures.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No lectures in this section</p>
                            <button
                              onClick={() => handleAddLecture(section.id)}
                              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                              Add First Lecture
                            </button>
                          </div>
                        ) : (
                          sectionLectures.map((lecture) => (
                            <div
                              key={lecture.id}
                              onClick={() => handleLectureClick(lecture)}
                              className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 transition-colors cursor-pointer ${
                                lecture.isLocked || !lecture.videoUrl
                                  ? 'border-gray-200 hover:border-gray-300 opacity-60'
                                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                {lecture.isLocked ? (
                                  <Lock className="w-6 h-6 text-red-600" />
                                ) : (
                                  <Video className="w-6 h-6 text-purple-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{lecture.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{lecture.description}</div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(lecture.durationSeconds || 0)}
                                  </div>
                                  {lecture.translationAvailable && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Translation</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    lecture.isLocked
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {lecture.isLocked ? 'Locked' : 'Open'}
                                </span>
                                <button
                                  onClick={() => handleEditLecture(lecture)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLecture(lecture)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
              </div>
            </div>

            {/* Right Column - Course Info */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-gradient-to-br from-white/95 via-purple-50/90 to-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100/60 p-6 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Kurs Haqqında</h2>
                
                {/* Course Image */}
                {course.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={course.imageUrl}
                      alt={course.details?.[0]?.title || 'Course'}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Course Description */}
                {course.details && course.details.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Təsvir</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {course.details[0]?.description || course.details[0]?.title || 'No description'}
                    </p>
                  </div>
                )}

                {/* Course Stats */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Dərs Sayı</div>
                      <div className="text-lg font-semibold text-gray-900">{totalLectures}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Ümumi Müddət</div>
                      <div className="text-lg font-semibold text-gray-900">{formatDuration(totalDuration)}</div>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  {/* Category */}
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Kateqoriya</div>
                      <div className="text-base font-semibold text-gray-900">
                        {courseInfo.category || 'General'}
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Səviyyə</div>
                      <div className="text-base font-semibold text-gray-900">
                        {course.levelId || 'Beginner'}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Qiymət</div>
                      <div className="text-base font-semibold text-gray-900">
                        {course.isFree ? 'Pulsuz' : `$${course.price}`}
                      </div>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Dil</div>
                      <div className="text-base font-semibold text-gray-900">
                        {course.usedLanguageId === '423dfdaf-ad5b-4843-a009-3abc5261e1a0' ? 'Azərbaycan' :
                         course.usedLanguageId === '1e2d847f-20dd-464a-7f2e-08de2959f69f' ? 'English' :
                         course.usedLanguageId === '1c9980c5-a7df-4bd7-9ef6-34eb3f2dbcac' ? 'Русский' : 'English'}
                      </div>
                    </div>
                  </div>

                  {/* Instructor */}
                  {courseInfo.instructor && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Müəllim</div>
                        <div className="text-base font-semibold text-gray-900">
                          {courseInfo.instructor.name || courseInfo.instructor.email || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  {course.createdAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Yaradılma Tarixi</div>
                        <div className="text-base font-semibold text-gray-900">
                          {new Date(course.createdAt).toLocaleDateString('az-AZ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Section Modal */}
      {isSectionModalOpen && (
        <SectionModal
          section={editingSection}
          courseId={courseId}
          onSave={handleSaveSection}
          onClose={() => {
            setIsSectionModalOpen(false)
            setEditingSection(null)
          }}
        />
      )}

      {/* Lecture Modal */}
      {isLectureModalOpen && (
        <LectureModal
          lecture={editingLecture}
          sectionId={selectedSectionId}
          onSave={handleSaveLecture}
          onClose={() => {
            setIsLectureModalOpen(false)
            setEditingLecture(null)
            setSelectedSectionId('')
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Delete ${confirmModal.type === 'section' ? 'Section' : 'Lecture'}`}
        message={`Are you sure you want to delete "${confirmModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'section', id: null, title: null })}
        type="danger"
      />

      {/* Video Player */}
      {selectedLecture && (
        <VideoPlayer
          lecture={selectedLecture}
          allLectures={allLecturesList}
          currentIndex={currentLectureIndex}
          onClose={handleCloseVideo}
          onNext={handleNextLecture}
          onPrevious={handlePreviousLecture}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

