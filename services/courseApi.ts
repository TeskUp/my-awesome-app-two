// services/courseApi.ts - Düzəldilmiş versiya

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://teskup-production.up.railway.app/api';

// Types
export interface AddCourseDetailRequest {
  Title: string;
  Description: string;
  LanguageId: 'English' | 'Azerbaijani' | 'Russian';
}

export interface UpdateCourseRequest {
  CategoryId: string;
  Level: 'Beginner' | 'Novice' | 'Intermediate' | 'Proficient' | 'Advanced';
  IsFree: boolean;
  Price: number;
  InstructorId: string;
  UsedLanguageId: string;
  Rating: number;
  DurationMinutes: number;
  Thumbnail?: File | null;
  Title?: string;
  Description?: string;
  LanguageId?: 'English' | 'Azerbaijani' | 'Russian';
}

export interface UsedLanguage {
  id: string;
  isoCode: string;
  isDeactive: boolean;
}

// Level options for dropdown (array of strings for CourseModal compatibility)
export const LEVEL_OPTIONS = [
  'Beginner',
  'Novice',
  'Intermediate',
  'Proficient',
  'Advanced',
] as const;

// Test IDs for default values (used in CourseModal)
export const TEST_IDS = {
  CATEGORY_ID_PROGRAMMING: '19ba8521-54d8-4f01-8935-6bac2e73011d',
  TEACHER_ID: 'eb5342da-b48b-4085-73cf-08de2dbbd0d8',
  USED_LANGUAGE_ID_ENGLISH: 'b2c3d4e5-2345-6789-abcd-ef0123456789',
} as const;

/**
 * Get default language ID (English)
 */
export function getDefaultLanguageId(): string {
  return TEST_IDS.USED_LANGUAGE_ID_ENGLISH;
}

/**
 * Get language ID by language name
 */
export function getLanguageId(language: 'English' | 'Azerbaijani' | 'Russian'): string {
  // For now, return English ID as default
  // You can extend this to return different IDs based on language
  return TEST_IDS.USED_LANGUAGE_ID_ENGLISH;
}

// Course detail response type (matches CourseDetailNewDTO from backend)
export interface CourseResponse {
  id: string;
  category: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
  };
  stats: {
    duration: string;
    students: number;
    rating: number;
    lessonsCount: number;
    level: string;
  };
  isPurchased: boolean;
  thumbnail?: string;
  imageUrl?: string; // Alias for thumbnail (backward compatibility)
  levelId?: string; // Alias for stats.level (backward compatibility)
  isFree?: boolean; // For backward compatibility (not in backend response)
  price?: number; // For backward compatibility (not in backend response)
  usedLanguageId?: string; // For backward compatibility (not in backend response)
  createdAt?: string; // For backward compatibility (not in backend response)
  progress?: {
    percentage: number;
    completedLessons: number;
    totalLessons: number;
  };
  sections: Array<{
    id: string;
    week: string;
    title: string;
    lessonsCount: number;
    duration: string;
    lectures: Array<{
      id: string;
      title: string;
      duration: string;
      isLocked: boolean;
    }>;
  }>;
  // Optional: For backward compatibility with frontend code that expects details array
  details?: CourseDetail[];
}

// Course detail item type (for details array)
export interface CourseDetail {
  title: string;
  description: string;
  languageId?: string;
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
    'Accept': 'application/json',
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only add Content-Type for JSON, not for FormData
  if (init?.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
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

// Course card type for list view (matches CourseCardDTO from backend)
export interface CourseCard {
  id: string;
  title: string;
  category: string;
  description?: string;
  thumbnail?: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  progress?: number | null;
  duration: string;
  students: number;
  rating: number;
  price: number;
  lessons: number;
  status: 'ongoing' | 'register' | 'completed' | 'Register';
}

/**
 * Get all courses (for course list page)
 * Backend: GET /api/courses
 * Returns CourseResponse[] for compatibility with frontend that expects CourseResponse
 */
export async function getAllCourses(params?: {
  search?: string;
  category?: string;
  difficulty?: 'Beginner' | 'Novice' | 'Intermediate' | 'Proficient' | 'Advanced';
  price?: string;
  status?: string;
}): Promise<CourseResponse[]> {
  try {
    console.log(`[getAllCourses] Fetching courses with params:`, params);

    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.price) queryParams.append('price', params.price);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const url = `/courses${queryString ? `?${queryString}` : ''}`;

    // Backend returns CourseCardDTO[], transform to CourseResponse[] for frontend compatibility
    const cards = await http<CourseCard[]>(url);
    console.log(`[getAllCourses] ✓ Found ${cards.length} courses`);

    // Transform CourseCard to CourseResponse
    const response: CourseResponse[] = cards.map((card) => ({
      id: card.id,
      category: card.category,
      title: card.title,
      description: card.description || '',
      instructor: {
        id: card.instructor.id,
        name: card.instructor.name,
        avatar: card.instructor.avatar,
      },
      stats: {
        duration: card.duration,
        students: card.students,
        rating: card.rating,
        lessonsCount: card.lessons,
        level: '', // CourseCard doesn't have level, will need to be populated from backend
      },
      isPurchased: card.status === 'ongoing' || card.status === 'completed',
      thumbnail: card.thumbnail,
      imageUrl: card.thumbnail, // Alias for backward compatibility
      levelId: '', // Will need to be populated from backend
      isFree: card.price === 0, // Infer from price
      price: card.price,
      usedLanguageId: getDefaultLanguageId(), // Default to English
      createdAt: new Date().toISOString(), // Default to current date
      progress: card.progress !== null && card.progress !== undefined
        ? {
            percentage: card.progress,
            completedLessons: 0, // Not available in CourseCard
            totalLessons: card.lessons,
          }
        : undefined,
      sections: [], // CourseCard doesn't include sections
      details: [
        {
          title: card.title,
          description: card.description || '',
          languageId: getDefaultLanguageId(),
        },
      ],
    }));

    return response;
  } catch (error: any) {
    console.error(`[getAllCourses] ✗✗✗ ERROR:`, error);
    throw error;
  }
}

/**
 * Get all available UsedLanguages
 * Backend: GET /api/UsedLanguages/GetAll
 */
export async function getUsedLanguages(): Promise<UsedLanguage[]> {
  try {
    console.log(`[getUsedLanguages] Fetching available languages...`);
    const languages = await http<UsedLanguage[]>(`/UsedLanguages/GetAll`);
    const activeLanguages = languages.filter(lang => !lang.isDeactive);
    console.log(`[getUsedLanguages] Found ${activeLanguages.length} active languages`);
    return activeLanguages;
  } catch (error: any) {
    console.error(`[getUsedLanguages] ✗ Error:`, error);
    throw error;
  }
}

/**
 * Get course detail by ID
 * Backend: GET /api/courses/{id}?language={language}
 */
export async function getCourseDetail(
  courseId: string,
  language: 'English' | 'Azerbaijani' | 'Russian' = 'English'
): Promise<CourseResponse> {
  try {
    console.log(`[getCourseDetail] Fetching course ${courseId} in ${language}`);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const response = await http<CourseResponse>(
      `/courses/${courseId}?language=${encodeURIComponent(language)}`
    );

    // Add details array for backward compatibility with frontend code
    if (!response.details) {
      response.details = [{
        title: response.title,
        description: response.description,
        languageId: language,
      }];
    }

    // Add imageUrl alias for backward compatibility
    if (!response.imageUrl && response.thumbnail) {
      response.imageUrl = response.thumbnail;
    }

    // Add levelId alias for backward compatibility
    if (!response.levelId && response.stats?.level) {
      response.levelId = response.stats.level;
    }

    // Add isFree and price for backward compatibility (not in backend response, set defaults)
    if (response.isFree === undefined) {
      response.isFree = false; // Default to paid course
    }
    if (response.price === undefined) {
      response.price = 0; // Default price
    }

    // Add usedLanguageId for backward compatibility (not in backend response, set default to English)
    if (!response.usedLanguageId) {
      // Default to English language ID (from the API response you provided)
      response.usedLanguageId = 'b2c3d4e5-2345-6789-abcd-ef0123456789'; // English
    }

    // Add createdAt for backward compatibility (not in backend response, set default)
    if (!response.createdAt) {
      response.createdAt = new Date().toISOString(); // Default to current date
    }

    console.log(`[getCourseDetail] ✓ Success`);
    return response;
  } catch (error: any) {
    console.error(`[getCourseDetail] ✗✗✗ ERROR:`, error);
    throw error;
  }
}

/**
 * Update course
 * Backend: PUT /api/admin/courses/{id}
 * 
 * IMPORTANT: Make sure UsedLanguageId exists in database before calling this!
 */
export async function updateCourse(
  courseId: string,
  request: UpdateCourseRequest
): Promise<void> {
  try {
    console.log(`[updateCourse] === UPDATING COURSE ===`);
    console.log(`[updateCourse] Course ID: ${courseId}`);
    console.log(`[updateCourse] IsFree: ${request.IsFree}`);
    console.log(`[updateCourse] Price: ${request.Price}`);
    console.log(`[updateCourse] CategoryId: ${request.CategoryId}`);
    console.log(`[updateCourse] Level: ${request.Level}`);
    console.log(`[updateCourse] InstructorId: ${request.InstructorId}`);
    console.log(`[updateCourse] UsedLanguageId: ${request.UsedLanguageId}`);
    console.log(`[updateCourse] Rating: ${request.Rating}`);
    console.log(`[updateCourse] DurationMinutes: ${request.DurationMinutes}`);
    console.log(`[updateCourse] Has Image: ${!!request.Thumbnail}`);

    // Validate required fields
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    if (!request.CategoryId) {
      throw new Error('CategoryId is required');
    }
    if (!request.InstructorId) {
      throw new Error('InstructorId is required');
    }
    if (!request.UsedLanguageId) {
      throw new Error('UsedLanguageId is required');
    }

    // Validate UsedLanguageId exists (fetch and check)
    const availableLanguages = await getUsedLanguages();
    const languageExists = availableLanguages.some(lang => lang.id === request.UsedLanguageId);
    
    if (!languageExists) {
      const availableIds = availableLanguages.map(l => l.id).join(', ');
      throw new Error(
        `Invalid UsedLanguageId: ${request.UsedLanguageId}. ` +
        `Available IDs: ${availableIds || 'None found'}. ` +
        `Please select a valid language from the dropdown.`
      );
    }

    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('CategoryId', request.CategoryId);
    formData.append('Level', request.Level);
    formData.append('IsFree', request.IsFree.toString());
    formData.append('Price', request.Price.toString());
    formData.append('InstructorId', request.InstructorId);
    formData.append('UsedLanguageId', request.UsedLanguageId);
    formData.append('Rating', request.Rating.toString());
    formData.append('DurationMinutes', request.DurationMinutes.toString());

    // Add optional fields if provided
    if (request.Title) {
      formData.append('Title', request.Title);
    }
    if (request.Description) {
      formData.append('Description', request.Description);
    }
    if (request.LanguageId) {
      formData.append('LanguageId', request.LanguageId);
    }

    // Only add Thumbnail if provided
    if (request.Thumbnail) {
      formData.append('Thumbnail', request.Thumbnail);
      console.log(`[updateCourse] Including Thumbnail: ${request.Thumbnail.name}`);
    } else {
      console.log(`[updateCourse] No image provided - not sending Thumbnail field`);
    }

    // Log FormData keys for debugging
    const formDataKeys: string[] = [];
    formData.forEach((_, key) => formDataKeys.push(key));
    console.log(`[updateCourse] FormData keys:`, formDataKeys);

    // Correct endpoint: PUT /api/admin/courses/{id}
    const url = `/admin/courses/${courseId}`;
    console.log(`[updateCourse] Sending PUT request to: ${BACKEND_API_BASE_URL}${url}`);

    const response = await http<{ message: string }>(url, {
      method: 'PUT',
      body: formData, // FormData, not JSON
    });

    console.log(`[updateCourse] ✓ Success:`, response);
  } catch (error: any) {
    console.error(`[updateCourse] ✗✗✗ ERROR:`, error);
    throw error;
  }
}

/**
 * Create course
 * Backend: POST /api/admin/courses
 */
export async function createCourse(request: UpdateCourseRequest): Promise<{ id: string; message: string }> {
  try {
    console.log(`[createCourse] === CREATING COURSE ===`);

    // Validate required fields
    if (!request.CategoryId) {
      throw new Error('CategoryId is required');
    }
    if (!request.InstructorId) {
      throw new Error('InstructorId is required');
    }
    if (!request.UsedLanguageId) {
      throw new Error('UsedLanguageId is required');
    }

    // Validate UsedLanguageId exists
    const availableLanguages = await getUsedLanguages();
    const languageExists = availableLanguages.some(lang => lang.id === request.UsedLanguageId);
    
    if (!languageExists) {
      const availableIds = availableLanguages.map(l => l.id).join(', ');
      throw new Error(
        `Invalid UsedLanguageId: ${request.UsedLanguageId}. ` +
        `Available IDs: ${availableIds || 'None found'}. ` +
        `Please select a valid language from the dropdown.`
      );
    }

    // Create FormData
    const formData = new FormData();
    formData.append('CategoryId', request.CategoryId);
    formData.append('Level', request.Level);
    formData.append('IsFree', request.IsFree.toString());
    formData.append('Price', request.Price.toString());
    formData.append('InstructorId', request.InstructorId);
    formData.append('UsedLanguageId', request.UsedLanguageId);
    formData.append('Rating', request.Rating.toString());
    formData.append('DurationMinutes', request.DurationMinutes.toString());

    if (request.Title) {
      formData.append('Title', request.Title);
    }
    if (request.Description) {
      formData.append('Description', request.Description);
    }
    if (request.LanguageId) {
      formData.append('LanguageId', request.LanguageId);
    }
    if (request.Thumbnail) {
      formData.append('Thumbnail', request.Thumbnail);
    }

    const response = await http<{ id: string; message: string }>(`/admin/courses`, {
      method: 'POST',
      body: formData,
    });

    console.log(`[createCourse] ✓ Success:`, response);
    return response;
  } catch (error: any) {
    console.error(`[createCourse] ✗✗✗ ERROR:`, error);
    throw error;
  }
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

    const requestBody = {
      Title: request.Title.trim(),
      Description: request.Description.trim(),
      LanguageId: request.LanguageId,
    };

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

    const requestBody = {
      Title: request.Title.trim(),
      Description: request.Description.trim(),
      LanguageId: request.LanguageId,
    };

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

/**
 * Delete course
 * Backend: DELETE /api/admin/courses/{id}
 */
export async function deleteCourse(courseId: string): Promise<void> {
  try {
    console.log(`[deleteCourse] Deleting course ${courseId}`);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const response = await http<void>(`/admin/courses/${courseId}`, {
      method: 'DELETE',
    });

    console.log(`[deleteCourse] ✓ Success`);
  } catch (error: any) {
    console.error(`[deleteCourse] ✗✗✗ ERROR:`, error);
    throw error;
  }
}
