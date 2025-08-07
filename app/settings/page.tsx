'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, LogOut, User, Download, BookOpen, Plus, Edit3, Trash2, RotateCcw, X, AlertTriangle, Settings as SettingsIcon, Palette, Library, Shield } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../contexts/BookContext'
import { useStatusOptions, StatusOption } from '../contexts/StatusOptionsContext'
import { useSeries, Series } from '../contexts/SeriesContext'
import { useTags, Tag } from '../contexts/TagsContext'

type SettingsTab = 'overview' | 'status' | 'series' | 'tags' | 'library' | 'account'

export default function Settings() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { books, deleteAllBooks } = useBooks()
  const { 
    statusOptions, 
    loading: statusLoading, 
    addStatusOption, 
    updateStatusOption, 
    deleteStatusOption, 
    resetToDefaults 
  } = useStatusOptions()

  const {
    series,
    loading: seriesLoading,
    createSeries,
    updateSeries,
    deleteSeries
  } = useSeries()

  const {
    tags,
    loading: tagsLoading,
    createTag,
    updateTag,
    deleteTag,
    resetToDefaults: resetTagsToDefaults,
    addMissingDefaultTags
  } = useTags()

  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab
    if (tabParam && ['overview', 'status', 'series', 'tags', 'library', 'account'].includes(tabParam)) {
      setActiveTab(tabParam)
      // Auto-open add series modal if coming from series assignment
      if (tabParam === 'series' && searchParams.get('action') === 'add') {
        setShowAddSeries(true)
      }
    }
  }, [searchParams])
  const [showAddStatus, setShowAddStatus] = useState(false)
  const [editingStatus, setEditingStatus] = useState<StatusOption | null>(null)
  const [newStatus, setNewStatus] = useState({ name: '', color: 'gray', icon: '📖' })

  const [showAddSeries, setShowAddSeries] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [newSeries, setNewSeries] = useState({ name: '', description: '', color: 'blue', icon: '📚' })

  const [showAddTag, setShowAddTag] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [newTag, setNewTag] = useState({ name: '', color: 'gray', icon: '🏷️' })

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Are you absolutely sure you want to delete ALL your data? This action cannot be undone and will permanently remove all your books, series, and status options.')) {
      return
    }
    
    if (!confirm('This will delete everything - all books, series, and custom status options. Are you really sure?')) {
      return
    }
    
    try {
      await deleteAllBooks()
      await resetToDefaults()
      
      for (const seriesItem of series) {
        await deleteSeries(seriesItem.id)
      }
      
      alert('All data has been successfully deleted.')
    } catch (error) {
      console.error('Error deleting all data:', error)
      alert('Failed to delete all data. Please try again.')
    }
  }

  const handleExportLibrary = () => {
    const dataStr = JSON.stringify(books, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-book-library.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleAddStatus = async () => {
    if (!newStatus.name.trim()) return
    
    try {
      await addStatusOption({
        name: newStatus.name.trim(),
        color: newStatus.color,
        icon: newStatus.icon,
        isDefault: false
      })
      setNewStatus({ name: '', color: 'gray', icon: '📖' })
      setShowAddStatus(false)
    } catch (error) {
      console.error('Error adding status option:', error)
      alert('Failed to add status option')
    }
  }

  const handleUpdateStatus = async () => {
    if (!editingStatus || !editingStatus.name.trim()) return
    
    try {
      await updateStatusOption(editingStatus.id, {
        name: editingStatus.name.trim(),
        color: editingStatus.color,
        icon: editingStatus.icon
      })
      setEditingStatus(null)
    } catch (error) {
      console.error('Error updating status option:', error)
      alert('Failed to update status option')
    }
  }

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this status option?')) return
    
    try {
      await deleteStatusOption(id)
    } catch (error) {
      console.error('Error deleting status option:', error)
      alert('Failed to delete status option')
    }
  }

  const handleResetToDefaults = async () => {
    if (!confirm('This will reset all status options to defaults. Continue?')) return
    
    try {
      await resetToDefaults()
    } catch (error) {
      console.error('Error resetting status options:', error)
      alert('Failed to reset status options')
    }
  }

  const handleAddSeries = async () => {
    if (!newSeries.name.trim()) return
    
    try {
      await createSeries({
        name: newSeries.name.trim(),
        description: newSeries.description.trim() || '',
        color: newSeries.color,
        icon: newSeries.icon,
        bookIds: []
      })
      setNewSeries({ name: '', description: '', color: 'blue', icon: '📚' })
      setShowAddSeries(false)
    } catch (error) {
      console.error('Error adding series:', error)
      alert('Failed to add series')
    }
  }

  const handleUpdateSeries = async () => {
    if (!editingSeries || !editingSeries.name.trim()) return
    
    try {
      await updateSeries(editingSeries.id, {
        name: editingSeries.name.trim(),
        description: editingSeries.description?.trim(),
        color: editingSeries.color,
        icon: editingSeries.icon
      })
      setEditingSeries(null)
    } catch (error) {
      console.error('Error updating series:', error)
      alert('Failed to update series')
    }
  }

  const handleDeleteSeries = async (id: string) => {
    if (!confirm('Are you sure you want to delete this series? This will remove all books from the series.')) return
    
    try {
      await deleteSeries(id)
    } catch (error) {
      console.error('Error deleting series:', error)
      alert('Failed to delete series')
    }
  }

  const handleAddTag = async () => {
    if (!newTag.name.trim()) return
    
    try {
      console.log('Attempting to create tag:', newTag)
      await createTag({
        name: newTag.name.trim(),
        color: newTag.color,
        icon: newTag.icon
      })
      setNewTag({ name: '', color: 'gray', icon: '🏷️' })
      setShowAddTag(false)
    } catch (error) {
      console.error('Error adding tag:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to add tag: ${errorMessage}`)
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) return
    
    try {
      await updateTag(editingTag.id, {
        name: editingTag.name.trim(),
        color: editingTag.color,
        icon: editingTag.icon
      })
      setEditingTag(null)
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Failed to update tag')
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove the tag from all books.')) return
    
    try {
      await deleteTag(id)
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  const handleResetTagsToDefaults = async () => {
    if (!confirm('This will reset all tags to defaults. Continue?')) return
    
    try {
      await resetTagsToDefaults()
    } catch (error) {
      console.error('Error resetting tags:', error)
      alert('Failed to reset tags')
    }
  }

  const handleAddMissingDefaultTags = async () => {
    try {
      await addMissingDefaultTags()
      alert('New default tags have been added!')
    } catch (error) {
      console.error('Error adding missing default tags:', error)
      alert('Failed to add missing default tags')
    }
  }

  const testTagSync = async () => {
    try {
      // Create a test tag
      await createTag({
        name: 'Test Tag',
        color: 'blue',
        icon: '🧪'
      })
      alert('Test tag created successfully! Check the tags list.')
    } catch (error) {
      console.error('Error creating test tag:', error)
      alert('Failed to create test tag. Check console for details.')
    }
  }

  const ownedCount = books.filter(book => book.status === 'owned').length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length

  const tabs = [
    { id: 'overview', name: 'Overview', icon: SettingsIcon },
    { id: 'status', name: 'Status Options', icon: Palette },
    { id: 'series', name: 'Series', icon: Library },
    { id: 'tags', name: 'Tags', icon: BookOpen },
    { id: 'library', name: 'Library', icon: BookOpen },
    { id: 'account', name: 'Account', icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-100 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-2 py-2">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap min-w-fit ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* About Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">About Book Tracker</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700 text-sm">
                    <strong>Book Tracker</strong> - "Do I own this book?" is a simple app to help you quickly check if you already own a book while shopping.
                  </p>
                  <p className="text-gray-600 text-xs">
                    Perfect for bookstores, libraries, and online shopping. Just scan a barcode or search for a book to instantly see if it's in your collection.
                  </p>
                </div>
              </div>

              {/* Library Stats */}
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Library className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Library Statistics</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-600">{books.length}</div>
                    <div className="text-xs sm:text-sm text-blue-700 font-medium">Total Books</div>
                  </div>
                  <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600">{ownedCount}</div>
                    <div className="text-xs sm:text-sm text-green-700 font-medium">Books Owned</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-amber-600">{wishlistCount}</div>
                    <div className="text-xs sm:text-sm text-amber-700 font-medium">Wishlist</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-600">{series.length}</div>
                    <div className="text-xs sm:text-sm text-purple-700 font-medium">Series</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('status')}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg sm:rounded-xl transition-colors"
                  >
                    <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-blue-900 text-sm sm:text-base">Manage Status Options</p>
                      <p className="text-xs sm:text-sm text-blue-700">Customize book statuses</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('series')}
                    className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg sm:rounded-xl transition-colors"
                  >
                    <Library className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-purple-900 text-sm sm:text-base">Manage Series</p>
                      <p className="text-xs sm:text-sm text-purple-700">Organize book series</p>
                    </div>
                  </button>
                  <button
                    onClick={handleExportLibrary}
                    className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg sm:rounded-xl transition-colors"
                  >
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-green-900 text-sm sm:text-base">Export Library</p>
                      <p className="text-xs sm:text-sm text-green-700">Download your data</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('account')}
                    className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg sm:rounded-xl transition-colors"
                  >
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-red-900 text-sm sm:text-base">Account Settings</p>
                      <p className="text-xs sm:text-sm text-red-700">Manage your account</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Status Options Tab */}
          {activeTab === 'status' && (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Book Status Options</h3>
                </div>
                <button
                  onClick={() => setShowAddStatus(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Status</span>
                </button>
              </div>
              
              {statusLoading ? (
                <div className="text-center py-8">
                  <div className="spinner h-8 w-8 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading status options...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusOptions.map((status) => (
                    <div 
                      key={status.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{status.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-base sm:text-lg truncate">{status.name}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1">
                            <span className={`inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-${status.color}-500 flex-shrink-0`}></span>
                            <span className="text-xs sm:text-sm text-gray-500 truncate">
                              {status.isDefault ? 'Default Status' : 'Custom Status'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {!status.isDefault && (
                          <>
                            <button
                              onClick={() => setEditingStatus(status)}
                              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Edit Status"
                            >
                              <Edit3 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteStatus(status.id)}
                              className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Status"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleResetToDefaults}
                    className="w-full flex items-center justify-center gap-2 p-4 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border-2 border-dashed border-gray-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to Default Status Options</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Series Tab */}
          {activeTab === 'series' && (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Library className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Book Series</h3>
                </div>
                <button
                  onClick={() => setShowAddSeries(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Series</span>
                </button>
              </div>
              
              {seriesLoading ? (
                <div className="text-center py-8">
                  <div className="spinner h-8 w-8 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading series...</p>
                </div>
              ) : series.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Library className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Series Yet</h4>
                  <p className="text-gray-600 mb-6">Create your first series to group related books together.</p>
                  <button
                    onClick={() => setShowAddSeries(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Series</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {series.map((seriesItem) => (
                    <div 
                      key={seriesItem.id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xl sm:text-2xl flex-shrink-0">{seriesItem.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-base sm:text-lg truncate">{seriesItem.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block w-3 h-3 rounded-full bg-${seriesItem.color}-500 flex-shrink-0`}></span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {seriesItem.bookIds.length} book{seriesItem.bookIds.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingSeries(seriesItem)}
                            className="p-1.5 sm:p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Edit Series"
                          >
                            <Edit3 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteSeries(seriesItem.id)}
                            className="p-1.5 sm:p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete Series"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      
                      {seriesItem.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{seriesItem.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Book Tags</h3>
                </div>
                <button
                  onClick={() => setShowAddTag(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tag</span>
                </button>
              </div>
              
              {tagsLoading ? (
                <div className="text-center py-8">
                  <div className="spinner h-8 w-8 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading tags...</p>
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Tags Yet</h4>
                  <p className="text-gray-600 mb-6">Create your first tag to categorize your books.</p>
                  <button
                    onClick={() => setShowAddTag(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Tag</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tags.map((tag) => (
                    <div 
                      key={tag.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{tag.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-base sm:text-lg truncate">{tag.name}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1">
                            <span className={`inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-${tag.color}-500 flex-shrink-0`}></span>
                            <span className="text-xs sm:text-sm text-gray-500 truncate">
                              Created {new Date(tag.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Edit Tag"
                        >
                          <Edit3 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Tag"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleAddMissingDefaultTags}
                      className="w-full flex items-center justify-center gap-2 p-4 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border-2 border-dashed border-blue-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Missing Default Tags</span>
                    </button>
                    
                    <button
                      onClick={testTagSync}
                      className="w-full flex items-center justify-center gap-2 p-4 text-green-600 hover:bg-green-50 rounded-xl transition-colors border-2 border-dashed border-green-300"
                    >
                      <span>🧪</span>
                      <span>Test Tag Sync</span>
                    </button>
                    
                    <button
                      onClick={handleResetTagsToDefaults}
                      className="w-full flex items-center justify-center gap-2 p-4 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border-2 border-dashed border-gray-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset to Default Tags</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Library Management Tab */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              {/* Export Library */}
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Export Library</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">Download your entire library as a JSON file for backup or migration purposes.</p>
                  <button
                    onClick={handleExportLibrary}
                    className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export Library Data</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white/95 backdrop-blur-sm border border-red-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-900">Danger Zone</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-red-600 text-sm">These actions are irreversible. Please be absolutely certain before proceeding.</p>
                  <button
                    onClick={handleDeleteAllData}
                    className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete All Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Display Name</p>
                      <p className="text-sm text-gray-600">{user?.displayName || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Sign Out</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">Sign out of your account. You'll need to sign in again to access your library.</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Status Modal */}
      {showAddStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Status</h3>
                <button
                  onClick={() => setShowAddStatus(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Name</label>
                  <input
                    type="text"
                    value={newStatus.name}
                    onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                    placeholder="e.g., Reading Now"
                    className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={newStatus.icon}
                    onChange={(e) => setNewStatus({ ...newStatus, icon: e.target.value })}
                    placeholder="📖"
                    className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={newStatus.color}
                    onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="amber">Amber</option>
                    <option value="yellow">Yellow</option>
                    <option value="lime">Lime</option>
                    <option value="green">Green</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="cyan">Cyan</option>
                    <option value="sky">Sky</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="pink">Pink</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddStatus(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStatus}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Status</h3>
                <button
                  onClick={() => setEditingStatus(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Name</label>
                  <input
                    type="text"
                    value={editingStatus.name}
                    onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={editingStatus.icon}
                    onChange={(e) => setEditingStatus({ ...editingStatus, icon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={editingStatus.color}
                    onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="amber">Amber</option>
                    <option value="yellow">Yellow</option>
                    <option value="lime">Lime</option>
                    <option value="green">Green</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="cyan">Cyan</option>
                    <option value="sky">Sky</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="pink">Pink</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingStatus(null)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Series Modal */}
      {showAddSeries && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Series</h3>
                <button
                  onClick={() => setShowAddSeries(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Series Name</label>
                  <input
                    type="text"
                    value={newSeries.name}
                    onChange={(e) => setNewSeries({ ...newSeries, name: e.target.value })}
                    placeholder="e.g., Harry Potter"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={newSeries.description}
                    onChange={(e) => setNewSeries({ ...newSeries, description: e.target.value })}
                    placeholder="Brief description of the series..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={newSeries.icon}
                    onChange={(e) => setNewSeries({ ...newSeries, icon: e.target.value })}
                    placeholder="📚"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={newSeries.color}
                    onChange={(e) => setNewSeries({ ...newSeries, color: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="amber">Amber</option>
                    <option value="yellow">Yellow</option>
                    <option value="lime">Lime</option>
                    <option value="green">Green</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="cyan">Cyan</option>
                    <option value="sky">Sky</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="pink">Pink</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddSeries(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSeries}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Series
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Series Modal */}
      {editingSeries && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Series</h3>
                <button
                  onClick={() => setEditingSeries(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Series Name</label>
                  <input
                    type="text"
                    value={editingSeries.name}
                    onChange={(e) => setEditingSeries({ ...editingSeries, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={editingSeries.description || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={editingSeries.icon || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, icon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={editingSeries.color || 'blue'}
                    onChange={(e) => setEditingSeries({ ...editingSeries, color: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="amber">Amber</option>
                    <option value="yellow">Yellow</option>
                    <option value="lime">Lime</option>
                    <option value="green">Green</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="cyan">Cyan</option>
                    <option value="sky">Sky</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="pink">Pink</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingSeries(null)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSeries}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Series
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {showAddTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Tag</h3>
                <button
                  onClick={() => setShowAddTag(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tag Name</label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="e.g., Special Edition"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={newTag.icon}
                    onChange={(e) => setNewTag({ ...newTag, icon: e.target.value })}
                    placeholder="🏷️"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="amber">Amber</option>
                    <option value="yellow">Yellow</option>
                    <option value="lime">Lime</option>
                    <option value="green">Green</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="cyan">Cyan</option>
                    <option value="sky">Sky</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="pink">Pink</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddTag(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTag}
                    className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Tag</h3>
                <button
                  onClick={() => setEditingTag(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tag Name</label>
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={editingTag.icon}
                    onChange={(e) => setEditingTag({ ...editingTag, icon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="amber">Amber</option>
                    <option value="yellow">Yellow</option>
                    <option value="lime">Lime</option>
                    <option value="green">Green</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="cyan">Cyan</option>
                    <option value="sky">Sky</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="pink">Pink</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingTag(null)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTag}
                    className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Update Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 