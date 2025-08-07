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
  addMissingDefaultTags: () => Promise<void>
  cleanupDuplicateTags: () => Promise<void>
}

const TagsContext = createContext<TagsContextType | undefined>(undefined)

export function TagsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAddedDefaults, setHasAddedDefaults] = useState(false)

  // Default tags
  const defaultTags = [
    { name: 'Paperback', color: 'green', icon: '📗' },
    { name: 'Hardback', color: 'blue', icon: '📘' },
    { name: 'Signed Copy', color: 'red', icon: '✍️' },
    { name: 'Fairyloot', color: 'pink', icon: '🧚' },
    { name: 'First Edition', color: 'amber', icon: '📚' },
    { name: 'Limited Edition', color: 'indigo', icon: '💎' },
    { name: 'Sprayed Edged', color: 'purple', icon: '🌈' },
    { name: 'Gift', color: 'pink', icon: '🎁' },
    { name: 'Series', color: 'purple', icon: '📚' },
    { name: 'Favourite', color: 'rose', icon: '❤️' },
    { name: 'Borrowing', color: 'orange', icon: '📖' },
    { name: 'Loaned Out', color: 'yellow', icon: '📤' }
  ]

  // Fetch tags from Firestore
  useEffect(() => {
    if (!user) {
      setTags([])
      setLoading(false)
      setHasAddedDefaults(false)
      return
    }

    const tagsQuery = query(
      collection(db, 'tags'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(tagsQuery, async (snapshot) => {
      const tagsData: Tag[] = []
      snapshot.forEach((doc) => {
        tagsData.push({ id: doc.id, ...doc.data() } as Tag)
      })
      setTags(tagsData)
      setLoading(false)
      
      // Automatically add missing default tags for existing users or all default tags for new users
      if (!hasAddedDefaults) {
        if (tagsData.length === 0) {
          // New user - add all default tags
          try {
            for (const defaultTag of defaultTags) {
              await createTag(defaultTag)
            }
            console.log(`Added ${defaultTags.length} default tags for new user`)
            setHasAddedDefaults(true)
          } catch (error) {
            console.error('Error adding default tags for new user:', error)
          }
        } else {
          // Existing user - add only missing default tags
          const existingTagNames = tagsData.map(tag => tag.name)
          const missingTags = defaultTags.filter(defaultTag => 
            !existingTagNames.includes(defaultTag.name)
          )
          
          if (missingTags.length > 0) {
            try {
              for (const missingTag of missingTags) {
                await createTag(missingTag)
              }
              console.log(`Added ${missingTags.length} missing default tags`)
            } catch (error) {
              console.error('Error adding missing default tags:', error)
            }
          }
          setHasAddedDefaults(true)
        }
      }
    }, (error) => {
      console.error('Error fetching tags:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const createTag = async (tag: Omit<Tag, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Check if tag with same name already exists
      const existingTagNames = tags.map(t => t.name.toLowerCase())
      if (existingTagNames.includes(tag.name.toLowerCase())) {
        throw new Error(`A tag with the name "${tag.name}" already exists.`)
      }

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

      // Add exactly the default tags (no duplicates)
      for (const defaultTag of defaultTags) {
        await createTag(defaultTag)
      }
    } catch (error) {
      console.error('Error resetting tags to defaults:', error)
      throw error
    }
  }

  const addMissingDefaultTags = async () => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Get existing tag names
      const existingTagNames = tags.map(tag => tag.name)
      
      // Find missing default tags
      const missingTags = defaultTags.filter(defaultTag => 
        !existingTagNames.includes(defaultTag.name)
      )
      
      // Add missing tags
      for (const missingTag of missingTags) {
        await createTag(missingTag)
      }
    } catch (error) {
      console.error('Error adding missing default tags:', error)
      throw error
    }
  }

  const cleanupDuplicateTags = async () => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Group tags by name to find duplicates
      const tagGroups = tags.reduce((groups, tag) => {
        if (!groups[tag.name]) {
          groups[tag.name] = []
        }
        groups[tag.name].push(tag)
        return groups
      }, {} as Record<string, Tag[]>)

      // Delete duplicate tags (keep the first one)
      for (const [tagName, tagList] of Object.entries(tagGroups)) {
        if (tagList.length > 1) {
          // Keep the first tag, delete the rest
          for (let i = 1; i < tagList.length; i++) {
            await deleteTag(tagList[i].id)
          }
          console.log(`Cleaned up ${tagList.length - 1} duplicate(s) for tag: ${tagName}`)
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate tags:', error)
      throw error
    }
  }

  const value = {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    resetToDefaults,
    addMissingDefaultTags,
    cleanupDuplicateTags
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