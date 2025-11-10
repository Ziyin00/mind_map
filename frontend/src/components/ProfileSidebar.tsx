import React, { useEffect } from 'react'
import { X, User, LogOut, Users, Wifi, WifiOff } from 'lucide-react'
import { useSocketStore } from '../store/socketStore'
import { useToastStore } from '../store/toastStore'

interface OnlineUser {
  user_id: string
  user_name: string
}

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onlineUsers: OnlineUser[]
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  isOpen,
  onClose,
  onlineUsers,
}) => {
  const { userId, userName, isConnected, socket, setSocket, setConnected, setUser, setCurrentSession } = useSocketStore()
  const addToast = useToastStore((state) => state.addToast)

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

  const handleLogout = () => {
    if (socket) {
      socket.disconnect()
    }
    setSocket(null)
    setConnected(false)
    setUser('', '')
    setCurrentSession(null)
    localStorage.removeItem('mindmap_user_name')
    addToast('Logged out successfully', 'success')
    onClose()
    // Reload page to reset state
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/60 z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/60">
          <h2 className="text-xl font-bold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* User Info Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Information</h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <User className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{userName || 'Anonymous'}</h4>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm text-emerald-700 font-medium">Online</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm text-red-700 font-medium">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User ID</span>
                    <span className="text-sm font-mono text-gray-900">{userId?.substring(0, 12)}...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Wifi className="text-emerald-600" size={16} />
                      ) : (
                        <WifiOff className="text-red-600" size={16} />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Online Users Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Online Users</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200/50">
                <Users className="text-emerald-600" size={14} />
                <span className="text-xs font-semibold text-emerald-700">{onlineUsers.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {onlineUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="mx-auto mb-2 opacity-50" size={32} />
                  <p className="text-sm">No other users online</p>
                </div>
              ) : (
                onlineUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      user.user_id === userId
                        ? 'bg-gradient-to-br from-blue-50 to-purple-50/50 border-blue-200/50'
                        : 'bg-gray-50/50 border-gray-200/50 hover:bg-gray-100/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      user.user_id === userId
                        ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                        : 'bg-gradient-to-br from-gray-300 to-gray-400'
                    }`}>
                      <User className="text-white" size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.user_name}
                        </p>
                        {user.user_id === userId && (
                          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl active:scale-95"
          >
            <LogOut size={18} strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}

