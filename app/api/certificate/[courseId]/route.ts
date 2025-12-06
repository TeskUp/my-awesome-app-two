import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Fetch certificates from backend
    const endpointUrl = `${API_BASE_URL}/Certificate/${courseId}`
    
    console.log('=== FETCHING CERTIFICATES ===')
    console.log('Endpoint URL:', endpointUrl)
    console.log('Course ID:', courseId)
    console.log('============================')

    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    console.log('=== BACKEND RESPONSE ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('========================')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      
      // If 404 or 500 with "Student has not completed" message, return empty array
      // This means the user hasn't completed the course yet, so no certificate
      if (response.status === 404 || 
          (response.status === 500 && errorText.includes('has not completed'))) {
        console.log('No certificate found (course not completed or no certificate yet)')
        return NextResponse.json({
          certificates: [],
        })
      }

      // For other errors, still return empty array to prevent frontend errors
      // But log the error for debugging
      console.warn(`Backend returned ${response.status}, but returning empty certificates array`)
      return NextResponse.json({
        certificates: [],
      })
    }

    const data = await response.json()
    console.log('Certificates data:', data)

    // Backend might return array directly or wrapped in an object
    const certificates = Array.isArray(data) ? data : (data.certificates || data.items || [])

    return NextResponse.json({
      certificates,
    })
  } catch (error: any) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

