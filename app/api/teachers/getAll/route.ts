import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
    // Fetch teachers from backend
    const response = await fetch(`${API_BASE_URL}/Teacher/GetAll`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to fetch teachers: ${response.status} ${response.statusText}`
      
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
    // Backend returns: { id, fullName, email, phoneNumber, specialty, rating, experienceYears, pricePerHourInAZN, isDeactive }
    const mappedTeachers = Array.isArray(data) ? data
      .filter((teacher: any) => !teacher.isDeactive) // Filter out inactive teachers
      .map((teacher: any) => {
        return {
          id: teacher.id,
          name: teacher.fullName || teacher.email || 'Unknown Teacher',
          email: teacher.email || '',
          specialty: teacher.specialty || '',
          rating: teacher.rating || 0,
        }
      }) : []

    return NextResponse.json({
      teachers: mappedTeachers,
    })
  } catch (error: any) {
    console.error('Error in getAll teachers API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

