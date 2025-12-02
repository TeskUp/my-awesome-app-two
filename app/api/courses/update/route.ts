import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const incomingFormData = await request.formData()

    const formData = new FormData()

    // Map frontend field names to backend field names according to Swagger
    // Swagger shows: CategoryId, Level, IsFree, Price, InstructorId, Thumbnail, UsedLanguageId, Rating, DurationMinutes
    // Note: Title and Description are NOT in Swagger, so we don't send them
    
    const categoryId = incomingFormData.get('CategoryId')
    if (categoryId) formData.append('CategoryId', String(categoryId))
    
    // Level (not LevelId)
    const level = incomingFormData.get('Level') || incomingFormData.get('LevelId')
    if (level) formData.append('Level', String(level))
    
    const isFree = incomingFormData.get('IsFree')
    if (isFree !== null) formData.append('IsFree', String(isFree))
    
    const price = incomingFormData.get('Price')
    if (price !== null) formData.append('Price', String(price))
    
    // InstructorId (single, not TeacherIds array)
    const instructorId = incomingFormData.get('InstructorId') || incomingFormData.getAll('TeacherIds')[0]
    if (!instructorId || String(instructorId).trim() === '') {
      return NextResponse.json(
        { error: 'InstructorId is required. Please select at least one teacher.' },
        { status: 400 }
      )
    }
    formData.append('InstructorId', String(instructorId))
    
    // Thumbnail (not Image) - handle File type
    const thumbnail = incomingFormData.get('Thumbnail') || incomingFormData.get('Image')
    if (thumbnail && thumbnail instanceof File) {
      formData.append('Thumbnail', thumbnail)
    }
    
    const usedLanguageId = incomingFormData.get('UsedLanguageId')
    if (usedLanguageId) formData.append('UsedLanguageId', String(usedLanguageId))

    // Rating
    const rating = incomingFormData.get('Rating')
    if (rating !== null) formData.append('Rating', String(rating))

    // DurationMinutes
    const durationMinutes = incomingFormData.get('DurationMinutes')
    if (durationMinutes !== null) formData.append('DurationMinutes', String(durationMinutes))

    console.log('=== UPDATE COURSE REQUEST ===')
    console.log('Course ID:', id)
    console.log('FormData keys:', Array.from(formData.keys()))
    
    // Log all FormData values for debugging
    for (const key of Array.from(formData.keys())) {
      const value = formData.get(key)
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name}, ${value.size} bytes, ${value.type}`)
      } else {
        console.log(`${key}:`, value)
      }
    }
    
    // Validate required fields
    if (!categoryId || String(categoryId).trim() === '') {
      return NextResponse.json(
        { error: 'CategoryId is required. Please select a category.' },
        { status: 400 }
      )
    }
    if (!level) {
      console.error('✗ Level is missing!')
    }
    if (!instructorId) {
      console.error('✗ InstructorId is missing!')
    }
    if (!usedLanguageId) {
      console.error('✗ UsedLanguageId is missing!')
    }
    
    console.log('===========================')

    // Get admin token for authentication
    let authToken: string | null = null
    try {
      authToken = await getAdminToken()
    } catch (authError) {
      console.error('Failed to get admin token:', authError)
      return NextResponse.json(
        { error: 'Failed to authenticate as admin. Please check admin credentials.' },
        { status: 401 }
      )
    }

    // Validate required fields before sending
    if (!categoryId || !level || !instructorId || !usedLanguageId) {
      const missingFields = []
      if (!categoryId) missingFields.push('CategoryId')
      if (!level) missingFields.push('Level')
      if (!instructorId) missingFields.push('InstructorId')
      if (!usedLanguageId) missingFields.push('UsedLanguageId')
      
      console.error('✗✗✗ Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Forward the form data to backend API
    console.log(`Sending PUT request to: ${API_BASE_URL}/admin/courses/${id}`)
    const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
      cache: 'no-store',
    })

    const responseText = await response.text()
    console.log('=== UPDATE RESPONSE ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Response Text:', responseText)
    console.log('=======================')

    if (!response.ok) {
      let errorMessage = `Failed to update course: ${response.status} ${response.statusText}`
      let errorDetails: any = null
      
      try {
        console.error('=== BACKEND UPDATE ERROR ===')
        console.error('Status:', response.status)
        console.error('Status Text:', response.statusText)
        console.error('Response Text:', responseText)
        console.error('===========================')
        
        try {
          errorDetails = JSON.parse(responseText)
          console.error('Parsed Error Details:', JSON.stringify(errorDetails, null, 2))
          
          if (errorDetails.errors) {
            const errorText = Object.entries(errorDetails.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ')
            errorMessage = `${errorMessage} - ${errorText}`
            console.error('Validation Errors:', errorText)
          } else if (errorDetails.title) {
            errorMessage = `${errorMessage} - ${errorDetails.title}`
          } else if (errorDetails.message) {
            errorMessage = `${errorMessage} - ${errorDetails.message}`
            console.error('Error Message:', errorDetails.message)
          } else if (errorDetails.error) {
            errorMessage = `${errorMessage} - ${errorDetails.error}`
          } else if (errorDetails.statusCode) {
            errorMessage = `${errorMessage} - Status: ${errorDetails.statusCode}, Message: ${errorDetails.message || 'Unknown error'}`
            console.error('Error Status Code:', errorDetails.statusCode)
            console.error('Error Message:', errorDetails.message)
            console.error('Full Error Object:', errorDetails)
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          if (responseText) {
            errorMessage = `${errorMessage} - ${responseText}`
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      // Azərbaycan dilində error mesajı
      let azErrorMessage = errorMessage
      if (response.status === 500) {
        azErrorMessage = 'Kurs yenilənərkən xəta baş verdi. Zəhmət olmasa dəyərləri yoxlayın və yenidən cəhd edin.'
      } else if (response.status === 401) {
        azErrorMessage = 'İcazə xətası. Admin hesabınızı yoxlayın.'
      } else if (response.status === 400) {
        azErrorMessage = 'Yanlış məlumat. Zəhmət olmasa bütün sahələri düzgün doldurun.'
      } else if (response.status === 404) {
        azErrorMessage = 'Kurs tapılmadı. Zəhmət olmasa səhifəni yeniləyin.'
      }
      
      return NextResponse.json(
        { error: azErrorMessage, details: errorDetails, originalError: errorMessage },
        { status: response.status }
      )
    }

    // Parse success response
    let responseData: any = { success: true, message: 'Course updated successfully' }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log('Update success response:', responseData)
        
        // Ensure message is present
        if (!responseData.message && response.status === 200) {
          responseData.message = 'Course updated successfully'
        }
      } catch (parseError) {
        console.log('Update success (non-JSON response):', responseText)
        // If response is not JSON but status is OK, that's fine
        if (response.status === 200) {
          responseData = { success: true, message: 'Course updated successfully' }
        }
      }
    }
    
    console.log('Returning success response:', responseData)
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error in update course API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

