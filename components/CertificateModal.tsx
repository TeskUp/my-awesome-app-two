'use client'

import { useState, useEffect } from 'react'
import { X, Send, Award, CheckCircle2, User, Download } from 'lucide-react'

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
  onSend?: (data: {
    users: EnrolledUser[]
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
  const [sending, setSending] = useState(false)
  const [downloadingUser, setDownloadingUser] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && courseId) {
      loadEnrolledUsers()
    }
  }, [isOpen, courseId])


  const loadEnrolledUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/enrolled-users`)
      if (response.ok) {
        const data = await response.json()
        // Filter only users with 100% progress
        // TEST MODE: For testing, also include test users even if progress < 100
        const allUsers = data.users || []
        const completedUsers = allUsers.filter((u: EnrolledUser) => {
        // Test users - force 100% for testing
        const testEmails = ['rauf123@gmail.com', 'test1@example.com', 'test2@example.com', 'vusalguluyev153@gmail.com', 'nbayramli2007@gmail.com']
          if (testEmails.includes(u.email)) {
            u.progress = 100
            u.completed = true
            u.status = 'Completed'
            return true
          }
          return u.progress >= 100
        })
        
        // Add test users if they don't exist
        const testUsers: EnrolledUser[] = [
          {
            id: 'test-user-2',
            email: 'test1@example.com',
            name: 'Ruslan Guluyev',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-3',
            email: 'test2@example.com',
            name: 'Elvin Mammadov',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-vusal',
            email: 'vusalguluyev153@gmail.com',
            name: 'Vusal',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-nezrin',
            email: 'nbayramli2007@gmail.com',
            name: 'Nazrin Bayramli',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
        ]
        
        // Add test users that don't already exist
        const existingEmails = new Set(completedUsers.map((u: EnrolledUser) => u.email))
        const newTestUsers = testUsers.filter(tu => !existingEmails.has(tu.email))
        const finalUsers = [...completedUsers, ...newTestUsers]
        
        setUsers(finalUsers)
      } else {
        console.error('Failed to load enrolled users')
        // Even if API fails, show test users for testing
        const testUsers: EnrolledUser[] = [
          {
            id: 'test-user-rauf',
            email: 'rauf123@gmail.com',
            name: 'Rauf Bextiyarli',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-2',
            email: 'test1@example.com',
            name: 'Ruslan Guluyev',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-3',
            email: 'test2@example.com',
            name: 'Elvin Mammadov',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-vusal',
            email: 'vusalguluyev153@gmail.com',
            name: 'Vusal',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
          {
            id: 'test-user-nezrin',
            email: 'nbayramli2007@gmail.com',
            name: 'Nazrin Bayramli',
            progress: 100,
            completed: true,
            status: 'Completed',
          },
        ]
        setUsers(testUsers)
      }
    } catch (error) {
      console.error('Error loading enrolled users:', error)
      // Even if error, show test users for testing
      const testUsers: EnrolledUser[] = [
        {
          id: 'test-user-rauf',
          email: 'rauf123@gmail.com',
          name: 'Rauf Bextiyarli',
          progress: 100,
          completed: true,
          status: 'Completed',
        },
        {
          id: 'test-user-2',
          email: 'test1@example.com',
          name: 'Ruslan Guluyev',
          progress: 100,
          completed: true,
          status: 'Completed',
        },
        {
          id: 'test-user-3',
          email: 'test2@example.com',
          name: 'Elvin Mammadov',
          progress: 100,
          completed: true,
          status: 'Completed',
        },
        {
          id: 'test-user-vusal',
          email: 'vusalguluyev153@gmail.com',
          name: 'Vusal',
          progress: 100,
          completed: true,
          status: 'Completed',
        },
        {
          id: 'test-user-nezrin',
          email: 'nbayramli2007@gmail.com',
          name: 'Nəzrin Bayramlı',
          progress: 100,
          completed: true,
          status: 'Completed',
        },
      ]
      setUsers(testUsers)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = async (user: EnrolledUser) => {
    if (downloadingUser === user.id) return
    
    setDownloadingUser(user.id)
    
    try {
      const userName = user.name || user.email.split('@')[0]
      
      const response = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: userName,
          courseTitle: courseTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
        throw new Error(errorData.error || 'Sertifikat yaradıla bilmədi')
      }

      // Get PDF blob and download
      const pdfBlob = await response.blob()
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${userName.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Error downloading certificate:', error)
      alert(error?.message || 'Sertifikat endirilərkən xəta baş verdi')
    } finally {
      setDownloadingUser(null)
    }
  }

  const handleSend = async () => {
    // Filter only users with 100% progress (double check)
    const completedUsers = users.filter(u => u.progress >= 100)
    
    if (completedUsers.length === 0) {
      alert('Bu kursa 100% tamamlayan istifadəçi yoxdur')
      return
    }

    setSending(true)
    try {
      // LOCALHOST MODE: Send certificates directly from modal using localhost endpoint
      const LOCALHOST_API = 'https://localhost:7240/api'
      const results: Array<{ status: 'fulfilled' | 'rejected', value?: any, reason?: any }> = []
      
      console.log('=== SENDING CERTIFICATES VIA LOCALHOST ===')
      console.log('Users:', completedUsers.length)
      console.log('Endpoint:', `${LOCALHOST_API}/Form/submit`)
      console.log('==========================================')
      
      // Send certificate to each user sequentially
      for (let i = 0; i < completedUsers.length; i++) {
        const user = completedUsers[i]
        const userName = user.name || user.email.split('@')[0]
        console.log(`Processing certificate ${i + 1}/${completedUsers.length} for ${userName} (${user.email})...`)
        
        try {
          // Step 1: Generate PDF with user's name
          console.log(`  → Generating PDF for ${userName}...`)
          const generateResponse = await fetch('/api/certificate/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userName: userName,
              courseTitle: courseTitle,
            }),
          })

          if (!generateResponse.ok) {
            const errorData = await generateResponse.json().catch(() => ({ error: 'Failed to generate PDF' }))
            throw new Error(errorData.error || `Failed to generate certificate PDF for ${user.email}`)
          }

          // Get PDF blob
          const pdfBlob = await generateResponse.blob()
          const pdfFile = new File([pdfBlob], `certificate-${userName.replace(/\s+/g, '-')}.pdf`, {
            type: 'application/pdf',
          })

          console.log(`  ✓ PDF generated for ${userName}`)

          // Step 2: Send certificate via localhost Form/submit endpoint
          console.log(`  → Sending email to ${user.email} via localhost...`)
          const formData = new FormData()
          formData.append('File', pdfFile)
          formData.append('Email', user.email)

          // Create AbortController for timeout - 360 seconds (6 minutes)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 360000) // 360 seconds timeout

          try {
            const emailResponse = await fetch(`${LOCALHOST_API}/Form/submit`, {
              method: 'POST',
              body: formData,
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text()
              throw new Error(
                `Failed to send certificate to ${user.email}: ${emailResponse.status} ${emailResponse.statusText} - ${errorText}`
              )
            }

            const result = await emailResponse.text()
            console.log(`  ✓ Certificate sent to ${user.email}:`, result)
            results.push({ status: 'fulfilled', value: { user, success: true } })
          } catch (error: any) {
            clearTimeout(timeoutId)
            if (error.name === 'AbortError') {
              throw new Error(`Request timeout for ${user.email}: Backend took too long to respond (360 seconds). Email service might be slow.`)
            }
            throw error
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to process certificate for ${user.email}:`, error.message)
          results.push({ status: 'rejected', reason: error })
          // Continue with next user instead of stopping
        }
      }
      
      // Separate successes and failures
      const successes = results.filter(r => r.status === 'fulfilled')
      const failures = results.filter(r => r.status === 'rejected')
      
      // Log results
      console.log(`✓ Successfully sent: ${successes.length}/${completedUsers.length}`)
      if (failures.length > 0) {
        console.error(`✗ Failed to send: ${failures.length}/${completedUsers.length}`)
        failures.forEach((f: any, index) => {
          console.error(`  Failure ${index + 1}:`, f.reason?.message || 'Unknown error')
        })
      }
      
      // Show results to user
      if (failures.length === completedUsers.length) {
        const errorMessages = failures
          .map((f: any) => f.reason?.message || 'Unknown error')
          .join('; ')
        alert(`Bütün sertifikatlar göndərilmədi: ${errorMessages}`)
      } else if (failures.length > 0) {
        const failedEmails = failures
          .map((f: any) => {
            const failedIndex = results.findIndex(r => r === f)
            const user = completedUsers[failedIndex]
            return user?.email || 'Unknown'
          })
          .join(', ')
        alert(`${successes.length} sertifikat uğurla göndərildi, ${failures.length} sertifikat göndərilmədi (${failedEmails})`)
      } else {
        // All successful
        const userCount = completedUsers.length
        alert(`Sertifikatlar ${userCount} istifadəçiyə uğurla göndərildi!`)
        onClose()
      }
      
      console.log(`✓ All certificates processed`)
      
      // If onSend callback is provided, call it (for backward compatibility)
      if (onSend) {
        await onSend({
          users: completedUsers,
        })
      }
    } catch (error) {
      console.error('Error sending certificates:', error)
      alert((error as any)?.message || 'Sertifikatlar göndərilərkən xəta baş verdi')
    } finally {
      setSending(false)
    }
  }

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
          {/* Users List */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Yüklənir...
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <User className="w-12 h-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Bu kursa 100% tamamlayan istifadəçi yoxdur
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-purple-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">İstifadəçi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">Proqress</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-purple-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user.name || user.email}
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
                          <div className="flex items-center gap-2">
                            {user.progress >= 100 ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Tamamlanıb
                                </span>
                                <button
                                  onClick={() => handleDownloadCertificate(user)}
                                  disabled={downloadingUser === user.id}
                                  className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={`${user.name || user.email} - Sertifikatı endir`}
                                >
                                  {downloadingUser === user.id ? (
                                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                Davam edir
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
            disabled={sending || users.filter(u => u.progress >= 100).length === 0}
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

