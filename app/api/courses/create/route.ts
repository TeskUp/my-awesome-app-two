import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData()

    const formData = new FormData()

    // Map frontend field names to backend field names according to Swagger
    // Swagger shows: CategoryId, Level, IsFree, Price, InstructorId, Thumbnail, UsedLanguageId, Rating, DurationMinutes
    // Note: Title and Description are NOT in Swagger, so we don't send them
    
    const categoryId = incomingFormData.get('CategoryId')
    if (!categoryId || String(categoryId).trim() === '') {
      return NextResponse.json(
        { error: 'CategoryId is required. Please select a category.' },
        { status: 400 }
      )
    }
    formData.append('CategoryId', String(categoryId))
    
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
    
    // Thumbnail (not Image)
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

    // Log form data for debugging (Swagger format - no Title/Description)
    console.log('=== CREATE COURSE REQUEST (Swagger format) ===')
    console.log('FormData keys:', Array.from(formData.keys()))
    console.log('CategoryId:', formData.get('CategoryId'))
    console.log('Level:', formData.get('Level'))
    console.log('IsFree:', formData.get('IsFree'))
    console.log('Price:', formData.get('Price'))
    console.log('InstructorId:', formData.get('InstructorId'))
    console.log('UsedLanguageId:', formData.get('UsedLanguageId'))
    console.log('Rating:', formData.get('Rating'))
    console.log('DurationMinutes:', formData.get('DurationMinutes'))
    console.log('Has Thumbnail:', formData.has('Thumbnail'))
    console.log('============================')

    // Get admin token for authentication FIRST
    let authToken: string | null = null
    try {
      authToken = await getAdminToken()
      console.log('Admin token obtained successfully, length:', authToken?.length || 0)
    } catch (authError: any) {
      console.error('Failed to get admin token:', authError)
      return NextResponse.json(
        { error: `Failed to authenticate as admin: ${authError?.message || 'Unknown error'}. Please check admin credentials.` },
        { status: 401 }
      )
    }
    
    // Forward the form data to backend API
    // Swagger shows: POST /api/admin/courses
    // Try the endpoint as shown in Swagger
    let url = `${API_BASE_URL}/admin/courses`
    console.log('=== CREATING COURSE ===')
    console.log('URL:', url)
    console.log('Method: POST')
    console.log('Has Auth Token:', !!authToken)
    console.log('Token Preview:', authToken ? `${authToken.substring(0, 30)}...` : 'N/A')
    console.log('FormData fields:', Array.from(formData.keys()))
    
    // Log all form data values (except files)
    Array.from(formData.keys()).forEach(key => {
      const value = formData.get(key)
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name}, ${value.size} bytes, ${value.type}`)
      } else {
        console.log(`${key}:`, value)
      }
    })
    
    // Try with Authorization header
    // Swagger shows: -H 'accept: */*' -H 'Content-Type: multipart/form-data'
    // But we should NOT set Content-Type manually for FormData - browser sets it with boundary
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${authToken}`,
        // Don't set Content-Type for FormData - browser will set it with boundary automatically
      },
      body: formData,
      cache: 'no-store',
    })
    
    console.log('=== RESPONSE (First Attempt) ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    let responseText = await response.text()
    
    // If 404, try alternative endpoint formats
    if (response.status === 404) {
      console.log('=== TRYING ALTERNATIVE ENDPOINTS ===')
      const alternatives = [
        `${API_BASE_URL}/Admin/Courses`, // Capitalized
        `${API_BASE_URL}/Admin/courses`, // Mixed
        `${API_BASE_URL}/admin/Courses`, // Mixed
      ]
      
      for (const altUrl of alternatives) {
        console.log(`Trying: ${altUrl}`)
        
        // Create new FormData for each attempt (FormData can only be used once)
        const altFormData = new FormData()
        Array.from(formData.keys()).forEach(key => {
          const value = formData.get(key)
          if (value instanceof File) {
            altFormData.append(key, value)
          } else if (value !== null) {
            altFormData.append(key, String(value))
          }
        })
        
        const altResponse = await fetch(altUrl, {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Authorization': `Bearer ${authToken}`,
          },
          body: altFormData,
          cache: 'no-store',
        })
        
        console.log(`Response from ${altUrl}:`, altResponse.status)
        
        if (altResponse.ok) {
          console.log(`SUCCESS with ${altUrl}!`)
          response = altResponse
          url = altUrl
          responseText = await altResponse.text()
          break
        } else {
          const altResponseText = await altResponse.text()
          console.log(`Failed with ${altUrl}:`, altResponse.status, altResponseText.substring(0, 100))
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `Failed to create course: ${response.status} ${response.statusText}`
      let errorDetails: any = null
      
      // If 404, try alternative endpoint formats
      if (response.status === 404) {
        console.error('=== 404 ERROR - TRYING ALTERNATIVE ENDPOINTS ===')
        console.error('Original URL:', url)
        console.error('Response Text:', responseText)
        
        // Try alternative endpoint formats (case-sensitive backend might require different casing)
        const alternativeUrls = [
          `${API_BASE_URL}/Admin/Courses`, // Capitalized
          `${API_BASE_URL}/Admin/courses`, // Mixed case
          `${API_BASE_URL}/admin/Courses`, // Mixed case
        ]
        
        console.error('Alternative endpoints to try:', alternativeUrls)
        console.error('Please check Swagger documentation: https://teskup-production.up.railway.app/swagger/index.html')
        
        errorMessage = `Endpoint not found (404). Requested: ${url}. Response: ${responseText.substring(0, 200)}. Please check Swagger documentation: https://teskup-production.up.railway.app/swagger/index.html to verify the correct endpoint.`
        console.error('404 Error - Create endpoint might be wrong. Check Swagger for correct endpoint.')
      }
      
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
        if (responseText && response.status !== 404) {
          errorMessage = `${errorMessage} - ${responseText}`
        }
      }
      
      console.error('Create course error:', errorMessage)
      console.error('Response status:', response.status)
      console.error('Response text:', responseText)
      
      // Azərbaycan dilində error mesajı
      let azErrorMessage = errorMessage
      if (response.status === 500) {
        azErrorMessage = 'Kurs yaradılarkən xəta baş verdi. Zəhmət olmasa dəyərləri yoxlayın və yenidən cəhd edin.'
      } else if (response.status === 401) {
        azErrorMessage = 'İcazə xətası. Admin hesabınızı yoxlayın.'
      } else if (response.status === 400) {
        azErrorMessage = 'Yanlış məlumat. Zəhmət olmasa bütün sahələri düzgün doldurun.'
      }
      
      return NextResponse.json(
        { error: azErrorMessage, details: errorDetails, originalError: errorMessage },
        { status: response.status }
      )
    }

    let responseData: any = { success: true }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log('CreateCourse response data:', responseData)
      } catch (parseError) {
        console.log('CreateCourse response text (not JSON):', responseText)
      }
    }
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error in create course API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

