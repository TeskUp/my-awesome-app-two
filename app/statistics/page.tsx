'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Calendar, TrendingUp, Mail, User as UserIcon, Shield, GraduationCap } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ToastContainer, { ToastMessage } from '@/components/ToastContainer'

interface User {
  id: string
  fullName: string
  userName: string
  email: string
  role: 'Student' | 'Teacher' | 'Admin'
  refreshToken: string | null
  refreshTokenExpiredAt: string | null
}

export default function StatisticsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly')

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/getAll')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || data || [])
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'İstifadəçilər yüklənə bilmədi', 'error')
      }
    } catch (error: any) {
      console.error('Error loading users:', error)
      showToast('İstifadəçilər yüklənərkən xəta baş verdi', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalUsers = users.length
  const students = users.filter(u => u.role === 'Student').length
  const teachers = users.filter(u => u.role === 'Teacher').length
  const admins = users.filter(u => u.role === 'Admin').length
  const activeUsers = users.filter(u => u.refreshToken !== null && u.refreshTokenExpiredAt && new Date(u.refreshTokenExpiredAt) > new Date()).length
  const inactiveUsers = totalUsers - activeUsers

  // Calculate activity statistics
  const getActivityStats = () => {
    const now = new Date()
    const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthlyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const startDate = timeRange === 'weekly' ? weeklyStart : monthlyStart
    
    const activeInPeriod = users.filter(u => {
      if (!u.refreshTokenExpiredAt) return false
      const expiredAt = new Date(u.refreshTokenExpiredAt)
      return expiredAt >= startDate && expiredAt <= now
    }).length

    const newRegistrations = users.filter(u => {
      // Since we don't have createdAt, we'll use refreshTokenExpiredAt as a proxy
      // Users with recent refresh tokens are considered active
      if (!u.refreshTokenExpiredAt) return false
      const expiredAt = new Date(u.refreshTokenExpiredAt)
      return expiredAt >= startDate
    }).length

    return {
      active: activeInPeriod,
      newRegistrations,
      period: timeRange === 'weekly' ? 'Həftəlik' : 'Aylıq',
    }
  }

  const activityStats = getActivityStats()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aktiv deyil'
    const date = new Date(dateString)
    return date.toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-700'
      case 'Teacher':
        return 'bg-blue-100 text-blue-700'
      case 'Student':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Admin'
      case 'Teacher':
        return 'Müəllim'
      case 'Student':
        return 'Tələbə'
      default:
        return role
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden ml-64">
        <div className="h-full overflow-y-auto p-8 bg-gray-50">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Statistika
            </h1>
            <p className="mt-2 text-gray-600">İstifadəçilərin statistikası və aktivlik məlumatları</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Ümumi İstifadəçilər</h3>
              <p className="text-3xl font-bold text-white">{totalUsers}</p>
            </div>

            {/* Students */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Tələbələr</h3>
              <p className="text-3xl font-bold text-white">{students}</p>
            </div>

            {/* Teachers */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Müəllimlər</h3>
              <p className="text-3xl font-bold text-white">{teachers}</p>
            </div>

            {/* Active Users */}
            <div className="bg-[#6B46C1] rounded-2xl p-6 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/90 text-sm font-medium mb-1">Aktiv İstifadəçilər</h3>
              <p className="text-3xl font-bold text-white">{activeUsers}</p>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Aktivlik Statistikası</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimeRange('weekly')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    timeRange === 'weekly'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Həftəlik
                </button>
                <button
                  onClick={() => setTimeRange('monthly')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    timeRange === 'monthly'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aylıq
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Aktiv İstifadəçilər</h3>
                </div>
                <p className="text-3xl font-bold text-purple-600">{activityStats.active}</p>
                <p className="text-sm text-gray-600 mt-1">{activityStats.period}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Yeni Qeydiyyat</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600">{activityStats.newRegistrations}</p>
                <p className="text-sm text-gray-600 mt-1">{activityStats.period}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <UserCheck className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Aktivlik Faizi</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Ümumi aktivlik</p>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">İstifadəçilər Siyahısı</h2>
              <p className="text-sm text-gray-600 mt-1">Ümumi: {totalUsers} istifadəçi</p>
            </div>
            {loading ? (
              <div className="p-16 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Yüklənir...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">İstifadəçi tapılmadı</h3>
                <p className="text-gray-500">Hələ heç bir istifadəçi qeydiyyatdan keçməyib</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-500 to-purple-400 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Ad Soyad</th>
                      <th className="px-6 py-4 text-left font-semibold">İstifadəçi Adı</th>
                      <th className="px-6 py-4 text-left font-semibold">Email</th>
                      <th className="px-6 py-4 text-left font-semibold">Rol</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold">Son Aktivlik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => {
                      const isActive = user.refreshToken !== null && 
                        user.refreshTokenExpiredAt && 
                        new Date(user.refreshTokenExpiredAt) > new Date()
                      
                      return (
                        <tr
                          key={user.id}
                          className="bg-white even:bg-gray-50 hover:bg-purple-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{user.fullName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-600">{user.userName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <UserCheck className="w-3 h-3" />
                                Aktiv
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                <UserX className="w-3 h-3" />
                                Aktiv deyil
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {formatDate(user.refreshTokenExpiredAt)}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

