import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lecture ID is required' },
        { status: 400 }
      )
    }

    const incomingFormData = await request.formData()
    const formData = new FormData()

    // Map fields to backend format
    const title = incomingFormData.get('Title')
    if (title) formData.append('Title', String(title))
    
    const description = incomingFormData.get('Description')
    if (description) formData.append('Description', String(description))
    
    const durationSeconds = incomingFormData.get('DurationSeconds')
    if (durationSeconds) formData.append('DurationSeconds', String(durationSeconds))
    
    const order = incomingFormData.get('Order')
    if (order) formData.append('Order', String(order))
    
    const isLocked = incomingFormData.get('IsLocked')
    if (isLocked !== null) formData.append('IsLocked', String(isLocked))
    
    const translationAvailable = incomingFormData.get('TranslationAvailable')
    if (translationAvailable !== null) formData.append('TranslationAvailable', String(translationAvailable))
    
    const videoUrl = incomingFormData.get('VideoUrl')
    if (videoUrl) formData.append('VideoUrl', String(videoUrl))
    
    // Handle Video file
    const video = incomingFormData.get('Video')
    if (video && video instanceof File) {
      formData.append('Video', video)
    }
    
    // Handle Thumbnail file
    const thumbnail = incomingFormData.get('Thumbnail')
    if (thumbnail && thumbnail instanceof File) {
      formData.append('Thumbnail', thumbnail)
    }

    console.log('Updating lecture:', id)
    console.log('FormData keys:', Array.from(formData.keys()))

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

    const response = await fetch(`${API_BASE_URL}/admin/lectures/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
      cache: 'no-store',
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Failed to update lecture: ${response.status} ${response.statusText}`
      
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
      
      console.error('Update lecture error:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    let responseData: any = { success: true }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        // Ignore parse error for empty responses
      }
    }
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error in update lecture API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

