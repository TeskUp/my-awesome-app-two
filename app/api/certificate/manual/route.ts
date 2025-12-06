import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData()

    // Note: Swagger shows this endpoint doesn't require authentication
    // But we'll try with auth token if needed (for retry logic)
    let authToken: string | null = null
    try {
      authToken = await getAdminToken()
      authToken = authToken?.trim() || null
    } catch (authError) {
      console.log('Could not get admin token (endpoint may not require auth):', authError)
      // Don't fail here - endpoint may not require auth
    }

    // Prepare FormData for backend
    const formData = new FormData()

    // Map frontend fields to backend format
    const name = incomingFormData.get('Name')
    if (!name || String(name).trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    formData.append('Name', String(name))

    const date = incomingFormData.get('Date')
    if (!date || String(date).trim() === '') {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }
    formData.append('Date', String(date))

    const courseId = incomingFormData.get('CourseId')
    if (!courseId || String(courseId).trim() === '') {
      return NextResponse.json(
        { error: 'CourseId is required' },
        { status: 400 }
      )
    }
    formData.append('CourseId', String(courseId))

    // Handle Email (to identify which user the certificate belongs to)
    const email = incomingFormData.get('Email')
    if (email && String(email).trim() !== '') {
      formData.append('Email', String(email))
    }

    // Handle File
    const file = incomingFormData.get('File')
    if (file && file instanceof File) {
      formData.append('File', file)
    } else {
      return NextResponse.json(
        { error: 'Certificate PDF file is required' },
        { status: 400 }
      )
    }

    console.log('=== SENDING CERTIFICATE MANUAL REQUEST ===')
    console.log('Name:', formData.get('Name'))
    console.log('Date:', formData.get('Date'))
    console.log('CourseId:', formData.get('CourseId'))
    console.log('Has File:', formData.has('File'))
    console.log('Auth Token:', authToken ? `${authToken.substring(0, 20)}...` : 'NONE (endpoint may not require auth)')
    console.log('==========================================')
    
    // Swagger shows this endpoint doesn't require Authorization header
    // But we'll include it if we have a token (some endpoints may require it)
    const headers: HeadersInit = {
      'Accept': '*/*',
      // Don't set Content-Type - browser will set it automatically for FormData with boundary
    }
    
    // Add Authorization header if we have a token
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }
    
    const response = await fetch(`${API_BASE_URL}/Certificate/manual`, {
      method: 'POST',
      headers: headers,
      body: formData,
      cache: 'no-store',
    })

    console.log('=== BACKEND RESPONSE ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    console.log('========================')

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to send certificate: ${response.status} ${response.statusText}`
      
      console.log('=== ERROR RESPONSE ===')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Error Text:', errorText)
      console.log('======================')
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        }
        
        // Check for specific backend service errors
        if (errorMessage.includes('ICertificateService') || errorMessage.includes('Unable to resolve service')) {
          errorMessage = 'Backend service configuration error. Please contact administrator.'
        }
      } catch {
        if (errorText) {
          // Check for service resolution errors in plain text
          if (errorText.includes('ICertificateService') || errorText.includes('Unable to resolve service')) {
            errorMessage = 'Backend service configuration error. Please contact administrator.'
          } else {
            errorMessage = `${errorMessage} - ${errorText}`
          }
        }
      }
      
      // If 401, provide more specific error message
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please check admin credentials or contact administrator.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      message: data.message || 'Certificate sent successfully',
      data: data,
    })
  } catch (error: any) {
    console.error('Error in certificate manual API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

