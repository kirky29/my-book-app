'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export interface Tag {
  id: string
  name: string
  color: string
  icon: string
  userId: string
  createdAt: string
}

interface TagsContextType {
  tags: Tag[]
  loading: boolean
  createTag: (tag: Omit<Tag, 'id' | 'userId' | 'createdAt'>) => Promise<void>
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  resetToDefaults: () => Promise<void>
}

const TagsContext = createContext<TagsContextType | undefined>(undefined)

export function TagsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  // Default tags
  const defaultTags = [
    { name: 'Special Edition', color: 'purple', icon: '⭐' },
    { name: 'Signed Copy', color: 'red', icon: '✍️' },
    { name: 'First Edition', color: 'amber', icon: '📚' },
    { name: 'Hardcover', color: 'blue', icon: '📖' },
    { name: 'Paperback', color: 'green', icon: '📗' },
    { name: 'Limited Edition', color: 'indigo', icon: '💎' },
    { name: 'Gift', color: 'pink', icon: '🎁' },
    { name: 'Favourite', color: 'rose', icon: '❤️' }
  ]

  // Fetch tags from Firestore
  useEffect(() => {
    if (!user) {
      setTags([])
      setLoading(false)
      return
    }

    const tagsQuery = query(
      collection(db, 'tags'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(tagsQuery, (snapshot) => {
      const tagsData: Tag[] = []
      snapshot.forEach((doc) => {
        tagsData.push({ id: doc.id, ...doc.data() } as Tag)
      })
      setTags(tagsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching tags:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const createTag = async (tag: Omit<Tag, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const tagData = {
        ...tag,
        userId: user.uid,
        createdAt: new Date().toISOString()
      }
      
      const docRef = await addDoc(collection(db, 'tags'), tagData)
      console.log('Tag created successfully with ID:', docRef.id)
    } catch (error) {
      console.error('Error creating tag:', error)
      
      if (error instanceof Error && (error as any).code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firebase security rules.')
      }
      
      throw error
    }
  }

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const tagRef = doc(db, 'tags', id)
      await updateDoc(tagRef, updates)
    } catch (error) {
      console.error('Error updating tag:', error)
      throw error
    }
  }

  const deleteTag = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      await deleteDoc(doc(db, 'tags', id))
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  }

  const resetToDefaults = async () => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Delete all existing tags
      const tagsQuery = query(
        collection(db, 'tags'),
        where('userId', '==', user.uid)
      )
      const snapshot = await getDocs(tagsQuery)
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref)
      }

      // Add default tags
      for (const defaultTag of defaultTags) {
        await createTag(defaultTag)
      }
    } catch (error) {
      console.error('Error resetting tags to defaults:', error)
      throw error
    }
  }

  const value = {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    resetToDefaults
  }

  return (
    <TagsContext.Provider value={value}>
      {children}
    </TagsContext.Provider>
  )
}

export function useTags() {
  const context = useContext(TagsContext)
  if (context === undefined) {
    throw new Error('useTags must be used within a TagsProvider')
  }
  return context
} 