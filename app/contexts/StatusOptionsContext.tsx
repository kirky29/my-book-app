'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from './AuthContext'

export interface StatusOption {
  id: string
  name: string
  color: string
  icon: string
  isDefault: boolean
}

interface StatusOptionsContextType {
  statusOptions: StatusOption[]
  loading: boolean
  addStatusOption: (option: Omit<StatusOption, 'id'>) => Promise<void>
  updateStatusOption: (id: string, updates: Partial<StatusOption>) => Promise<void>
  deleteStatusOption: (id: string) => Promise<void>
  reorderStatusOptions: (newOrder: string[]) => Promise<void>
  resetToDefaults: () => Promise<void>
}

const defaultStatusOptions: StatusOption[] = [
  {
    id: 'physical-owned',
    name: 'Physical Book Owned',
    color: 'green',
    icon: '📚',
    isDefault: true
  },
  {
    id: 'kindle-owned',
    name: 'Kindle Book Owned',
    color: 'blue',
    icon: '📱',
    isDefault: true
  },
  {
    id: 'wishlist',
    name: 'Wish List',
    color: 'amber',
    icon: '❤️',
    isDefault: true
  },
  {
    id: 'borrowing',
    name: 'Borrowing',
    color: 'purple',
    icon: '📖',
    isDefault: true
  },
  {
    id: 'lent-out',
    name: 'Lent Out',
    color: 'orange',
    icon: '📤',
    isDefault: true
  }
]

const StatusOptionsContext = createContext<StatusOptionsContextType | undefined>(undefined)

export const useStatusOptions = () => {
  const context = useContext(StatusOptionsContext)
  if (!context) {
    throw new Error('useStatusOptions must be used within a StatusOptionsProvider')
  }
  return context
}

export const StatusOptionsProvider = ({ children }: { children: ReactNode }) => {
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(defaultStatusOptions)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load user's status options from Firebase
  useEffect(() => {
    if (!user) {
      setStatusOptions(defaultStatusOptions)
      setLoading(false)
      return
    }

    const loadStatusOptions = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists() && userDoc.data().statusOptions) {
          setStatusOptions(userDoc.data().statusOptions)
        } else {
          // Initialize with defaults for new users
          await setDoc(userDocRef, { statusOptions: defaultStatusOptions }, { merge: true })
          setStatusOptions(defaultStatusOptions)
        }
      } catch (error) {
        console.error('Error loading status options:', error)
        setStatusOptions(defaultStatusOptions)
      } finally {
        setLoading(false)
      }
    }

    loadStatusOptions()
  }, [user])

  const addStatusOption = async (option: Omit<StatusOption, 'id'>) => {
    if (!user) {
      throw new Error('User must be authenticated to add status options')
    }

    const newOption: StatusOption = {
      ...option,
      id: `custom-${Date.now()}`
    }

    const updatedOptions = [...statusOptions, newOption]
    setStatusOptions(updatedOptions)

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { statusOptions: updatedOptions })
    } catch (error) {
      console.error('Error adding status option:', error)
      setStatusOptions(statusOptions) // Revert on error
      throw error
    }
  }

  const updateStatusOption = async (id: string, updates: Partial<StatusOption>) => {
    if (!user) {
      throw new Error('User must be authenticated to update status options')
    }

    const updatedOptions = statusOptions.map(option =>
      option.id === id ? { ...option, ...updates } : option
    )
    setStatusOptions(updatedOptions)

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { statusOptions: updatedOptions })
    } catch (error) {
      console.error('Error updating status option:', error)
      setStatusOptions(statusOptions) // Revert on error
      throw error
    }
  }

  const deleteStatusOption = async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete status options')
    }

    const optionToDelete = statusOptions.find(option => option.id === id)
    if (optionToDelete?.isDefault) {
      throw new Error('Cannot delete default status options')
    }

    const updatedOptions = statusOptions.filter(option => option.id !== id)
    setStatusOptions(updatedOptions)

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { statusOptions: updatedOptions })
    } catch (error) {
      console.error('Error deleting status option:', error)
      setStatusOptions(statusOptions) // Revert on error
      throw error
    }
  }

  const reorderStatusOptions = async (newOrder: string[]) => {
    if (!user) {
      throw new Error('User must be authenticated to reorder status options')
    }

    const reorderedOptions = newOrder.map(id => 
      statusOptions.find(option => option.id === id)
    ).filter(Boolean) as StatusOption[]

    setStatusOptions(reorderedOptions)

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { statusOptions: reorderedOptions })
    } catch (error) {
      console.error('Error reordering status options:', error)
      setStatusOptions(statusOptions) // Revert on error
      throw error
    }
  }

  const resetToDefaults = async () => {
    if (!user) {
      throw new Error('User must be authenticated to reset status options')
    }

    setStatusOptions(defaultStatusOptions)

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { statusOptions: defaultStatusOptions })
    } catch (error) {
      console.error('Error resetting status options:', error)
      setStatusOptions(statusOptions) // Revert on error
      throw error
    }
  }

  const value: StatusOptionsContextType = {
    statusOptions,
    loading,
    addStatusOption,
    updateStatusOption,
    deleteStatusOption,
    reorderStatusOptions,
    resetToDefaults
  }

  return (
    <StatusOptionsContext.Provider value={value}>
      {children}
    </StatusOptionsContext.Provider>
  )
} 