const API_BASE_URL = '/api'

export interface QuizQuestion {
  questionNumber: number
  title: string
  description: string
  questionType: 'multiple-choice' | 'true-false'
  options?: string[]
  correctAnswer?: number
  category?: string
  hint?: string
}

export interface Quiz {
  id: string
  sectionId: string
  questions: QuizQuestion[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateQuizRequest {
  sectionId: string
  questions: QuizQuestion[]
}

export interface UpdateQuizRequest {
  id: string
  sectionId: string
  questions: QuizQuestion[]
}

/**
 * Get all quizzes for a section
 */
export async function getAllQuizzes(sectionId: string): Promise<Quiz[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes/getAll?sectionId=${sectionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to fetch quizzes: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`
        }
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.quizzes || []
  } catch (error: any) {
    console.error('Error fetching quizzes:', error)
    throw error
  }
}

/**
 * Create a new quiz
 */
export async function createQuiz(request: CreateQuizRequest): Promise<Quiz> {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes/create?sectionId=${request.sectionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions: request.questions,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to create quiz: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.errors) {
          const errorText = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          errorMessage = `${errorMessage} - ${errorText}`
        }
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`
        }
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Error creating quiz:', error)
    throw error
  }
}

/**
 * Update a quiz
 */
export async function updateQuiz(request: UpdateQuizRequest): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes/update?id=${request.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sectionId: request.sectionId,
        questions: request.questions,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to update quiz: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`
        }
      }
      
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    console.error('Error updating quiz:', error)
    throw error
  }
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes/delete?id=${quizId}`, {
      method: 'DELETE',
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to delete quiz: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`
        }
      }
      
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    console.error('Error deleting quiz:', error)
    throw error
  }
}

