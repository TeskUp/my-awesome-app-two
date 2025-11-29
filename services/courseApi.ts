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

// Language name to enum value mapping (for backend LanguageType enum)
// Backend uses JsonStringEnumConverter, so it accepts string enum values
// Backend enum: 0=Azerbaijani, 1=Russian, 2=English
// We send the string enum name which JsonStringEnumConverter will parse
const LANGUAGE_NAME_TO_ENUM_STRING: { [key: string]: string } = {
  'Azerbaijani': 'Azerbaijani',
  'Russian': 'Russian',
  'English': 'English',
}

// Helper function to normalize language name for backend
function getLanguageEnumString(languageName: string): string {
  // Ensure proper casing for enum string
  const normalized = languageName.charAt(0).toUpperCase() + languageName.slice(1).toLowerCase()
  return LANGUAGE_NAME_TO_ENUM_STRING[normalized] ?? 'English' // Default to English
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
    // Backend expects LanguageType enum with JsonStringEnumConverter
    // Backend enum: 0=Azerbaijani, 1=Russian, 2=English
    // JsonStringEnumConverter accepts string enum values like "English", "Azerbaijani", "Russian"
    const languageEnumString = getLanguageEnumString(request.LanguageId)
    const requestBody = {
      Title: request.Title,
      Description: request.Description,
      LanguageId: languageEnumString, // Send enum string value (e.g., "English")
    }

    console.log(`[addCourseDetail] Language conversion: "${request.LanguageId}" -> "${languageEnumString}"`)
    console.log(`[addCourseDetail] Request body:`, JSON.stringify(requestBody, null, 2))
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
    // Backend expects LanguageType enum with JsonStringEnumConverter
    // Backend enum: 0=Azerbaijani, 1=Russian, 2=English
    // JsonStringEnumConverter accepts string enum values like "English", "Azerbaijani", "Russian"
    const languageEnumString = getLanguageEnumString(request.LanguageId)
    const requestBody = {
      Title: request.Title,
      Description: request.Description,
      LanguageId: languageEnumString, // Send enum string value (e.g., "English")
    }

    console.log(`[updateCourseDetail] Language conversion: "${request.LanguageId}" -> "${languageEnumString}"`)
    console.log(`[updateCourseDetail] Request body:`, JSON.stringify(requestBody, null, 2))
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

    // Validate UsedLanguageId exists in database
    try {
      const availableLanguages = await getUsedLanguages()
      const languageExists = availableLanguages.some(lang => lang.id === request.UsedLanguageId)
      
      if (!languageExists) {
        const availableIds = availableLanguages.map(l => l.id).join(', ')
        throw new Error(
          `Invalid UsedLanguageId: ${request.UsedLanguageId}. ` +
          `Available IDs: ${availableIds || 'None found'}. ` +
          `Please select a valid language from the dropdown.`
        )
      }
    } catch (langError: any) {
      // If we can't fetch languages, log but don't fail (might be network issue)
      console.warn(`[updateCourse] Could not validate UsedLanguageId:`, langError.message)
      // Only throw if it's our validation error
      if (langError.message.includes('Invalid UsedLanguageId')) {
        throw langError
      }
    }

    const formData = new FormData()

    // Map to backend format according to Swagger
    // Swagger shows: CategoryId, Level, IsFree, Price, InstructorId, Thumbnail, UsedLanguageId, Rating, DurationMinutes
    // Also include Title and Description for updating CourseDetail

    // Extract Title and Description from Details array (prefer English detail, or use first one)
    const englishDetail = request.Details?.find(d => 
      d.languageId === DEFAULT_LANGUAGE_ID || 
      d.languageId === 'English' ||
      d.languageId === 'b2c3d4e5-2345-6789-abcd-ef0123456789'
    ) || request.Details?.[0]
    
    if (englishDetail) {
      if (englishDetail.title) {
        formData.append('Title', englishDetail.title)
      }
      if (englishDetail.description) {
        formData.append('Description', englishDetail.description)
      }
    }

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
  name: string
  isDeactive: boolean
}

export interface UsedLanguage {
  id: string
  isoCode: string
  isDeactive: boolean
}

export interface Teacher {
  id: string
  fullName?: string
  email?: string
  phoneNumber?: string
  specialty: string
  rating: number
  experienceYears: number
  pricePerHourInAZN: number
  isDeactive: boolean
}

/**
 * Get all categories from backend
 * Backend: GET /api/Category/GetAll?language=English
 * Note: Categories are filtered by language, so we fetch for all languages and merge
 */
export async function getCategories(language: 'English' | 'Azerbaijani' | 'Russian' = 'English'): Promise<Category[]> {
  try {
    // Fetch categories for the specified language
    const response = await fetch(`${BACKEND_API_BASE_URL}/Category/GetAll?language=${language}`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }

    const data = await response.json()
    // Filter out deactivated categories
    return Array.isArray(data) ? data.filter((cat: Category) => !cat.isDeactive) : []
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

/**
 * Get all categories for all languages (merged)
 * This ensures we get all categories even if they don't have translations in a specific language
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    // Fetch categories for all three languages and merge unique categories by ID
    const [englishCats, azerbaijaniCats, russianCats] = await Promise.all([
      getCategories('English').catch(() => []),
      getCategories('Azerbaijani').catch(() => []),
      getCategories('Russian').catch(() => []),
    ])

    // Merge all categories, keeping unique ones by ID
    const categoryMap = new Map<string, Category>()
    
    ;[...englishCats, ...azerbaijaniCats, ...russianCats].forEach((cat) => {
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, cat)
      }
    })

    return Array.from(categoryMap.values())
  } catch (error) {
    console.error('Error fetching all categories:', error)
    // Fallback to English only if merge fails
    return getCategories('English')
  }
}

/**
 * Get all used languages from backend
 * Backend: GET /api/UsedLanguage/GetAll
 */
export async function getUsedLanguages(): Promise<UsedLanguage[]> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/UsedLanguage/GetAll`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch used languages: ${response.statusText}`)
    }

    const data = await response.json()
    // Filter out deactivated languages
    const languages = Array.isArray(data) ? data.filter((lang: UsedLanguage) => !lang.isDeactive) : []
    
    // Log for debugging
    console.log(`[getUsedLanguages] Fetched ${languages.length} active languages:`, languages.map(l => ({ id: l.id, isoCode: l.isoCode })))
    
    return languages
  } catch (error) {
    console.error('Error fetching used languages:', error)
    throw error
  }
}

/**
 * Get all teachers from backend
 * Backend: GET /api/Teacher/GetAll
 */
export async function getTeachers(): Promise<Teacher[]> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/Teacher/GetAll`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch teachers: ${response.statusText}`)
    }

    const data = await response.json()
    // Filter out deactivated teachers
    const teachers = Array.isArray(data) ? data.filter((teacher: Teacher) => !teacher.isDeactive) : []
    
    // Log for debugging
    console.log(`[getTeachers] Fetched ${teachers.length} active teachers:`, teachers.map(t => ({ id: t.id, name: t.fullName })))
    
    return teachers
  } catch (error) {
    console.error('Error fetching teachers:', error)
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
