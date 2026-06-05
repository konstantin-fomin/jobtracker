'use client'
import { useCallback, useState } from 'react'
import { ColumnKey } from './types'

export interface ColumnDef {
  key: ColumnKey
  label: string
  defaultOn: boolean
}

/** Fixed columns — always visible, locked in configurator */
export const FIXED_COLUMNS = [
  { key: 'company' as const, label: 'Компания' },
  { key: 'role'    as const, label: 'Должность' },
  { key: 'status'  as const, label: 'Статус' },
]

/** Toggleable columns in display order */
export const TOGGLEABLE_COLUMNS: ColumnDef[] = [
  { key: 'date',    label: 'Дата',     defaultOn: true  },
  { key: 'salary',  label: 'ЗП',       defaultOn: true  },
  { key: 'source',  label: 'Источник', defaultOn: true  },
  { key: 'url',              label: 'Ссылка',          defaultOn: false },
  { key: 'contact',          label: 'Контакт',         defaultOn: false },
  { key: 'notes',            label: 'Заметки',         defaultOn: false },
  { key: 'stage',            label: 'Этап',            defaultOn: false },
  { key: 'next_action',      label: 'Следующий шаг',   defaultOn: true  },
  { key: 'next_action_date', label: 'Дата шага',       defaultOn: false },
  { key: 'work_format',      label: 'Формат работы',   defaultOn: false },
  { key: 'city',             label: 'Город',           defaultOn: false },
  { key: 'rating',           label: 'Оценка',          defaultOn: false },
  { key: 'reject_reason',    label: 'Причина отказа',  defaultOn: false },
  { key: 'updated_at',       label: 'Изменено',        defaultOn: false },
]

export const DEFAULT_COLUMNS: ColumnKey[] = TOGGLEABLE_COLUMNS
  .filter(c => c.defaultOn)
  .map(c => c.key)

export const MAIN_VIEW_COLUMNS: ColumnKey[] = [
  'date',
  'salary',
  'source',
  'stage',
  'next_action',
]

export const ALL_COLUMNS: ColumnKey[] = TOGGLEABLE_COLUMNS.map(c => c.key)
export const FIXED_DATA_COLUMN_COUNT = FIXED_COLUMNS.length
export const MAX_NORMAL_VISIBLE_DATA_COLUMNS = 8

const TOGGLEABLE_KEYS = new Set(TOGGLEABLE_COLUMNS.map(c => c.key))

export const getEnabledOptionalCount = (columns: ColumnKey[]) =>
  columns.filter(key => TOGGLEABLE_KEYS.has(key)).length

export const getVisibleDataColumnCount = (columns: ColumnKey[]) =>
  FIXED_DATA_COLUMN_COUNT + getEnabledOptionalCount(columns)

export const isDetailedColumnMode = (columns: ColumnKey[]) =>
  getVisibleDataColumnCount(columns) > MAX_NORMAL_VISIBLE_DATA_COLUMNS

export const canEnableColumn = (columns: ColumnKey[], key: ColumnKey) =>
  columns.includes(key) ||
  isDetailedColumnMode(columns) ||
  getVisibleDataColumnCount(columns) < MAX_NORMAL_VISIBLE_DATA_COLUMNS

const LS_KEY = 'jt_columns'

function readLS(): ColumnKey[] {
  if (typeof window === 'undefined') return DEFAULT_COLUMNS
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as ColumnKey[]
    }
  } catch { /* ignore */ }
  return DEFAULT_COLUMNS
}

export function useColumns() {
  const [active, setActive] = useState<ColumnKey[]>(readLS)

  const toggle = useCallback((key: ColumnKey) => {
    const isOn = active.includes(key)
    if (!isOn && !canEnableColumn(active, key)) return false

    const next = isOn
      ? active.filter(k => k !== key)
      : [...active, key]
    setActive(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    return true
  }, [active])

  const reset = useCallback(() => {
    setActive(DEFAULT_COLUMNS)
    try { localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_COLUMNS)) } catch { /* ignore */ }
  }, [])

  const setPreset = useCallback((columns: ColumnKey[]) => {
    setActive(columns)
    try { localStorage.setItem(LS_KEY, JSON.stringify(columns)) } catch { /* ignore */ }
  }, [])

  return { active, toggle, reset, setPreset }
}
