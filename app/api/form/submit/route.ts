import { NextRequest, NextResponse } from 'next/server'

// Increase timeout for API route (max 60 seconds for Vercel, but can be higher for self-hosted/Railway)
// Note: Railway doesn't have the same 60s limit as Vercel
export const maxDuration = 300 // 5 minutes for Railway

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData()

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
    console.log('File Name:', formData.get('File') instanceof File ? (formData.get('File') as File).name : 'N/A')
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
      console.error('Error:', fetchError.message)
      throw fetchError
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
      console.log('======================')
      
      // If 404, provide more specific error message
      if (response.status === 404) {
        errorMessage = `Endpoint not found (404). Tried: ${endpointPaths.join(', ')}. Please check Swagger documentation to verify the correct endpoint path.`
        console.error('404 Error - All endpoint paths failed. Check Swagger for correct endpoint.')
      }
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        }
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
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

