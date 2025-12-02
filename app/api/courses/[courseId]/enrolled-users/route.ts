import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function GET(
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

    // Try multiple endpoints to get enrolled users
    let enrolledUsers: any[] = []
    
    // Try endpoint 1: /admin/courses/{courseId}/students (NEW PRIMARY ENDPOINT)
    try {
      const response1 = await fetch(
        `${API_BASE_URL}/admin/courses/${courseId}/students`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      )

      if (response1.ok) {
        const data = await response1.json()
        enrolledUsers = Array.isArray(data) ? data : []
        console.log('✓ Got enrolled users from /admin/courses/{courseId}/students')
      }
    } catch (error1) {
      console.log('Endpoint 1 failed, trying alternatives...')
    }

    // Try endpoint 2: /admin/courses/{courseId}/enrolled-users (FALLBACK)
    if (enrolledUsers.length === 0) {
      try {
        const response2 = await fetch(
          `${API_BASE_URL}/admin/courses/${courseId}/enrolled-users`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
            cache: 'no-store',
          }
        )

        if (response2.ok) {
          const data = await response2.json()
          enrolledUsers = Array.isArray(data) ? data : (data.users || data.enrolledUsers || [])
          console.log('✓ Got enrolled users from /admin/courses/{courseId}/enrolled-users')
        }
      } catch (error2) {
        console.log('Endpoint 2 failed, trying alternatives...')
      }
    }

    // Try endpoint 3: /api/courses/{courseId}/enrolled-users (FALLBACK)
    if (enrolledUsers.length === 0) {
      try {
        const response3 = await fetch(
          `${API_BASE_URL}/courses/${courseId}/enrolled-users`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
            cache: 'no-store',
          }
        )

        if (response3.ok) {
          const data = await response3.json()
          enrolledUsers = Array.isArray(data) ? data : (data.users || data.enrolledUsers || [])
          console.log('✓ Got enrolled users from /courses/{courseId}/enrolled-users')
        }
      } catch (error3) {
        console.log('Endpoint 3 failed, trying to get from course detail...')
      }
    }

    // If still no users, try to get from course detail endpoint
    if (enrolledUsers.length === 0) {
      try {
        const courseResponse = await fetch(
          `${API_BASE_URL}/courses/${courseId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
            cache: 'no-store',
          }
        )

        if (courseResponse.ok) {
          const courseData = await courseResponse.json()
          // Check if course has enrolledUsers or students field
          if (courseData.enrolledUsers && Array.isArray(courseData.enrolledUsers)) {
            enrolledUsers = courseData.enrolledUsers
            console.log('✓ Got enrolled users from course detail')
          } else if (courseData.students && Array.isArray(courseData.students)) {
            enrolledUsers = courseData.students
            console.log('✓ Got enrolled users from course students field')
          }
        }
      } catch (error3) {
        console.log('Course detail endpoint failed')
      }
    }

    // If we have enrolled users, map them to frontend format
    if (enrolledUsers.length > 0) {
      const mappedUsers = enrolledUsers.map((user: any) => {
        // New endpoint format: studentId, fullName, email, percentCompleted, status, enrollmentDate, completedDate, viewCount
        const studentId = user.studentId || user.id || user.userId || user.user?.id || ''
        const email = user.email || user.userEmail || user.user?.email || ''
        const fullName = user.fullName || user.name || user.userName || user.user?.fullName || user.user?.name || 'İstifadəçi'
        const percentCompleted = user.percentCompleted !== undefined ? user.percentCompleted : (user.progress || user.progressPercent || user.completionPercentage || 0)
        const status = user.status || (percentCompleted >= 100 ? 'Completed' : 'Ongoing')
        const completed = percentCompleted >= 100 || status === 'Completed' || status === 'Tamamlanıb'
        
        return {
          id: studentId,
          email: email,
          name: fullName,
          progress: percentCompleted,
          completed: completed,
          status: status,
          enrollmentDate: user.enrollmentDate || null,
          completedDate: user.completedDate || null,
          viewCount: user.viewCount || 0,
        }
      })
      
      console.log(`✓ Mapped ${mappedUsers.length} enrolled users`)
      return NextResponse.json({
        users: mappedUsers,
      })
    }

    // If no enrolled users found, try to get all users and filter by course purchases
    if (enrolledUsers.length === 0) {
      try {
        console.log('Trying to get users from course purchases...')
        
        // Try to get course purchases
        const purchasesResponse = await fetch(
          `${API_BASE_URL}/admin/courses/${courseId}/purchases`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
            cache: 'no-store',
          }
        )

        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json()
          const purchases = Array.isArray(purchasesData) ? purchasesData : (purchasesData.purchases || purchasesData.users || [])
          
          if (purchases.length > 0) {
            // Get all users to match with purchases
            const allUsersResponse = await fetch(
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

            if (allUsersResponse.ok) {
              const allUsers = await allUsersResponse.json()
              const usersArray = Array.isArray(allUsers) ? allUsers : []
              
              // Match purchases with users
              const purchaseUserIds = new Set(
                purchases.map((p: any) => p.userId || p.user?.id || p.id)
              )
              
              enrolledUsers = usersArray
                .filter((user: any) => purchaseUserIds.has(user.id))
                .map((user: any) => ({
                  ...user,
                  progress: purchases.find((p: any) => (p.userId || p.user?.id) === user.id)?.progress || 0,
                }))
              
              console.log(`✓ Found ${enrolledUsers.length} enrolled users from purchases`)
            }
          }
        }
      } catch (purchaseError) {
        console.log('Could not get users from purchases:', purchaseError)
      }
    }

    // If we have enrolled users now, map them to frontend format
    if (enrolledUsers.length > 0) {
      const mappedUsers = enrolledUsers.map((user: any) => {
        // New endpoint format: studentId, fullName, email, percentCompleted, status, enrollmentDate, completedDate, viewCount
        const studentId = user.studentId || user.id || user.userId || user.user?.id || ''
        const email = user.email || user.userEmail || user.user?.email || ''
        const fullName = user.fullName || user.name || user.userName || user.user?.fullName || user.user?.name || 'İstifadəçi'
        const percentCompleted = user.percentCompleted !== undefined ? user.percentCompleted : (user.progress || user.progressPercent || user.completionPercentage || 0)
        const status = user.status || (percentCompleted >= 100 ? 'Completed' : 'Ongoing')
        const completed = percentCompleted >= 100 || status === 'Completed' || status === 'Tamamlanıb'
        
        return {
          id: studentId,
          email: email,
          name: fullName,
          progress: percentCompleted,
          completed: completed,
          status: status,
          enrollmentDate: user.enrollmentDate || null,
          completedDate: user.completedDate || null,
          viewCount: user.viewCount || 0,
        }
      })
      
      console.log(`✓ Mapped ${mappedUsers.length} enrolled users`)
      return NextResponse.json({
        users: mappedUsers,
      })
    }

    // If still no enrolled users found, return empty array
    console.log('⚠ No enrolled users found for this course')
    return NextResponse.json({
      users: [],
    })
  } catch (error: any) {
    console.error('Error in enrolled-users API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

