// Section API service
const API_BASE_URL = '/api/sections'
const BACKEND_API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export interface Section {
  id: string
  courseId: string
  title: string
  order: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateSectionRequest {
  courseId: string
  title: string
  order: number
}

export interface UpdateSectionRequest {
  id: string
  title: string
  order: number
}

/**
 * Get all sections for a course
 */
export async function getAllSections(courseId: string): Promise<Section[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/getAll?courseId=${courseId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = `Failed to fetch sections: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('GetAll sections error response:', responseText)
        
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
    console.error('Error fetching sections:', error)
    throw error
  }
}

/**
 * Create a new section
 */
export async function createSection(request: CreateSectionRequest): Promise<Section> {
  try {
    const response = await fetch(`${API_BASE_URL}/create?courseId=${request.courseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: request.title,
        order: request.order,
      }),
    })

    if (!response.ok) {
      let errorMessage = `Failed to create section: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Create section error response:', responseText)
        
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
    console.error('Error creating section:', error)
    throw error
  }
}

/**
 * Update a section
 */
export async function updateSection(request: UpdateSectionRequest): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/update?id=${request.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: request.title,
        order: request.order,
      }),
    })

    if (!response.ok) {
      let errorMessage = `Failed to update section: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Update section error response:', responseText)
        
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
    console.error('Error updating section:', error)
    throw error
  }
}

/**
 * Delete a section
 */
export async function deleteSection(sectionId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete?id=${sectionId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      let errorMessage = `Failed to delete section: ${response.status} ${response.statusText}`
      
      try {
        const responseText = await response.text()
        console.error('Delete section error response:', responseText)
        
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
    console.error('Error deleting section:', error)
    throw error
  }
}

