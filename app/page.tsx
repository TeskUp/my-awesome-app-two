'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Newspaper, Calendar, Eye, MessageSquare } from 'lucide-react'
import NewsModal from '@/components/NewsModal'
import Sidebar from '@/components/Sidebar'
import ToastContainer, { ToastMessage } from '@/components/ToastContainer'
import ConfirmModal from '@/components/ConfirmModal'
import { getAllNews, getNewsDetail, createNews, updateNews, deleteNews, addNewsDetail, getCategoryId, getDefaultLanguageIdSync, NewsResponse } from '@/services/newsApi'

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
  const [availableCategories, setAvailableCategories] = useState<string[]>(['News'])
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
    const fetchNews = async () => {
      try {
        const response = await getAllNews('English')
        console.log('Fetched news from API:', response)
        
        // Map API response to NewsItem format - use REAL data, no placeholders
        // For items with null title/description, fetch detail from GetDetail endpoint
        const mappedNewsPromises = response.map(async (item) => {
          let finalItem = item
          
          // If title, description, or categoryName is null, fetch detail from GetDetail endpoint
          if (!item.title || !item.description || !item.categoryName || 
              item.title === null || item.description === null || item.categoryName === null ||
              item.title === '' || item.description === '' || item.categoryName === '') {
            try {
              console.log(`Fetching detail for news ID: ${item.id} (title/description/categoryName is null or empty)`)
              
              // Try to fetch detail for all 3 languages to get the best available data
              const languages = ['English', 'Azerbaijani', 'Russian']
              let bestDetail: NewsResponse | null = null
              
              for (const lang of languages) {
                try {
                  const detail = await getNewsDetail(item.id, lang)
                  console.log(`Fetched detail for ${lang}:`, detail)
                  
                  // Use the first language that has title and description
                  if (detail.title && detail.description) {
                    bestDetail = detail
                    break
                  }
                  
                  // If no best detail yet, use this one as fallback
                  if (!bestDetail) {
                    bestDetail = detail
                  }
                } catch (langError) {
                  console.warn(`Error fetching detail for ${lang}:`, langError)
                  // Continue to next language
                }
              }
              
              if (bestDetail) {
                // Merge detail data with item data, prioritizing detail data
                finalItem = {
                  ...item,
                  title: bestDetail.title || item.title,
                  description: bestDetail.description || item.description,
                  categoryName: bestDetail.categoryName || item.categoryName,
                }
                console.log('Final item after detail fetch (best available):', finalItem)
              }
            } catch (detailError) {
              console.error(`Error fetching detail for news ID ${item.id}:`, detailError)
              // Continue with original item if detail fetch fails
            }
          }
          
          // Use REAL data from API - only use defaults if absolutely necessary
          // If categoryName is still null/empty after GetDetail, default to 'News'
          const categoryToUse = finalItem.categoryName?.trim() || 'News'
          
          const newsItem: NewsItem = {
            id: finalItem.id || '',
            // Use real title from detail if available
            title: finalItem.title?.trim() || '',
            // Use real description from detail if available
            description: finalItem.description?.trim() || '',
            // Use real category name from API or detail, default to 'News'
            category: categoryToUse,
            image: finalItem.coverPictureUrl || '',
            tags: finalItem.tags || [],
            author: finalItem.author?.trim() || 'Teskup Team',
            readTime: finalItem.readTimeMinutes || 5,
            createdAt: new Date().toISOString(), // API doesn't return createdAt, using current date
            updatedAt: new Date().toISOString(),
            views: finalItem.viewCount || 0,
            comments: finalItem.likeCount || 0, // Using likeCount as comments for now
          }
          
          console.log('Mapped news item (REAL DATA with detail):', {
            id: newsItem.id,
            title: newsItem.title,
            description: newsItem.description,
            category: newsItem.category,
          })
          return newsItem
        })
        
        // Wait for all promises to resolve (including detail fetches)
        const mappedNews = await Promise.all(mappedNewsPromises)
        
        console.log('All mapped news (REAL DATA with details):', mappedNews)
        setNewsData(mappedNews)
        setFilteredNews(mappedNews)
        
        // Extract unique categories from API response (REAL categories from backend)
        const categories = Array.from(new Set(mappedNews.map(item => item.category?.trim()).filter(Boolean))) as string[]
        console.log('Available categories from API:', categories)
        // Always include 'News' as default, then add other categories from API
        const allCategories = categories.length > 0 
          ? Array.from(new Set(['News', ...categories])) 
          : ['News']
        setAvailableCategories(allCategories)
        
        // Also save to localStorage as backup
        localStorage.setItem('newsData', JSON.stringify(mappedNews))
      } catch (error: any) {
        console.error('Error loading news:', error)
        // Show toast only if component is mounted
        const errorMessage = error?.message || 'Unknown error occurred'
        const id = Date.now().toString()
        setToasts((prev) => [...prev, { 
          id, 
          message: `Error loading news: ${errorMessage}. Using local storage.`, 
          type: 'warning' 
        }])
        // Fallback to localStorage
        const stored = localStorage.getItem('newsData')
        if (stored) {
          try {
            const data = JSON.parse(stored)
            console.log('Loaded news from localStorage:', data)
            
            // Use REAL data from localStorage - no placeholders
            const mappedLocalNews: NewsItem[] = data.map((item: any) => ({
              id: item.id || '',
              title: item.title?.trim() || '',
              description: item.description?.trim() || '',
              category: item.category?.trim() || '',
              image: item.image || '',
              tags: item.tags || [],
              author: item.author || '',
              readTime: item.readTime || 0,
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
              views: item.views || 0,
              comments: item.comments || 0,
            }))
            
            // Extract unique categories from localStorage data
            const categories = Array.from(new Set(data.map((item: any) => item.category?.trim()).filter(Boolean))) as string[]
            // Always include 'News' as default, then add other categories
            const allCategories = categories.length > 0 
              ? Array.from(new Set(['News', ...categories])) 
              : ['News']
            setAvailableCategories(allCategories)
            
            setNewsData(mappedLocalNews)
            setFilteredNews(mappedLocalNews)
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError)
          }
        }
      }
    }
    fetchNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleEditNews = async (news: NewsItem) => {
    // Validate that news has a valid ID
    if (!news.id || news.id === '') {
      showToast('Invalid news ID. Please refresh the page and try again.', 'error')
      return
    }
    
    console.log('Editing news with ID:', news.id)
    console.log('News data:', news)
    
    // Verify that the news exists in the database before opening edit modal
    try {
      const existingNews = await getNewsDetail(news.id, 'English')
      console.log('News exists in database:', existingNews)
      
      // Update news data with latest from database - prioritize detail data
      const updatedNews: NewsItem = {
        ...news,
        // Use detail data if available, otherwise use existing news data
        title: existingNews.title?.trim() || news.title?.trim() || '',
        description: existingNews.description?.trim() || news.description?.trim() || '',
        category: existingNews.categoryName?.trim() || news.category?.trim() || 'News', // Default to 'News' if empty
        image: existingNews.coverPictureUrl || news.image || '',
        tags: existingNews.tags || news.tags || [],
        author: existingNews.author?.trim() || news.author?.trim() || 'Teskup Team',
        readTime: existingNews.readTimeMinutes || news.readTime || 5,
        views: existingNews.viewCount || news.views || 0,
        comments: existingNews.likeCount || news.comments || 0,
      }
      
      console.log('Updated news for edit modal:', updatedNews)
      console.log('  - Title:', updatedNews.title)
      console.log('  - Description:', updatedNews.description)
      console.log('  - Category:', updatedNews.category)
      
      setEditingNews(updatedNews)
      setIsModalOpen(true)
    } catch (error: any) {
      console.error('Error verifying news existence:', error)
      // If news doesn't exist, show error and refresh list
      showToast('News not found in database. Refreshing news list...', 'error')
      
      // Refresh news list
      try {
        const response = await getAllNews('English')
        const mappedNewsPromises = response.map(async (item) => {
          let finalItem = item
          
          if (!item.title || !item.description || item.title === null || item.description === null) {
            try {
              // Try to fetch detail for all 3 languages to get the best available data
              const languages = ['English', 'Azerbaijani', 'Russian']
              let bestDetail: NewsResponse | null = null
              
              for (const lang of languages) {
                try {
                  const detail = await getNewsDetail(item.id, lang)
                  
                  // Use the first language that has title and description
                  if (detail.title && detail.description) {
                    bestDetail = detail
                    break
                  }
                  
                  // If no best detail yet, use this one as fallback
                  if (!bestDetail) {
                    bestDetail = detail
                  }
                } catch (langError) {
                  // Continue to next language
                }
              }
              
              if (bestDetail) {
                finalItem = {
                  ...item,
                  title: bestDetail.title || item.title,
                  description: bestDetail.description || item.description,
                  categoryName: bestDetail.categoryName || item.categoryName,
                }
              }
            } catch (detailError) {
              console.error(`Error fetching detail for news ID ${item.id}:`, detailError)
            }
          }
          
          return {
            id: finalItem.id || '',
            title: finalItem.title?.trim() || '',
            description: finalItem.description?.trim() || '',
            category: finalItem.categoryName?.trim() || '',
            image: finalItem.coverPictureUrl || '',
            tags: finalItem.tags || [],
            author: finalItem.author || '',
            readTime: finalItem.readTimeMinutes || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: finalItem.viewCount || 0,
            comments: finalItem.likeCount || 0,
          }
        })
        
        const mappedNews = await Promise.all(mappedNewsPromises)
        setNewsData(mappedNews)
        setFilteredNews(mappedNews)
        localStorage.setItem('newsData', JSON.stringify(mappedNews))
      } catch (refreshError) {
        console.error('Error refreshing news list:', refreshError)
      }
    }
  }

  const handleDeleteClick = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      newsId: id,
      newsTitle: title,
    })
  }

  const handleDeleteConfirm = async () => {
    if (confirmModal.newsId) {
      try {
        // Delete from backend API
        await deleteNews(confirmModal.newsId)
        
        // Remove from local state
        const updatedNews = newsData.filter((news) => news.id !== confirmModal.newsId)
        setNewsData(updatedNews)
        setFilteredNews(updatedNews)
        localStorage.setItem('newsData', JSON.stringify(updatedNews))
        
        setConfirmModal({ isOpen: false, newsId: null, newsTitle: null })
        showToast('News deleted successfully from database!', 'success')
      } catch (error: any) {
        console.error('Error deleting news:', error)
        showToast(error?.message || 'Error deleting news. Please try again.', 'error')
      }
    }
  }

  const handleDeleteCancel = () => {
    setConfirmModal({ isOpen: false, newsId: null, newsTitle: null })
  }

  const handleSaveNews = async (news: NewsItem, imageFile?: File | string) => {
    // Declare newsIdToUpdate outside the if block so it's accessible in error handler
    let newsIdToUpdate: string | null = null
    
    if (editingNews) {
      // Update existing news via API
      try {
        // Always use the original editing news ID
        newsIdToUpdate = editingNews.id
        
        if (!newsIdToUpdate || newsIdToUpdate === '') {
          showToast('Invalid news ID. Cannot update news.', 'error')
          return
        }
        
        console.log('=== UPDATE NEWS ===')
        console.log('News ID to update:', newsIdToUpdate)
        console.log('News data:', news)
        console.log('Editing news:', editingNews)
        
        // Try to get news detail (optional - don't fail if it doesn't exist)
        // This is just for logging, we'll proceed with update anyway
        try {
          const existingNews = await getNewsDetail(newsIdToUpdate, 'English')
          console.log('News exists in database (from GetDetail):', existingNews)
        } catch (detailError: any) {
          console.warn('Could not fetch news detail (this is OK, we will still try to update):', detailError?.message)
          // Continue with update attempt - GetDetail might fail but Update might still work
        }
        
        // Ensure category is set, default to 'News' if empty
        const categoryToUse = news.category?.trim() || 'News'
        const categoryId = getCategoryId(categoryToUse)
        const languageId = getDefaultLanguageIdSync()
        
        console.log('=== UPDATE NEWS CATEGORY ===')
        console.log('Original category:', news.category)
        console.log('Category to use:', categoryToUse)
        console.log('CategoryId:', categoryId)
        console.log('LanguageId:', languageId)
        console.log('===========================')

        // Prepare image data
        let coverPicture: File | Blob | undefined = undefined
        let imageUrl: string | undefined = undefined

        if (imageFile instanceof File) {
          coverPicture = imageFile
        } else if (typeof imageFile === 'string') {
          if (imageFile.startsWith('data:')) {
            const base64Data = imageFile.split(',')[1] || imageFile
            const mimeType = imageFile.match(/data:([^;]+);/)?.[1] || 'image/png'
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            coverPicture = new Blob([byteArray], { type: mimeType })
          } else {
            imageUrl = imageFile
          }
        }

        console.log('=== UPDATE NEWS DATA ===')
        console.log('Title:', news.title)
        console.log('Description:', news.description)
        console.log('Category:', news.category)
        console.log('CategoryId:', categoryId)
        console.log('Author:', news.author)
        console.log('Tags:', news.tags)
        console.log('ReadTime:', news.readTime)
        console.log('========================')
        
        // Ensure all required fields are present
        const titleToUse = news.title?.trim() || ''
        const descriptionToUse = news.description?.trim() || ''
        
        if (!titleToUse) {
          showToast('Title is required. Please enter a title.', 'error')
          return
        }
        
        if (!descriptionToUse) {
          showToast('Description is required. Please enter a description.', 'error')
          return
        }
        
        if (!categoryToUse || categoryToUse === '') {
          showToast('Category is required. Please select a category.', 'error')
          return
        }
        
        console.log('=== SENDING UPDATE REQUEST ===')
        console.log('Title:', titleToUse)
        console.log('Description:', descriptionToUse)
        console.log('Category:', categoryToUse)
        console.log('CategoryId:', categoryId)
        console.log('==============================')
        
        await updateNews({
          Id: newsIdToUpdate, // Always use the original editing news ID
          Title: titleToUse,
          Description: descriptionToUse,
          CategoryId: categoryId,
          TagsCsv: news.tags?.join(',') || '',
          Author: news.author?.trim() || 'Teskup Team',
          ReadTimeMinutes: news.readTime || 5,
          CoverPicture: coverPicture,
          ImageUrl: imageUrl,
          Link: 'https://teskup.com',
          IsDeactive: false,
          LanguageId: languageId,
        })
        
        console.log('Update successful!')

        showToast('News updated successfully in database!', 'success')
        
        // Wait a bit for backend to process the update (some backends need time to commit changes)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Refresh news list from API
        const response = await getAllNews('English')
        console.log('Refreshed news from API after update:', response)
        console.log('Looking for updated news ID:', newsIdToUpdate)
        
        // Create a map to store the updated category for the specific news item
        const updatedCategoryMap = new Map<string, string>()
        updatedCategoryMap.set(newsIdToUpdate, news.category)
        
        // Map API response to NewsItem format - ALWAYS fetch detail for the updated news item
        const mappedNewsPromises = response.map(async (item) => {
          let finalItem = item
          
          // ALWAYS fetch detail for the news item we just updated to get the latest data
          const isUpdatedItem = item.id === newsIdToUpdate
          
          // Also fetch detail if title, description, or categoryName is null/empty
          const shouldFetchDetail = isUpdatedItem || 
                                    !item.title || !item.description || !item.categoryName || 
                                    item.title === null || item.description === null || item.categoryName === null ||
                                    item.title === '' || item.description === '' || item.categoryName === ''
          
          if (shouldFetchDetail) {
            try {
              console.log(`Fetching detail for news ID: ${item.id} after update (${isUpdatedItem ? 'UPDATED ITEM' : 'null/empty fields'})`)
              
              // Try to fetch detail for all 3 languages to get the best available data
              const languages = ['English', 'Azerbaijani', 'Russian']
              let bestDetail: NewsResponse | null = null
              
              for (const lang of languages) {
                try {
                  const detail = await getNewsDetail(item.id, lang)
                  console.log(`Fetched detail for ${lang} after update:`, detail)
                  
                  // Use the first language that has title and description
                  if (detail.title && detail.description) {
                    bestDetail = detail
                    break
                  }
                  
                  // If no best detail yet, use this one as fallback
                  if (!bestDetail) {
                    bestDetail = detail
                  }
                } catch (langError) {
                  console.warn(`Error fetching detail for ${lang} after update:`, langError)
                  // Continue to next language
                }
              }
              
              if (bestDetail) {
                // Merge detail data with item data, prioritizing detail data
                finalItem = {
                  ...item,
                  title: bestDetail.title || item.title,
                  description: bestDetail.description || item.description,
                  categoryName: bestDetail.categoryName || item.categoryName,
                }
                console.log('Final item after detail fetch (best available):', {
                  id: finalItem.id,
                  title: finalItem.title,
                  description: finalItem.description,
                  categoryName: finalItem.categoryName,
                })
              }
            } catch (detailError) {
              console.error(`Error fetching detail for news ID ${item.id} after update:`, detailError)
              // Continue with original item if detail fetch fails
            }
          }
          
          // If this is the updated news item, prioritize the data from the update form
          // Otherwise, use the category from API response or detail
          const updatedCategory = updatedCategoryMap.get(item.id)
          
          // For updated item, use form data if available, otherwise use detail/API data
          let finalTitle = finalItem.title?.trim() || ''
          let finalDescription = finalItem.description?.trim() || ''
          let finalCategory = finalItem.categoryName?.trim() || ''
          
          if (isUpdatedItem) {
            // For updated item, prioritize detail data (from GetDetail) over form data
            // because GetDetail returns the actual data from database after update
            // But if detail data is still null/empty, use form data as fallback
            finalTitle = finalItem.title?.trim() || news.title?.trim() || finalTitle
            finalDescription = finalItem.description?.trim() || news.description?.trim() || finalDescription
            finalCategory = finalItem.categoryName?.trim() || news.category?.trim() || updatedCategory?.trim() || finalCategory || 'News'
            
            console.log('=== UPDATED ITEM DATA ===')
            console.log('Detail title:', finalItem.title)
            console.log('Form title:', news.title)
            console.log('Final title:', finalTitle)
            console.log('Detail description:', finalItem.description)
            console.log('Form description:', news.description)
            console.log('Final description:', finalDescription)
            console.log('Detail categoryName:', finalItem.categoryName)
            console.log('Form category:', news.category)
            console.log('Final category:', finalCategory)
            console.log('=========================')
          } else {
            // For other items, use detail/API data
            finalCategory = updatedCategory?.trim() || finalCategory || 'News'
          }
          
          const newsItem: NewsItem = {
            id: finalItem.id || '',
            title: finalTitle,
            description: finalDescription,
            category: finalCategory,
            image: finalItem.coverPictureUrl || '',
            tags: finalItem.tags || [],
            author: finalItem.author?.trim() || 'Teskup Team',
            readTime: finalItem.readTimeMinutes || 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: finalItem.viewCount || 0,
            comments: finalItem.likeCount || 0,
          }
          console.log('Mapped news item after update:', {
            id: newsItem.id,
            title: newsItem.title,
            description: newsItem.description,
            category: newsItem.category,
            isUpdatedItem,
          })
          return newsItem
        })
        
        const mappedNews = await Promise.all(mappedNewsPromises)
        
        // Also update categories list - use categories from mapped news (which includes detail data)
        const categories = Array.from(new Set(mappedNews.map(item => item.category?.trim()).filter(Boolean))) as string[]
        const allCategories = categories.length > 0 
          ? Array.from(new Set(['News', ...categories])) 
          : ['News']
        setAvailableCategories(allCategories)
        
        setNewsData(mappedNews)
        setFilteredNews(mappedNews)
        localStorage.setItem('newsData', JSON.stringify(mappedNews))
        
        setIsModalOpen(false)
        setEditingNews(null)
      } catch (error: any) {
        console.error('=== ERROR UPDATING NEWS ===')
        console.error('Error object:', error)
        console.error('Error message:', error?.message)
        console.error('Error stack:', error?.stack)
        console.error('News ID:', newsIdToUpdate || 'unknown')
        console.error('News data:', news)
        console.error('Editing news ID:', editingNews?.id || 'unknown')
        console.error('===========================')
        
        const errorMessage = error?.message || 'Error updating news. Please try again.'
        
        // Use newsIdToUpdate if available, otherwise use editingNews.id
        const updateNewsId = newsIdToUpdate || editingNews?.id || null
        
        // Check for specific error types
        const isNotFoundError = errorMessage.includes('not found') || 
                                errorMessage.includes('expected to affect 1 row') ||
                                errorMessage.includes('404') ||
                                errorMessage.includes('No rows affected')
        
        if (isNotFoundError) {
          console.warn('News might not exist in database, but trying to refresh list anyway...')
          
          // Try to refresh news list to see current state
          try {
            const response = await getAllNews('English')
            const mappedNewsPromises = response.map(async (item) => {
              let finalItem = item
              
              // Check if this is the news we tried to update
              if (updateNewsId && item.id === updateNewsId) {
                console.log('Found the news we tried to update in the list:', item)
              }
              
              if (!item.title || !item.description || item.title === null || item.description === null) {
                try {
                  const detail = await getNewsDetail(item.id, 'English')
                  finalItem = {
                    ...item,
                    title: detail.title || item.title,
                    description: detail.description || item.description,
                    categoryName: detail.categoryName || item.categoryName,
                  }
                } catch (detailError) {
                  console.error(`Error fetching detail for news ID ${item.id}:`, detailError)
                }
              }
              
              return {
                id: finalItem.id || '',
                title: finalItem.title?.trim() || '',
                description: finalItem.description?.trim() || '',
                category: finalItem.categoryName?.trim() || 'News',
                image: finalItem.coverPictureUrl || '',
                tags: finalItem.tags || [],
                author: finalItem.author?.trim() || 'Teskup Team',
                readTime: finalItem.readTimeMinutes || 5,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                views: finalItem.viewCount || 0,
                comments: finalItem.likeCount || 0,
              }
            })
            
            const mappedNews = await Promise.all(mappedNewsPromises)
            
            // Check if the news still exists in the list
            const newsStillExists = updateNewsId ? mappedNews.some(item => item.id === updateNewsId) : false
            
            if (newsStillExists) {
              // News exists, so the update might have actually succeeded
              // Refresh the list and show success message
              setNewsData(mappedNews)
              setFilteredNews(mappedNews)
              localStorage.setItem('newsData', JSON.stringify(mappedNews))
              showToast('News updated successfully!', 'success')
              setIsModalOpen(false)
              setEditingNews(null)
            } else {
              // News doesn't exist, show error
              setNewsData(mappedNews)
              setFilteredNews(mappedNews)
              localStorage.setItem('newsData', JSON.stringify(mappedNews))
              showToast('News not found in database. The news may have been deleted. Please refresh the page.', 'error')
              setIsModalOpen(false)
              setEditingNews(null)
            }
          } catch (refreshError) {
            console.error('Error refreshing news list:', refreshError)
            showToast('Error updating news. Please refresh the page and try again.', 'error')
          }
        } else {
          // Other errors - show the error message with more details
          console.error('Update error (not not found):', errorMessage)
          // Show a more user-friendly error message
          const userFriendlyMessage = errorMessage.includes('Failed to update news') 
            ? errorMessage 
            : `Failed to update news: ${errorMessage}`
          showToast(userFriendlyMessage, 'error')
        }
      }
    } else {
      // Create new news via API
      try {
        // Ensure category is set, default to 'News' if empty
        const categoryToUse = news.category?.trim() || 'News'
        const categoryId = getCategoryId(categoryToUse)
        // LanguageId should be language name (e.g., "English") for AddNewsDetail
        const languageId = 'English' // Default to English
        
        console.log('=== CREATE NEWS CATEGORY ===')
        console.log('Original category from news:', news.category)
        console.log('Category to use:', categoryToUse)
        console.log('CategoryId (should be 164345bb-18de-4d78-97fb-9a53af74ec68 for News):', categoryId)
        console.log('LanguageId (language name):', languageId)
        console.log('============================')
        
        // Validate category ID
        if (!categoryId || categoryId === '') {
          showToast('Invalid category. Please select a valid category.', 'error')
          return
        }

        // Prepare image data
        let coverPicture: File | Blob | undefined = undefined
        let imageUrl: string | undefined = undefined

        if (imageFile instanceof File) {
          coverPicture = imageFile
        } else if (typeof imageFile === 'string') {
          if (imageFile.startsWith('data:')) {
            // Base64 image - convert to Blob
            const base64Data = imageFile.split(',')[1] || imageFile
            const mimeType = imageFile.match(/data:([^;]+);/)?.[1] || 'image/png'
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            coverPicture = new Blob([byteArray], { type: mimeType })
          } else {
            // Regular URL
            imageUrl = imageFile
          }
        }

        console.log('=== CREATE NEWS DATA ===')
        console.log('Title:', news.title)
        console.log('Description:', news.description)
        console.log('Category:', news.category)
        console.log('CategoryId:', categoryId)
        console.log('Author:', news.author)
        console.log('Tags:', news.tags)
        console.log('ReadTime:', news.readTime)
        console.log('========================')
        
        // Ensure all required fields are present
        const titleToUse = news.title?.trim() || ''
        const descriptionToUse = news.description?.trim() || ''
        
        if (!titleToUse) {
          showToast('Title is required. Please enter a title.', 'error')
          return
        }
        
        if (!descriptionToUse) {
          showToast('Description is required. Please enter a description.', 'error')
          return
        }
        
        if (!categoryToUse || categoryToUse === '') {
          showToast('Category is required. Please select a category.', 'error')
          return
        }
        
        console.log('=== SENDING CREATE REQUEST ===')
        console.log('Title:', titleToUse)
        console.log('Description:', descriptionToUse)
        console.log('Category:', categoryToUse)
        console.log('CategoryId:', categoryId)
        console.log('==============================')
        
        const createResult = await createNews({
          Title: titleToUse,
          Description: descriptionToUse,
          CategoryId: categoryId,
          TagsCsv: news.tags?.join(',') || '',
          Author: news.author?.trim() || 'Teskup Team',
          ReadTimeMinutes: news.readTime || 5,
          CoverPicture: coverPicture,
          ImageUrl: imageUrl,
          Link: 'https://teskup.com', // Required field - placeholder URL
          IsDeactive: false,
          LanguageId: languageId,
        })

        console.log('CreateNews result:', createResult)
        
        // Get the created news ID if available, otherwise fetch all news and find the latest
        let createdNewsId: string | null = createResult.id || null
        
        // If we don't have the ID from response, fetch all news and get the latest one
        if (!createdNewsId) {
          console.log('No ID in CreateNews response, fetching all news to find the latest...')
          const allNews = await getAllNews('English')
          // The latest news should be the first one (most recently created)
          createdNewsId = allNews[0]?.id || null
        }
        
        // IMPORTANT: Add news detail (title, description) to the Details array for ALL 3 languages
        // CreateNews only creates the base news, but title/description must be in Details array
        // Add details for English, Azerbaijani, and Russian so it works in all languages
        if (createdNewsId) {
          const languages = [
            { name: 'English', id: '669f256a-0b60-4989-bf88-4817b50dd365' },
            { name: 'Azerbaijani', id: '423dfdaf-ad5b-4843-a009-3abc5261e1a0' },
            { name: 'Russian', id: '1c9980c5-a7df-4bd7-9ef6-34eb3f2dbcac' }
          ]
          
          console.log('Adding news detail for ID:', createdNewsId)
          console.log('Title:', titleToUse)
          console.log('Description:', descriptionToUse)
          console.log('Adding details for all 3 languages:', languages.map(l => l.name))
          
          // Add details for all languages in parallel
          const detailResults = await Promise.allSettled(
            languages.map(async (lang) => {
              await addNewsDetail(createdNewsId, {
                Title: titleToUse,
                Description: descriptionToUse,
                LanguageId: lang.name, // Use language name (e.g., "English", "Azerbaijani", "Russian")
              })
              console.log(`News detail added successfully for ${lang.name}!`)
              return lang.name
            })
          )
          
          const failedLanguages = detailResults
            .map((result, index) => {
              if (result.status === 'rejected') {
                console.error(`Error adding news detail for ${languages[index].name}:`, result.reason)
                return languages[index].name
              }
              return null
            })
            .filter((lang): lang is string => lang !== null)
          
          if (failedLanguages.length > 0) {
            console.warn(`Failed to add details for languages: ${failedLanguages.join(', ')}`)
            // Don't fail the entire operation if some detail adds fail
            showToast(`News created, but failed to add details for: ${failedLanguages.join(', ')}. Please edit the news to add title and description.`, 'warning')
          } else {
            console.log('News detail added successfully for all languages!')
          }
        }
        
        showToast('News added successfully to database!', 'success')
        
        // Refresh news list from API
        const response = await getAllNews('English')
        console.log('Refreshed news from API after create:', response)
        
        // Map API response to NewsItem format - fetch detail for items with null title/description/categoryName
        const mappedNewsPromises = response.map(async (item) => {
          let finalItem = item
          
          // Always fetch detail for the newly created news, or if title/description/categoryName is null
          const shouldFetchDetail = 
            (createdNewsId && item.id === createdNewsId) ||
            !item.title || !item.description || !item.categoryName || 
            item.title === null || item.description === null || item.categoryName === null ||
            item.title === '' || item.description === '' || item.categoryName === ''
          
          if (shouldFetchDetail) {
            try {
              console.log(`Fetching detail for news ID: ${item.id} after create (title/description/categoryName is null or empty, or is newly created)`)
              
              // Try to fetch detail for all 3 languages to get the best available data
              const languages = ['English', 'Azerbaijani', 'Russian']
              let bestDetail: NewsResponse | null = null
              
              for (const lang of languages) {
                try {
                  const detail = await getNewsDetail(item.id, lang)
                  console.log(`Fetched detail for ${lang}:`, detail)
                  
                  // Use the first language that has title and description
                  if (detail.title && detail.description) {
                    bestDetail = detail
                    break
                  }
                  
                  // If no best detail yet, use this one as fallback
                  if (!bestDetail) {
                    bestDetail = detail
                  }
                } catch (langError) {
                  console.warn(`Error fetching detail for ${lang}:`, langError)
                  // Continue to next language
                }
              }
              
              if (bestDetail) {
                // Merge detail data with item data, prioritizing detail data
                finalItem = {
                  ...item,
                  title: bestDetail.title || item.title,
                  description: bestDetail.description || item.description,
                  categoryName: bestDetail.categoryName || item.categoryName,
                }
                console.log('Final item after detail fetch (best available):', finalItem)
              }
            } catch (detailError) {
              console.error(`Error fetching detail for news ID ${item.id} after create:`, detailError)
              // Continue with original item if detail fetch fails
            }
          }
          
          // Use created category if API doesn't return it, otherwise use API categoryName or detail categoryName
          const categoryToUse = finalItem.categoryName?.trim() || news.category?.trim() || 'News'
          
          const newsItem: NewsItem = {
            id: finalItem.id || '',
            title: finalItem.title?.trim() || '',
            description: finalItem.description?.trim() || '',
            category: categoryToUse,
            image: finalItem.coverPictureUrl || '',
            tags: finalItem.tags || [],
            author: finalItem.author?.trim() || 'Teskup Team',
            readTime: finalItem.readTimeMinutes || 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: finalItem.viewCount || 0,
            comments: finalItem.likeCount || 0,
          }
          console.log('Mapped news item after create:', newsItem)
          console.log('  - Item ID:', item.id)
          console.log('  - API categoryName:', item.categoryName)
          console.log('  - Detail categoryName:', finalItem.categoryName)
          console.log('  - Created category from form:', news.category)
          console.log('  - Final category:', categoryToUse)
          return newsItem
        })
        
        const mappedNews = await Promise.all(mappedNewsPromises)
        
        // Also update categories list - use categories from mapped news (which includes detail data)
        const categories = Array.from(new Set(mappedNews.map(item => item.category?.trim()).filter(Boolean))) as string[]
        const allCategories = categories.length > 0 
          ? Array.from(new Set(['News', ...categories])) 
          : ['News']
        setAvailableCategories(allCategories)
        
        setNewsData(mappedNews)
        setFilteredNews(mappedNews)
        localStorage.setItem('newsData', JSON.stringify(mappedNews))
        
        setIsModalOpen(false)
        setEditingNews(null)
      } catch (error: any) {
        console.error('Error creating news:', error)
        showToast(error?.message || 'Error creating news. Please try again.', 'error')
      }
    }
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
                          <div className="font-semibold text-gray-900 min-w-[150px]">
                            {news.title || <span className="text-gray-400 italic">No title</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-gray-600 max-w-md truncate" 
                            title={news.description || ''}
                          >
                            {news.description || <span className="text-gray-400 italic">No description</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {news.category ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 min-w-[80px]">
                              {news.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">No category</span>
                          )}
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
          categories={availableCategories}
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
