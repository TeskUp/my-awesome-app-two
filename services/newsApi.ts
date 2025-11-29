// Use Next.js API routes as proxy to avoid CORS issues
const API_BASE_URL = '/api/news'
const BACKEND_API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export interface NewsResponse {
  id: string
  link: string
  coverPictureUrl: string
  title: string
  description: string
  author: string
  readTimeMinutes: number
  categoryName: string
  tags: string[]
  isDeactive: boolean
  viewCount: number
  likeCount: number
}

export interface CreateNewsRequest {
  Title: string
  Description: string
  CategoryId: string
  TagsCsv: string
  Author: string
  ReadTimeMinutes: number
  CoverPicture?: File | Blob
  ImageUrl?: string
  Link?: string
  IsDeactive: boolean
  LanguageId: string
}

// Category ID mapping - real kateqoriyalar və onların ID-ləri
// - psychology (lang: English)      -> 2b4d53c3-33ea-4e45-aa65-20d1e92d61a9
// - programming (lang: English)     -> 19ba8521-54d8-4f01-8935-6bac2e73011d
// - proqramlasdirma (lang: Azerbaijani) -> e46228f6-64c0-44fe-b84f-e2efdc3a334c
// Açarlar həmişə kiçik hərflə saxlanılır.
const CATEGORY_ID_MAP: { [key: string]: string } = {
  psychology: '2b4d53c3-33ea-4e45-aa65-20d1e92d61a9',
  programming: '19ba8521-54d8-4f01-8935-6bac2e73011d',
  proqramlasdirma: 'e46228f6-64c0-44fe-b84f-e2efdc3a334c',
}

// Language ID mapping - correct IDs from backend
const LANGUAGE_ID_MAP: { [key: string]: string } = {
  'az': '423dfdaf-ad5b-4843-a009-3abc5261e1a0', // Azerbaijani
  'en': '669f256a-0b60-4989-bf88-4817b50dd365', // English
  'ru': '1c9980c5-a7df-4bd7-9ef6-34eb3f2dbcac', // Russian
}

// Default Language ID (English) - using English as default
const DEFAULT_LANGUAGE_ID = LANGUAGE_ID_MAP['en'] || '669f256a-0b60-4989-bf88-4817b50dd365'

/**
 * Get all news articles
 */
export async function getAllNews(language: string = 'English'): Promise<NewsResponse[]> {
  try {
    // Backend expects language name like "English", not code like "en"
    // Map language codes to names if needed
    let languageName = language
    if (language === 'en') {
      languageName = 'English'
    } else if (language === 'az') {
      languageName = 'Azerbaijani'
    } else if (language === 'ru') {
      languageName = 'Russian'
    }
    
    const response = await fetch(`${API_BASE_URL}/getAll?language=${languageName}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('API Error Response:', errorData)
      throw new Error(errorData.error || `Failed to fetch news: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check if response has error
    if (data.error) {
      throw new Error(data.error)
    }

    return Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Error fetching news:', error)
    throw error
  }
}

/**
 * Get news detail by ID
 */
export async function getNewsDetail(newsId: string, language: string = 'English'): Promise<NewsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/getDetail?id=${newsId}&language=${language}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('API Error Response:', errorData)
      throw new Error(errorData.error || `Failed to fetch news detail: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check if response has error
    if (data.error) {
      throw new Error(data.error)
    }

    return data
  } catch (error: any) {
    console.error('Error fetching news detail:', error)
    throw error
  }
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const base64Data = base64.split(',')[1] || base64
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Create a new news article
 * Returns the created news ID if available in response
 */
export async function createNews(request: CreateNewsRequest): Promise<{ id?: string; success: boolean }> {
  try {
    const formData = new FormData()

    // Add text fields
    formData.append('Title', request.Title)
    formData.append('Description', request.Description)
    formData.append('CategoryId', request.CategoryId)
    formData.append('TagsCsv', request.TagsCsv)
    formData.append('Author', request.Author)
    formData.append('ReadTimeMinutes', request.ReadTimeMinutes.toString())
    formData.append('IsDeactive', request.IsDeactive.toString())
    // LanguageId should be language name (e.g., "English"), not GUID
    // But we'll send it as provided and let the API route handle conversion
    formData.append('LanguageId', request.LanguageId)
    
    // Link field is required - use placeholder URL if not provided
    formData.append('Link', request.Link || 'https://teskup.com')

    // Handle image - prioritize CoverPicture (file/blob) over ImageUrl
    if (request.CoverPicture) {
      // If it's a File, use it directly
      if (request.CoverPicture instanceof File) {
        formData.append('CoverPicture', request.CoverPicture)
      } 
      // If it's a Blob, convert to File
      else if (request.CoverPicture instanceof Blob) {
        const file = new File([request.CoverPicture], 'cover.jpg', { type: request.CoverPicture.type || 'image/jpeg' })
        formData.append('CoverPicture', file)
      }
    } else if (request.ImageUrl) {
      formData.append('ImageUrl', request.ImageUrl)
    }

    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorMessage = errorData.error || `Failed to create news: ${response.statusText}`
      throw new Error(errorMessage)
    }

    // Check if response has error or contains created news ID
    const result = await response.json()
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Return result which may contain the created news ID
    return result
  } catch (error) {
    console.error('Error creating news:', error)
    throw error
  }
}

/**
 * Get category ID from category name
 */
export function getCategoryId(categoryName: string): string {
  // Normalize category name (trim + lowercase)
  const normalizedCategory = (categoryName || '').trim().toLowerCase()

  const categoryId = CATEGORY_ID_MAP[normalizedCategory]

  // Əgər tapmadıqsa, konkret error vəziyyəti olsun – caller bunu yoxlayıb user‑ə mesaj göstərə bilir
  if (!categoryId) {
    console.error(`getCategoryId: UNKNOWN CATEGORY "${categoryName}" (normalized: "${normalizedCategory}")`)
    return ''
  }
  
  console.log(`getCategoryId: "${categoryName}" -> "${normalizedCategory}" -> "${categoryId}"`)
  return categoryId
}

/**
 * Delete a news article
 */
export async function deleteNews(newsId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete?id=${newsId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorMessage = errorData.error || `Failed to delete news: ${response.statusText}`
      throw new Error(errorMessage)
    }

    // HardDelete endpoint may return 200 OK with empty body
    // Try to parse response, but don't fail if it's empty
    try {
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      // Success - result.success should be true
    } catch (parseError) {
      // If response is empty or not JSON, that's OK - 200 OK means delete succeeded
      console.log('Delete response is empty or not JSON, but status is OK - delete succeeded')
    }
  } catch (error) {
    console.error('Error deleting news:', error)
    throw error
  }
}

/**
 * Get default language ID
 * Try to get from existing news first, otherwise use default
 */
export async function getDefaultLanguageId(): Promise<string> {
  try {
    // Try to get language ID from existing news
    const news = await getAllNews('az')
    if (news.length > 0) {
      // If we have news, we can try to infer the language ID
      // For now, return the default
      return DEFAULT_LANGUAGE_ID
    }
  } catch (error) {
    console.warn('Could not fetch news to determine language ID, using default')
  }
  return DEFAULT_LANGUAGE_ID
}

/**
 * Get language ID synchronously (for cases where async is not possible)
 */
export function getDefaultLanguageIdSync(): string {
  return DEFAULT_LANGUAGE_ID
}

/**
 * Add news detail (title, description) to a news article
 */
export interface AddNewsDetailRequest {
  Title: string
  Description: string
  LanguageId: string
}

export async function addNewsDetail(newsId: string, request: AddNewsDetailRequest): Promise<void> {
  try {
    console.log(`[addNewsDetail] Starting for newsId: ${newsId}, language: ${request.LanguageId}`)
    console.log(`[addNewsDetail] Title: "${request.Title}", Description: "${request.Description}"`)
    
    const formData = new FormData()
    formData.append('Title', request.Title)
    formData.append('Description', request.Description)
    formData.append('LanguageId', request.LanguageId)

    console.log(`[addNewsDetail] Sending request to: ${API_BASE_URL}/addDetail?id=${newsId}`)
    
    const response = await fetch(`${API_BASE_URL}/addDetail?id=${newsId}`, {
      method: 'POST',
      body: formData,
    })

    console.log(`[addNewsDetail] Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const responseText = await response.text()
      console.error(`[addNewsDetail] Error response text:`, responseText)
      
      let errorData: any = { error: 'Unknown error' }
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText || `Failed to add news detail: ${response.statusText}` }
      }
      
      const errorMessage = errorData.error || errorData.message || `Failed to add news detail: ${response.statusText}`
      console.error(`[addNewsDetail] Error message:`, errorMessage)
      throw new Error(errorMessage)
    }

    const responseText = await response.text()
    console.log(`[addNewsDetail] Success response text:`, responseText)
    
    let result: any = {}
    try {
      result = JSON.parse(responseText)
    } catch {
      // If response is not JSON but status is OK, that's fine
      console.log(`[addNewsDetail] Response is not JSON, but status is OK - assuming success`)
      return
    }
    
    if (result.error) {
      console.error(`[addNewsDetail] Result contains error:`, result.error)
      throw new Error(result.error)
    }
    
    console.log(`[addNewsDetail] ✓ Successfully added news detail for ${request.LanguageId}`)
  } catch (error: any) {
    console.error(`[addNewsDetail] ✗ Error adding news detail for ${request.LanguageId}:`, error)
    console.error(`[addNewsDetail] Error message:`, error?.message)
    console.error(`[addNewsDetail] Error stack:`, error?.stack)
    throw error
  }
}

/**
 * Update a news article
 */
export interface UpdateNewsRequest extends CreateNewsRequest {
  Id: string
}

export async function updateNews(request: UpdateNewsRequest): Promise<void> {
  try {
    const formData = new FormData()

    // Add text fields
    formData.append('Id', request.Id)
    formData.append('Title', request.Title)
    formData.append('Description', request.Description)
    formData.append('CategoryId', request.CategoryId)
    formData.append('TagsCsv', request.TagsCsv)
    formData.append('Author', request.Author)
    formData.append('ReadTimeMinutes', request.ReadTimeMinutes.toString())
    formData.append('IsDeactive', request.IsDeactive.toString())
    formData.append('LanguageId', request.LanguageId.toLowerCase())
    formData.append('Link', request.Link || 'https://teskup.com')

    // Handle image
    if (request.CoverPicture) {
      if (request.CoverPicture instanceof File) {
        formData.append('CoverPicture', request.CoverPicture)
      } else if (request.CoverPicture instanceof Blob) {
        const file = new File([request.CoverPicture], 'cover.jpg', { type: request.CoverPicture.type || 'image/jpeg' })
        formData.append('CoverPicture', file)
      }
    } else if (request.ImageUrl) {
      formData.append('ImageUrl', request.ImageUrl)
    }

    const response = await fetch(`${API_BASE_URL}/update?id=${request.Id}`, {
      method: 'PUT',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorMessage = errorData.error || `Failed to update news: ${response.statusText}`
      throw new Error(errorMessage)
    }

    const result = await response.json()
    if (result.error) {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Error updating news:', error)
    throw error
  }
}

