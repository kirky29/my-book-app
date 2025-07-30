'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { useBooks } from '../../../contexts/BookContext'
import { useStatusOptions } from '../../../contexts/StatusOptionsContext'

export default function ChangeBookStatus() {
  const router = useRouter()
  const params = useParams()
  const { getBook, updateBook } = useBooks()
  const { statusOptions } = useStatusOptions()
  const book = getBook(params.id as string)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (book) {
      setSelectedStatus(book.status)
    }
  }, [book])

  useEffect(() => {
    if (!book) {
      router.push('/')
    }
  }, [book, router])

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Book not found.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleStatusChange = async () => {
    if (!book || !selectedStatus || selectedStatus === book.status) return
    
    setIsUpdating(true)
    try {
      await updateBook(book.id, { status: selectedStatus })
      router.back()
    } catch (error) {
      console.error('Error updating book status:', error)
      alert('Failed to update book status. Please try again.')
      setIsUpdating(false)
    }
  }

  const getStatusInfo = (statusId: string) => {
    const status = statusOptions.find(s => s.id === statusId)
    return status || { name: 'Unknown', color: 'gray', icon: '❓' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Change Status</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Book Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h2>
              <p className="text-gray-600">by {book.author}</p>
            </div>
          </div>

          {/* Status Options */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select New Status</h3>
            
            <div className="space-y-2">
              {statusOptions.map((status) => {
                const isSelected = selectedStatus === status.id
                const isCurrent = book.status === status.id
                
                return (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{status.icon}</span>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{status.name}</p>
                        {isCurrent && (
                          <p className="text-sm text-gray-500">Current status</p>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.back()}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus || selectedStatus === book.status || isUpdating}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 