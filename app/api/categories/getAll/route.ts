import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') || 'Azerbaijani'

    // Fetch categories from backend
    const response = await fetch(`${API_BASE_URL}/Category/GetAll?language=${encodeURIComponent(language)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to fetch categories: ${response.status} ${response.statusText}`
      
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

    const data = await response.json()
    
    // Map backend response to frontend format
    // Backend returns: { id, isDeactive, details: [{ id, name, languageId }], courseDetails: [] }
    const mappedCategories = Array.isArray(data) ? data
      .filter((cat: any) => !cat.isDeactive) // Filter out inactive categories
      .map((cat: any) => {
        // Get the first detail (name) from details array
        const detail = cat.details?.[0]
        return {
          id: cat.id,
          name: detail?.name || 'Unknown Category',
          languageId: detail?.languageId || language,
        }
      }) : []

    return NextResponse.json({
      categories: mappedCategories,
    })
  } catch (error: any) {
    console.error('Error in getAll categories API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

