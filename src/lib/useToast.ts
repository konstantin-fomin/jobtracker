import { useState, useCallback } from 'react'
import type { ToastItem, ToastType } from '@/components/Toast'

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((
    message: string,
    type: ToastType = 'info',
    action?: ToastItem['action']
  ) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type, action }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}
