import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      )
    }

    // Get form data from request
    const incomingFormData = await request.formData()

    // Create new FormData to ensure all fields are properly set
    const formData = new FormData()

    // Extract key fields before copying (we need them for Details array)
    const title = incomingFormData.get('Title')?.toString() || ''
    const description = incomingFormData.get('Description')?.toString() || ''
    const categoryId = incomingFormData.get('CategoryId')?.toString() || ''
    const tagsCsv = incomingFormData.get('TagsCsv')?.toString() || ''
    const author = incomingFormData.get('Author')?.toString() || ''
    const readTimeMinutes = incomingFormData.get('ReadTimeMinutes')?.toString() || '5'
    const link = incomingFormData.get('Link')?.toString() || 'https://teskup.com'
    const isDeactive = incomingFormData.get('IsDeactive')?.toString() || 'false'
    let providedLanguageId = incomingFormData.get('LanguageId')?.toString() || ''
    
    // Get image files
    const coverPicture = incomingFormData.get('CoverPicture')
    const imageUrl = incomingFormData.get('ImageUrl')?.toString() || ''

    // Copy all fields from incoming form data
    const entries = Array.from(incomingFormData.entries())
    for (const [key, value] of entries) {
      const fileValue = value as File | Blob | string
      if (fileValue && typeof fileValue === 'object' && (fileValue instanceof File || fileValue instanceof Blob)) {
        formData.append(key, fileValue)
      } else {
        formData.append(key, String(fileValue))
      }
    }

    // Ensure Link field is present (required by backend)
    const linkValue = formData.get('Link')?.toString() || ''
    if (!linkValue || linkValue.trim() === '') {
      formData.set('Link', 'https://teskup.com')
    }

    // Handle LanguageId - According to Swagger docs, LanguageId is a STRING (language name), not a GUID!
    // Example from Swagger: "Azerbaijani" (not a GUID)
    
    // providedLanguageId is already defined above, just get it from formData if needed
    // But we already have it from incomingFormData, so use that
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

    // Ensure all required fields are set
    formData.set('Id', id)
    formData.set('Title', title)
    formData.set('Description', description)
    formData.set('CategoryId', categoryId)
    formData.set('TagsCsv', tagsCsv)
    formData.set('Author', author)
    formData.set('ReadTimeMinutes', readTimeMinutes)
    formData.set('Link', link)
    formData.set('IsDeactive', isDeactive)
    
    // Ensure image is set if provided
    if (coverPicture && coverPicture instanceof File) {
      formData.set('CoverPicture', coverPicture)
    } else if (imageUrl) {
      formData.set('ImageUrl', imageUrl)
    }
    
    // Create Details array as required by the API for ALL 3 languages
    // Details should be an array of objects with: id, title, description, languageId
    // Add details for English, Azerbaijani, and Russian so it works in all languages
    const languages = [
      { name: 'English', id: '669f256a-0b60-4989-bf88-4817b50dd365' },
      { name: 'Azerbaijani', id: '423dfdaf-ad5b-4843-a009-3abc5261e1a0' },
      { name: 'Russian', id: '1c9980c5-a7df-4bd7-9ef6-34eb3f2dbcac' }
    ]
    
    const detailsArray = languages.map(lang => ({
      id: id,
      title: title,
      description: description,
      languageId: lang.name, // Use language name (e.g., "English", "Azerbaijani", "Russian")
    }))
    
    // Append Details array as JSON string
    // Backend expects Details as array<object> in multipart/form-data
    // We send it as a JSON string which the backend will parse
    formData.set('Details', JSON.stringify(detailsArray))
    
    console.log('=== DETAILS ARRAY ===')
    console.log('Details array:', detailsArray)
    console.log('Details as JSON string:', JSON.stringify(detailsArray))
    console.log('=====================')

    // Log all form data for debugging
    console.log('=== UPDATE NEWS REQUEST ===')
    console.log('News ID:', id)
    console.log('FormData keys:', Array.from(formData.keys()))
    console.log('Title:', formData.get('Title'))
    console.log('Description:', formData.get('Description'))
    console.log('CategoryId:', formData.get('CategoryId'))
    console.log('LanguageId:', formData.get('LanguageId'))
    console.log('Link:', formData.get('Link'))
    console.log('Id field:', formData.get('Id'))
    console.log('Details:', formData.get('Details'))
    console.log('===========================')

    // Forward the form data to backend API
    const response = await fetch(`${API_BASE_URL}/News/Update/${id}`, {
      method: 'PUT',
      body: formData,
      cache: 'no-store',
    })

    // Read response as text first (can only be read once)
    const responseText = await response.text()
    console.log('=== UPDATE RESPONSE ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Response Text:', responseText)
    console.log('=======================')

    if (!response.ok) {
      let errorMessage = `Failed to update news: ${response.status} ${response.statusText}`
      let errorDetails: any = null
      
      try {
        console.error('Backend Update Error Response:', responseText)
        
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
          } else if (errorDetails.error) {
            errorMessage = `${errorMessage} - ${errorDetails.error}`
          }
        } catch {
          // If not JSON, use text as is
          if (responseText) {
            errorMessage = `${errorMessage} - ${responseText}`
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      // Check if it's a "row not found" error - but don't change the error message format
      // Let the frontend handle the error message display
      if (errorMessage.includes('expected to affect 1 row') || errorMessage.includes('actually affected 0 row')) {
        console.warn(`Update failed: News with ID ${id} might not exist or was not updated`)
        // Keep the original error message but add more context
        errorMessage = `Update failed: ${errorMessage}. News ID: ${id}`
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
          
          const retryResponse = await fetch(`${API_BASE_URL}/News/Update/${id}`, {
            method: 'PUT',
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
        
        const retryResponse = await fetch(`${API_BASE_URL}/News/Update/${id}`, {
          method: 'PUT',
          body: formData,
          cache: 'no-store',
        })
        
        if (retryResponse.ok) {
          return NextResponse.json({ success: true })
        }
        
        console.error('All LanguageId strategies failed. Backend might require a specific language name format.')
      }
      
      console.error('=== UPDATE ERROR ===')
      console.error('Status:', response.status)
      console.error('Error message:', errorMessage)
      console.error('Error details:', errorDetails)
      console.error('====================')
      
      return NextResponse.json(
        { error: errorMessage, details: errorDetails },
        { status: response.status }
      )
    }

    // Success - parse response if available
    let responseData: any = { success: true }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log('Update success response:', responseData)
      } catch {
        console.log('Update success (non-JSON response):', responseText)
        // If not JSON, still return success
      }
    }
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error in update news API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

