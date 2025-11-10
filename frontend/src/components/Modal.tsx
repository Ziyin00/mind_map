import React, { useEffect } from 'react'
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export type ModalType = 'confirm' | 'info' | 'success' | 'warning' | 'error'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const iconConfig = {
    confirm: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  }

  const buttonConfig = {
    confirm: 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    info: 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    success: 'bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
    warning: 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800',
    error: 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
  }

  const config = iconConfig[type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/80 animate-modal-in">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-200/60">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg',
            config.bg,
            config.border
          )}>
            <Icon className={cn('w-6 h-6', config.color)} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200/60">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold text-sm active:scale-95"
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={cn(
                'flex-1 px-4 py-2.5 text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl active:scale-95',
                buttonConfig[type]
              )}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

