import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting news with ID:', id)

    // Forward the delete request to backend API
    const response = await fetch(`${API_BASE_URL}/News/HardDelete/${id}`, {
      method: 'DELETE',
      cache: 'no-store',
    })

    // HardDelete endpoint may return 200 OK with empty body or no body
    // Check if response is ok (status 200-299)
    if (!response.ok) {
      let errorMessage = `Failed to delete news: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Backend Delete Error Response:', responseText)
        
        if (responseText && responseText.trim() !== '') {
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
            } else if (errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`
            }
          } catch {
            if (responseText) {
              errorMessage = `${errorMessage} - ${responseText}`
            }
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

    // Response is ok - HardDelete returns 200 OK, body may be empty
    // Try to read response body, but don't fail if it's empty
    try {
      const responseText = await response.text()
      if (responseText && responseText.trim() !== '') {
        try {
          const responseData = JSON.parse(responseText)
          return NextResponse.json({ success: true, ...responseData })
        } catch {
          // If not JSON, just return success
          return NextResponse.json({ success: true })
        }
      }
    } catch (e) {
      // If reading response fails, still return success (200 OK means delete succeeded)
      console.log('Response body is empty or unreadable, but status is OK - delete succeeded')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete news API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

