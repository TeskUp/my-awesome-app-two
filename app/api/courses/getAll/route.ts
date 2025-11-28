import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/courses`
    
    console.log('Fetching courses from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch courses: ${response.status} ${response.statusText}`
      let errorText = ''
      
      try {
        errorText = await response.text()
        console.error('Backend API Error Response:', errorText)
        console.error('Requested URL:', url)
        
        // If 404, suggest checking Swagger
        if (response.status === 404) {
          errorMessage = `Endpoint not found (404). Requested: ${url}. Please check Swagger documentation: https://teskup-production.up.railway.app/swagger/index.html to verify the correct endpoint.`
          console.error('404 Error - Endpoint might be wrong. Check Swagger for correct endpoint.')
        }
        
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
          } else if (errorData.type) {
            errorMessage = `${errorMessage} - ${errorData.type}`
          }
        } catch {
          if (errorText) {
            // Check if it's a mapping error - in that case, return empty array instead of error
            if (errorText.includes('Error mapping types') || errorText.includes('Mapping types')) {
              console.warn('Backend mapping error detected, returning empty array')
              return NextResponse.json([])
            }
            if (response.status !== 404) {
              errorMessage = `${errorMessage} - ${errorText}`
            }
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      // If it's a 500 error with mapping issue, log the full error
      // (Backend should be fixed now, but keep this for safety)
      if (response.status === 500 && (errorText.includes('Error mapping types') || errorText.includes('Mapping types'))) {
        console.error('=== BACKEND MAPPING ERROR (Should be fixed) ===')
        console.error(errorText)
        console.error('===============================================')
        return NextResponse.json(
          { error: errorMessage, fullError: errorText },
          { status: response.status }
        )
      }
      
      // For 404, return empty array instead of error (endpoint might not exist yet)
      if (response.status === 404) {
        console.warn('404 Error - Returning empty array. Endpoint might not exist or be different.')
        return NextResponse.json([])
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const text = await response.text()
    
    if (!text || text.trim() === '') {
      return NextResponse.json([])
    }

    try {
      const data = JSON.parse(text)
      const coursesArray = Array.isArray(data) ? data : []
      
      console.log(`Received ${coursesArray.length} courses from backend`)
      
      // Map backend response format to frontend format
      // Backend returns: { id, title, category (string), description, thumbnail, instructor {id, name, avatar}, duration (string), rating, price, ... }
      // Frontend expects: { id, title, description, imageUrl, categoryId, levelId, teacherIds, details, durationMinutes, rating, ... }
      
      // Category name to ID mapping (from user's provided IDs)
      const categoryNameToId: { [key: string]: string } = {
        'psychology': '2b4d53c3-33ea-4e45-aa65-20d1e92d61a9',
        'programming': '19ba8521-54d8-4f01-8935-6bac2e73011d',
        'proqramlasdirma': 'e46228f6-64c0-44fe-b84f-e2efdc3a334c',
        'General': '19ba8521-54d8-4f01-8935-6bac2e73011d', // Default to programming
      }
      
      const mappedCourses = coursesArray.map((course: any) => {
        // Map category name (string) to categoryId
        const categoryName = course.category || 'General'
        const categoryId = categoryNameToId[categoryName] || course.categoryId || '19ba8521-54d8-4f01-8935-6bac2e73011d'
        
        // Map instructor to teacherIds array
        const teacherIds = course.instructor?.id && course.instructor.id !== '00000000-0000-0000-0000-000000000000'
          ? [course.instructor.id]
          : []
        
        // Parse duration string (e.g., "0 min", "350 min") to minutes (integer)
        let durationMinutes: number | undefined = undefined
        if (course.duration) {
          const durationMatch = course.duration.toString().match(/(\d+)\s*min/i)
          if (durationMatch) {
            durationMinutes = parseInt(durationMatch[1], 10)
          }
        }
        
        // Backend-dən gələn title və description birbaşa istifadə olunur
        // "Untitled" yoxlanılır və boş string-ə çevrilir
        const courseTitle = course.title && course.title.trim() !== '' && course.title !== 'Untitled' 
          ? course.title.trim() 
          : ''
        const courseDescription = course.description && course.description.trim() !== '' 
          ? course.description.trim() 
          : ''
        
        return {
          id: course.id || '',
          title: courseTitle,
          description: courseDescription,
          imageUrl: course.thumbnail || '',
          categoryId: categoryId,
          category: categoryName, // Keep original category string too
          levelId: course.level || course.difficulty || 'Beginner',
          teacherIds: teacherIds,
          isFree: course.price === 0 || course.price === null || course.price === undefined,
          price: course.price || 0,
          usedLanguageId: course.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789', // Default language ID
          driveLink: course.driveLink || '',
          durationMinutes: durationMinutes,
          rating: course.rating,
          details: [{
            title: courseTitle,
            description: courseDescription,
            languageId: course.usedLanguageId || 'b2c3d4e5-2345-6789-abcd-ef0123456789',
          }],
          createdAt: course.createdAt || new Date().toISOString(),
          updatedAt: course.updatedAt || new Date().toISOString(),
        }
      })
      
      return NextResponse.json(mappedCourses)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', text)
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in getAll courses API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

