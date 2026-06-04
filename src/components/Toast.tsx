'use client'
import { useEffect, useRef } from 'react'
import { IconCheck, IconX } from './icons'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  action?: { label: string; onClick: () => void }
}

interface Props {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-rose-500/30 bg-rose-500/10 text-rose-300',
  info:    'border-hairline bg-surface text-ink',
}

const typeIcon: Record<ToastType, React.ReactNode> = {
  success: <IconCheck size={14} />,
  error:   <IconX size={14} />,
  info:    null,
}

function ToastEntry({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timerRef.current)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex items-center gap-3 rounded-xl border px-4 py-3 shadow-pop
        text-sm font-medium animate-fade-in
        ${typeStyles[toast.type]}
      `}
    >
      {typeIcon[toast.type] && (
        <span className="shrink-0">{typeIcon[toast.type]}</span>
      )}
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onDismiss() }}
          className="shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold
            bg-white/10 hover:bg-white/20 transition cursor-pointer"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Закрыть"
        className="shrink-0 opacity-50 hover:opacity-100 transition cursor-pointer"
      >
        <IconX size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div
      aria-label="Уведомления"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map(t => (
        <ToastEntry key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}
