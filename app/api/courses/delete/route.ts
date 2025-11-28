import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting course with ID:', id)

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

    const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to delete course: ${response.status} ${response.statusText}`
      
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
      
      // Azərbaycan dilində error mesajı
      let azErrorMessage = errorMessage
      if (response.status === 500) {
        azErrorMessage = 'Kurs silinərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
      } else if (response.status === 401) {
        azErrorMessage = 'İcazə xətası. Admin hesabınızı yoxlayın.'
      } else if (response.status === 404) {
        azErrorMessage = 'Kurs tapılmadı. Zəhmət olmasa səhifəni yeniləyin.'
      }
      
      return NextResponse.json(
        { error: azErrorMessage, originalError: errorMessage },
        { status: response.status }
      )
    }

    try {
      const responseText = await response.text()
      if (responseText && responseText.trim() !== '') {
        try {
          const responseData = JSON.parse(responseText)
          return NextResponse.json({ success: true, ...responseData })
        } catch {
          return NextResponse.json({ success: true })
        }
      }
    } catch (e) {
      console.log('Response body is empty or unreadable, but status is OK - delete succeeded')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete course API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

