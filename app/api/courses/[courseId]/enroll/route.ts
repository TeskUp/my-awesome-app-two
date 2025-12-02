import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId || String(userId).trim() === '') {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Get user email from user data
    let userEmail: string | null = null
    try {
      const usersResponse = await fetch(
        `${API_BASE_URL}/Auth/GetAllUsers`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      )

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const usersArray = Array.isArray(usersData) ? usersData : []
        const user = usersArray.find((u: any) => u.id === userId)
        if (user) {
          userEmail = user.email || user.userName
        }
      }
    } catch (error) {
      console.log('Could not fetch user email:', error)
    }

    // Try multiple endpoints to enroll user
    // Option 1: Try new Student/Enroll endpoint first (no auth required)
    try {
      console.log('=== TRYING STUDENT ENROLL ENDPOINT ===')
      console.log('Student ID:', userId)
      console.log('Course ID:', courseId)
      console.log('=====================================')
      
      const response1 = await fetch(
        `${API_BASE_URL}/Student/Enroll/${userId}/${courseId}`,
        {
          method: 'POST',
          headers: {
            'Accept': '*/*',
          },
          // No body needed as shown in Swagger (empty body)
          cache: 'no-store',
        }
      )

      console.log('=== STUDENT ENROLL RESPONSE ===')
      console.log('Status:', response1.status)
      console.log('Status Text:', response1.statusText)
      console.log('==============================')

      if (response1.ok) {
        const data = await response1.json().catch(() => ({}))
        console.log('✓ User enrolled successfully via Student/Enroll endpoint')
        return NextResponse.json({
          success: true,
          message: 'User enrolled successfully',
          data: data,
        })
      } else {
        const errorText = await response1.text()
        let errorMessage = `Failed to enroll user: ${response1.status} ${response1.statusText}`
        
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText}`
          }
        }
        
        // If 400 and message says already enrolled, that's actually a success
        if (response1.status === 400 && errorMessage.includes('already enrolled')) {
          console.log('User is already enrolled (this is OK)')
          return NextResponse.json({
            success: true,
            message: 'User is already enrolled in this course',
            data: { alreadyEnrolled: true },
          })
        }
        
        // If not 404, return the error
        if (response1.status !== 404) {
          console.log('Student/Enroll endpoint returned error:', errorMessage)
          return NextResponse.json(
            { error: errorMessage },
            { status: response1.status }
          )
        }
      }
    } catch (error1) {
      console.log('Student/Enroll endpoint failed, trying admin endpoints...', error1)
    }

    // Try endpoint 2: /admin/courses/{courseId}/enroll (with admin token)
    try {
      const response2 = await fetch(
        `${API_BASE_URL}/admin/courses/${courseId}/enroll`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
          }),
          cache: 'no-store',
        }
      )

      if (response2.ok) {
        const data = await response2.json()
        return NextResponse.json({
          success: true,
          message: 'User enrolled successfully',
          data: data,
        })
      }
    } catch (error2) {
      console.log('Admin enroll endpoint failed, trying enroll-user endpoint...')
    }

    // Try endpoint 3: /admin/courses/{courseId}/enroll-user (with admin token)
    try {
      const response3 = await fetch(
        `${API_BASE_URL}/admin/courses/${courseId}/enroll-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
          }),
          cache: 'no-store',
        }
      )

      if (response3.ok) {
        const data = await response3.json()
        return NextResponse.json({
          success: true,
          message: 'User enrolled successfully',
          data: data,
        })
      }
    } catch (error3) {
      console.log('Admin enroll-user endpoint failed')
    }

    // Try endpoint 4: /api/courses/{id}/purchase (requires user token)
    // This is a fallback - should not be needed if Student/Enroll works
    if (userEmail) {
      // Known test user credentials (for testing only)
      const testUserCredentials: { [key: string]: string } = {
        'rauf123@gmail.com': 'Rauf123#',
        // Add more test users here if needed
      }

      const userPassword = testUserCredentials[userEmail]
      
      if (userPassword) {
        try {
          // First, login as user to get user token
          const loginResponse = await fetch(
            `${API_BASE_URL}/Auth/Login`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                emailOrUsername: userEmail,
                password: userPassword,
                isPersistent: true,
              }),
              cache: 'no-store',
            }
          )

          if (loginResponse.ok) {
            const loginData = await loginResponse.json()
            const userToken = loginData.token

            console.log('=== USER LOGIN SUCCESS ===')
            console.log('User Email:', userEmail)
            console.log('Has Token:', !!userToken)
            console.log('Token Preview:', userToken ? `${userToken.substring(0, 20)}...` : 'N/A')
            console.log('========================')

            if (userToken) {
              // Now use user token to purchase/enroll
              // Try without body first, then with empty object
              console.log('=== ATTEMPTING PURCHASE ===')
              console.log('Course ID:', courseId)
              console.log('User Token:', userToken ? 'Present' : 'Missing')
              console.log('==========================')

              const purchaseResponse = await fetch(
                `${API_BASE_URL}/courses/${courseId}/purchase`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                  // Try with empty body - some endpoints don't need body
                  body: JSON.stringify({}),
                  cache: 'no-store',
                }
              )

              console.log('=== PURCHASE RESPONSE ===')
              console.log('Status:', purchaseResponse.status)
              console.log('Status Text:', purchaseResponse.statusText)
              console.log('========================')

              if (purchaseResponse.ok) {
                const data = await purchaseResponse.json()
                return NextResponse.json({
                  success: true,
                  message: 'User enrolled successfully',
                  data: data,
                })
              } else {
                const errorText = await purchaseResponse.text()
                let errorMessage = `Failed to enroll user: ${purchaseResponse.status} ${purchaseResponse.statusText}`
                
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
                
                // If 401, it means the user token is not valid or the endpoint doesn't accept user tokens
                if (purchaseResponse.status === 401) {
                  errorMessage = 'User authentication failed. The purchase endpoint requires the user to be logged in through the frontend application, not through admin panel. This is a backend limitation. Please contact backend team to add an admin endpoint for enrolling users (e.g., POST /admin/courses/{courseId}/enroll-user).'
                }
                
                return NextResponse.json(
                  { error: errorMessage },
                  { status: purchaseResponse.status }
                )
              }
            }
          } else {
            const loginErrorText = await loginResponse.text()
            console.log('Failed to login as user:', loginErrorText)
            // Don't return error here, continue to final error message
          }
        } catch (fetchError: any) {
          console.error('Error enrolling user with user token:', fetchError)
          // Don't return error here, continue to final error message
        }
      }
    }

    // If all endpoints failed, return error
    return NextResponse.json(
      { 
        error: 'Failed to enroll user. All enrollment endpoints failed.',
        details: 'Tried Student/Enroll endpoint and admin endpoints, but none succeeded.',
        solution: 'Please check that the user ID and course ID are correct, and that the user is not already enrolled.'
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Error in enroll API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

