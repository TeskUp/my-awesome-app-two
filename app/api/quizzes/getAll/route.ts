import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

export const dynamic = 'force-dynamic'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    
    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

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

    // Try to get quizzes from backend using Swagger endpoint
    try {
      const response = await fetch(
        `${API_BASE_URL}/Quiz/sections/${sectionId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      )

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(Array.isArray(data) ? data : [])
      } else if (response.status === 404) {
        // Endpoint doesn't exist, return empty array
        console.log('Quizzes endpoint not found, returning empty array')
        return NextResponse.json([])
      } else {
        const errorText = await response.text()
        console.error('Error fetching quizzes:', errorText)
        return NextResponse.json(
          { error: 'Failed to fetch quizzes' },
          { status: response.status }
        )
      }
    } catch (fetchError: any) {
      console.error('Error in quizzes fetch:', fetchError)
      // Return empty array on error
      return NextResponse.json([])
    }
  } catch (error: any) {
    console.error('Error in getAll quizzes API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

