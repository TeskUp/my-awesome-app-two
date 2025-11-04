'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Newspaper, Calendar, Eye, MessageSquare } from 'lucide-react'
import NewsModal from '@/components/NewsModal'
import Sidebar from '@/components/Sidebar'
import ToastContainer, { ToastMessage } from '@/components/ToastContainer'
import ConfirmModal from '@/components/ConfirmModal'

export interface NewsItem {
  id: string
  title: string
  description: string
  category: string
  image: string
  tags: string[]
  author: string
  readTime: number
  createdAt: string
  updatedAt: string
  views: number
  comments: number
}

export default function AdminPanel() {
  const [newsData, setNewsData] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    newsId: string | null
    newsTitle: string | null
  }>({
    isOpen: false,
    newsId: null,
    newsTitle: null,
  })

  // Calculate statistics
  const totalNews = newsData.length
  const newsThisMonth = newsData.filter((news) => {
    const newsDate = new Date(news.createdAt)
    const now = new Date()
    return newsDate.getMonth() === now.getMonth() && newsDate.getFullYear() === now.getFullYear()
  }).length
  const totalViews = newsData.reduce((sum, news) => sum + (news.views || 0), 0)
  const totalComments = newsData.reduce((sum, news) => sum + (news.comments || 0), 0)

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    const stored = localStorage.getItem('newsData')
    if (stored) {
      const data = JSON.parse(stored)
      setNewsData(data)
      setFilteredNews(data)
    }
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNews(newsData)
    } else {
      const filtered = newsData.filter(
        (news) =>
          news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          news.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          news.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          news.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredNews(filtered)
    }
  }, [searchTerm, newsData])

  const handleAddNews = () => {
    setEditingNews(null)
    setIsModalOpen(true)
  }

  const handleEditNews = (news: NewsItem) => {
    setEditingNews(news)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      newsId: id,
      newsTitle: title,
    })
  }

  const handleDeleteConfirm = () => {
    if (confirmModal.newsId) {
      const updatedNews = newsData.filter((news) => news.id !== confirmModal.newsId)
      setNewsData(updatedNews)
      setFilteredNews(updatedNews)
      localStorage.setItem('newsData', JSON.stringify(updatedNews))
      setConfirmModal({ isOpen: false, newsId: null, newsTitle: null })
      showToast('News deleted successfully!', 'success')
    }
  }

  const handleDeleteCancel = () => {
    setConfirmModal({ isOpen: false, newsId: null, newsTitle: null })
  }

  const handleSaveNews = (news: NewsItem) => {
    if (editingNews) {
      const updatedNews = newsData.map((item) => (item.id === news.id ? news : item))
      setNewsData(updatedNews)
      setFilteredNews(updatedNews)
      localStorage.setItem('newsData', JSON.stringify(updatedNews))
      showToast('News updated successfully!', 'success')
    } else {
      const updatedNews = [...newsData, news]
      setNewsData(updatedNews)
      setFilteredNews(updatedNews)
      localStorage.setItem('newsData', JSON.stringify(updatedNews))
      showToast('News added successfully!', 'success')
    }
    setIsModalOpen(false)
    setEditingNews(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden ml-64">
        <div className="h-full overflow-y-auto p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                News Management
              </h1>
              <p className="mt-2 text-gray-600">Manage and organize your news articles</p>
            </div>
            <button
              onClick={handleAddNews}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New News
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total News Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Total News</h3>
              <p className="text-3xl font-bold text-white">{totalNews}</p>
            </div>

            {/* This Month News Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">This Month</h3>
              <p className="text-3xl font-bold text-white">{newsThisMonth}</p>
            </div>

            {/* Total Views Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Total Views</h3>
              <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
            </div>

            {/* Total Comments Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Total Comments</h3>
              <p className="text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* News Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {filteredNews.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <ImageIcon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">No News Found</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first news article</p>
                <button
                  onClick={handleAddNews}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Add Your First News
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Image</th>
                      <th className="px-6 py-4 text-left font-semibold">Title</th>
                      <th className="px-6 py-4 text-left font-semibold">Description</th>
                      <th className="px-6 py-4 text-left font-semibold">Category</th>
                      <th className="px-6 py-4 text-left font-semibold">Date</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredNews.map((news) => (
                      <tr
                        key={news.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="w-20 h-16 rounded-lg overflow-hidden shadow-md">
                            <img
                              src={news.image}
                              alt={news.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Crect fill='%23ddd' width='100' height='60'/%3E%3Ctext x='50' y='30' text-anchor='middle' fill='%23999' font-size='14'%3EImage%3C/text%3E%3C/svg%3E`
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{news.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 max-w-md truncate" title={news.description}>
                            {news.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                            {news.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {formatDate(news.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditNews(news)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(news.id, news.title)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <NewsModal
          news={editingNews}
          onSave={handleSaveNews}
          onClose={() => {
            setIsModalOpen(false)
            setEditingNews(null)
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete News Article"
        message={`Are you sure you want to delete "${confirmModal.newsTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
