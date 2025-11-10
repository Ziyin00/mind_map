import React, { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

export const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const iconConfig = {
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  }

  const config = iconConfig[toast.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'relative bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 min-w-[320px] max-w-md p-4 flex items-start gap-3 animate-toast-in',
        config.border,
        isLeaving && 'animate-toast-out'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2 shadow-sm',
        config.bg,
        config.border
      )}>
        <Icon className={cn('w-5 h-5', config.color)} strokeWidth={2.5} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={handleRemove}
        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors text-gray-400 hover:text-gray-600"
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
        <div
          className={cn(
            'h-full transition-all ease-linear',
            toast.type === 'success' && 'bg-emerald-500',
            toast.type === 'error' && 'bg-red-500',
            toast.type === 'info' && 'bg-blue-500',
            toast.type === 'warning' && 'bg-amber-500'
          )}
          style={{
            animation: `toast-progress ${toast.duration || 3000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  )
}

export const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}

