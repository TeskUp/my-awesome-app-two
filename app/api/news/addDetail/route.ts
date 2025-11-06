import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('id')
    
    if (!newsId) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      )
    }

    // Get form data from request
    const incomingFormData = await request.formData()

    // Create new FormData for backend
    const formData = new FormData()

    // Copy all fields from incoming form data
    const entries = Array.from(incomingFormData.entries())
    for (const [key, value] of entries) {
      const fileValue = value as File | Blob | string
      if (fileValue && fileValue instanceof File) {
        formData.append(key, fileValue)
      } else {
        formData.append(key, String(fileValue))
      }
    }

    // Handle LanguageId - convert to language name if needed
    let providedLanguageId = formData.get('LanguageId')?.toString() || ''
    formData.delete('LanguageId')
    
    // Map language codes/names to backend expected format
    let languageId = 'English' // Default
    
    if (providedLanguageId) {
      const lowerLang = providedLanguageId.toLowerCase()
      if (lowerLang === 'az' || lowerLang.includes('azerbaijani')) {
        languageId = 'Azerbaijani'
      } else if (lowerLang === 'en' || lowerLang.includes('english')) {
        languageId = 'English'
      } else if (lowerLang === 'ru' || lowerLang.includes('russian')) {
        languageId = 'Russian'
      } else {
        // If it's already a language name, use it as is
        languageId = providedLanguageId
      }
    }
    
    formData.append('LanguageId', languageId)

    // Based on Swagger, the correct endpoint is: /api/News/AddNewsDetail/newsdetails/{id}
    // Also add NewsId to formData as it might be required by backend
    formData.append('NewsId', newsId)
    
    console.log(`[addDetail API] ========================================`)
    console.log(`[addDetail API] News ID: ${newsId}`)
    console.log(`[addDetail API] Using LanguageId as language name: ${languageId} (converted from: ${providedLanguageId || 'default'})`)
    console.log(`[addDetail API] Title: ${formData.get('Title')}`)
    console.log(`[addDetail API] Description: ${formData.get('Description')}`)
    console.log(`[addDetail API] LanguageId: ${formData.get('LanguageId')}`)
    console.log(`[addDetail API] NewsId: ${formData.get('NewsId')}`)
    console.log(`[addDetail API] ========================================`)
    
    // Use the correct endpoint from Swagger: /api/News/AddNewsDetail/newsdetails/{id}
    const backendUrl = `${API_BASE_URL}/News/AddNewsDetail/newsdetails/${newsId}`
    console.log(`[addDetail API] Sending POST request to: ${backendUrl}`)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })

    console.log(`[addDetail API] Backend response status: ${response.status} ${response.statusText}`)
    const responseText = await response.text()
    console.log(`[addDetail API] Backend response text (full):`, responseText)

    if (!response.ok) {
      let errorMessage = `Failed to add news detail: ${response.statusText}`
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

    console.log(`[addDetail API] ✓✓✓ SUCCESS: News detail added successfully`)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error in add news detail API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

