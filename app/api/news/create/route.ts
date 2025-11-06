import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const incomingFormData = await request.formData()

    // Create new FormData to ensure all fields are properly set
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

    // Ensure Link field is present (required by backend)
    // Backend might require a valid URL, so use a placeholder if empty
    const linkValue = formData.get('Link')?.toString() || ''
    if (!linkValue || linkValue.trim() === '') {
      // Use a placeholder URL if Link is empty
      formData.set('Link', 'https://teskup.com')
    }

    // Handle LanguageId - According to Swagger docs, LanguageId is a STRING (language name), not a GUID!
    // Example from Swagger: "Azerbaijani" (not a GUID)
    // So we need to convert GUID to language name
    
    // Get LanguageId from form data (might be GUID from frontend)
    let providedLanguageId = formData.get('LanguageId')?.toString() || ''
    formData.delete('LanguageId')
    
    // Map GUID to language name (as backend expects language name, not GUID)
    const guidToLanguageName: { [key: string]: string } = {
      '423dfdaf-ad5b-4843-a009-3abc5261e1a0': 'Azerbaijani',
      '669f256a-0b60-4989-bf88-4817b50dd365': 'English',
      '1c9980c5-a7df-4bd7-9ef6-34eb3f2dbcac': 'Russian',
      // Also handle lowercase versions
      '423dfdafad5b4843a0093abc5261e1a0': 'Azerbaijani',
      '669f256a0b604989bf884817b50dd365': 'English',
      '1c9980c5a7df4bd79ef634eb3f2dbcac': 'Russian',
    }
    
    // Also map language codes to names
    const codeToLanguageName: { [key: string]: string } = {
      'az': 'Azerbaijani',
      'en': 'English',
      'ru': 'Russian',
    }
    
    let languageId = 'English' // Default to English
    
    // If a languageId was provided, try to convert it
    if (providedLanguageId) {
      const normalizedId = providedLanguageId.toLowerCase().trim()
      
      // Check if it's already a language name
      if (['english', 'azerbaijani', 'russian'].includes(normalizedId)) {
        languageId = normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1)
      }
      // Check if it's a language code
      else if (codeToLanguageName[normalizedId]) {
        languageId = codeToLanguageName[normalizedId]
      }
      // Check if it's a GUID and convert to language name
      else if (guidToLanguageName[normalizedId]) {
        languageId = guidToLanguageName[normalizedId]
      }
      // Check if it's a GUID with dashes
      else if (guidToLanguageName[normalizedId.replace(/-/g, '')]) {
        languageId = guidToLanguageName[normalizedId.replace(/-/g, '')]
      }
    }
    
    // Append LanguageId as language name (not GUID)
    formData.append('LanguageId', languageId)
    
    console.log(`Using LanguageId as language name: ${languageId} (converted from: ${providedLanguageId || 'default'})`)

    // Log form data for debugging
    console.log('FormData keys:', Array.from(formData.keys()))
    console.log('Link value:', formData.get('Link'))
    console.log('LanguageId value (as language name):', formData.get('LanguageId'))
    console.log('Title value:', formData.get('Title'))

    // Forward the form data to backend API
    const response = await fetch(`${API_BASE_URL}/News/CreateNews`, {
      method: 'POST',
      body: formData,
      // Disable cache
      cache: 'no-store',
    })

    // Get response as text first to check for errors and extract data
    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Failed to create news: ${response.statusText}`
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
        // If JSON parsing fails, use text response
        const errorText = await response.text()
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`
        }
      }
      
      // If LanguageId error, try different language name formats
      if (errorMessage.includes('LanguageId') && response.status === 400) {
        console.warn('LanguageId validation failed, trying different language name formats...')
        
        // Try different language name variants
        const languageNameVariants = [
          'English',
          'english',
          'ENGLISH',
          'Azerbaijani',
          'azerbaijani',
          'AZERBAIJANI',
          'Russian',
          'russian',
          'RUSSIAN',
          'en',
          'az',
          'ru',
        ]
        
        for (const variant of languageNameVariants) {
          console.log(`Trying LanguageId variant: ${variant}`)
          formData.set('LanguageId', variant)
          
          const retryResponse = await fetch(`${API_BASE_URL}/News/CreateNews`, {
            method: 'POST',
            body: formData,
            cache: 'no-store',
          })
          
          if (retryResponse.ok) {
            console.log(`Success with LanguageId: ${variant}`)
            return NextResponse.json({ success: true })
          }
        }
        
        // Try without LanguageId field
        console.log('Trying without LanguageId field...')
        formData.delete('LanguageId')
        
        const retryResponse = await fetch(`${API_BASE_URL}/News/CreateNews`, {
          method: 'POST',
          body: formData,
          cache: 'no-store',
        })
        
        if (retryResponse.ok) {
          return NextResponse.json({ success: true })
        }
        
        console.error('All LanguageId strategies failed. Backend might require a specific language name format.')
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorDetails },
        { status: response.status }
      )
    }

    // Try to parse response as JSON to get created news ID or other data
    let responseData: any = { success: true }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log('CreateNews response data:', responseData)
      } catch (parseError) {
        // If not JSON, response might be empty or plain text
        console.log('CreateNews response text (not JSON):', responseText)
        // Try to extract ID from response if it's in a different format
        if (responseText.includes('id') || responseText.includes('Id')) {
          console.log('Response might contain ID in non-JSON format')
        }
      }
    }
    
    // Return success response with any data from backend (may include created news ID)
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error in create news API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

