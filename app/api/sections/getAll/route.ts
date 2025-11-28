import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching sections for course:', courseId)

    // Public endpoint: GET /api/courses/{courseId}/sections
    const url = `${API_BASE_URL}/courses/${courseId}/sections`
    console.log('Fetching from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch sections: ${response.status} ${response.statusText}`
      try {
        const errorText = await response.text()
        console.error('Backend API Error Response:', errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.errors) {
            const errorDetails = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ')
            errorMessage = `${errorMessage} - ${errorDetails}`
          } else if (errorData.title) {
            errorMessage = `${errorMessage} - ${errorData.title}`
          } else if (errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`
          }
        } catch {
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText}`
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const text = await response.text()
    
    if (!text || text.trim() === '') {
      return NextResponse.json([])
    }

    try {
      const data = JSON.parse(text)
      
      // Backend might return array directly or wrapped in an object
      const sections = Array.isArray(data) ? data : (data.sections || data.items || [])
      
      // Map to frontend format
      const mappedSections = sections.map((section: any) => ({
        id: section.id || '',
        courseId: courseId,
        title: section.title || '',
        order: section.order || section.orderNumber || 0,
        createdAt: section.createdAt || new Date().toISOString(),
        updatedAt: section.updatedAt || new Date().toISOString(),
      }))
      
      return NextResponse.json(mappedSections)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', text)
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in getAll sections API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

