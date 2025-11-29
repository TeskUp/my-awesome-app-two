// Use Next.js API routes as proxy to avoid CORS issues

const API_BASE_URL = '/api/courses'

const BACKEND_API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export interface CourseDetail {
  title: string
  description: string
  languageId: string
}

export interface CourseResponse {
  id: string
  driveLink?: string
  isFree: boolean
  price: number
  imageUrl?: string
  usedLanguageId: string
  categoryId: string
  category?: string // Category name (string) from backend
  levelId: string
  teacherIds: string[]
  details?: CourseDetail[]
  durationMinutes?: number
  rating?: number
  createdAt?: string
  updatedAt?: string
}

// Language ID mapping - using provided language ID
const LANGUAGE_ID_MAP: { [key: string]: string } = {
  'default': 'b2c3d4e5-2345-6789-abcd-ef0123456789', // Provided language ID
}

// Language name to ID mapping (for UsedLanguageId)
const LANGUAGE_NAME_TO_ID: { [key: string]: string } = {
  'Azerbaijani': 'b2c3d4e5-2345-6789-abcd-ef0123456789',
  'English': 'b2c3d4e5-2345-6789-abcd-ef0123456789',
  'Russian': 'b2c3d4e5-2345-6789-abcd-ef0123456789',
}

// Language ID to name mapping (for addDetail - backend expects language name)
const LANGUAGE_ID_TO_NAME: { [key: string]: string } = {
  'b2c3d4e5-2345-6789-abcd-ef0123456789': 'English', // Default to English for addDetail
}

// Default language ID (provided by user)
export const DEFAULT_LANGUAGE_ID = 'b2c3d4e5-2345-6789-abcd-ef0123456789'

// Level options - from Swagger dropdown
export const LEVEL_OPTIONS = ['Beginner', 'Novice', 'Intermediate', 'Proficient', 'Advanced']

// Default category ID (programming - provided by user)
export const DEFAULT_CATEGORY_ID = '19ba8521-54d8-4f01-8935-6bac2e73011d'

export function getLanguageId(language: string): string {
  return LANGUAGE_NAME_TO_ID[language] || DEFAULT_LANGUAGE_ID
}

export function getDefaultLanguageId(): string {
  return DEFAULT_LANGUAGE_ID
}

export interface CreateCourseRequest {
  IsFree: boolean
  Price: number
  Image?: File | Blob
  UsedLanguageId: string
  CategoryId: string
  LevelId: string
  TeacherIds: string[]
  Details: CourseDetail[]
  Rating?: number
  DurationMinutes?: number
}

export interface UpdateCourseRequest {
  IsFree: boolean
  Price: number
  Image?: File | Blob
  UsedLanguageId: string
  CategoryId: string
  LevelId: string
  TeacherIds: string[]
  Details: CourseDetail[]
  Rating?: number
  DurationMinutes?: number
}

export interface AddCourseDetailRequest {
  Title: string
  Description: string
  LanguageId: string // Language name (e.g., "English", "Azerbaijani", "Russian")
}

/**
 * Add course detail (title, description) to a course
 * Similar to addNewsDetail - backend expects language name, not GUID
 */
export async function addCourseDetail(courseId: string, request: AddCourseDetailRequest): Promise<void> {
  try {
    console.log(`[addCourseDetail] Starting for courseId: ${courseId}, language: ${request.LanguageId}`)
    console.log(`[addCourseDetail] Title: "${request.Title}", Description: "${request.Description}"`)

    // Prepare JSON body according to Swagger: POST /api/admin/courses/{courseId}/details
    const requestBody = {
      Title: request.Title,
      Description: request.Description,
      LanguageId: request.LanguageId, // Language name, not GUID
    }

    console.log(`[addCourseDetail] Sending request to: ${API_BASE_URL}/addDetail?id=${courseId}`)
    const response = await fetch(`${API_BASE_URL}/addDetail?id=${courseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`[addCourseDetail] Response status: ${response.status} ${response.statusText}`)
    if (!response.ok) {
      const responseText = await response.text()
      console.error(`[addCourseDetail] Error response text:`, responseText)
      let errorData: any = { error: 'Unknown error' }
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText || `Failed to add course detail: ${response.statusText}` }
      }
      const errorMessage = errorData.error || errorData.message || `Failed to add course detail: ${response.statusText}`
      console.error(`[addCourseDetail] Error message:`, errorMessage)
      throw new Error(errorMessage)
    }

    const responseText = await response.text()
    console.log(`[addCourseDetail] Success response text:`, responseText)
    let result: any = {}
    try {
      result = JSON.parse(responseText)
    } catch {
      // If response is not JSON but status is OK, that's fine
      console.log(`[addCourseDetail] Response is not JSON, but status is OK - assuming success`)
      return
    }
    if (result.error) {
      console.error(`[addCourseDetail] Result contains error:`, result.error)
      throw new Error(result.error)
    }
    console.log(`[addCourseDetail] ✓ Successfully added course detail for ${request.LanguageId}`)
  } catch (error: any) {
    console.error(`[addCourseDetail] ✗ Error adding course detail for ${request.LanguageId}:`, error)
    console.error(`[addCourseDetail] Error message:`, error?.message)
    console.error(`[addCourseDetail] Error stack:`, error?.stack)
    throw error
  }
}

/**
 * Update course detail (title, description) for a course
 * Uses PUT /api/admin/courses/{courseId}/details with JSON body
 */
export async function updateCourseDetail(courseId: string, request: AddCourseDetailRequest): Promise<void> {
  try {
    console.log(`[updateCourseDetail] Starting for courseId: ${courseId}, language: ${request.LanguageId}`)
    console.log(`[updateCourseDetail] Title: "${request.Title}", Description: "${request.Description}"`)

    // Prepare JSON body according to Swagger: PUT /api/admin/courses/{courseId}/details
    // Swagger shows: { courseId, title, description, languageId }
    const requestBody = {
      Title: request.Title,
      Description: request.Description,
      LanguageId: request.LanguageId, // Language name, not GUID - will be converted to lowercase in API route
    }

    console.log(`[updateCourseDetail] Sending request to: ${API_BASE_URL}/updateDetail?id=${courseId}`)
    const response = await fetch(`${API_BASE_URL}/updateDetail?id=${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`[updateCourseDetail] Response status: ${response.status} ${response.statusText}`)
    if (!response.ok) {
      const responseText = await response.text()
      console.error(`[updateCourseDetail] Error response text:`, responseText)
      let errorData: any = { error: 'Unknown error' }
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText || `Failed to update course detail: ${response.statusText}` }
      }
      const errorMessage = errorData.error || errorData.message || `Failed to update course detail: ${response.statusText}`
      console.error(`[updateCourseDetail] Error message:`, errorMessage)
      throw new Error(errorMessage)
    }

    const responseText = await response.text()
    console.log(`[updateCourseDetail] Success response text:`, responseText)
    let result: any = {}
    try {
      result = JSON.parse(responseText)
    } catch {
      // If response is not JSON but status is OK, that's fine
      console.log(`[updateCourseDetail] Response is not JSON, but status is OK - assuming success`)
      return
    }
    if (result.error) {
      console.error(`[updateCourseDetail] Result contains error:`, result.error)
      throw new Error(result.error)
    }
    console.log(`[updateCourseDetail] ✓ Successfully updated course detail for ${request.LanguageId}`)
  } catch (error: any) {
    console.error(`[updateCourseDetail] ✗ Error updating course detail for ${request.LanguageId}:`, error)
    console.error(`[updateCourseDetail] Error message:`, error?.message)
    console.error(`[updateCourseDetail] Error stack:`, error?.stack)
    throw error
  }
}

/**
 * Create a new course
 * Returns the created course ID if available in response
 */
export async function createCourse(request: CreateCourseRequest): Promise<{ id?: string; success: boolean; message?: string }> {
  try {
    const formData = new FormData()

    // Map to backend format according to Swagger
    // Swagger shows: CategoryId, Level, IsFree, Price, InstructorId, Thumbnail, UsedLanguageId, Rating, DurationMinutes
    // Note: Title and Description are NOT in Swagger, so we don't send them here
    // They will be added via addCourseDetail after course creation

    formData.append('CategoryId', request.CategoryId)
    formData.append('Level', request.LevelId) // Backend expects 'Level', not 'LevelId'
    formData.append('IsFree', request.IsFree.toString())
    formData.append('Price', request.Price.toString())

    // Rating (optional) - handle NaN
    if (typeof request.Rating === 'number' && !isNaN(request.Rating)) {
      formData.append('Rating', request.Rating.toString())
    }

    // DurationMinutes (optional) - handle NaN
    if (typeof request.DurationMinutes === 'number' && !isNaN(request.DurationMinutes)) {
      formData.append('DurationMinutes', Math.max(0, Math.round(request.DurationMinutes)).toString())
    }

    // InstructorId (single, not array) - use first teacher ID
    if (request.TeacherIds && request.TeacherIds.length > 0) {
      formData.append('InstructorId', request.TeacherIds[0])
    }

    formData.append('UsedLanguageId', request.UsedLanguageId)

    // Thumbnail (not Image)
    if (request.Image) {
      if (request.Image instanceof File) {
        formData.append('Thumbnail', request.Image)
      } else if (request.Image instanceof Blob) {
        const file = new File([request.Image], 'course.jpg', { type: request.Image.type || 'image/jpeg' })
        formData.append('Thumbnail', file)
      }
    }

    // Use Next.js API route as proxy
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorMessage = errorData.error || `Failed to create course: ${response.statusText}`
      throw new Error(errorMessage)
    }

    // Check if response has error or contains created course ID
    const responseData = await response.json().catch(() => ({ success: true }))

    // Swagger shows response format: { id: "...", message: "Course created successfully" }
    // Return the result with id field
    return {
      id: responseData.id,
      success: true,
      message: responseData.message,
    }
  } catch (error) {
    console.error('Error creating course:', error)
    throw error
  }
}

/**
 * Update a course
 */
export async function updateCourse(request: UpdateCourseRequest & { id: string }): Promise<void> {
  try {
    // Validate required fields
    if (!request.CategoryId) {
      throw new Error('CategoryId is required for course update')
    }
    if (!request.LevelId) {
      throw new Error('LevelId is required for course update')
    }
    if (!request.TeacherIds || request.TeacherIds.length === 0) {
      throw new Error('At least one TeacherId is required for course update')
    }
    if (!request.UsedLanguageId) {
      throw new Error('UsedLanguageId is required for course update')
    }

    // Note: UsedLanguageId validation is handled by backend
    // Frontend should ensure valid UsedLanguageId is selected from dropdown

    const formData = new FormData()

    // Map to backend format according to Swagger
    // Swagger shows: CategoryId, Level, IsFree, Price, InstructorId, Thumbnail, UsedLanguageId, Rating, DurationMinutes
    // Note: Title and Description are NOT in Swagger, so we don't send them here
    // They should be updated via updateCourseDetail if needed

    formData.append('CategoryId', request.CategoryId)
    formData.append('Level', request.LevelId) // Backend expects 'Level', not 'LevelId'
    formData.append('IsFree', request.IsFree.toString())
    formData.append('Price', request.Price.toString())

    // Rating (optional) - handle NaN
    if (typeof request.Rating === 'number' && !isNaN(request.Rating)) {
      formData.append('Rating', request.Rating.toString())
    }

    // DurationMinutes (optional) - handle NaN
    if (typeof request.DurationMinutes === 'number' && !isNaN(request.DurationMinutes)) {
      formData.append('DurationMinutes', Math.max(0, Math.round(request.DurationMinutes)).toString())
    }

    // InstructorId (single, not array) - use first teacher ID
    if (request.TeacherIds && request.TeacherIds.length > 0) {
      formData.append('InstructorId', request.TeacherIds[0])
    }

    formData.append('UsedLanguageId', request.UsedLanguageId)

    // Thumbnail (not Image) - only append if provided
    // IMPORTANT: Backend may require Thumbnail even if empty, but Swagger shows it's optional
    // If no image provided, don't send Thumbnail field at all (not empty string)
    if (request.Image) {
      if (request.Image instanceof File) {
        formData.append('Thumbnail', request.Image)
        console.log(`[updateCourse] Appending Thumbnail as File: ${request.Image.name}, ${request.Image.size} bytes`)
      } else if (request.Image instanceof Blob) {
        const file = new File([request.Image], 'course.jpg', { type: request.Image.type || 'image/jpeg' })
        formData.append('Thumbnail', file)
        console.log(`[updateCourse] Appending Thumbnail as Blob converted to File: ${file.size} bytes`)
      }
    } else {
      console.log(`[updateCourse] No image provided - not sending Thumbnail field`)
    }

    console.log(`[updateCourse] Sending PUT request to: ${API_BASE_URL}/update?id=${request.id}`)
    console.log(`[updateCourse] FormData keys:`, Array.from(formData.keys()))

    // Use Next.js API route as proxy
    const response = await fetch(`${API_BASE_URL}/update?id=${request.id}`, {
      method: 'PUT',
      body: formData,
    })

    console.log(`[updateCourse] Response status: ${response.status} ${response.statusText}`)

    // Get response text first (can only be read once)
    const responseText = await response.text()
    console.log(`[updateCourse] Response text:`, responseText)

    if (!response.ok) {
      let errorMessage = `Failed to update course: ${response.status} ${response.statusText}`
      let errorData: any = null
      try {
        errorData = JSON.parse(responseText)
        console.error(`[updateCourse] Error response parsed:`, errorData)
        if (errorData.errors) {
          const errorText = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          errorMessage = `${errorMessage} - ${errorText}`
        } else if (errorData.title) {
          errorMessage = `${errorMessage} - ${errorData.title}`
        } else if (errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.originalError) {
          errorMessage = errorData.originalError
        }
      } catch (parseError) {
        console.error(`[updateCourse] Failed to parse error response:`, parseError)
        if (responseText) {
          errorMessage = `${errorMessage} - ${responseText}`
        }
      }
      console.error(`[updateCourse] ✗✗✗ ERROR: ${errorMessage}`)
      throw new Error(errorMessage)
    }

    // Parse success response
    let responseData: any = { success: true, message: 'Course updated successfully' }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log(`[updateCourse] ✓ Success response parsed:`, responseData)
        // Ensure message is present
        if (!responseData.message && response.status === 200) {
          responseData.message = 'Course updated successfully'
        }
      } catch (parseError) {
        console.log(`[updateCourse] Response is not JSON, but status is OK - assuming success`)
        // If response is not JSON but status is OK, that's fine
        if (response.status === 200) {
          responseData = { success: true, message: 'Course updated successfully' }
        }
      }
    }

    // If response has error field, throw it
    if (responseData.error) {
      console.error(`[updateCourse] Response contains error field:`, responseData.error)
      throw new Error(responseData.error)
    }

    console.log(`[updateCourse] ✓✓✓ SUCCESS: Course updated successfully`)
    console.log(`[updateCourse] Response message:`, responseData.message || 'Course updated successfully')
  } catch (error) {
    console.error('Error updating course:', error)
    throw error
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete?id=${courseId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorMessage = errorData.error || `Failed to delete course: ${response.statusText}`
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error('Error deleting course:', error)
    throw error
  }
}

/**
 * Get all courses
 */
export async function getAllCourses(): Promise<CourseResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/getAll`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching courses:', error)
    throw error
  }
}

/**
 * Get course detail by ID
 */
export async function getCourseDetail(courseId: string): Promise<CourseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/getDetail?id=${courseId}`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch course detail: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching course detail:', error)
    throw error
  }
}

// Interfaces for API responses
export interface Category {
  id: string
  isDeactive: boolean
  details: Array<{
    name: string
    languageId: string
  }>
  // Helper: get name from first detail (for backward compatibility)
  name?: string
}

export interface UsedLanguage {
  id: string
  isoCode: string
  isDeactive: boolean
  courseIds?: string[]
  teacherIds?: string[]
}

/**
 * Get all categories from backend
 * NOTE: This requires a Next.js API proxy route at /api/categories/getAll
 * If CORS issues occur, create a proxy route similar to /api/courses routes
 */
export async function getCategories(language: 'English' | 'Azerbaijani' | 'Russian' = 'English'): Promise<Category[]> {
  try {
    // Try using proxy route first, fallback to direct backend call
    let response
    try {
      response = await fetch(`/api/categories/getAll?language=${language}`, {
        method: 'GET',
        cache: 'no-store',
      })
    } catch {
      // Fallback to direct backend (may have CORS issues)
      response = await fetch(`${BACKEND_API_BASE_URL}/Category/GetAll?language=${language}`, {
        method: 'GET',
        cache: 'no-store',
      })
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }

    const data = await response.json()
    // Filter out deactivated categories and add name helper
    return Array.isArray(data) 
      ? data
          .filter((cat: Category) => !cat.isDeactive)
          .map((cat: Category) => ({
            ...cat,
            name: cat.details?.[0]?.name || 'Unnamed Category', // Extract name from first detail
          }))
      : []
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

/**
 * Get all used languages from backend
 * NOTE: This requires a Next.js API proxy route at /api/usedLanguages/getAll
 * If CORS issues occur, create a proxy route similar to /api/courses routes
 */
export async function getUsedLanguages(): Promise<UsedLanguage[]> {
  try {
    // Try using proxy route first, fallback to direct backend call
    let response
    try {
      response = await fetch(`/api/usedLanguages/getAll`, {
        method: 'GET',
        cache: 'no-store',
      })
    } catch {
      // Fallback to direct backend (may have CORS issues)
      response = await fetch(`${BACKEND_API_BASE_URL}/UsedLanguage/GetAll`, {
        method: 'GET',
        cache: 'no-store',
      })
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch used languages: ${response.statusText}`)
    }

    const data = await response.json()
    // Filter out deactivated languages
    return Array.isArray(data) ? data.filter((lang: UsedLanguage) => !lang.isDeactive) : []
  } catch (error) {
    console.error('Error fetching used languages:', error)
    throw error
  }
}

// Test IDs for development - using provided IDs
export const TEST_IDS = {
  LECTURE_ID: '9c9b49c2-cb38-4d44-dac6-08de295b8d47',
  COURSE_ID: 'c8aa90ad-cf8c-4712-79be-08de295aefbe',
  USED_LANGUAGE_ID_ENGLISH: 'b2c3d4e5-2345-6789-abcd-ef0123456789', // Provided language ID
  CATEGORY_ID_PROGRAMMING: '19ba8521-54d8-4f01-8935-6bac2e73011d', // programming (default)
  TEACHER_ID: 'eb5342da-b48b-4085-73cf-08de2dbbd0d8', // ahmet yilmaz (default)
}

/**
 * Validate and fix UsedLanguageId - returns a valid ID
 * If the provided ID is invalid, returns the default English ID
 */
export async function validateOrFixUsedLanguageId(usedLanguageId: string | undefined): Promise<string> {
  if (!usedLanguageId) {
    return TEST_IDS.USED_LANGUAGE_ID_ENGLISH
  }

  try {
    const validLanguages = await getUsedLanguages()
    const languageExists = validLanguages.some(lang => lang.id === usedLanguageId)
    
    if (languageExists) {
      return usedLanguageId
    } else {
      console.warn(`[validateOrFixUsedLanguageId] Invalid UsedLanguageId: ${usedLanguageId}, using default English ID`)
      return TEST_IDS.USED_LANGUAGE_ID_ENGLISH
    }
  } catch (error) {
    console.warn(`[validateOrFixUsedLanguageId] Could not validate UsedLanguageId, using default:`, error)
    return TEST_IDS.USED_LANGUAGE_ID_ENGLISH
  }
}
