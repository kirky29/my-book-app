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
  status: 'physical' | 'digital' | 'both' | 'read' | 'wishlist' | 'lent'
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
    
    try {
      const bookRef = doc(db, 'users', user.uid, 'books', id)
      await updateDoc(bookRef, updates)
    } catch (error) {
      console.error('Error updating book:', error)
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
      // Cycle through ownership statuses: wishlist -> physical -> digital -> both -> read -> lent -> wishlist
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
          newStatus = 'read'
          break
        case 'read':
          newStatus = 'lent'
          break
        case 'lent':
          newStatus = 'wishlist'
          break
        default:
          newStatus = 'physical'
      }
      await updateBook(id, { status: newStatus })
    }
  }

  const value: BookContextType = {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    getBook,
    toggleBookStatus
  }

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  )
} 