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
  Timestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from './AuthContext'

interface Book {
  id: string
  title: string
  author: string
  status: string // Dynamic status from StatusOptions
  cover?: string
  isbn?: string
  dateAdded: string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  language?: string
  edition?: string
  description?: string
  tagIds?: string[] // Array of tag IDs
}

interface SimilarityResult {
  book: Book
  similarityScore: number
  matchType: 'exact_isbn' | 'similar_title_author' | 'similar_title' | 'same_author_series' | 'edition_variant'
  reasons: string[]
}

interface BookContextType {
  books: Book[]
  loading: boolean
  addBook: (book: Omit<Book, 'id' | 'dateAdded'>) => Promise<void>
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  deleteAllBooks: () => Promise<void>
  getBook: (id: string) => Book | undefined
  toggleBookStatus: (id: string) => Promise<void>
  findDuplicates: (title: string, author: string) => Book[]
  findSimilarBooks: (title: string, author: string, isbn?: string, publisher?: string) => SimilarityResult[]
  getBooksByISBN: (isbn: string) => Book[]
  searchByISBN: (isbn: string) => Promise<any>
  calculateSimilarityScore: (book1: Partial<Book>, book2: Partial<Book>) => number
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
          publisher: data.publisher,
          publishedDate: data.publishedDate,
          pageCount: data.pageCount,
          language: data.language,
          edition: data.edition,
          description: data.description,
          tagIds: data.tagIds || [],
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
        dateAdded: new Date().toISOString(),
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

  const deleteAllBooks = async () => {
    if (!user) {
      throw new Error('User must be authenticated to delete books')
    }
    
    try {
      const booksRef = collection(db, 'users', user.uid, 'books')
      const snapshot = await getDocs(booksRef)
      
      // Delete all books in batches
      const batch = writeBatch(db)
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Error deleting all books:', error)
      throw error
    }
  }

  const getBook = (id: string) => {
    return books.find(book => book.id === id)
  }

  const toggleBookStatus = async (id: string) => {
    const book = getBook(id)
    if (book) {
      // For now, just toggle between first two status options
      // This will be enhanced to cycle through all available statuses
      const newStatus = book.status === 'physical-owned' ? 'wishlist' : 'physical-owned'
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

  // Enhanced similarity detection with multiple methods
  const findSimilarBooks = (title: string, author: string, isbn?: string, publisher?: string): SimilarityResult[] => {
    const results: SimilarityResult[] = []
    const normalizedTitle = normalizeTitle(title)
    const normalizedAuthor = normalizeAuthor(author)
    
    books.forEach(book => {
      const similarityScore = calculateSimilarityScore(
        { title, author, isbn, publisher },
        { title: book.title, author: book.author, isbn: book.isbn, publisher: book.publisher }
      )
      
      if (similarityScore > 0.3) { // Only include books with significant similarity
        const matchType = determineMatchType(
          { title, author, isbn, publisher },
          { title: book.title, author: book.author, isbn: book.isbn, publisher: book.publisher }
        )
        
        const reasons = generateSimilarityReasons(
          { title, author, isbn, publisher },
          { title: book.title, author: book.author, isbn: book.isbn, publisher: book.publisher }
        )
        
        results.push({
          book,
          similarityScore,
          matchType,
          reasons
        })
      }
    })
    
    // Sort by similarity score (highest first) and remove duplicates
    return results
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .filter((result, index, self) => 
        index === self.findIndex(r => r.book.id === result.book.id)
      )
  }

  // Calculate similarity score between two books (0-1 scale)
  const calculateSimilarityScore = (book1: Partial<Book>, book2: Partial<Book>): number => {
    let totalScore = 0
    let maxScore = 0
    
    // ISBN comparison (highest weight - 40%)
    if (book1.isbn && book2.isbn) {
      const isbnScore = compareISBNs(book1.isbn, book2.isbn)
      totalScore += isbnScore * 0.4
      maxScore += 0.4
    }
    
    // Title comparison (30% weight)
    if (book1.title && book2.title) {
      const titleScore = compareTitles(book1.title, book2.title)
      totalScore += titleScore * 0.3
      maxScore += 0.3
    }
    
    // Author comparison (20% weight)
    if (book1.author && book2.author) {
      const authorScore = compareAuthors(book1.author, book2.author)
      totalScore += authorScore * 0.2
      maxScore += 0.2
    }
    
    // Publisher comparison (10% weight)
    if (book1.publisher && book2.publisher) {
      const publisherScore = comparePublishers(book1.publisher, book2.publisher)
      totalScore += publisherScore * 0.1
      maxScore += 0.1
    }
    
    return maxScore > 0 ? totalScore / maxScore : 0
  }

  // Helper functions for similarity calculations
  const normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  const normalizeAuthor = (author: string): string => {
    return author
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const compareISBNs = (isbn1: string, isbn2: string): number => {
    const clean1 = isbn1.replace(/[^\dX]/gi, '')
    const clean2 = isbn2.replace(/[^\dX]/gi, '')
    
    if (clean1 === clean2) return 1.0
    
    // Check if one is ISBN-10 and other is ISBN-13 of same book
    if (clean1.length === 10 && clean2.length === 13) {
      // Convert ISBN-10 to ISBN-13 and compare
      const converted = convertISBN10To13(clean1)
      if (converted === clean2) return 0.95
    } else if (clean1.length === 13 && clean2.length === 10) {
      const converted = convertISBN10To13(clean2)
      if (converted === clean1) return 0.95
    }
    
    return 0
  }

  const convertISBN10To13 = (isbn10: string): string => {
    // Simple conversion: add 978 prefix and recalculate check digit
    const prefix = '978'
    const body = isbn10.slice(0, 9)
    const isbn13 = prefix + body
    
    // Calculate check digit for ISBN-13
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn13[i])
      sum += digit * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    
    return isbn13 + checkDigit
  }

  const compareTitles = (title1: string, title2: string): number => {
    const norm1 = normalizeTitle(title1)
    const norm2 = normalizeTitle(title2)
    
    if (norm1 === norm2) return 1.0
    
    // Split into words
    const words1 = norm1.split(' ').filter(w => w.length > 2)
    const words2 = norm2.split(' ').filter(w => w.length > 2)
    
    if (words1.length === 0 || words2.length === 0) return 0
    
    // Calculate word overlap
    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = Math.max(words1.length, words2.length)
    
    const wordOverlap = commonWords.length / totalWords
    
    // Check for edition indicators
    const editionWords = ['edition', 'ed', 'version', 'revised', 'updated', 'new', 'special', 'collector']
    const hasEdition1 = editionWords.some(word => norm1.includes(word))
    const hasEdition2 = editionWords.some(word => norm2.includes(word))
    
    // If both have edition words, boost similarity
    if (hasEdition1 && hasEdition2) {
      return Math.min(1.0, wordOverlap + 0.2)
    }
    
    return wordOverlap
  }

  const compareAuthors = (author1: string, author2: string): number => {
    const norm1 = normalizeAuthor(author1)
    const norm2 = normalizeAuthor(author2)
    
    if (norm1 === norm2) return 1.0
    
    // Split into name parts
    const parts1 = norm1.split(' ')
    const parts2 = norm2.split(' ')
    
    // Check for exact match
    if (parts1.join(' ') === parts2.join(' ')) return 1.0
    
    // Check for reversed names (e.g., "John Smith" vs "Smith, John")
    if (parts1.length === 2 && parts2.length === 2) {
      if (parts1[0] === parts2[1] && parts1[1] === parts2[0]) return 0.9
    }
    
    // Check for partial matches (first name or last name)
    const commonParts = parts1.filter(part => parts2.includes(part))
    if (commonParts.length > 0) {
      return commonParts.length / Math.max(parts1.length, parts2.length)
    }
    
    return 0
  }

  const comparePublishers = (pub1: string, pub2: string): number => {
    const norm1 = pub1.toLowerCase().replace(/[^\w\s]/g, '').trim()
    const norm2 = pub2.toLowerCase().replace(/[^\w\s]/g, '').trim()
    
    if (norm1 === norm2) return 1.0
    
    // Check for partial matches
    const words1 = norm1.split(' ')
    const words2 = norm2.split(' ')
    const commonWords = words1.filter(word => words2.includes(word))
    
    if (commonWords.length > 0) {
      return commonWords.length / Math.max(words1.length, words2.length)
    }
    
    return 0
  }

  const determineMatchType = (book1: Partial<Book>, book2: Partial<Book>): SimilarityResult['matchType'] => {
    // Check for exact ISBN match
    if (book1.isbn && book2.isbn && compareISBNs(book1.isbn, book2.isbn) > 0.9) {
      return 'exact_isbn'
    }
    
    // Check for similar title and author
    if (book1.title && book2.title && book1.author && book2.author) {
      const titleScore = compareTitles(book1.title, book2.title)
      const authorScore = compareAuthors(book1.author, book2.author)
      
      if (titleScore > 0.7 && authorScore > 0.7) {
        return 'similar_title_author'
      }
    }
    
    // Check for same author with similar titles (potential series)
    if (book1.author && book2.author && book1.title && book2.title) {
      const authorScore = compareAuthors(book1.author, book2.author)
      const titleScore = compareTitles(book1.title, book2.title)
      
      if (authorScore > 0.8 && titleScore > 0.3) {
        return 'same_author_series'
      }
    }
    
    // Check for edition variants
    if (book1.title && book2.title) {
      const titleScore = compareTitles(book1.title, book2.title)
      if (titleScore > 0.6) {
        return 'edition_variant'
      }
    }
    
    return 'similar_title'
  }

  const generateSimilarityReasons = (book1: Partial<Book>, book2: Partial<Book>): string[] => {
    const reasons: string[] = []
    
    // ISBN reasons
    if (book1.isbn && book2.isbn) {
      const isbnScore = compareISBNs(book1.isbn, book2.isbn)
      if (isbnScore > 0.9) {
        reasons.push('Same ISBN')
      } else if (isbnScore > 0.8) {
        reasons.push('Similar ISBN (different format)')
      }
    }
    
    // Title reasons
    if (book1.title && book2.title) {
      const titleScore = compareTitles(book1.title, book2.title)
      if (titleScore > 0.9) {
        reasons.push('Nearly identical title')
      } else if (titleScore > 0.7) {
        reasons.push('Very similar title')
      } else if (titleScore > 0.5) {
        reasons.push('Similar title')
      }
    }
    
    // Author reasons
    if (book1.author && book2.author) {
      const authorScore = compareAuthors(book1.author, book2.author)
      if (authorScore > 0.9) {
        reasons.push('Same author')
      } else if (authorScore > 0.7) {
        reasons.push('Similar author name')
      }
    }
    
    // Publisher reasons
    if (book1.publisher && book2.publisher) {
      const publisherScore = comparePublishers(book1.publisher, book2.publisher)
      if (publisherScore > 0.8) {
        reasons.push('Same publisher')
      }
    }
    
    // Edition indicators
    if (book1.title && book2.title) {
      const editionWords = ['edition', 'ed', 'version', 'revised', 'updated', 'new', 'special', 'collector']
      const hasEdition1 = editionWords.some(word => book1.title!.toLowerCase().includes(word))
      const hasEdition2 = editionWords.some(word => book2.title!.toLowerCase().includes(word))
      
      if (hasEdition1 && hasEdition2) {
        reasons.push('Both appear to be different editions')
      } else if (hasEdition1 || hasEdition2) {
        reasons.push('One appears to be a special edition')
      }
    }
    
    return reasons
  }

  const getBooksByISBN = (isbn: string): Book[] => {
    const cleanISBN = isbn.replace(/[^\dX]/gi, '')
    return books.filter(book => 
      book.isbn && book.isbn.replace(/[^\dX]/gi, '') === cleanISBN
    )
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
    deleteAllBooks,
    getBook,
    toggleBookStatus,
    findDuplicates,
    findSimilarBooks,
    getBooksByISBN,
    searchByISBN,
    calculateSimilarityScore
  }

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  )
} 