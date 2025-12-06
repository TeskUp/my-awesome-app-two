'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, BookOpen, Clock, Lock, Unlock, ChevronDown, ChevronUp, Video, FileQuestion } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ToastContainer, { ToastMessage } from '@/components/ToastContainer'
import ConfirmModal from '@/components/ConfirmModal'
import SectionModal from '@/components/SectionModal'
import LectureModal from '@/components/LectureModal'
import QuizModal, { QuizQuestion } from '@/components/QuizModal'
import { getCourseDetail, CourseResponse } from '@/services/courseApi'
import { createSection, updateSection, deleteSection, getAllSections, Section } from '@/services/sectionApi'
import { createLecture, updateLecture, deleteLecture, getAllLectures, Lecture } from '@/services/lectureApi'
import { createQuiz, getAllQuizzes, deleteQuiz, updateQuiz, Quiz } from '@/services/quizApi'
import VideoPlayer from '@/components/VideoPlayer'
import { User, Tag, Award, DollarSign, Globe, Calendar, Download, FileText } from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [lectures, setLectures] = useState<{ [sectionId: string]: Lecture[] }>({})
  const [quizzes, setQuizzes] = useState<{ [sectionId: string]: Quiz[] }>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'section' | 'lecture' | 'quiz'
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
  const [certificates, setCertificates] = useState<any[]>([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([])

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
      loadEnrolledUsersForCertificates()
    }
  }, [courseId])

  useEffect(() => {
    if (enrolledUsers.length > 0 || course) {
      loadCertificates()
    }
  }, [enrolledUsers, course])

  const loadEnrolledUsersForCertificates = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enrolled-users`)
      if (response.ok) {
        const data = await response.json()
        // Get users with 100% progress (completed users)
        const completedUsers = (data.users || []).filter((u: any) => u.progress >= 100)
        
        // Add test users for testing
        const testUsers = [
          { id: 'test-rauf', email: 'rauf123@gmail.com', name: 'Rauf Bextiyarli', progress: 100 },
          { id: 'test-ruslan', email: 'test1@example.com', name: 'Ruslan Guluyev', progress: 100 },
          { id: 'test-elvin', email: 'test2@example.com', name: 'Elvin Mammadov', progress: 100 },
          { id: 'test-vusal', email: 'vusalguluyev153@gmail.com', name: 'Vusal', progress: 100 },
          { id: 'test-enel', email: 'yusiflienel@gmail.com', name: 'Enel Yusifli', progress: 100 },
        ]
        
        const existingEmails = new Set(completedUsers.map((u: any) => u.email))
        const newTestUsers = testUsers.filter(tu => !existingEmails.has(tu.email))
        const allUsers = [...completedUsers, ...newTestUsers]
        
        setEnrolledUsers(allUsers)
      }
    } catch (error) {
      console.error('Error loading enrolled users:', error)
      // Even if error, show test users
      const testUsers = [
        { id: 'test-rauf', email: 'rauf123@gmail.com', name: 'Rauf Bextiyarli', progress: 100 },
        { id: 'test-ruslan', email: 'test1@example.com', name: 'Ruslan Guluyev', progress: 100 },
        { id: 'test-elvin', email: 'test2@example.com', name: 'Elvin Mammadov', progress: 100 },
        { id: 'test-vusal', email: 'vusalguluyev153@gmail.com', name: 'Vusal', progress: 100 },
        { id: 'test-enel', email: 'yusiflienel@gmail.com', name: 'Enel Yusifli', progress: 100 },
      ]
      setEnrolledUsers(testUsers)
    }
  }

  const loadCertificates = async () => {
    setLoadingCertificates(true)
    try {
      const response = await fetch(`/api/certificate/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        const backendCertificates = data.certificates || []
        
        // If no backend certificates, create certificates from enrolled users (for testing)
        if (backendCertificates.length === 0 && enrolledUsers.length > 0) {
          const userCertificates = enrolledUsers.map((user: any) => ({
            id: user.id || user.email,
            certificateNumber: `CERT-${user.email.split('@')[0].toUpperCase()}`,
            issueDate: new Date().toISOString(),
            certificateUrl: null, // Will be generated on download
            courseTitle: course?.details?.[0]?.title || 'Course',
            userName: user.name || user.email.split('@')[0],
            fullName: user.name,
            email: user.email,
          }))
          setCertificates(userCertificates)
        } else {
          setCertificates(backendCertificates)
        }
      } else {
        console.error('Failed to load certificates')
        // If backend fails, create certificates from enrolled users (for testing)
        if (enrolledUsers.length > 0) {
          const userCertificates = enrolledUsers.map((user: any) => ({
            id: user.id || user.email,
            certificateNumber: `CERT-${user.email.split('@')[0].toUpperCase()}`,
            issueDate: new Date().toISOString(),
            certificateUrl: null,
            courseTitle: course?.details?.[0]?.title || 'Course',
            userName: user.name || user.email.split('@')[0],
            fullName: user.name,
            email: user.email,
          }))
          setCertificates(userCertificates)
        } else {
          setCertificates([])
        }
      }
    } catch (error) {
      console.error('Error loading certificates:', error)
      // If error, create certificates from enrolled users (for testing)
      if (enrolledUsers.length > 0) {
        const userCertificates = enrolledUsers.map((user: any) => ({
          id: user.id || user.email,
          certificateNumber: `CERT-${user.email.split('@')[0].toUpperCase()}`,
          issueDate: new Date().toISOString(),
          certificateUrl: null,
          courseTitle: course?.details?.[0]?.title || 'Course',
          userName: user.name || user.email.split('@')[0],
          fullName: user.name,
          email: user.email,
        }))
        setCertificates(userCertificates)
      } else {
        setCertificates([])
      }
    } finally {
      setLoadingCertificates(false)
    }
  }

  const handleDownloadCertificate = async (certificate: any) => {
    const certId = certificate.id || certificate.certificateId
    
    // If already downloading this certificate, return
    if (downloadingCert === certId) return
    
    setDownloadingCert(certId)
    
    try {
      // If certificate URL exists, download directly
      if (certificate.certificateUrl) {
        const link = document.createElement('a')
        link.href = certificate.certificateUrl
        link.download = `certificate-${certificate.certificateNumber || certId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // Otherwise, generate PDF from user name
      // Try to get user name from certificate data or use a default
      const userName = certificate.userName || 
                       certificate.fullName || 
                       certificate.studentName ||
                       certificate.name ||
                       (certificate.email ? certificate.email.split('@')[0] : 'İstifadəçi')
      const certCourseTitle = certificate.courseTitle || 
                              course?.details?.[0]?.title || 
                              'Course'
      
      const response = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: userName,
          courseTitle: certCourseTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
        throw new Error(errorData.error || 'Sertifikat yaradıla bilmədi')
      }

      // Get PDF blob and download
      const pdfBlob = await response.blob()
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${userName.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showToast('Sertifikat uğurla endirildi', 'success')
    } catch (error: any) {
      console.error('Error downloading certificate:', error)
      showToast(error?.message || 'Sertifikat endirilərkən xəta baş verdi', 'error')
    } finally {
      setDownloadingCert(null)
    }
  }

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
          
          try {
            const quizzesData = await getAllQuizzes(section.id)
            setQuizzes((prev) => ({
              ...prev,
              [section.id]: quizzesData,
            }))
          } catch (quizError) {
            console.error(`Error loading quizzes for section ${section.id}:`, quizError)
            setQuizzes((prev) => ({
              ...prev,
              [section.id]: [],
            }))
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
        } else if (confirmModal.type === 'lecture') {
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
        } else if (confirmModal.type === 'quiz') {
          await deleteQuiz(confirmModal.id)
          showToast('Quiz deleted successfully!', 'success')
          // Remove from quizzes state
          setQuizzes((prev) => {
            const newQuizzes = { ...prev }
            Object.keys(newQuizzes).forEach((sectionId) => {
              newQuizzes[sectionId] = newQuizzes[sectionId].filter((q) => q.id !== confirmModal.id)
            })
            return newQuizzes
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

  const handleAddQuiz = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    setEditingQuiz(null)
    setIsQuizModalOpen(true)
  }

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setSelectedSectionId(quiz.sectionId)
    setIsQuizModalOpen(true)
  }

  const handleSaveQuiz = async (quizData: { category?: string; questions: QuizQuestion[] }) => {
    try {
      if (editingQuiz) {
        // Update existing quiz
        await updateQuiz({
          id: editingQuiz.id,
          category: quizData.category,
          questions: quizData.questions,
        })
        showToast('Quiz updated successfully!', 'success')
      } else {
        // Create new quiz
        const newQuiz = await createQuiz({
          sectionId: selectedSectionId,
          category: quizData.category,
          questions: quizData.questions,
        })
        showToast('Quiz created successfully!', 'success')
        setQuizzes((prev) => {
          const sectionQuizzes = prev[selectedSectionId] || []
          return {
            ...prev,
            [selectedSectionId]: [...sectionQuizzes, newQuiz],
          }
        })
      }
      setIsQuizModalOpen(false)
      setSelectedSectionId('')
      setEditingQuiz(null)
      await loadCourseData()
    } catch (error: any) {
      console.error('Error saving quiz:', error)
      showToast(error?.message || 'Error saving quiz', 'error')
    }
  }

  const handleDeleteQuiz = (quiz: Quiz) => {
    const questionCount = quiz.questionsCount || (quiz.questions && quiz.questions.length) || 0
    setConfirmModal({
      isOpen: true,
      type: 'quiz',
      id: quiz.id,
      title: `Quiz (${questionCount} sual)`,
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
                              {sectionLectures.length} lessons • {(quizzes[section.id] || []).length} quiz • {formatDuration(totalDuration)}
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
                            onClick={() => handleAddQuiz(section.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FileQuestion className="w-4 h-4" />
                            Add Quiz
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

                    {/* Section Content (Lectures and Quizzes) */}
                    {isExpanded && (
                      <div className="p-6 space-y-3">
                        {/* Lectures */}
                        {sectionLectures.length === 0 && (quizzes[section.id] || []).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No content in this section</p>
                            <div className="flex gap-2 justify-center mt-4">
                            <button
                              onClick={() => handleAddLecture(section.id)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                              Add First Lecture
                            </button>
                              <button
                                onClick={() => handleAddQuiz(section.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                              >
                                Add First Quiz
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {sectionLectures.map((lecture) => (
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditLecture(lecture)
                                  }}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteLecture(lecture)
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Quizzes */}
                          {(quizzes[section.id] || []).map((quiz) => (
                            <div
                              key={quiz.id}
                              className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:shadow-md transition-colors"
                            >
                              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileQuestion className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">Quiz</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {quiz.questionsCount || (quiz.questions && quiz.questions.length) || 0} sual
                                </div>
                                {quiz.category && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                      {quiz.category}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  Quiz
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditQuiz(quiz)
                                  }}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteQuiz(quiz)
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          </>
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

                {/* Completed Users with Certificates */}
                {enrolledUsers.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Tamamlayan İstifadəçilər
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {enrolledUsers.map((user: any) => {
                        const userName = user.name || user.email.split('@')[0]
                        const isDownloading = downloadingCert === (user.id || user.email)
                        return (
                          <button
                            key={user.id || user.email}
                            onClick={() => {
                              // Create certificate object for download
                              const cert = {
                                id: user.id || user.email,
                                userName: userName,
                                fullName: user.name,
                                email: user.email,
                                courseTitle: course?.details?.[0]?.title || 'Course',
                              }
                              handleDownloadCertificate(cert)
                            }}
                            disabled={isDownloading}
                            className="relative group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px]"
                            title={`${userName} - Sertifikatı endir`}
                          >
                            <div className="absolute top-2 right-2">
                              {isDownloading ? (
                                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center group-hover:bg-purple-700 transition-colors shadow-md">
                                  <Download className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-3 shadow-lg">
                              <Award className="w-8 h-8 text-white" />
                            </div>
                            <p 
                              className="text-base font-bold text-gray-900 text-center px-2"
                              style={{ 
                                fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                                letterSpacing: '0.01em'
                              }}
                            >
                              {userName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 text-center truncate w-full px-2">
                              {user.email}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Certificates Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Sertifikatlar
                  </h3>
                  
                  {loadingCertificates ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Yüklənir...
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-2">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">
                        Kurs tamamlandıqda sertifikat burada görünəcək
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {certificates.map((certificate, index) => (
                        <div
                          key={certificate.id || index}
                          className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {certificate.userName || certificate.fullName || certificate.email || `Sertifikat #${index + 1}`}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  Tamamlanıb
                                  <button
                                    onClick={() => handleDownloadCertificate(certificate)}
                                    disabled={downloadingCert === (certificate.id || certificate.certificateId)}
                                    className="hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    title="Sertifikatı endir"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              </div>
                              {certificate.issueDate && (
                                <p className="text-xs text-gray-600">
                                  {new Date(certificate.issueDate).toLocaleDateString('az-AZ', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                              {certificate.courseTitle && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {certificate.courseTitle}
                                </p>
                              )}
                              {certificate.email && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {certificate.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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

      {/* Quiz Modal */}
      {isQuizModalOpen && selectedSectionId && (
        <QuizModal
          isOpen={isQuizModalOpen}
          sectionId={selectedSectionId}
          sectionTitle={sections.find(s => s.id === selectedSectionId)?.title || 'Section'}
          quiz={editingQuiz}
          onSave={handleSaveQuiz}
          onClose={() => {
            setIsQuizModalOpen(false)
            setSelectedSectionId('')
            setEditingQuiz(null)
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Delete ${confirmModal.type === 'section' ? 'Section' : confirmModal.type === 'lecture' ? 'Lecture' : 'Quiz'}`}
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

