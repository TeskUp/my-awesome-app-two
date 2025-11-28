import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Get JSON data from request body
    const body = await request.json()
    const { Title, Description, LanguageId } = body
    
    if (!Title || !Description || !LanguageId) {
      return NextResponse.json(
        { error: 'Title, Description, and LanguageId are required' },
        { status: 400 }
      )
    }

    // Handle LanguageId - convert to language name if needed
    let languageId = 'English' // Default
    
    if (LanguageId) {
      const lowerLang = LanguageId.toLowerCase()
      if (lowerLang === 'az' || lowerLang.includes('azerbaijani')) {
        languageId = 'Azerbaijani'
      } else if (lowerLang === 'en' || lowerLang.includes('english')) {
        languageId = 'English'
      } else if (lowerLang === 'ru' || lowerLang.includes('russian')) {
        languageId = 'Russian'
      } else {
        // If it's already a language name, use it as is
        languageId = LanguageId
      }
    }

    // Prepare JSON body according to Swagger: POST /api/admin/courses/{courseId}/details
    // Swagger shows: { courseId, title, description, languageId }
    const requestBody = {
      courseId: courseId,
      title: Title,
      description: Description,
      languageId: languageId
    }
    
    console.log(`[addDetail API] ========================================`)
    console.log(`[addDetail API] Course ID: ${courseId}`)
    console.log(`[addDetail API] Using LanguageId as language name: ${languageId} (converted from: ${LanguageId || 'default'})`)
    console.log(`[addDetail API] Title: ${Title}`)
    console.log(`[addDetail API] Description: ${Description}`)
    console.log(`[addDetail API] Request Body:`, requestBody)
    console.log(`[addDetail API] ========================================`)
    
    // Get admin token for authentication
    let authToken: string | null = null
    try {
      authToken = await getAdminToken()
      console.log('Admin token obtained successfully')
    } catch (authError: any) {
      console.error('Failed to get admin token:', authError)
      return NextResponse.json(
        { error: `Failed to authenticate as admin: ${authError?.message || 'Unknown error'}` },
        { status: 401 }
      )
    }
    
    // Use the correct endpoint from Swagger: POST /api/admin/courses/{courseId}/details
    const backendUrl = `${API_BASE_URL}/admin/courses/${courseId}/details`
    console.log(`[addDetail API] Sending POST request to: ${backendUrl}`)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    })

    console.log(`[addDetail API] Backend response status: ${response.status} ${response.statusText}`)
    const responseText = await response.text()
    console.log(`[addDetail API] Backend response text (full):`, responseText)

    if (!response.ok) {
      let errorMessage = `Failed to add course detail: ${response.statusText}`
      let errorDetails: any = null
      
      try {
        errorDetails = JSON.parse(responseText)
        console.error(`[addDetail API] Error details:`, errorDetails)
        
        if (errorDetails.errors) {
          const errorText = Object.entries(errorDetails.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          errorMessage = `${errorMessage} - ${errorText}`
        } else if (errorDetails.title) {
          errorMessage = `${errorMessage} - ${errorDetails.title}`
        } else if (errorDetails.message) {
          errorMessage = `${errorMessage} - ${errorDetails.message}`
        } else if (errorDetails.error) {
          errorMessage = `${errorMessage} - ${errorDetails.error}`
        }
      } catch (parseError) {
        console.error(`[addDetail API] Failed to parse error response:`, parseError)
        if (responseText) {
          errorMessage = `${errorMessage} - ${responseText}`
        }
      }
      
      console.error(`[addDetail API] ✗✗✗ ERROR: ${errorMessage}`)
      return NextResponse.json(
        { error: errorMessage, details: errorDetails },
        { status: response.status }
      )
    }

    // Parse success response
    let result: any = {}
    try {
      if (responseText) {
        result = JSON.parse(responseText)
        console.log(`[addDetail API] Success response parsed:`, result)
      }
    } catch (parseError) {
      // If response is not JSON but status is OK, that's fine
      console.log(`[addDetail API] Response is not JSON, but status is OK - assuming success`)
    }

    // Check if result contains error
    if (result.error) {
      console.error(`[addDetail API] Result contains error:`, result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log(`[addDetail API] ✓✓✓ SUCCESS: Course detail added successfully`)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error in add course detail API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

