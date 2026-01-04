import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

export const dynamic = 'force-dynamic'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(request: NextRequest) {
  try {
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

    // Fetch all users from backend
    const response = await fetch(`${API_BASE_URL}/Auth/GetAllUsers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to fetch users: ${response.status} ${response.statusText}`
      
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
    // Backend returns: { id, firstName, lastName, userName, email, refreshToken, refreshTokenExpiredAt, role }
    // Frontend expects: { id, fullName, userName, email, role, refreshToken, refreshTokenExpiredAt }
    const mappedUsers = Array.isArray(data) ? data.map((user: any) => ({
      id: user.id,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userName || user.email,
      userName: user.userName,
      email: user.email,
      role: user.role,
      refreshToken: user.refreshToken,
      refreshTokenExpiredAt: user.refreshTokenExpiredAt,
    })) : []
    
    return NextResponse.json({
      users: mappedUsers,
    })
  } catch (error: any) {
    console.error('Error in getAll users API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

