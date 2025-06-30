'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  orderBy, 
  query,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from './AuthContext'

interface Book {
  id: string
  title: string
  author: string
  status: 'physical' | 'digital' | 'both' | 'wishlist' | 'lent' | 'none' // Ownership status
  readStatus: 'unread' | 'reading' | 'read' // Reading progress
  rating?: number // Star rating from 1-5
  series?: string // Book series name
  seriesNumber?: number // Position in series
  dateAdded: string
  cover?: string
  isbn?: string
  description?: string
  pageCount?: number
  publishedDate?: string
  publisher?: string
  categories?: string[]
  notes?: string
  lentTo?: string // Person who borrowed the book
}

interface BookContextType {
  books: Book[]
  loading: boolean
  addBook: (book: Omit<Book, 'id' | 'dateAdded'>) => Promise<void>
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  getBook: (id: string) => Book | undefined
  toggleBookStatus: (id: string) => Promise<void>
  findDuplicates: (title: string, author: string) => Book[]
  getBooksByISBN: (isbn: string) => Book[]
  getSeriesBooks: (seriesName: string) => Book[]
  searchByISBN: (isbn: string) => Promise<any>
  getAllSeries: () => Array<{ name: string; count: number; ownedCount: number }>
}

const BookContext = createContext<BookContextType | undefined>(undefined)

export const useBooks = () => {
  const context = useContext(BookContext)
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider')
  }
  return context
}

export const BookProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Set up real-time listener for user's books collection
  useEffect(() => {
    if (!user) {
      setBooks([])
      setLoading(false)
      return
    }

    const booksRef = collection(db, 'users', user.uid, 'books')
    const q = query(booksRef, orderBy('dateAdded', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData: Book[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        booksData.push({
          id: doc.id,
          title: data.title,
          author: data.author,
          status: data.status,
          readStatus: data.readStatus || 'unread', // Default for existing books
          rating: data.rating, // Star rating
          series: data.series, // Series name
          seriesNumber: data.seriesNumber, // Series position
          dateAdded: data.dateAdded,
          cover: data.cover,
          isbn: data.isbn,
          description: data.description,
          pageCount: data.pageCount,
          publishedDate: data.publishedDate,
          publisher: data.publisher,
          categories: data.categories,
          notes: data.notes || '',
          lentTo: data.lentTo
        })
      })
      setBooks(booksData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching books:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addBook = async (bookData: Omit<Book, 'id' | 'dateAdded'>) => {
    if (!user) {
      throw new Error('User must be authenticated to add books')
    }
    
    try {
      const booksRef = collection(db, 'users', user.uid, 'books')
      await addDoc(booksRef, {
        ...bookData,
        readStatus: bookData.readStatus || 'unread', // Default to unread
        dateAdded: new Date().toISOString().split('T')[0],
        notes: bookData.notes || ''
      })
    } catch (error) {
      console.error('Error adding book:', error)
      throw error
    }
  }

  const updateBook = async (id: string, updates: Partial<Book>) => {
    if (!user) {
      throw new Error('User must be authenticated to update books')
    }
    
    // Optimistically update local state immediately
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === id ? { ...book, ...updates } : book
      )
    )
    
    try {
      const bookRef = doc(db, 'users', user.uid, 'books', id)
      await updateDoc(bookRef, updates)
    } catch (error) {
      console.error('Error updating book:', error)
      // The onSnapshot listener will automatically revert the change if it fails
      // since it will get the actual state from Firebase
      throw error
    }
  }

  const deleteBook = async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete books')
    }
    
    try {
      const bookRef = doc(db, 'users', user.uid, 'books', id)
      await deleteDoc(bookRef)
    } catch (error) {
      console.error('Error deleting book:', error)
      throw error
    }
  }

  const getBook = (id: string) => {
    return books.find(book => book.id === id)
  }

  const toggleBookStatus = async (id: string) => {
    const book = getBook(id)
    if (book) {
      // Cycle through ownership statuses: wishlist -> physical -> digital -> both -> lent -> none -> wishlist
      let newStatus: Book['status']
      switch (book.status) {
        case 'wishlist':
          newStatus = 'physical'
          break
        case 'physical':
          newStatus = 'digital'
          break
        case 'digital':
          newStatus = 'both'
          break
        case 'both':
          newStatus = 'lent'
          break
        case 'lent':
          newStatus = 'none'
          break
        case 'none':
          newStatus = 'wishlist'
          break
        default:
          newStatus = 'physical'
      }
      await updateBook(id, { status: newStatus })
    }
  }

  // New helper functions for enhanced features
  const findDuplicates = (title: string, author: string): Book[] => {
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 2)
    const authorWords = author.toLowerCase().split(' ')
    
    return books.filter(book => {
      const bookTitle = book.title.toLowerCase()
      const bookAuthor = book.author.toLowerCase()
      
      // Check if titles are very similar (80% word match)
      const titleMatches = titleWords.filter(word => bookTitle.includes(word)).length
      const titleSimilarity = titleWords.length > 0 ? titleMatches / titleWords.length : 0
      
      // Check if author matches
      const authorMatches = authorWords.some(word => bookAuthor.includes(word))
      
      return titleSimilarity >= 0.8 && authorMatches
    })
  }

  const getBooksByISBN = (isbn: string): Book[] => {
    const cleanISBN = isbn.replace(/[^\dX]/gi, '')
    return books.filter(book => 
      book.isbn && book.isbn.replace(/[^\dX]/gi, '') === cleanISBN
    )
  }

  const getSeriesBooks = (seriesName: string): Book[] => {
    return books
      .filter(book => book.series?.toLowerCase() === seriesName.toLowerCase())
      .sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0))
  }

  const getAllSeries = () => {
    const seriesMap = new Map<string, { name: string; count: number; ownedCount: number }>()
    
    books.forEach(book => {
      if (book.series) {
        const existing = seriesMap.get(book.series.toLowerCase())
        const isOwned = ['physical', 'digital', 'both'].includes(book.status)
        
        if (existing) {
          existing.count++
          if (isOwned) existing.ownedCount++
        } else {
          seriesMap.set(book.series.toLowerCase(), {
            name: book.series,
            count: 1,
            ownedCount: isOwned ? 1 : 0
          })
        }
      }
    })
    
    return Array.from(seriesMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  const searchByISBN = async (isbn: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      )
      const data = await response.json()
      return data.items?.[0] || null
    } catch (error) {
      console.error('Error searching by ISBN:', error)
      return null
    }
  }

  const value: BookContextType = {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    getBook,
    toggleBookStatus,
    findDuplicates,
    getBooksByISBN,
    getSeriesBooks,
    searchByISBN,
    getAllSeries
  }

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  )
} 