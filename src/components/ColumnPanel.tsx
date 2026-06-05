'use client'
import { useEffect, useRef, useState } from 'react'
import { ColumnKey } from '@/lib/types'
import {
  ALL_COLUMNS,
  MAIN_VIEW_COLUMNS,
  FIXED_DATA_COLUMN_COUNT,
  MAX_NORMAL_VISIBLE_DATA_COLUMNS,
  TOGGLEABLE_COLUMNS,
  getVisibleDataColumnCount,
  isDetailedColumnMode,
} from '@/lib/useColumns'
import { IconCheck } from './icons'

interface Props {
  active: ColumnKey[]
  onToggle: (key: ColumnKey) => boolean
  onPreset: (columns: ColumnKey[]) => void
  onReset: () => void
  onClose: () => void
}

export default function ColumnPanel({ active, onToggle, onPreset, onReset, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [limitHint, setLimitHint] = useState(false)
  const activeSet = new Set(active)

  // Close on click outside (the trigger button uses onMouseDown stopPropagation
  // to prevent a double-toggle race, so only clicks on other elements reach here)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const visibleDataColumns = getVisibleDataColumnCount(active)
  const totalDataColumns = FIXED_DATA_COLUMN_COUNT + TOGGLEABLE_COLUMNS.length
  const detailedMode = isDetailedColumnMode(active)

  const handleToggle = (key: ColumnKey) => {
    const ok = onToggle(key)
    setLimitHint(!ok)
  }

  const handlePreset = (columns: ColumnKey[]) => {
    setLimitHint(false)
    onPreset(columns)
  }

  const handleReset = () => {
    setLimitHint(false)
    onReset()
  }

  return (
    <div ref={ref} className="card p-4 animate-fade-in">
      {/* Title */}
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        Колонки таблицы
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => handlePreset(MAIN_VIEW_COLUMNS)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-hairline-strong bg-surface px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Основной вид
        </button>
        <button
          onClick={() => handlePreset(ALL_COLUMNS)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-hairline-strong bg-surface px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Все колонки
        </button>
      </div>

      {/* 2-column chip grid — toggleable only */}
      <p className="mb-3 text-xs text-ink-subtle">
        Все колонки могут включить горизонтальную прокрутку таблицы.
      </p>

      {limitHint && (
        <div className="mb-3 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-xs text-ink-muted">
          В основном виде можно показывать до {MAX_NORMAL_VISIBLE_DATA_COLUMNS} колонок. Отключи одну колонку или используй «Все колонки».
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {TOGGLEABLE_COLUMNS.map(col => {
          const on = activeSet.has(col.key)
          return (
            <button
              key={col.key}
              onClick={() => handleToggle(col.key)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors
                ${on
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-hairline bg-surface text-ink-muted hover:border-hairline-strong hover:text-ink'
                }`}
            >
              {/* Checkbox */}
              <span
                className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors
                  ${on ? 'border-accent bg-accent' : 'border-hairline-strong'}`}
              >
                {on && <IconCheck size={9} strokeWidth={3} className="text-white" />}
              </span>
              <span className="text-sm">{col.label}</span>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <button
          onClick={handleReset}
          className="cursor-pointer text-xs text-ink-muted transition-colors hover:text-ink"
        >
          Сбросить колонки
        </button>
        <span className="text-xs text-ink-muted">
          {detailedMode
            ? `${visibleDataColumns} из ${totalDataColumns} · Детальный вид`
            : `${visibleDataColumns} из ${MAX_NORMAL_VISIBLE_DATA_COLUMNS} колонок в основном виде`}
        </span>
      </div>
    </div>
  )
}
