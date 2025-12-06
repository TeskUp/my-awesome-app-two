'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, BookOpen, Users, DollarSign, GraduationCap, Award } from 'lucide-react'
import CourseModal from '@/components/CourseModal'
import CertificateModal, { EnrolledUser } from '@/components/CertificateModal'
import Sidebar from '@/components/Sidebar'
import ToastContainer, { ToastMessage } from '@/components/ToastContainer'
import ConfirmModal from '@/components/ConfirmModal'
import { getAllCourses, getCourseDetail, createCourse, updateCourse, deleteCourse, addCourseDetail, updateCourseDetail, CourseResponse, CourseDetail, LEVEL_OPTIONS, getDefaultLanguageId } from '@/services/courseApi'

export interface CourseItem {
  id: string
  title: string
  description: string
  driveLink: string
  isFree: boolean
  price: number
  imageUrl: string
  usedLanguageId: string
  categoryId: string
  levelId: string
  teacherIds: string[]
  details: CourseDetail[]
  createdAt: string
  updatedAt: string
  categoryName?: string
  teacherNames?: string[]
  // Extra fields for UI card design (optional, frontend only for now)
  durationMinutes?: number // Backend expects DurationMinutes (integer)
  rating?: number
  category?: string // Category name (string) from backend - e.g., "General", "psychology", "programming"
  studentsCount?: number
  modulesCount?: number
  progressPercent?: number
}

export default function CoursesPage() {
  const router = useRouter()
  const [coursesData, setCoursesData] = useState<CourseItem[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    courseId: string | null
    courseTitle: string | null
  }>({
    isOpen: false,
    courseId: null,
    courseTitle: null,
  })
  const [certificateModal, setCertificateModal] = useState<{
    isOpen: boolean
    courseId: string | null
    courseTitle: string | null
  }>({
    isOpen: false,
    courseId: null,
    courseTitle: null,
  })

  // Calculate statistics
  const totalCourses = coursesData.length
  const freeCourses = coursesData.filter(c => c.isFree).length
  const paidCourses = coursesData.filter(c => !c.isFree).length
  const totalRevenue = coursesData.filter(c => !c.isFree).reduce((sum, c) => sum + (c.price || 0), 0)

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration?: number) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Load categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/getAll?language=Azerbaijani')
        if (response.ok) {
          const data = await response.json()
          const categoriesList = data.categories || []
          setCategories(categoriesList)
          console.log('Loaded categories:', categoriesList)
        } else {
          const errorData = await response.json()
          console.error('Failed to load categories:', errorData.error)
          showToast('Kateqoriyalar yüklənə bilmədi', 'error')
        }
      } catch (error: any) {
        console.error('Error loading categories:', error)
        showToast('Kateqoriyalar yüklənərkən xəta baş verdi', 'error')
      }
    }
    fetchCategories()
  }, [])

  // Load teachers from backend
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers/getAll')
        if (response.ok) {
          const data = await response.json()
          const teachersList = data.teachers || []
          setTeachers(teachersList)
          console.log('Loaded teachers:', teachersList)
        } else {
          const errorData = await response.json()
          console.error('Failed to load teachers:', errorData.error)
          showToast('Müəllimlər yüklənə bilmədi', 'error')
        }
      } catch (error: any) {
        console.error('Error loading teachers:', error)
        showToast('Müəllimlər yüklənərkən xəta baş verdi', 'error')
      }
    }
    fetchTeachers()
  }, [])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getAllCourses()
        console.log('Fetched courses:', response)
        
        // If response is empty array, that's OK - just means no courses yet
        if (!Array.isArray(response)) {
          console.warn('Response is not an array:', response)
          setCoursesData([])
          setFilteredCourses([])
          return
        }
        
        // Map API response to CourseItem format
        const mappedCourses: CourseItem[] = response.map((item: CourseResponse) => {
          // Get English detail if available, otherwise use direct title/description from backend
          const englishDetail = item.details?.find((d: CourseDetail) => 
            d.languageId === 'English' || 
            d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789' ||
            d.languageId === getDefaultLanguageId() ||
            d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
          ) || item.details?.[0]
          
          return {
            id: item.id || '',
            title: englishDetail?.title || ((item as any).title && (item as any).title !== 'Untitled' && (item as any).title !== 'No Title' ? (item as any).title : '') || '',
            description: englishDetail?.description || ((item as any).description && (item as any).description !== 'No Description' ? (item as any).description : '') || '',
            driveLink: item.driveLink || '',
            isFree: item.isFree ?? false,
            price: item.price || 0,
            imageUrl: item.imageUrl || '',
            usedLanguageId: item.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
            categoryId: item.categoryId || '',
            category: item.category, // Keep category name from backend
            levelId: item.levelId || 'Beginner',
            teacherIds: item.teacherIds || [],
            details: item.details || [],
            durationMinutes: item.durationMinutes,
            rating: item.rating,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
        
        setCoursesData(mappedCourses)
        setFilteredCourses(mappedCourses)
        
        localStorage.setItem('coursesData', JSON.stringify(mappedCourses))
      } catch (error: any) {
        console.error('Error loading courses:', error)
        
        // Log error for debugging
        console.error('Error loading courses:', error)
        const errorMessage = error?.message || 'Bilinmeyen hata'
        showToast(`Error loading courses: ${errorMessage}`, 'error')
        
        // Fallback to localStorage
        const stored = localStorage.getItem('coursesData')
        if (stored) {
          try {
            const data = JSON.parse(stored)
            setCoursesData(data)
            setFilteredCourses(data)
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError)
          }
        }
      }
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(coursesData)
    } else {
      const filtered = coursesData.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.levelId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCourses(filtered)
    }
  }, [searchTerm, coursesData])

  const handleAddCourse = () => {
    setEditingCourse(null)
    setIsModalOpen(true)
  }

  const handleEditCourse = async (course: CourseItem) => {
    if (!course.id || course.id === '') {
        showToast('Invalid course ID. Please refresh the page.', 'error')
      return
    }
    
    try {
      const existingCourse = await getCourseDetail(course.id)
      console.log('Course exists in database:', existingCourse)
      
      const englishDetail = existingCourse.details?.find((d: CourseDetail) => 
        d.languageId === 'English' || 
        d.languageId === '1e2d847f-20dd-464a-7f2e-08de2959f69f' ||
        d.languageId === getDefaultLanguageId() ||
        d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
      ) || existingCourse.details?.[0]
      
      const updatedCourse: CourseItem = {
        ...course,
        title: englishDetail?.title || course.title || '',
        description: englishDetail?.description || course.description || '',
        driveLink: existingCourse.driveLink || course.driveLink || '',
        isFree: existingCourse.isFree ?? course.isFree ?? false,
        price: existingCourse.price || course.price || 0,
        imageUrl: existingCourse.imageUrl || course.imageUrl || '',
        usedLanguageId: existingCourse.usedLanguageId || course.usedLanguageId || getDefaultLanguageId(),
        categoryId: existingCourse.categoryId || course.categoryId || '',
        levelId: existingCourse.levelId || course.levelId || 'Beginner',
        teacherIds: existingCourse.teacherIds || course.teacherIds || [],
        details: existingCourse.details || course.details || [],
      }
      
      setEditingCourse(updatedCourse)
      setIsModalOpen(true)
    } catch (error: any) {
      console.error('Error verifying course existence:', error)
        showToast('Course not found in database. Refreshing course list...', 'error')
      
      // Refresh course list
      try {
        const response = await getAllCourses()
        const mappedCourses: CourseItem[] = response.map((item: CourseResponse) => {
          const englishDetail = item.details?.find((d: CourseDetail) => 
            d.languageId === 'English' || 
            d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789' ||
            d.languageId === getDefaultLanguageId() ||
            d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
          ) || item.details?.[0]
          
          return {
            id: item.id || '',
            title: englishDetail?.title || 'No Title',
            description: englishDetail?.description || 'No Description',
            driveLink: item.driveLink || '',
            isFree: item.isFree ?? false,
            price: item.price || 0,
            imageUrl: item.imageUrl || '',
            usedLanguageId: item.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
            categoryId: item.categoryId || '',
            levelId: item.levelId || 'Beginner',
            teacherIds: item.teacherIds || [],
            details: item.details || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
        
        setCoursesData(mappedCourses)
        setFilteredCourses(mappedCourses)
        localStorage.setItem('coursesData', JSON.stringify(mappedCourses))
      } catch (refreshError) {
        console.error('Error refreshing course list:', refreshError)
      }
    }
  }

  const handleDeleteClick = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      courseId: id,
      courseTitle: title,
    })
  }

  const handleDeleteConfirm = async () => {
    if (confirmModal.courseId) {
      try {
        console.log('Deleting course with ID:', confirmModal.courseId)
        
        await deleteCourse(confirmModal.courseId)
        
        // Refresh course list
        const response = await getAllCourses()
        const mappedCourses: CourseItem[] = response.map((item: CourseResponse) => {
          const englishDetail = item.details?.find((d: CourseDetail) => 
            d.languageId === 'English' || 
            d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789' ||
            d.languageId === getDefaultLanguageId() ||
            d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
          ) || item.details?.[0]
          
          return {
            id: item.id || '',
            title: englishDetail?.title || 'No Title',
            description: englishDetail?.description || 'No Description',
            driveLink: item.driveLink || '',
            isFree: item.isFree ?? false,
            price: item.price || 0,
            imageUrl: item.imageUrl || '',
            usedLanguageId: item.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
            categoryId: item.categoryId || '',
            levelId: item.levelId || 'Beginner',
            teacherIds: item.teacherIds || [],
            details: item.details || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
        
        setCoursesData(mappedCourses)
        setFilteredCourses(mappedCourses)
        localStorage.setItem('coursesData', JSON.stringify(mappedCourses))
        
        setConfirmModal({ isOpen: false, courseId: null, courseTitle: null })
        showToast('Kurs uğurla silindi!', 'success')
      } catch (error: any) {
        console.error('Error deleting course:', error)
        showToast(error?.message || 'Error deleting course. Please try again.', 'error')
      }
    }
  }

  const handleDeleteCancel = () => {
    setConfirmModal({ isOpen: false, courseId: null, courseTitle: null })
  }

  const handleSaveCourse = async (course: CourseItem, imageFile?: File | string) => {
    // Validate category selection
    if (!course.categoryId || course.categoryId.trim() === '') {
      showToast('Zəhmət olmasa kateqoriya seçin', 'error')
      return
    }
    
    // Validate teacher selection
    if (!course.teacherIds || course.teacherIds.length === 0) {
      showToast('Zəhmət olmasa ən azı bir müəllim seçin', 'error')
      return
    }
    
    if (editingCourse) {
      // Update existing course
      try {
        if (!editingCourse.id || editingCourse.id === '') {
          showToast('Invalid course ID. Cannot update course.', 'error')
          return
        }
        
        // Convert image to blob if needed (same as create)
        let imageBlob: File | Blob | undefined = undefined
        if (imageFile instanceof File) {
          imageBlob = imageFile
        } else if (imageFile && typeof imageFile === 'string' && imageFile.startsWith('data:')) {
          // Convert base64 to blob
          const base64Data = imageFile.split(',')[1] || imageFile
          const mimeType = imageFile.match(/data:([^;]+);/)?.[1] || 'image/png'
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          imageBlob = new Blob([byteArray], { type: mimeType })
        }
        
        console.log('=== UPDATING COURSE ===')
        console.log('Course ID:', editingCourse.id)
        console.log('IsFree:', course.isFree)
        console.log('Price:', course.price)
        console.log('CategoryId:', course.categoryId)
        console.log('LevelId:', course.levelId)
        console.log('TeacherIds:', course.teacherIds)
        console.log('UsedLanguageId:', course.usedLanguageId)
        console.log('Rating:', course.rating)
        console.log('DurationMinutes:', (course as any).durationMinutes)
        console.log('Has Image:', !!imageBlob)
        console.log('=====================')
        
              await updateCourse({
                id: editingCourse.id,
                // DriveLink removed - not in Swagger
                IsFree: course.isFree,
          Price: course.price,
          Image: imageBlob,
          UsedLanguageId: course.usedLanguageId,
          CategoryId: course.categoryId,
          LevelId: course.levelId,
          TeacherIds: course.teacherIds,
          Details: [], // Empty - will be updated via updateCourseDetail
          Rating: typeof course.rating === 'number' ? course.rating : undefined,
          DurationMinutes: typeof (course as any).durationMinutes === 'number' ? Math.round((course as any).durationMinutes) : undefined,
        })
        
        console.log('✓ Course base update completed')
        
        // Get Title and Description from course object (from form)
        // EXACTLY like create - form-dan gəlir, course.title və course.description istifadə edilir
        // Form-dan gələn title və description birbaşa istifadə olunur (create kimi)
        const titleToUse = course.title && course.title.trim() !== '' && course.title !== 'Untitled' && course.title !== 'No Title'
          ? course.title.trim()
          : ''
        
        const descriptionToUse = course.description && course.description.trim() !== '' && course.description !== 'No Description'
          ? course.description.trim()
          : ''
        
        console.log('========================================')
        console.log('Updating course details for ID:', editingCourse.id)
        console.log('Title from form (course.title):', course.title)
        console.log('Final title to use (trimmed):', titleToUse)
        console.log('Description from form (course.description):', course.description)
        console.log('Final description to use (trimmed):', descriptionToUse)
        console.log('========================================')
        
        // Update course details for all languages (EXACTLY like create)
        // Only proceed if we have valid title and description
        if (editingCourse.id && titleToUse && titleToUse.trim() !== '' && descriptionToUse && descriptionToUse.trim() !== '') {
          console.log('✓ Valid title and description found, proceeding with detail update...')
          const languages = [
            { name: 'English', id: 'b2c3d4e5-2345-6789-abcd-ef0123456789' }
          ]
          
          console.log('Adding details for all languages PARALLEL:', languages.map(l => l.name))
          
          // Wait a bit for backend to fully process the update before adding details
          // EXACTLY like create - same timing
          console.log('Waiting 800ms for backend to fully process the update...')
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Update details for all languages in parallel for faster execution
          // Use Promise.allSettled to handle failures gracefully
          // EXACTLY like create - same structure
          console.log('Updating details for all languages in parallel...')
          const detailPromises = languages.map(async (lang) => {
            try {
              console.log(`[${lang.name}] Updating course detail...`)
              console.log(`[${lang.name}] Title: "${titleToUse}"`)
              console.log(`[${lang.name}] Description: "${descriptionToUse}"`)
              console.log(`[${lang.name}] LanguageId: "${lang.name}"`)
              
              await updateCourseDetail(editingCourse.id, {
                Title: titleToUse.trim(),
                Description: descriptionToUse.trim(),
                LanguageId: lang.name, // Language name, not GUID
              })
              
              console.log(`✓ [${lang.name}] UpdateCourseDetail call succeeded!`)
              return { success: true, language: lang.name }
            } catch (error: any) {
              console.error(`✗ [${lang.name}] Error:`, error?.message)
              console.error(`✗ [${lang.name}] Error stack:`, error?.stack)
              return { success: false, language: lang.name, error: error?.message }
            }
          })
          
          const detailResults = await Promise.allSettled(detailPromises)
          const successfulLanguages: string[] = []
          const failedLanguages: string[] = []
          
          detailResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (result.value.success) {
                successfulLanguages.push(result.value.language)
              } else {
                failedLanguages.push(result.value.language)
              }
            } else {
              failedLanguages.push(languages[index].name)
            }
          })
          
          console.log('========================================')
          console.log('Course detail update results:')
          console.log('✓ Successful languages:', successfulLanguages)
          if (failedLanguages.length > 0) {
            console.log('✗ Failed languages:', failedLanguages)
          }
          console.log('========================================')
          
          if (successfulLanguages.length === 0) {
            console.error('✗✗✗ CRITICAL: All course detail updates failed!')
            showToast('Kurs yeniləndi, amma detallar yenilənə bilmədi. Zəhmət olmasa səhifəni yeniləyin.', 'warning')
          } else if (failedLanguages.length > 0) {
            console.warn('⚠ Some course detail updates failed:', failedLanguages)
            showToast(`Kurs yeniləndi, amma bəzi dillər üçün detallar yenilənə bilmədi: ${failedLanguages.join(', ')}`, 'warning')
          } else {
            console.log('✓✓✓ All course details updated successfully!')
            showToast('Kurs uğurla yeniləndi!', 'success')
          }
        } else {
          // If no title/description, just show success for the main update
          console.warn('⚠ No title or description to update - skipping detail update')
          showToast('Kurs uğurla yeniləndi!', 'success')
        }
        
        // Wait a bit more for backend to process the details
        // EXACTLY like create - same timing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Refresh course list
        const response = await getAllCourses()
        const mappedCourses: CourseItem[] = response.map((item: CourseResponse) => {
          const englishDetail = item.details?.find((d: CourseDetail) => 
            d.languageId === 'English' || 
            d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789' ||
            d.languageId === getDefaultLanguageId() ||
            d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
          ) || item.details?.[0]
          
          return {
            id: item.id || '',
            title: englishDetail?.title || ((item as any).title && (item as any).title !== 'Untitled' && (item as any).title !== 'No Title' ? (item as any).title : '') || '',
            description: englishDetail?.description || ((item as any).description && (item as any).description !== 'No Description' ? (item as any).description : '') || '',
            driveLink: item.driveLink || '',
            isFree: item.isFree ?? false,
            price: item.price || 0,
            imageUrl: item.imageUrl || '',
            usedLanguageId: item.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
            categoryId: item.categoryId || '',
            category: item.category, // Keep category name
            levelId: item.levelId || 'Beginner',
            teacherIds: item.teacherIds || [],
            details: item.details || [],
            durationMinutes: item.durationMinutes,
            rating: item.rating,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
        
        setCoursesData(mappedCourses)
        setFilteredCourses(mappedCourses)
        localStorage.setItem('coursesData', JSON.stringify(mappedCourses))
        
        // Fetch the updated course detail directly from backend to get fresh data
        // This ensures we get the latest title and description from details
        try {
          console.log('✓ Fetching updated course detail from backend for ID:', editingCourse.id, 'with language: English')
          const updatedCourseDetail = await getCourseDetail(editingCourse.id, 'English')
          
          // Map the course detail response to CourseItem format
          const englishDetail = updatedCourseDetail.details?.find((d: CourseDetail) => 
            d.languageId === 'English' || 
            d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789' ||
            d.languageId === getDefaultLanguageId() ||
            d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
          ) || updatedCourseDetail.details?.[0]
          
          const refreshedCourse: CourseItem = {
            id: updatedCourseDetail.id || editingCourse.id,
            title: englishDetail?.title || ((updatedCourseDetail as any).title && (updatedCourseDetail as any).title !== 'Untitled' && (updatedCourseDetail as any).title !== 'No Title' ? (updatedCourseDetail as any).title : '') || '',
            description: englishDetail?.description || ((updatedCourseDetail as any).description && (updatedCourseDetail as any).description !== 'No Description' ? (updatedCourseDetail as any).description : '') || '',
            driveLink: updatedCourseDetail.driveLink || '',
            isFree: updatedCourseDetail.isFree ?? false,
            price: updatedCourseDetail.price || 0,
            imageUrl: updatedCourseDetail.imageUrl || '',
            usedLanguageId: updatedCourseDetail.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
            categoryId: updatedCourseDetail.categoryId || '',
            category: updatedCourseDetail.category,
            levelId: updatedCourseDetail.levelId || 'Beginner',
            teacherIds: updatedCourseDetail.teacherIds || [],
            details: updatedCourseDetail.details || [],
            durationMinutes: updatedCourseDetail.durationMinutes,
            rating: updatedCourseDetail.rating,
            createdAt: updatedCourseDetail.createdAt || new Date().toISOString(),
            updatedAt: updatedCourseDetail.updatedAt || new Date().toISOString(),
          }
          
          console.log('✓✓✓ Refreshed course data from getCourseDetail:')
          console.log('  Title:', refreshedCourse.title)
          console.log('  Description:', refreshedCourse.description)
          console.log('  Details array:', refreshedCourse.details)
          
          setEditingCourse(refreshedCourse)
          // Keep modal open to show updated data - modal will automatically refresh with new editingCourse
        } catch (detailError: any) {
          console.error('⚠ Failed to fetch course detail, using data from list:', detailError)
          // Fallback to using data from mappedCourses
          const updatedCourse = mappedCourses.find(c => c.id === editingCourse.id)
          if (updatedCourse) {
            console.log('✓ Using course data from list')
            setEditingCourse(updatedCourse)
          } else {
            console.warn('⚠ Updated course not found in list, closing modal')
            setIsModalOpen(false)
            setEditingCourse(null)
          }
        }
      } catch (error: any) {
        console.error('✗✗✗ Error updating course:', error)
        console.error('Error message:', error?.message)
        console.error('Error stack:', error?.stack)
        
        const errorMessage = error?.message || 'Kurs yenilənərkən xəta baş verdi. Zəhmət olmasa dəyərləri yoxlayın və yenidən cəhd edin.'
        
        // Check if error message contains specific error info
        if (errorMessage.includes('Kurs əsas məlumatları')) {
          showToast(errorMessage, 'error')
        } else if (errorMessage.includes('Failed to update course') || errorMessage.includes('Failed to authenticate')) {
          showToast('Kurs yenilənərkən xəta baş verdi. Zəhmət olmasa dəyərləri yoxlayın və yenidən cəhd edin.', 'error')
        } else {
          // Show the actual error message
          showToast(errorMessage, 'error')
        }
      }
    } else {
      // Create new course
      try {
        let imageBlob: File | Blob | undefined = undefined
        
        if (imageFile instanceof File) {
          imageBlob = imageFile
        } else if (imageFile && typeof imageFile === 'string' && imageFile.startsWith('data:')) {
          // Convert base64 to blob
          const base64Data = imageFile.split(',')[1] || imageFile
          const mimeType = imageFile.match(/data:([^;]+);/)?.[1] || 'image/png'
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          imageBlob = new Blob([byteArray], { type: mimeType })
        }
        
        // Get Title and Description from course.details (first item) or course.title/description
        // Exclude "Untitled" and empty strings
        const titleFromDetails = course.details && course.details.length > 0 ? course.details[0].title : ''
        const titleFromCourse = course.title && course.title !== 'Untitled' && course.title !== 'No Title' ? course.title : ''
        const titleToUse = (titleFromDetails && titleFromDetails.trim() !== '' ? titleFromDetails : titleFromCourse) || ''
        
        const descFromDetails = course.details && course.details.length > 0 ? course.details[0].description : ''
        const descFromCourse = course.description && course.description !== 'No Description' ? course.description : ''
        const descriptionToUse = (descFromDetails && descFromDetails.trim() !== '' ? descFromDetails : descFromCourse) || ''
        
        const createResult = await createCourse({
          // DriveLink removed - not in Swagger
          IsFree: course.isFree,
          Price: course.price,
          Image: imageBlob,
          UsedLanguageId: course.usedLanguageId,
          CategoryId: course.categoryId,
          LevelId: course.levelId,
          TeacherIds: course.teacherIds,
          Details: [], // Empty - will be added via addCourseDetail
          Rating: typeof course.rating === 'number' ? course.rating : undefined,
          DurationMinutes: typeof (course as any).durationMinutes === 'number' ? Math.round((course as any).durationMinutes) : undefined,
        })
        
        console.log('Course created, result:', createResult)
        
        // Get created course ID
        let createdCourseId: string | null = createResult.id || null
        
        if (!createdCourseId) {
          // Try to find it in the course list
          try {
            const allCourses = await getAllCourses()
            // Find the most recently created course (by matching other fields)
            const foundCourse = allCourses.find(c => 
              c.categoryId === course.categoryId &&
              c.levelId === course.levelId &&
              c.isFree === course.isFree &&
              c.price === course.price
            )
            if (foundCourse) {
              createdCourseId = foundCourse.id
              console.log('Found created course ID from list:', createdCourseId)
            }
          } catch (e) {
            console.warn('Could not find created course ID:', e)
          }
        }
        
        if (!createdCourseId) {
          console.error('✗✗✗ CRITICAL: Could not find created course ID!')
          showToast('Kurs yaradıldı, amma ID tapıla bilmədi. Zəhmət olmasa səhifəni yeniləyin.', 'error')
          setIsModalOpen(false)
          return
        }
        
        console.log('✓✓✓ Using course ID for AddCourseDetail:', createdCourseId)
        
        // IMPORTANT: Add course detail (title, description) to the Details array for ALL 3 languages
        // createCourse only creates the base course, but title/description must be in Details array
        // Add details for English, Azerbaijani, and Russian so it works in all languages
        if (createdCourseId && titleToUse && descriptionToUse) {
          const languages = [
            { name: 'English', id: 'b2c3d4e5-2345-6789-abcd-ef0123456789' }
          ]
          
          console.log('========================================')
          console.log('Adding course detail for ID:', createdCourseId)
          console.log('Title:', titleToUse)
          console.log('Description:', descriptionToUse)
          console.log('Adding details for all 3 languages PARALLEL:', languages.map(l => l.name))
          console.log('========================================')
          
          // Wait a bit for backend to fully create the course before adding details
          console.log('Waiting 800ms for backend to fully create the course...')
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Add details for all languages in parallel for faster execution
          // Use Promise.allSettled to handle failures gracefully
          console.log('Adding details for all languages in parallel...')
          const detailPromises = languages.map(async (lang) => {
            try {
              console.log(`[${lang.name}] Adding course detail...`)
              await addCourseDetail(createdCourseId!, {
                Title: titleToUse,
                Description: descriptionToUse,
                LanguageId: lang.name, // Language name, not GUID
              })
              console.log(`✓ [${lang.name}] AddCourseDetail call succeeded!`)
              return { success: true, language: lang.name }
            } catch (error: any) {
              console.error(`✗ [${lang.name}] Error:`, error?.message)
              return { success: false, language: lang.name, error: error?.message }
            }
          })
          
          const detailResults = await Promise.allSettled(detailPromises)
          const successfulLanguages: string[] = []
          const failedLanguages: string[] = []
          
          detailResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (result.value.success) {
                successfulLanguages.push(result.value.language)
              } else {
                failedLanguages.push(result.value.language)
              }
            } else {
              failedLanguages.push(languages[index].name)
            }
          })
          
          console.log('========================================')
          console.log('Course detail results:')
          console.log('✓ Successful languages:', successfulLanguages)
          if (failedLanguages.length > 0) {
            console.log('✗ Failed languages:', failedLanguages)
          }
          console.log('========================================')
          
          if (successfulLanguages.length === 0) {
            console.error('✗✗✗ CRITICAL: All course detail additions failed!')
            showToast('Kurs yaradıldı, amma detallar əlavə oluna bilmədi. Zəhmət olmasa səhifəni yeniləyin.', 'warning')
          } else if (failedLanguages.length > 0) {
            console.warn('⚠ Some course detail additions failed:', failedLanguages)
            showToast(`Kurs yaradıldı, amma bəzi dillər üçün detallar əlavə oluna bilmədi: ${failedLanguages.join(', ')}`, 'warning')
          } else {
            console.log('✓✓✓ All course details added successfully!')
          }
        }
        
        // Wait a bit more for backend to process the details
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Try to get the created course by ID if available
        let createdCourse: CourseResponse | null = null
        
        if (createdCourseId) {
          try {
            createdCourse = await getCourseDetail(createdCourseId)
            console.log('Fetched created course by ID:', createdCourse)
          } catch (detailError) {
            console.warn('Could not fetch course detail by ID:', detailError)
          }
        }
        
        // Refresh course list
        let response: CourseResponse[] = []
        try {
          response = await getAllCourses()
          console.log('Fetched courses after create:', response.length)
          
          // If we have the created course from detail, add it to the list if not already there
          if (createdCourse && !response.find(c => c.id === createdCourse!.id)) {
            response = [createdCourse, ...response]
            console.log('Added created course to list from detail fetch')
          }
          
          showToast('Kurs uğurla yaradıldı!', 'success')
        } catch (fetchError: any) {
          console.error('Error fetching courses after create:', fetchError)
          
          // If we have the created course from detail, use it
          if (createdCourse) {
            response = [createdCourse]
            console.log('Using created course from detail fetch due to list error')
            showToast('Kurs uğurla yaradıldı! (Siyahı yüklənmədi, amma kurs yaradıldı)', 'success')
          } else {
            showToast('Course created, but an error occurred while loading the list. Please refresh the page.', 'warning')
          }
        }
        const mappedCourses: CourseItem[] = response.map((item: CourseResponse) => {
          const englishDetail = item.details?.find((d: CourseDetail) => 
            d.languageId === 'English' || 
            d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789' ||
            d.languageId === getDefaultLanguageId() ||
            d.languageId === '669f256a-0b60-4989-bf88-4817b50dd365'
          ) || item.details?.[0]
          
          return {
            id: item.id || '',
            title: englishDetail?.title || 'No Title',
            description: englishDetail?.description || 'No Description',
            driveLink: item.driveLink || '',
            isFree: item.isFree ?? false,
            price: item.price || 0,
            imageUrl: item.imageUrl || '',
            usedLanguageId: item.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
            categoryId: item.categoryId || '',
            levelId: item.levelId || 'Beginner',
            teacherIds: item.teacherIds || [],
            details: item.details || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
        
        setCoursesData(mappedCourses)
        setFilteredCourses(mappedCourses)
        localStorage.setItem('coursesData', JSON.stringify(mappedCourses))
        
        setIsModalOpen(false)
        setEditingCourse(null)
      } catch (error: any) {
        console.error('Error creating course:', error)
        const errorMessage = error?.message || 'Kurs yaradılarkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
        showToast(errorMessage, 'error')
      }
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden ml-64">
        <div className="h-full overflow-y-auto p-8 bg-gray-50">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                Course Management
              </h1>
              <p className="mt-2 text-gray-600">Manage and organize your courses</p>
            </div>
            <button
              onClick={handleAddCourse}
              className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-xl font-semibold shadow-md shadow-purple-200 hover:shadow-purple-300 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Course
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Courses Card */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Total Courses</h3>
              <p className="text-3xl font-bold text-white">{totalCourses}</p>
            </div>

            {/* Free Courses Card */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Free Courses</h3>
              <p className="text-3xl font-bold text-white">{freeCourses}</p>
            </div>

            {/* Paid Courses Card */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Paid Courses</h3>
              <p className="text-3xl font-bold text-white">{paidCourses}</p>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-purple-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {filteredCourses.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mb-4">
                  <BookOpen className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Courses Found</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first course</p>
                <button
                  onClick={handleAddCourse}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-xl font-semibold shadow-md hover:shadow-purple-300 transition-all duration-300"
                >
                  Add Your First Course
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-500 to-purple-400 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Image</th>
                      <th className="px-6 py-4 text-left font-semibold">Title</th>
                      <th className="px-6 py-4 text-left font-semibold">Description</th>
                      <th className="px-6 py-4 text-left font-semibold">Level</th>
                      <th className="px-6 py-4 text-left font-semibold">Price</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCourses.map((course) => (
                      <tr
                        key={course.id}
                        className="bg-white even:bg-gray-50 hover:bg-purple-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="w-20 h-16 rounded-lg overflow-hidden shadow-md">
                            <img
                              src={course.imageUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Crect fill='%23ddd' width='100' height='60'/%3E%3Ctext x='50' y='30' text-anchor='middle' fill='%23999' font-size='14'%3EImage%3C/text%3E%3C/svg%3E`
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 min-w-[150px]">
                            {course.title || <span className="text-gray-400 italic">No title</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-gray-600 max-w-md truncate" 
                            title={course.description || ''}
                          >
                            {course.description || <span className="text-gray-400 italic">No description</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 min-w-[80px]">
                            {course.levelId || 'Beginner'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {course.isFree ? (
                            <span className="text-green-600 font-semibold">Free</span>
                          ) : (
                            <span className="text-gray-900 font-semibold">${course.price.toLocaleString()}</span>
                          )}
                        </td>
                               <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                   <button
                                     onClick={() => router.push(`/courses/${course.id}`)}
                                     className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                     title="Manage Content"
                                   >
                                     <BookOpen className="w-4 h-4" />
                                   </button>
                                   <button
                                     onClick={() => setCertificateModal({
                                       isOpen: true,
                                       courseId: course.id,
                                       courseTitle: course.title || 'Untitled Course',
                                     })}
                                     className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                     title="Send Certificate"
                                   >
                                     <Award className="w-4 h-4" />
                                   </button>
                                   <button
                                     onClick={() => handleEditCourse(course)}
                                     className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                     title="Edit"
                                   >
                                     <Edit2 className="w-4 h-4" />
                                   </button>
                                   <button
                                     onClick={() => handleDeleteClick(course.id, course.title)}
                                     className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                     title="Delete"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 </div>
                               </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <CourseModal
          course={editingCourse}
          categories={categories}
          teachers={teachers}
          onSave={handleSaveCourse}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCourse(null)
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Course"
        message={`Are you sure you want to delete "${confirmModal.courseTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />

      {/* Certificate Modal */}
      {certificateModal.isOpen && certificateModal.courseId && (
        <CertificateModal
          isOpen={certificateModal.isOpen}
          courseId={certificateModal.courseId}
          courseTitle={certificateModal.courseTitle || 'Untitled Course'}
          onClose={() => setCertificateModal({ isOpen: false, courseId: null, courseTitle: null })}
          onSend={async (data) => {
            try {
              if (data.users.length === 0) {
                throw new Error('Bu kursa enroll olunmuş istifadəçi yoxdur')
              }

              // Get today's date in DD.MM.YYYY format
              const today = new Date()
              const day = String(today.getDate()).padStart(2, '0')
              const month = String(today.getMonth() + 1).padStart(2, '0')
              const year = today.getFullYear()
              const formattedDate = `${day}.${month}.${year}`

              // Use course title as certificate name
              const certificateName = certificateModal.courseTitle || 'Certificate'

              console.log('=== CERTIFICATE SEND DATA ===')
              console.log('Users:', data.users.length)
              console.log('Certificate Name:', certificateName)
              console.log('Certificate Date:', formattedDate)
              console.log('Course ID:', certificateModal.courseId)
              console.log('Course Title:', certificateModal.courseTitle)
              console.log('============================')

              // Send certificate to each user sequentially to avoid timeout issues
              const results: Array<{ status: 'fulfilled' | 'rejected', value?: any, reason?: any }> = []
              
              for (let i = 0; i < data.users.length; i++) {
                const user = data.users[i]
                const userName = user.name || user.email.split('@')[0] // Use name or email prefix
                console.log(`Processing certificate ${i + 1}/${data.users.length} for ${userName} (${user.email})...`)
                
                try {
                  // Step 1: Generate PDF with user's name
                  console.log(`  → Generating PDF for ${userName}...`)
                  const generateResponse = await fetch('/api/certificate/generate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userName: userName,
                      courseTitle: certificateModal.courseTitle,
                    }),
                  })

                  if (!generateResponse.ok) {
                    const errorData = await generateResponse.json().catch(() => ({ error: 'Failed to generate PDF' }))
                    throw new Error(errorData.error || `Failed to generate certificate PDF for ${user.email}`)
                  }

                  // Get PDF blob
                  const pdfBlob = await generateResponse.blob()
                  const pdfFile = new File([pdfBlob], `certificate-${userName.replace(/\s+/g, '-')}.pdf`, {
                    type: 'application/pdf',
                  })

                  console.log(`  ✓ PDF generated for ${userName}`)

                  // Step 2: Save certificate to backend (so user can view it later)
                  // Each user gets their own certificate saved with their email
                  console.log(`  → Saving certificate to backend for ${user.email}...`)
                  try {
                    const saveFormData = new FormData()
                    saveFormData.append('Name', certificateName)
                    saveFormData.append('Date', formattedDate)
                    saveFormData.append('CourseId', certificateModal.courseId!)
                    saveFormData.append('Email', user.email) // Add email to identify user
                    saveFormData.append('File', pdfFile)

                    const saveResponse = await fetch('/api/certificate/manual', {
                      method: 'POST',
                      body: saveFormData,
                    })

                    if (saveResponse.ok) {
                      console.log(`  ✓ Certificate saved to backend for ${user.email}`)
                    } else {
                      console.warn(`  ⚠ Failed to save certificate to backend for ${user.email}, but continuing...`)
                    }
                  } catch (saveError) {
                    console.warn(`  ⚠ Error saving certificate to backend for ${user.email}:`, saveError)
                    // Continue with email sending even if save fails
                  }

                  // Step 3: Send certificate via email
                  console.log(`  → Sending email to ${user.email}...`)
                  const formData = new FormData()
                  formData.append('Name', certificateName)
                  formData.append('Date', formattedDate)
                  formData.append('File', pdfFile)
                  formData.append('Email', user.email)

                  // Create AbortController for timeout - increased to 360 seconds (6 minutes)
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => controller.abort(), 360000) // 360 seconds timeout

                  try {
                    const emailResponse = await fetch('/api/form/submit', {
                      method: 'POST',
                      body: formData,
                      signal: controller.signal,
                    })

                    clearTimeout(timeoutId)

                    if (!emailResponse.ok) {
                      const errorData = await emailResponse.json()
                      throw new Error(
                        errorData.error || 
                        `Failed to send certificate to ${user.email}: ${emailResponse.status} ${emailResponse.statusText}`
                      )
                    }

                    const result = await emailResponse.json()
                    console.log(`  ✓ Certificate sent to ${user.email}:`, result.message)
                    results.push({ status: 'fulfilled', value: { user, success: true } })
                  } catch (error: any) {
                    clearTimeout(timeoutId)
                    if (error.name === 'AbortError') {
                      throw new Error(`Request timeout for ${user.email}: Backend took too long to respond (360 seconds). Email service might be slow.`)
                    }
                    throw error
                  }
                } catch (error: any) {
                  console.error(`  ✗ Failed to process certificate for ${user.email}:`, error.message)
                  results.push({ status: 'rejected', reason: error })
                  // Continue with next user instead of stopping
                }
              }
              
              // Separate successes and failures
              const successes = results.filter(r => r.status === 'fulfilled')
              const failures = results.filter(r => r.status === 'rejected')
              
              // Log results
              console.log(`✓ Successfully sent: ${successes.length}/${data.users.length}`)
              if (failures.length > 0) {
                console.error(`✗ Failed to send: ${failures.length}/${data.users.length}`)
                failures.forEach((f: any, index) => {
                  console.error(`  Failure ${index + 1}:`, f.reason?.message || 'Unknown error')
                })
              }
              
              // If all failed, throw error
              if (failures.length === data.users.length) {
                const errorMessages = failures
                  .map((f: any) => f.reason?.message || 'Unknown error')
                  .join('; ')
                throw new Error(`Bütün sertifikatlar göndərilmədi: ${errorMessages}`)
              }
              
              // If some failed, show warning but don't throw
              if (failures.length > 0) {
                const failedEmails = failures
                  .map((f: any) => {
                    const failedIndex = results.findIndex(r => r === f)
                    const user = data.users[failedIndex]
                    return user?.email || 'Unknown'
                  })
                  .join(', ')
                showToast(
                  `${successes.length} sertifikat uğurla göndərildi, ${failures.length} sertifikat göndərilmədi (${failedEmails})`,
                  'warning'
                )
              } else {
                // Show success message
                const userCount = data.users.length
                showToast(
                  `Sertifikatlar ${userCount} istifadəçiyə uğurla göndərildi!`,
                  'success'
                )
              }
              
              console.log(`✓ All certificates processed`)
            } catch (error: any) {
              console.error('Error sending certificates:', error)
              showToast(error?.message || 'Sertifikatlar göndərilərkən xəta baş verdi', 'error')
              throw error
            }
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

