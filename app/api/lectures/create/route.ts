import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    
    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    const incomingFormData = await request.formData()
    const formData = new FormData()

    // Map fields to backend format - extract values once
    const titleValue = incomingFormData.get('Title')
    if (titleValue) formData.append('Title', String(titleValue))
    
    const descriptionValue = incomingFormData.get('Description')
    if (descriptionValue) formData.append('Description', String(descriptionValue))
    
    const durationSecondsValue = incomingFormData.get('DurationSeconds')
    if (durationSecondsValue) formData.append('DurationSeconds', String(durationSecondsValue))
    
    const orderValue = incomingFormData.get('Order')
    if (orderValue) formData.append('Order', String(orderValue))
    
    const isLockedValue = incomingFormData.get('IsLocked')
    if (isLockedValue !== null) formData.append('IsLocked', String(isLockedValue))
    
    const translationAvailableValue = incomingFormData.get('TranslationAvailable')
    if (translationAvailableValue !== null) formData.append('TranslationAvailable', String(translationAvailableValue))
    
    const videoUrlValue = incomingFormData.get('VideoUrl')
    if (videoUrlValue) formData.append('VideoUrl', String(videoUrlValue))
    
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

    console.log('Creating lecture for section:', sectionId)
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

    const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/lectures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
      cache: 'no-store',
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Failed to create lecture: ${response.status} ${response.statusText}`
      
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
      
      console.error('Create lecture error:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    let responseData: any = { success: true }
    if (responseText && responseText.trim() !== '') {
      try {
        responseData = JSON.parse(responseText)
        console.log('CreateLecture response data:', responseData)
        
        // Map backend response to frontend format
        if (responseData.id) {
          // Use already extracted values
          const title = titleValue?.toString() || ''
          const description = descriptionValue?.toString() || ''
          const durationSeconds = parseInt(durationSecondsValue?.toString() || '0')
          const order = parseInt(orderValue?.toString() || '0')
          const isLocked = isLockedValue?.toString() === 'true'
          const translationAvailable = translationAvailableValue?.toString() === 'true'
          const videoUrl = videoUrlValue?.toString() || ''
          
          return NextResponse.json({
            id: responseData.id,
            sectionId: sectionId,
            title: responseData.title || title,
            description: responseData.description || description,
            durationSeconds: responseData.durationSeconds || durationSeconds,
            order: responseData.order || order,
            isLocked: responseData.isLocked !== undefined ? responseData.isLocked : isLocked,
            translationAvailable: responseData.translationAvailable !== undefined ? responseData.translationAvailable : translationAvailable,
            videoUrl: responseData.videoUrl || videoUrl,
            thumbnailUrl: responseData.thumbnailUrl || responseData.thumbnail || '',
            createdAt: responseData.createdAt || new Date().toISOString(),
            updatedAt: responseData.updatedAt || new Date().toISOString(),
          })
        }
      } catch (parseError) {
        console.log('CreateLecture response text (not JSON):', responseText)
      }
    }
    
    // If response doesn't have id, return with generated data
    // Use already extracted values
    const title = titleValue?.toString() || ''
    const description = descriptionValue?.toString() || ''
    const durationSeconds = parseInt(durationSecondsValue?.toString() || '0')
    const order = parseInt(orderValue?.toString() || '0')
    const isLocked = isLockedValue?.toString() === 'true'
    const translationAvailable = translationAvailableValue?.toString() === 'true'
    const videoUrl = videoUrlValue?.toString() || ''
    
    return NextResponse.json({
      id: responseData.id || `temp-${Date.now()}`,
      sectionId: sectionId,
      title: title,
      description: description,
      durationSeconds: durationSeconds,
      order: order,
      isLocked: isLocked,
      translationAvailable: translationAvailable,
      videoUrl: videoUrl,
      thumbnailUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in create lecture API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

