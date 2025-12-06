import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/services/authApi'

const API_BASE_URL = 'https://teskup-production.up.railway.app/api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    
    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { category, questions } = body

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Transform questions to Swagger format
    const transformedQuestions = questions.map((q: any) => {
      const variants: any[] = []
      let correctAnswer = ''
      
      if (q.questionType === 'multiple-choice' && q.options && q.options.length > 0) {
        // Multiple choice: create variants from options
        q.options.forEach((option: string, index: number) => {
          const letter = String.fromCharCode(65 + index) // A, B, C, D
          const isCorrect = q.correctAnswer === index
          variants.push({
            letter: letter,
            text: option.trim(),
            isCorrect: isCorrect,
          })
          if (isCorrect) {
            correctAnswer = option.trim()
          }
        })
      } else if (q.questionType === 'true-false') {
        // True/False: always create two variants
        const isTrueCorrect = q.correctAnswer === 0
        variants.push(
          { letter: 'A', text: 'True', isCorrect: isTrueCorrect },
          { letter: 'B', text: 'False', isCorrect: !isTrueCorrect }
        )
        correctAnswer = isTrueCorrect ? 'True' : 'False'
      }

      // Validate that we have variants
      if (variants.length === 0) {
        throw new Error(`Question "${q.title || 'Untitled'}" must have at least one variant`)
      }

      // Validate that exactly one variant is correct
      const correctCount = variants.filter((v: any) => v.isCorrect).length
      if (correctCount !== 1) {
        throw new Error(`Question "${q.title || 'Untitled'}" must have exactly one correct answer`)
      }

      return {
        title: q.title?.trim() || '',
        description: q.description?.trim() || '',
        hint: q.hint?.trim() || '',
        questionType: q.questionType === 'multiple-choice' ? 'MultipleChoice' : 'TrueFalse',
        correctAnswer: correctAnswer,
        variants: variants,
      }
    })

    // Prepare request body according to Swagger
    // Note: category can be empty string, but should not be null
    const requestBody = {
      category: category?.trim() || '',
      questions: transformedQuestions,
    }

    // Validate request body
    if (!requestBody.questions || requestBody.questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Log request body for debugging
    console.log('Creating quiz for section:', sectionId)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    // Try to create quiz via backend API using Swagger endpoint
    try {
      const response = await fetch(
        `${API_BASE_URL}/Quiz/sections/${sectionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          cache: 'no-store',
        }
      )

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        const errorText = await response.text()
        console.error('Error creating quiz - Status:', response.status)
        console.error('Error creating quiz - Response:', errorText)
        console.error('Error creating quiz - Request body sent:', JSON.stringify(requestBody, null, 2))
        
        // Try to parse error as JSON
        let errorMessage = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorText
        } catch {
          // Keep original error text
        }
        
        return NextResponse.json(
          { error: `Failed to create quiz: ${errorMessage}` },
          { status: response.status }
        )
      }
    } catch (fetchError: any) {
      console.error('Error creating quiz:', fetchError)
      return NextResponse.json(
        { error: fetchError?.message || 'Failed to create quiz' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in create quiz API route:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

