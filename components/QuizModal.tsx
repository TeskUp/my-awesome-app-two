'use client'

import { useState, useEffect } from 'react'
import { X, Save, HelpCircle, CheckCircle2, FileQuestion, Lightbulb, Tag } from 'lucide-react'

export interface QuizQuestion {
  questionNumber: number
  title: string
  description: string
  questionType: 'multiple-choice' | 'true-false'
  options?: string[] // For multiple choice (4 options)
  correctAnswer?: number // Index of correct answer (0-3 for multiple choice, 0-1 for true/false)
  category?: string
  hint?: string
}

interface QuizModalProps {
  isOpen: boolean
  sectionId: string
  sectionTitle: string
  onSave: (quiz: {
    questions: QuizQuestion[]
  }) => Promise<void>
  onClose: () => void
}

export default function QuizModal({
  isOpen,
  sectionId,
  sectionTitle,
  onSave,
  onClose,
}: QuizModalProps) {
  const [numberOfQuestions, setNumberOfQuestions] = useState(1)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Initialize questions based on numberOfQuestions
      const initialQuestions: QuizQuestion[] = Array.from({ length: numberOfQuestions }, (_, index) => ({
        questionNumber: index + 1,
        title: '',
        description: '',
        questionType: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: '',
        hint: '',
      }))
      setQuestions(initialQuestions)
    }
  }, [isOpen, numberOfQuestions])

  const handleQuestionTypeChange = (index: number, type: 'multiple-choice' | 'true-false') => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      questionType: type,
      options: type === 'multiple-choice' ? ['', '', '', ''] : ['True', 'False'],
      correctAnswer: 0,
    }
    setQuestions(updatedQuestions)
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = ['', '', '', '']
    }
    updatedQuestions[questionIndex].options![optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const handleCorrectAnswerChange = (questionIndex: number, answerIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].correctAnswer = answerIndex
    setQuestions(updatedQuestions)
  }

  const handleQuestionFieldChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    }
    setQuestions(updatedQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    for (const question of questions) {
      if (!question.title.trim()) {
        alert(`Sual ${question.questionNumber} üçün başlıq doldurulmalıdır`)
        return
      }
      if (!question.description.trim()) {
        alert(`Sual ${question.questionNumber} üçün təsvir doldurulmalıdır`)
        return
      }
      if (question.questionType === 'multiple-choice') {
        if (!question.options || question.options.some(opt => !opt.trim())) {
          alert(`Sual ${question.questionNumber} üçün bütün variantlar doldurulmalıdır`)
          return
        }
        if (question.correctAnswer === undefined || question.correctAnswer < 0 || question.correctAnswer > 3) {
          alert(`Sual ${question.questionNumber} üçün düzgün cavab seçilməlidir`)
          return
        }
      }
    }

    setSaving(true)
    try {
      await onSave({ questions })
      onClose()
    } catch (error) {
      console.error('Error saving quiz:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quiz Əlavə Et</h2>
              <p className="text-sm text-white/90">{sectionTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Number of Questions Selector */}
          <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <HelpCircle className="w-4 h-4 inline mr-1" />
              Sual Sayı
            </label>
            <select
              value={numberOfQuestions}
              onChange={(e) => {
                const count = parseInt(e.target.value)
                setNumberOfQuestions(count)
                const newQuestions: QuizQuestion[] = Array.from({ length: count }, (_, index) => {
                  const existing = questions[index]
                  return existing || {
                    questionNumber: index + 1,
                    title: '',
                    description: '',
                    questionType: 'multiple-choice',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    category: '',
                    hint: '',
                  }
                })
                setQuestions(newQuestions)
              }}
              className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} sual
                </option>
              ))}
            </select>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div
                key={questionIndex}
                className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                      {question.questionNumber}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sual {question.questionNumber}</h3>
                  </div>
                </div>

                {/* Question Type Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sual Tipi
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(questionIndex, 'multiple-choice')}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                        question.questionType === 'multiple-choice'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Multiple Choice (4 variant)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(questionIndex, 'true-false')}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                        question.questionType === 'true-false'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      True/False
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Başlıq *
                  </label>
                  <input
                    type="text"
                    value={question.title}
                    onChange={(e) => handleQuestionFieldChange(questionIndex, 'title', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                    placeholder="Sual başlığı..."
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Təsvir *
                  </label>
                  <textarea
                    value={question.description}
                    onChange={(e) => handleQuestionFieldChange(questionIndex, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all resize-none"
                    placeholder="Sual təsviri..."
                    required
                  />
                </div>

                {/* Options */}
                {question.questionType === 'multiple-choice' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Variantlar *
                    </label>
                    <div className="space-y-2">
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                            placeholder={`Variant ${String.fromCharCode(65 + optionIndex)}`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleCorrectAnswerChange(questionIndex, optionIndex)}
                            className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                              question.correctAnswer === optionIndex
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {question.correctAnswer !== undefined && (
                      <p className="mt-2 text-sm text-green-600">
                        Düzgün cavab: {String.fromCharCode(65 + question.correctAnswer)}
                      </p>
                    )}
                  </div>
                )}

                {/* True/False Options */}
                {question.questionType === 'true-false' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Düzgün Cavab *
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleCorrectAnswerChange(questionIndex, 0)}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                          question.correctAnswer === 0
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        True
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCorrectAnswerChange(questionIndex, 1)}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                          question.correctAnswer === 1
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        False
                      </button>
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <input
                    type="text"
                    value={question.category || ''}
                    onChange={(e) => handleQuestionFieldChange(questionIndex, 'category', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
                    placeholder="Məsələn: Design Principles and Color Theory"
                  />
                </div>

                {/* Hint */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    İpucu (Hint)
                  </label>
                  <textarea
                    value={question.hint || ''}
                    onChange={(e) => handleQuestionFieldChange(questionIndex, 'hint', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all resize-none"
                    placeholder="İpucu mətnini yazın..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-4 -mx-6 -mb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/30 hover:shadow-purple-800/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Yadda saxlanılır...' : 'Yadda Saxla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

