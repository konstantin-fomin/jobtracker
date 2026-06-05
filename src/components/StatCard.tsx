'use client'
import type { ReactNode } from 'react'
import { useCountUp } from '@/lib/useCountUp'

interface Props {
  label: string
  value: number
  icon: ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
}

/**
 * Unified metric card — single visual treatment for all four stats.
 * Icons and labels are monochrome (text-ink-subtle); no per-tone colors,
 * no featured ring. Count-up animation is kept (respects reduced-motion).
 */
export default function StatCard({ label, value, icon, onClick, active = false, title }: Props) {
  const animated = useCountUp(value)
  const className = `flex h-28 flex-col gap-3 rounded-xl border bg-surface p-5 text-left shadow-card transition-colors ${
    active
      ? 'border-accent bg-accent-soft'
      : 'border-hairline'
  } ${onClick ? 'cursor-pointer hover:border-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent' : ''}`

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase leading-snug tracking-wider text-ink-subtle">
          {label}
        </span>
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-ink-subtle opacity-75 [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">
          {icon}
        </span>
      </div>
      <span className="text-3xl font-semibold tabular-nums text-ink">{animated}</span>
    </>
  )

  return onClick ? (
    <button type="button" onClick={onClick} className={className} title={title} aria-pressed={active}>
      {content}
    </button>
  ) : (
    <div className={className} title={title}>
      {content}
    </div>
  )
}
