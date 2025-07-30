'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export interface Series {
  id: string
  name: string
  description?: string
  bookIds: string[]
  color: string
  icon: string
  userId: string
  dateCreated: string
}

interface SeriesContextType {
  series: Series[]
  loading: boolean
  createSeries: (series: Omit<Series, 'id' | 'userId' | 'dateCreated'>) => Promise<void>
  updateSeries: (id: string, updates: Partial<Series>) => Promise<void>
  deleteSeries: (id: string) => Promise<void>
  addBookToSeries: (seriesId: string, bookId: string) => Promise<void>
  removeBookFromSeries: (seriesId: string, bookId: string) => Promise<void>
  getSeriesForBook: (bookId: string) => Series | undefined
  getBooksInSeries: (seriesId: string, allBooks: any[]) => any[]
}

const SeriesContext = createContext<SeriesContextType | undefined>(undefined)

export function SeriesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch series from Firestore
  useEffect(() => {
    if (!user) {
      setSeries([])
      setLoading(false)
      return
    }

    const seriesQuery = query(
      collection(db, 'series'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(seriesQuery, (snapshot) => {
      const seriesData: Series[] = []
      snapshot.forEach((doc) => {
        seriesData.push({ id: doc.id, ...doc.data() } as Series)
      })
      setSeries(seriesData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching series:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const createSeries = async (series: Omit<Series, 'id' | 'userId' | 'dateCreated'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const seriesData = {
        ...series,
        userId: user.uid,
        dateCreated: new Date().toISOString()
      }
      
      const docRef = await addDoc(collection(db, 'series'), seriesData)
      console.log('Series created successfully with ID:', docRef.id)
    } catch (error) {
      console.error('Error creating series:', error)
      
      if (error instanceof Error && (error as any).code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firebase security rules.')
      }
      
      throw error
    }
  }

  const updateSeries = async (id: string, updates: Partial<Series>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const seriesRef = doc(db, 'series', id)
      await updateDoc(seriesRef, updates)
    } catch (error) {
      console.error('Error updating series:', error)
      throw error
    }
  }

  const deleteSeries = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      await deleteDoc(doc(db, 'series', id))
    } catch (error) {
      console.error('Error deleting series:', error)
      throw error
    }
  }

  const addBookToSeries = async (seriesId: string, bookId: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const seriesRef = doc(db, 'series', seriesId)
      const seriesDoc = await getDocs(query(collection(db, 'series'), where('__name__', '==', seriesId)))
      
      if (!seriesDoc.empty) {
        const currentBookIds = seriesDoc.docs[0].data().bookIds || []
        if (!currentBookIds.includes(bookId)) {
          await updateDoc(seriesRef, {
            bookIds: [...currentBookIds, bookId]
          })
        }
      }
    } catch (error) {
      console.error('Error adding book to series:', error)
      throw error
    }
  }

  const removeBookFromSeries = async (seriesId: string, bookId: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const seriesRef = doc(db, 'series', seriesId)
      const seriesDoc = await getDocs(query(collection(db, 'series'), where('__name__', '==', seriesId)))
      
      if (!seriesDoc.empty) {
        const currentBookIds = seriesDoc.docs[0].data().bookIds || []
        const updatedBookIds = currentBookIds.filter((id: string) => id !== bookId)
        await updateDoc(seriesRef, {
          bookIds: updatedBookIds
        })
      }
    } catch (error) {
      console.error('Error removing book from series:', error)
      throw error
    }
  }

  const getSeriesForBook = (bookId: string): Series | undefined => {
    return series.find(s => s.bookIds.includes(bookId))
  }

  const getBooksInSeries = (seriesId: string, allBooks: any[]) => {
    const seriesData = series.find(s => s.id === seriesId)
    if (!seriesData) return []
    
    return allBooks.filter(book => seriesData.bookIds.includes(book.id))
  }

  const value = {
    series,
    loading,
    createSeries,
    updateSeries,
    deleteSeries,
    addBookToSeries,
    removeBookFromSeries,
    getSeriesForBook,
    getBooksInSeries
  }

  return (
    <SeriesContext.Provider value={value}>
      {children}
    </SeriesContext.Provider>
  )
}

export function useSeries() {
  const context = useContext(SeriesContext)
  if (context === undefined) {
    throw new Error('useSeries must be used within a SeriesProvider')
  }
  return context
} 