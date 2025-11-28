import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, order } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    console.log('Creating section for course:', courseId)
    console.log('Section data:', { title, order })

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

    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title,
        order: order || 0,
      }),
      cache: 'no-store',
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Failed to create section: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(responseText)
        if (errorData.errors) {
          const errorText = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          errorMessage = `${errorMessage} - ${errorText}`
        } else if (errorData.title) {
          errorMessage = `${errorMessage} - ${errorData.title}`
        } else if (errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`
        }
      } catch {
        if (responseText) {
          errorMessage = `${errorMessage} - ${responseText}`
        }
      }
      
      console.error('Create section error:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    let responseData: any = { success: true }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log('CreateSection response data:', responseData)
        
        // Map backend response to frontend format
        if (responseData.id) {
          return NextResponse.json({
            id: responseData.id,
            courseId: courseId,
            title: responseData.title || title,
            order: responseData.order || order || 0,
            createdAt: responseData.createdAt || new Date().toISOString(),
            updatedAt: responseData.updatedAt || new Date().toISOString(),
          })
        }
      } catch (parseError) {
        console.log('CreateSection response text (not JSON):', responseText)
      }
    }
    
    // If response doesn't have id, return with generated data
    return NextResponse.json({
      id: responseData.id || `temp-${Date.now()}`,
      courseId: courseId,
      title: title,
      order: order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in create section API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

