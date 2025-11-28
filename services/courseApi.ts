// services/courseApi.ts - Düzəldilmiş versiya

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://teskup-production.up.railway.app/api';

// Types
export interface AddCourseDetailRequest {
  Title: string;
  Description: string;
  LanguageId: 'English' | 'Azerbaijani' | 'Russian';
}

/**
 * Helper function to get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

/**
 * Helper function to make authenticated API calls
 */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge any additional headers
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  const res = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
    headers: headers as HeadersInit,
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    let errorMessage = `Request failed: ${res.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.title || errorJson.error || errorText;
    } catch {
      errorMessage = errorText || `Request failed: ${res.status} ${res.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  return (await res.json()) as T;
}

/**
 * Add course detail (title, description) to a course
 * Backend: POST /api/admin/courses/{courseId}/details
 */
export async function addCourseDetail(
  courseId: string,
  request: AddCourseDetailRequest
): Promise<void> {
  try {
    console.log(`[addCourseDetail] Starting for courseId: ${courseId}, language: ${request.LanguageId}`);

    // Validate input
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    if (!request.Title?.trim()) {
      throw new Error('Title is required');
    }
    if (!request.Description?.trim()) {
      throw new Error('Description is required');
    }
    if (!request.LanguageId) {
      throw new Error('LanguageId is required');
    }

    // Backend expects: { Title, Description, LanguageId }
    // LanguageId should be enum string: "English", "Azerbaijani", or "Russian"
    const requestBody = {
      Title: request.Title.trim(),
      Description: request.Description.trim(),
      LanguageId: request.LanguageId, // "English", "Azerbaijani", "Russian"
    };

    console.log(`[addCourseDetail] Sending POST to: ${BACKEND_API_BASE_URL}/admin/courses/${courseId}/details`);
    console.log(`[addCourseDetail] Request body:`, requestBody);

    const response = await http<{ message: string }>(
      `/admin/courses/${courseId}/details`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    console.log(`[addCourseDetail] ✓ Success:`, response);
  } catch (error: any) {
    console.error(`[addCourseDetail] ✗✗✗ ERROR:`, error);
    throw error;
  }
}

/**
 * Update course detail (title, description) for a course
 * Backend: PUT /api/admin/courses/{courseId}/details
 */
export async function updateCourseDetail(
  courseId: string,
  request: AddCourseDetailRequest
): Promise<void> {
  try {
    console.log(`[updateCourseDetail] Starting for courseId: ${courseId}, language: ${request.LanguageId}`);

    // Validate input
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    if (!request.Title?.trim()) {
      throw new Error('Title is required');
    }
    if (!request.Description?.trim()) {
      throw new Error('Description is required');
    }
    if (!request.LanguageId) {
      throw new Error('LanguageId is required');
    }

    // Backend expects: { Title, Description, LanguageId }
    // LanguageId should be enum string: "English", "Azerbaijani", or "Russian"
    const requestBody = {
      Title: request.Title.trim(),
      Description: request.Description.trim(),
      LanguageId: request.LanguageId, // "English", "Azerbaijani", "Russian"
    };

    console.log(`[updateCourseDetail] Sending PUT to: ${BACKEND_API_BASE_URL}/admin/courses/${courseId}/details`);
    console.log(`[updateCourseDetail] Request body:`, requestBody);

    const response = await http<{ message: string }>(
      `/admin/courses/${courseId}/details`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      }
    );

    console.log(`[updateCourseDetail] ✓ Success:`, response);
  } catch (error: any) {
    console.error(`[updateCourseDetail] ✗✗✗ ERROR:`, error);
    throw error;
  }
}
