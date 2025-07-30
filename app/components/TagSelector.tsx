'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTags, Tag } from '../contexts/TagsContext'

interface TagSelectorProps {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  className?: string
}

export default function TagSelector({ selectedTagIds, onTagsChange, className = '' }: TagSelectorProps) {
  const { tags } = useTags()
  const [showTagSelector, setShowTagSelector] = useState(false)

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id))
  const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.id))

  const addTag = (tagId: string) => {
    onTagsChange([...selectedTagIds, tagId])
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId))
  }

  return (
    <div className={className}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-${tag.color}-100 text-${tag.color}-800 border border-${tag.color}-200`}
          >
            <span className="text-base">{tag.icon}</span>
            <span>{tag.name}</span>
            <button
              onClick={() => removeTag(tag.id)}
              className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </span>
        ))}
      </div>

      {/* Add Tag Button */}
      {availableTags.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowTagSelector(!showTagSelector)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tag</span>
          </button>

          {/* Tag Dropdown */}
          {showTagSelector && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              <div className="p-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      addTag(tag.id)
                      setShowTagSelector(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <span className="text-lg">{tag.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{tag.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-full bg-${tag.color}-500`}></span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Tags Available */}
      {availableTags.length === 0 && selectedTags.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No tags available. Create some tags in Settings first.</p>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showTagSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTagSelector(false)}
        />
      )}
    </div>
  )
} 