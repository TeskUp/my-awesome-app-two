import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    
    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching lectures for section:', sectionId)

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

    // Admin endpoint: GET /api/admin/sections/{sectionId}/lectures
    const url = `${API_BASE_URL}/admin/sections/${sectionId}/lectures`
    console.log('Fetching from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch lectures: ${response.status} ${response.statusText}`
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
      const lectures = Array.isArray(data) ? data : (data.lectures || data.items || [])
      
      // Map to frontend format
      const mappedLectures = lectures.map((lecture: any) => ({
        id: lecture.id || '',
        sectionId: sectionId,
        title: lecture.title || '',
        description: lecture.description || '',
        durationSeconds: lecture.durationSeconds || lecture.duration || 0,
        order: lecture.order || lecture.orderNumber || 0,
        isLocked: lecture.isLocked !== undefined ? lecture.isLocked : false,
        translationAvailable: lecture.translationAvailable !== undefined ? lecture.translationAvailable : false,
        videoUrl: lecture.videoUrl || lecture.video || '',
        thumbnailUrl: lecture.thumbnailUrl || lecture.thumbnail || '',
        createdAt: lecture.createdAt || new Date().toISOString(),
        updatedAt: lecture.updatedAt || new Date().toISOString(),
      }))
      
      return NextResponse.json(mappedLectures)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', text)
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in getAll lectures API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

