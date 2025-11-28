// Lecture API service
const API_BASE_URL = '/api/lectures'
const BACKEND_API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export interface Lecture {
  id: string
  sectionId: string
  title: string
  description: string
  durationSeconds: number
  order: number
  isLocked: boolean
  translationAvailable: boolean
  videoUrl?: string
  thumbnailUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateLectureRequest {
  sectionId: string
  title: string
  description: string
  durationSeconds: number
  order: number
  isLocked: boolean
  translationAvailable: boolean
  video?: File | Blob
  videoFile?: File | Blob
  videoUrl?: string
  thumbnail?: File | Blob
  thumbnailFile?: File | Blob
}

export interface UpdateLectureRequest extends CreateLectureRequest {
  id: string
}

/**
 * Get all lectures for a section
 */
export async function getAllLectures(sectionId: string): Promise<Lecture[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/getAll?sectionId=${sectionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch lectures: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('GetAll lectures error response:', responseText)
        
        if (responseText && responseText.trim() !== '') {
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            errorMessage = responseText || errorMessage
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Check if response has error
    if (data.error) {
      throw new Error(data.error)
    }

    return Array.isArray(data) ? data : []
  } catch (error: any) {
    console.error('Error fetching lectures:', error)
    throw error
  }
}

/**
 * Create a new lecture
 */
export async function createLecture(request: CreateLectureRequest): Promise<Lecture> {
  try {
    const formData = new FormData()
    
    formData.append('Title', request.title)
    formData.append('Description', request.description)
    formData.append('DurationSeconds', request.durationSeconds.toString())
    formData.append('Order', request.order.toString())
    formData.append('IsLocked', request.isLocked.toString())
    formData.append('TranslationAvailable', request.translationAvailable.toString())
    
    if (request.videoUrl) {
      formData.append('VideoUrl', request.videoUrl)
    }
    
    // Handle video file (support both video and videoFile)
    const videoFile = request.video || request.videoFile
    if (videoFile) {
      if (videoFile instanceof File) {
        formData.append('Video', videoFile)
      } else if (videoFile instanceof Blob) {
        const file = new File([videoFile], 'video.mp4', { type: videoFile.type || 'video/mp4' })
        formData.append('Video', file)
      }
    }
    
    // Handle thumbnail file (support both thumbnail and thumbnailFile)
    const thumbnailFile = request.thumbnail || request.thumbnailFile
    if (thumbnailFile) {
      if (thumbnailFile instanceof File) {
        formData.append('Thumbnail', thumbnailFile)
      } else if (thumbnailFile instanceof Blob) {
        const file = new File([thumbnailFile], 'thumbnail.jpg', { type: thumbnailFile.type || 'image/jpeg' })
        formData.append('Thumbnail', file)
      }
    }

    const response = await fetch(`${API_BASE_URL}/create?sectionId=${request.sectionId}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = `Failed to create lecture: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Create lecture error response:', responseText)
        
        if (responseText && responseText.trim() !== '') {
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.errors) {
              const errorText = Object.entries(errorData.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ')
              errorMessage = `${errorMessage} - ${errorText}`
            } else if (errorData.title) {
              errorMessage = `${errorMessage} - ${errorData.title}`
            } else if (errorData.message) {
              errorMessage = `${errorMessage} - ${errorData.message}`
            } else if (errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`
            } else {
              errorMessage = `${errorMessage} - ${responseText}`
            }
          } catch (parseError) {
            errorMessage = `${errorMessage} - ${responseText}`
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error creating lecture:', error)
    throw error
  }
}

/**
 * Update a lecture
 */
export async function updateLecture(request: UpdateLectureRequest): Promise<void> {
  try {
    const formData = new FormData()
    
    formData.append('Title', request.title)
    formData.append('Description', request.description)
    formData.append('DurationSeconds', request.durationSeconds.toString())
    formData.append('Order', request.order.toString())
    formData.append('IsLocked', request.isLocked.toString())
    formData.append('TranslationAvailable', request.translationAvailable.toString())
    
    if (request.videoUrl) {
      formData.append('VideoUrl', request.videoUrl)
    }
    
    // Handle video file (support both video and videoFile)
    const videoFile = request.video || request.videoFile
    if (videoFile) {
      if (videoFile instanceof File) {
        formData.append('Video', videoFile)
      } else if (videoFile instanceof Blob) {
        const file = new File([videoFile], 'video.mp4', { type: videoFile.type || 'video/mp4' })
        formData.append('Video', file)
      }
    }
    
    // Handle thumbnail file (support both thumbnail and thumbnailFile)
    const thumbnailFile = request.thumbnail || request.thumbnailFile
    if (thumbnailFile) {
      if (thumbnailFile instanceof File) {
        formData.append('Thumbnail', thumbnailFile)
      } else if (thumbnailFile instanceof Blob) {
        const file = new File([thumbnailFile], 'thumbnail.jpg', { type: thumbnailFile.type || 'image/jpeg' })
        formData.append('Thumbnail', file)
      }
    }

    const response = await fetch(`${API_BASE_URL}/update?id=${request.id}`, {
      method: 'PUT',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = `Failed to update lecture: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Update lecture error response:', responseText)
        
        if (responseText && responseText.trim() !== '') {
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.errors) {
              const errorText = Object.entries(errorData.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ')
              errorMessage = `${errorMessage} - ${errorText}`
            } else if (errorData.title) {
              errorMessage = `${errorMessage} - ${errorData.title}`
            } else if (errorData.message) {
              errorMessage = `${errorMessage} - ${errorData.message}`
            } else if (errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`
            } else {
              errorMessage = `${errorMessage} - ${responseText}`
            }
          } catch (parseError) {
            errorMessage = `${errorMessage} - ${responseText}`
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error('Error updating lecture:', error)
    throw error
  }
}

/**
 * Delete a lecture
 */
export async function deleteLecture(lectureId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete?id=${lectureId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      let errorMessage = `Failed to delete lecture: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Delete lecture error response:', responseText)
        
        if (responseText && responseText.trim() !== '') {
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.errors) {
              const errorText = Object.entries(errorData.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ')
              errorMessage = `${errorMessage} - ${errorText}`
            } else if (errorData.title) {
              errorMessage = `${errorMessage} - ${errorData.title}`
            } else if (errorData.message) {
              errorMessage = `${errorMessage} - ${errorData.message}`
            } else if (errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`
            } else {
              errorMessage = `${errorMessage} - ${responseText}`
            }
          } catch (parseError) {
            errorMessage = `${errorMessage} - ${responseText}`
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e)
      }
      
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error('Error deleting lecture:', error)
    throw error
  }
}

