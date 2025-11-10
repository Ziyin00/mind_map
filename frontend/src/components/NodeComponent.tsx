import React, { useState, useRef } from 'react'
import type { Node } from '../types'
import { cn } from '../lib/utils'
import { X } from 'lucide-react'

interface NodeComponentProps {
  node: Node
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: number, updates: Partial<Node>) => void
  onDelete: (id: number) => void
  onDragStart: (e: React.MouseEvent, id: number) => void
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDragStart,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(node.content)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleDoubleClick = () => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (content !== node.content) {
      onUpdate(node.id, { content })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setContent(node.content)
      setIsEditing(false)
    }
  }

  const isEmpty = !node.content || node.content.trim() === ''

  return (
    <div
      className={cn(
        'absolute cursor-move rounded-xl border-2 transition-all duration-300 z-10 group',
        'bg-gradient-to-br from-white to-gray-50/50 shadow-md backdrop-blur-sm',
        isSelected 
          ? 'border-slate-600 shadow-2xl ring-4 ring-slate-200/60 scale-[1.03] shadow-slate-900/10' 
          : 'border-gray-200 hover:border-slate-300 hover:shadow-xl hover:scale-[1.01]',
        isEditing && 'ring-4 ring-blue-300/50 shadow-xl border-blue-400'
      )}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        minHeight: `${node.height}px`,
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onMouseDown={(e) => onDragStart(e, node.id)}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-3.5 rounded-lg resize-none focus:outline-none text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 bg-transparent"
          style={{ minHeight: `${node.height}px` }}
          placeholder="Type your thoughts..."
        />
      ) : (
        <div className="p-3.5 min-h-full">
          <div className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap break-words",
            isEmpty ? "text-gray-400" : "text-gray-900"
          )}>
            {node.content || 'Double-click to edit'}
          </div>
        </div>
      )}
      
      {/* Delete button - only show when selected */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white hover:from-red-600 hover:via-red-700 hover:to-red-800 flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 z-30 active:scale-90 group/delete"
          title="Delete node"
        >
          <X size={13} strokeWidth={3} className="group-hover/delete:rotate-90 transition-transform duration-300" />
          <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover/delete:scale-100 transition-transform duration-300"></div>
        </button>
      )}
    </div>
  )
}

