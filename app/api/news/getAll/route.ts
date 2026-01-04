import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let language = searchParams.get('language') || 'English'

    // Backend expects language name like "English", not code like "en"
    // Map language codes to names
    if (language === 'en') {
      language = 'English'
    } else if (language === 'az') {
      language = 'Azerbaijani'
    } else if (language === 'ru') {
      language = 'Russian'
    }
    
    // Backend accepts language parameter as "English", "Azerbaijani", "Russian"
    const url = `${API_BASE_URL}/News/GetAll?language=${language}`
    
    console.log('Fetching news from:', url, 'with language:', language)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      // Disable cache
      cache: 'no-store',
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch news: ${response.status} ${response.statusText}`
      try {
        const errorText = await response.text()
        console.error('Backend API Error Response:', errorText)
        
        // Try to parse as JSON for better error message
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
          // If not JSON, use text as is
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

    // Get response as text first, then try to parse as JSON
    const text = await response.text()
    
    if (!text || text.trim() === '') {
      return NextResponse.json([])
    }

    try {
      // Try to parse as JSON
      const data = JSON.parse(text)
      const newsArray = Array.isArray(data) ? data : []
      
      // Log the number of news items received from backend
      console.log(`Received ${newsArray.length} news items from backend`)
      console.log('News IDs:', newsArray.map((item: any) => item.id))
      
      // Filter out inactive news if needed (but don't limit the count)
      // Only filter if explicitly requested, otherwise return all news
      const activeNews = newsArray.filter((item: any) => !item.isDeactive)
      
      // Log filtered news count
      if (activeNews.length !== newsArray.length) {
        console.log(`Filtered to ${activeNews.length} active news items (removed ${newsArray.length - activeNews.length} inactive)`)
      }
      
      // Return all active news (no limit)
      return NextResponse.json(activeNews)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', text)
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in getAll news API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

