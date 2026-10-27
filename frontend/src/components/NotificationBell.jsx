import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { Bell, CheckCheck } from 'lucide-react'
import api, { API_BASE_URL } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime } from '../utils/format'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  useEffect(() => {
    let ignore = false

    async function loadNotifications() {
      try {
        const { data } = await api.get('/notifications')

        if (!ignore) {
          setNotifications(data)
          setError('')
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getErrorMessage(requestError))
        }
      }
    }

    if (user?._id) {
      loadNotifications()
    }

    return () => {
      ignore = true
    }
  }, [user?._id])

  useEffect(() => {
    if (!user?._id) {
      return undefined
    }

    const socket = io(API_BASE_URL, {
      query: { userId: user._id },
    })

    socket.on('newNotification', (notification) => {
      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current
        }

        return [notification, ...current]
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user?._id])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  async function handleMarkOne(notification) {
    if (notification.isRead) {
      return
    }

    setNotifications((current) =>
      current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item,
      ),
    )

    try {
      await api.patch(`/notifications/${notification._id}/read`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleMarkAll() {
    if (unreadCount === 0) {
      return
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    )

    try {
      await api.patch('/notifications/read-all')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(23,34,56,0.14)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <p className="font-display text-[13px] font-bold text-slate-800">Notifications</p>
              <p className="text-[10px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-slate-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleMarkOne(notification)}
                  className={`block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                    notification.isRead ? 'bg-white' : 'bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        notification.isRead ? 'bg-slate-300' : 'bg-blue-600'
                      }`}
                    />
                    <span>
                      <span className="block text-xs leading-5 text-slate-700">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
