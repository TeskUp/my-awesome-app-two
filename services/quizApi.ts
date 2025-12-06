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
  category?: string
  questions: QuizQuestion[]
  questionsCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateQuizRequest {
  sectionId: string
  category?: string
  questions: QuizQuestion[]
}

export interface UpdateQuizRequest {
  id: string
  category?: string
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
    // Transform Swagger response format to our format
    const quizzes = Array.isArray(data) ? data : []
    return quizzes.map((quiz: any) => transformQuizFromBackend(quiz))
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
        category: request.category || '',
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
        category: request.category || '',
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
 * Get a single quiz by ID
 */
export async function getQuiz(quizId: string): Promise<Quiz> {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Failed to fetch quiz: ${response.status} ${response.statusText}`
      
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
    return transformQuizFromBackend(data)
  } catch (error: any) {
    console.error('Error fetching quiz:', error)
    throw error
  }
}

/**
 * Transform backend quiz format to frontend format
 */
function transformQuizFromBackend(backendQuiz: any): Quiz {
  const transformedQuestions: QuizQuestion[] = (backendQuiz.questions || []).map((q: any) => {
    let questionType: 'multiple-choice' | 'true-false' = 'multiple-choice'
    let options: string[] = []
    let correctAnswer: number | undefined = undefined

    if (q.questionType === 'TrueFalse') {
      questionType = 'true-false'
      options = ['True', 'False']
      correctAnswer = q.correctAnswer === 'True' ? 0 : 1
    } else if (q.variants && q.variants.length > 0) {
      questionType = 'multiple-choice'
      options = q.variants.map((v: any) => v.text)
      const correctIndex = q.variants.findIndex((v: any) => v.isCorrect)
      correctAnswer = correctIndex >= 0 ? correctIndex : undefined
    }

    return {
      questionNumber: 0, // Will be set by frontend
      title: q.title || '',
      description: q.description || '',
      questionType: questionType,
      options: options,
      correctAnswer: correctAnswer,
      category: backendQuiz.category || '',
      hint: q.hint || '',
    }
  })

  // Set question numbers
  transformedQuestions.forEach((q, index) => {
    q.questionNumber = index + 1
  })

  return {
    id: backendQuiz.id,
    sectionId: backendQuiz.sectionId,
    category: backendQuiz.category,
    questions: transformedQuestions,
    questionsCount: backendQuiz.questionsCount || transformedQuestions.length,
    createdAt: backendQuiz.createdAt,
    updatedAt: backendQuiz.updatedAt,
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

