import { NextRequest, NextResponse } from 'next/server'

// Increase timeout for API route (max 60 seconds for Vercel, but can be higher for self-hosted/Railway)
// Note: Railway doesn't have the same 60s limit as Vercel
export const maxDuration = 300 // 5 minutes for Railway

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData()

    // Prepare FormData for backend
    // Backend requires: Name, Date, File, and Email (despite Swagger UI showing only File and Email)
    const formData = new FormData()

    // Handle Name - required by backend validation
    const name = incomingFormData.get('Name')
    if (!name || String(name).trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    formData.append('Name', String(name))

    // Handle Date - required by backend validation
    const date = incomingFormData.get('Date')
    if (!date || String(date).trim() === '') {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }
    formData.append('Date', String(date))

    // Handle File
    const file = incomingFormData.get('File')
    if (!file) {
      return NextResponse.json(
        { error: 'Certificate PDF file is required' },
        { status: 400 }
      )
    }
    
    // Append file directly to FormData - backend expects 'File' field name
    // Type guard: ensure file is a File instance
    if (!file || typeof file !== 'object' || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı. Lütfen geçerli bir dosya yükleyin.' },
        { status: 400 }
      )
    }
    
    formData.append('File', file)

    // Handle Email
    const email = incomingFormData.get('Email')
    if (!email || String(email).trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    formData.append('Email', String(email))

    // Use the exact endpoint from Swagger (confirmed working)
    const endpointUrl = `${API_BASE_URL}/Form/submit`
    
    console.log('=== SENDING FORM SUBMIT REQUEST ===')
    console.log('Endpoint URL:', endpointUrl)
    console.log('Name:', formData.get('Name'))
    console.log('Date:', formData.get('Date'))
    console.log('Email:', formData.get('Email'))
    console.log('Has File:', formData.has('File'))
    const fileForLog = formData.get('File')
    if (fileForLog && fileForLog instanceof File) {
      console.log('File Name:', fileForLog.name)
      console.log('File Size:', fileForLog.size, 'bytes')
      console.log('File Type:', fileForLog.type)
    }
    console.log('===================================')

    // Create AbortController for timeout - increased to 300 seconds (5 minutes)
    // Backend email sending can take time
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 300 seconds (5 minutes) timeout
    
    let response: Response
    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          // Don't set Content-Type - browser will set it automatically for FormData with boundary
          // This matches Swagger's curl command exactly
        },
        body: formData,
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('=== REQUEST TIMEOUT ===')
        console.error('Timeout after 300 seconds (5 minutes)')
        return NextResponse.json(
          { error: 'Request timeout: Backend took too long to respond (300 seconds). The email service might be slow. Please try again.' },
          { status: 504 }
        )
      }
      console.error('=== FETCH ERROR ===')
      console.error('Error Name:', fetchError.name)
      console.error('Error Message:', fetchError.message)
      console.error('Error Stack:', fetchError.stack)
      console.error('Full Error:', JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError)))
      return NextResponse.json(
        { error: `Network error: ${fetchError.message || 'Failed to connect to backend'}` },
        { status: 500 }
      )
    }

    console.log('=== BACKEND RESPONSE ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('========================')

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to send certificate: ${response.status} ${response.statusText}`
      
      console.log('=== ERROR RESPONSE ===')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Error Text:', errorText)
      console.log('Error Text Length:', errorText.length)
      console.log('======================')
      
      // If 404, provide more specific error message
      if (response.status === 404) {
        errorMessage = `Endpoint not found (404). Tried: ${endpointUrl}. Please check Swagger documentation to verify the correct endpoint path.`
        console.error('404 Error - Endpoint not found. Check Swagger for correct endpoint.')
      }
      
      // Try to parse error as JSON
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        } else if (errorData.title || errorData.detail) {
          errorMessage = errorData.title || errorData.detail
        }
      } catch {
        // If not JSON, use the raw error text
        if (errorText && errorText.trim()) {
          errorMessage = errorText.trim()
        }
      }
      
      // Always include the full error message for debugging
      console.error('Final Error Message:', errorMessage)
      
      return NextResponse.json(
        { error: errorMessage, details: errorText },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    console.log('Response Text:', responseText)
    
    return NextResponse.json({
      success: true,
      message: responseText || 'Email sent successfully',
    })
  } catch (error: any) {
    console.error('Error in form submit API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

