// Authentication API service
const BACKEND_API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export interface LoginRequest {
  emailOrUsername: string
  password: string
  isPersistent: boolean
}

export interface LoginResponse {
  token?: string
  refreshToken?: string
  expiresIn?: number
  user?: any
}

// Admin credentials (backend-də qeydiyyatda olan admin istifadəçi)
const ADMIN_CREDENTIALS = {
  // email və ya userName-dən biri ola bilər; email daha sabitdir
  emailOrUsername: 'ruslan123@gmail.com',
  password: 'Ruslan12#',
  isPersistent: true,
}

let cachedToken: string | null = null
let tokenExpiry: number | null = null

/**
 * Login as admin and get authentication token
 */
export async function adminLogin(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/Auth/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS),
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error('Admin login error:', responseText)
      throw new Error(`Failed to login as admin: ${response.status} ${response.statusText}`)
    }

    let data: LoginResponse | any = {}
    
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse login response as JSON:', responseText)
      throw new Error('Invalid login response format')
    }
    
    // Extract token from response - Swagger shows token is directly in response
    let token = data.token
    
    if (!token) {
      // Try alternative field names
      token = data.accessToken || data.access_token || (data as any).jwtToken
    }
    
    // Log response for debugging
    console.log('=== LOGIN RESPONSE ===')
    console.log('Has Token:', !!token)
    console.log('Token Length:', token ? token.length : 0)
    console.log('Response Keys:', Object.keys(data))
    console.log('Token Preview:', token ? `${token.substring(0, 20)}...` : 'N/A')
    console.log('========================')

    if (!token) {
      throw new Error('No authentication token received from login response')
    }

    // Cache token - use expiredDate from response if available
    cachedToken = token
    if (data.expiredDate) {
      // Parse expiredDate: "2025-11-22T17:27:36.2673627Z"
      const expiryDate = new Date(data.expiredDate)
      tokenExpiry = expiryDate.getTime()
      console.log('Token expires at:', expiryDate.toISOString())
    } else {
      // Fallback: assume it expires in 1 hour if not specified
      tokenExpiry = Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 3600000)
    }

    console.log('Admin login successful, token cached')
    return token
  } catch (error) {
    console.error('Error in admin login:', error)
    throw error
  }
}

/**
 * Get current admin token (login if needed)
 */
export async function getAdminToken(): Promise<string> {
  return await adminLogin()
}

/**
 * Clear cached token (force re-login)
 */
export function clearAdminToken() {
  cachedToken = null
  tokenExpiry = null
}

