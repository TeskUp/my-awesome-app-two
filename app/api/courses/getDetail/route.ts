import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching course detail for ID:', id)

    const url = `${API_BASE_URL}/courses/${id}`
    console.log('Fetching from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch course detail: ${response.status} ${response.statusText}`
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
      return NextResponse.json(
        { error: 'Empty response from API' },
        { status: 500 }
      )
    }

    try {
      const data = JSON.parse(text)
      
      // Map backend response format to frontend format
      const categoryId = data.category === 'General' 
        ? '164345bb-18de-4d78-97fb-9a53af74ec68' 
        : data.categoryId || '164345bb-18de-4d78-97fb-9a53af74ec68'
      
      const teacherIds = data.instructor?.id && data.instructor.id !== '00000000-0000-0000-0000-000000000000'
        ? [data.instructor.id]
        : []
      
      const mappedCourse = {
        id: data.id || '',
        title: data.title || 'Untitled',
        description: data.description || '',
        imageUrl: data.thumbnail || '',
        categoryId: categoryId,
        levelId: data.level || data.difficulty || 'Beginner',
        teacherIds: teacherIds,
        isFree: data.price === 0 || data.price === null || data.price === undefined,
        price: data.price || 0,
        usedLanguageId: data.usedLanguageId || '1e2d847f-20dd-464a-7f2e-08de2959f69f',
        driveLink: data.driveLink || '',
        details: [{
          title: data.title || 'Untitled',
          description: data.description || '',
          languageId: data.usedLanguageId || '1e2d847f-20dd-464a-7f2e-08de2959f69f',
        }],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      }
      
      return NextResponse.json(mappedCourse)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', text)
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in getDetail courses API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

