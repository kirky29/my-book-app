'use client'

import React from 'react'
import { useStatusOptions } from '../contexts/StatusOptionsContext'

interface StatusSelectorProps {
  selectedStatus: string
  onStatusChange: (statusId: string) => void
  className?: string
  compact?: boolean
}

export default function StatusSelector({ 
  selectedStatus, 
  onStatusChange, 
  className = '',
  compact = false 
}: StatusSelectorProps) {
  const { statusOptions } = useStatusOptions()

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {statusOptions.map((status) => (
          <button
            key={status.id}
            onClick={() => onStatusChange(status.id)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedStatus === status.id
                ? `bg-${status.color}-100 text-${status.color}-800 border border-${status.color}-300`
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
            title={status.name}
          >
            {status.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {statusOptions.map((status) => (
        <button
          key={status.id}
          onClick={() => onStatusChange(status.id)}
          className={`py-3 px-4 rounded-lg border transition-colors text-sm font-medium ${
            selectedStatus === status.id
              ? `bg-${status.color}-100 border-${status.color}-300 text-${status.color}-800`
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {status.icon} {status.name}
        </button>
      ))}
    </div>
  )
} 