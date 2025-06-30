'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Book {
  id: string
  title: string
  author: string
  status: 'owned' | 'wishlist'
  dateAdded: string
  cover?: string
  isbn?: string
  description?: string
  pageCount?: number
  publishedDate?: string
  publisher?: string
  categories?: string[]
  notes?: string
}

interface BookContextType {
  books: Book[]
  addBook: (book: Omit<Book, 'id' | 'dateAdded'>) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  deleteBook: (id: string) => void
  getBook: (id: string) => Book | undefined
  toggleBookStatus: (id: string) => void
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

  // Load books from localStorage on component mount
  useEffect(() => {
    const savedBooks = localStorage.getItem('book-tracker-books')
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks))
    }
  }, [])

  // Save books to localStorage whenever books change
  useEffect(() => {
    localStorage.setItem('book-tracker-books', JSON.stringify(books))
  }, [books])

  const addBook = (bookData: Omit<Book, 'id' | 'dateAdded'>) => {
    const book: Book = {
      ...bookData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0],
      notes: bookData.notes || ''
    }
    setBooks(prev => [book, ...prev])
  }

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, ...updates } : book
    ))
  }

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(book => book.id !== id))
  }

  const getBook = (id: string) => {
    return books.find(book => book.id === id)
  }

  const toggleBookStatus = (id: string) => {
    setBooks(prev => prev.map(book => 
      book.id === id 
        ? { ...book, status: book.status === 'owned' ? 'wishlist' : 'owned' }
        : book
    ))
  }

  const value: BookContextType = {
    books,
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