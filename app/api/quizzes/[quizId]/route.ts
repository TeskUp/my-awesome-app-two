import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    // Try to get quiz from backend using Swagger endpoint
    try {
      const response = await fetch(
        `${API_BASE_URL}/Quiz/${quizId}`,
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
        return NextResponse.json(data)
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      } else {
        const errorText = await response.text()
        console.error('Error fetching quiz:', errorText)
        return NextResponse.json(
          { error: 'Failed to fetch quiz' },
          { status: response.status }
        )
      }
    } catch (fetchError: any) {
      console.error('Error in quiz fetch:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch quiz' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in get quiz API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

