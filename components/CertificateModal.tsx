'use client'

import { useState, useEffect } from 'react'
import { X, Send, Award, CheckCircle2, FileText, User, Calendar } from 'lucide-react'

export interface EnrolledUser {
  id: string
  email: string
  name?: string
  progress: number // 0-100
  completed: boolean
  status?: string // 'Ongoing' | 'Completed' | 'Tamamlanıb' | 'Davam edir'
  enrollmentDate?: string | null
  completedDate?: string | null
  viewCount?: number
}

interface CertificateModalProps {
  isOpen: boolean
  courseId: string
  courseTitle: string
  onClose: () => void
  onSend: (data: {
    selectedUsers: EnrolledUser[]
    certificateFile: File | null
    name: string
    date: string
  }) => Promise<void>
}

export default function CertificateModal({
  isOpen,
  courseId,
  courseTitle,
  onClose,
  onSend,
}: CertificateModalProps) {
  const [users, setUsers] = useState<EnrolledUser[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [filterCompleted, setFilterCompleted] = useState(true)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (isOpen && courseId) {
      loadEnrolledUsers()
      // Set default date to today
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
    }
  }, [isOpen, courseId, courseTitle])


  const loadEnrolledUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/enrolled-users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        // Auto-select users with 100% progress
        const completedUserIds = new Set<string>(
          data.users
            .filter((u: EnrolledUser) => u.progress >= 100)
            .map((u: EnrolledUser) => u.id)
        )
        setSelectedUserIds(completedUserIds)
      } else {
        console.error('Failed to load enrolled users')
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading enrolled users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const selectAllCompleted = () => {
    const completedIds = new Set(
      users.filter(u => u.progress >= 100).map(u => u.id)
    )
    setSelectedUserIds(completedIds)
  }

  const selectAll = () => {
    const allIds = new Set(users.map(u => u.id))
    setSelectedUserIds(allIds)
  }

  const deselectAll = () => {
    setSelectedUserIds(new Set())
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setCertificateFile(file)
    } else {
      alert('Yalnız PDF faylı yükləyə bilərsiniz')
    }
  }

  const handleSend = async () => {
    if (selectedUserIds.size === 0) {
      alert('Zəhmət olmasa ən azı bir istifadəçi seçin')
      return
    }

    if (!certificateFile) {
      alert('Zəhmət olmasa sertifikat PDF faylını yükləyin')
      return
    }

    if (!name.trim()) {
      alert('Zəhmət olmasa adı doldurun')
      return
    }

    if (!date.trim()) {
      alert('Zəhmət olmasa tarixi seçin')
      return
    }

    const selectedUsers = users.filter(u => selectedUserIds.has(u.id))

    setSending(true)
    try {
      await onSend({
        selectedUsers,
        certificateFile,
        name: name.trim(),
        date: date.trim(),
      })
      onClose()
    } catch (error) {
      console.error('Error sending certificates:', error)
    } finally {
      setSending(false)
    }
  }

  const displayedUsers = filterCompleted
    ? users.filter(u => u.progress >= 100)
    : users

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sertifikat Göndər</h2>
              <p className="text-sm text-white/90">{courseTitle}</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filter and Selection Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Yalnız tamamlayanları göstər (100%)
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllCompleted}
                className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tamamlayanları seç
              </button>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hamısını seç
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Seçimi ləğv et
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Yüklənir...
                </div>
              ) : displayedUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <User className="w-12 h-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {filterCompleted 
                      ? 'Bu kursa 100% tamamlayan istifadəçi yoxdur'
                      : 'Bu kursa enroll olunmuş istifadəçi yoxdur'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-purple-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700 w-12">
                        <input
                          type="checkbox"
                          checked={displayedUsers.length > 0 && displayedUsers.every(u => selectedUserIds.has(u.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = new Set<string>(displayedUsers.map(u => u.id))
                              const newSelection = new Set<string>(selectedUserIds)
                              allIds.forEach(id => newSelection.add(id))
                              setSelectedUserIds(newSelection)
                            } else {
                              const displayedIds = new Set<string>(displayedUsers.map(u => u.id))
                              const newSelection = new Set<string>(selectedUserIds)
                              displayedIds.forEach(id => newSelection.delete(id))
                              setSelectedUserIds(newSelection)
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">İstifadəçi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">Proqress</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-purple-50 transition-colors ${
                          selectedUserIds.has(user.id) ? 'bg-purple-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user.name || 'İstifadəçi'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{user.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  user.progress >= 100 ? 'bg-green-500' : 'bg-purple-500'
                                }`}
                                style={{ width: `${Math.min(user.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 min-w-[40px]">
                              {user.progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user.progress >= 100 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Tamamlanıb
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              Davam edir
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Selected Count */}
          <div className="text-sm text-gray-600">
            <strong>{selectedUserIds.size}</strong> istifadəçi seçilib
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Ad *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
              placeholder="Sertifikat adını daxil edin"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tarix *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all"
            />
          </div>

          {/* Certificate PDF Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Sertifikat PDF Faylı *
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-4 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                  <button
                    type="button"
                    className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
                      input?.click()
                    }}
                  >
                    Dosya Seç
                  </button>
                  <span className="text-sm text-gray-500 flex-1">
                    {certificateFile ? certificateFile.name : 'Dosya seçilmədi'}
                  </span>
                </div>
              </label>
              {certificateFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Yalnız PDF formatında fayl yükləyə bilərsiniz
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-4 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Ləğv et
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedUserIds.size === 0 || !certificateFile || !name.trim() || !date.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/30 hover:shadow-purple-800/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Göndərilir...' : 'Göndər'}
          </button>
        </div>
      </div>

    </div>
  )
}

