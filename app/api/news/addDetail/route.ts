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

    console.log(`AddNewsDetail: Using LanguageId as language name: ${languageId} (converted from: ${providedLanguageId || 'default'})`)

    // Forward the form data to backend API
    const response = await fetch(`${API_BASE_URL}/News/AddNewsDetail/newsdetails/${newsId}`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Failed to add news detail: ${response.statusText}`
      let errorDetails: any = null
      
      try {
        errorDetails = JSON.parse(responseText)
        if (errorDetails.errors) {
          const errorText = Object.entries(errorDetails.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          errorMessage = `${errorMessage} - ${errorText}`
        } else if (errorDetails.title) {
          errorMessage = `${errorMessage} - ${errorDetails.title}`
        } else if (errorDetails.message) {
          errorMessage = `${errorMessage} - ${errorDetails.message}`
        }
      } catch {
        if (responseText) {
          errorMessage = `${errorMessage} - ${responseText}`
        }
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorDetails },
        { status: response.status }
      )
    }

    // Return success response
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in add news detail API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

