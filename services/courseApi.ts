// services/courseApi.ts - Düzəldilmiş versiya

const BACKEND_API_BASE_URL = 'https://teskup-production.up.railway.app/api'

/**
 * Add course detail (title, description) to a course
 * Backend: POST /api/admin/courses/{courseId}/details
 */
export async function addCourseDetail(courseId: string, request: AddCourseDetailRequest): Promise<void> {
  try {
    console.log(`[addCourseDetail] Starting for courseId: ${courseId}, language: ${request.LanguageId}`)
    
    // Backend expects: { Title, Description, LanguageId }
    const requestBody = {
      Title: request.Title,
      Description: request.Description,
      LanguageId: request.LanguageId, // "English", "Azerbaijani", "Russian"
    }
    
    console.log(`[addCourseDetail] Sending POST to: ${BACKEND_API_BASE_URL}/admin/courses/${courseId}/details`)
    
    const response = await fetch(`${BACKEND_API_BASE_URL}/admin/courses/${courseId}/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
      throw new Error(errorMessage)
    }
    
    const responseData = await response.json().catch(() => ({}))
    console.log(`[addCourseDetail] ✓ Success:`, responseData)
  } catch (error: any) {
    console.error(`[addCourseDetail] ✗ Error:`, error)
    throw error
  }
}

/**
 * Update course detail (title, description) for a course
 * Backend: PUT /api/admin/courses/{courseId}/details
 */
export async function updateCourseDetail(courseId: string, request: AddCourseDetailRequest): Promise<void> {
  try {
    console.log(`[updateCourseDetail] Starting for courseId: ${courseId}, language: ${request.LanguageId}`)
    
    // Backend expects: { Title, Description, LanguageId }
    const requestBody = {
      Title: request.Title,
      Description: request.Description,
      LanguageId: request.LanguageId, // "English", "Azerbaijani", "Russian"
    }
    
    console.log(`[updateCourseDetail] Sending PUT to: ${BACKEND_API_BASE_URL}/admin/courses/${courseId}/details`)
    
    const response = await fetch(`${BACKEND_API_BASE_URL}/admin/courses/${courseId}/details`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
      throw new Error(errorMessage)
    }
    
    const responseData = await response.json().catch(() => ({}))
    console.log(`[updateCourseDetail] ✓ Success:`, responseData)
  } catch (error: any) {
    console.error(`[updateCourseDetail] ✗ Error:`, error)
    throw error
  }
}
