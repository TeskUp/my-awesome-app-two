import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting section:', id)

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

    const response = await fetch(`${API_BASE_URL}/admin/sections/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to delete section: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Delete section error response:', responseText)
        
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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete section API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

