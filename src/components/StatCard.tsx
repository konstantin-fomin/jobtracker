'use client'
import type { ReactNode } from 'react'
import { useCountUp } from '@/lib/useCountUp'

type Tone = 'default' | 'amber' | 'emerald' | 'rose'

const toneMap: Record<Tone, { chip: string }> = {
  default: { chip: 'text-accent bg-accent-soft' },
  amber:   { chip: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-400/15' },
  emerald: { chip: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-400/15' },
  rose:    { chip: 'text-rose-500 bg-rose-50 dark:text-rose-300 dark:bg-rose-400/15' },
}

// Semantic color only when value > 0: zeros are muted so they don't distract
const valueColor: Record<Tone, string> = {
  default: 'text-ink',
  amber:   'text-amber-600 dark:text-amber-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  rose:    'text-rose-500 dark:text-rose-400',
}

interface Props {
  label: string
  value: number
  tone?: Tone
  icon: ReactNode
  hint?: string
  /** Highlights this card as the goal metric — subtle accent ring */
  featured?: boolean
}

export default function StatCard({ label, value, tone = 'default', icon, hint, featured }: Props) {
  const animated = useCountUp(value)
  const t = toneMap[tone]
  const numColor = value === 0 ? 'text-ink-subtle' : valueColor[tone]

  return (
    <div
      className="card p-4 sm:p-5 transition-all duration-200 hover:shadow-pop"
      // ring-accent/25 doesn't work with CSS-variable colors in Tailwind (opacity modifier
      // requires a raw color value, not var()). Use borderColor via inline style instead.
      style={featured ? { borderColor: 'var(--accent-ring)' } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-ink-subtle leading-snug">{label}</p>
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.chip}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums transition-colors duration-300 ${numColor}`}>
        {animated}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-ink-subtle">{hint}</p>
      )}
    </div>
  )
}
