export type Status = 'sent' | 'interview' | 'test' | 'offer' | 'rejected' | 'ghosted'

/** Toggleable column keys — all map to real DB fields */
export type ColumnKey =
  | 'date' | 'salary' | 'source' | 'url' | 'contact' | 'notes'
  | 'stage' | 'next_action' | 'next_action_date' | 'work_format'
  | 'city' | 'rating' | 'reject_reason' | 'updated_at'

// ── Salary currency ───────────────────────────────────────────────────────────
export type SalaryCurrency = 'RUB' | 'USD' | 'EUR'

export function isSalaryCurrency(value: unknown): value is SalaryCurrency {
  return value === 'RUB' || value === 'USD' || value === 'EUR'
}

export const CURRENCY_OPTIONS = [
  { value: 'RUB' as const, label: 'RUB' },
  { value: 'USD' as const, label: 'USD' },
  { value: 'EUR' as const, label: 'EUR' },
]

export interface Job {
  id: string
  user_id: string
  company: string
  role: string
  status: Status
  source: string
  date: string | null
  salary_from: string
  salary_to: string
  salary_currency: SalaryCurrency
  contact: string
  url: string
  notes: string
  created_at: string
  // New fields (added in migration)
  stage?: string | null
  next_action?: string | null
  next_action_date?: string | null
  work_format?: string | null
  city?: string | null
  rating?: number | null
  referred_by?: string | null
  reject_reason?: string | null
  updated_at?: string | null
  deleted_at?: string | null
}

export type JobInsert = Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>

/**
 * Loose shape of a row as it may arrive from Supabase: every column can be
 * null/undefined because the SQL schema marks the text fields as nullable and
 * `.select('*')` is not backed by generated DB types.
 */
export type RawJob =
  Partial<Record<keyof Job, unknown>> &
  Pick<Job, 'id' | 'user_id' | 'company' | 'role' | 'status'>

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const strOrNull = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null
const numOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

/**
 * Normalize a raw Supabase row into a UI-safe Job. The six nullable text
 * fields (source, salary_from, salary_to, contact, url, notes) and created_at
 * are coalesced to empty strings so the Job string contract is honest at
 * runtime; the genuinely-optional fields stay null when missing.
 */
export function normalizeJob(raw: RawJob): Job {
  return {
    id: raw.id,
    user_id: raw.user_id,
    company: raw.company,
    role: raw.role,
    status: raw.status,
    source: str(raw.source),
    salary_from: str(raw.salary_from),
    salary_to: str(raw.salary_to),
    salary_currency: isSalaryCurrency(raw.salary_currency) ? raw.salary_currency : 'RUB',
    contact: str(raw.contact),
    url: str(raw.url),
    notes: str(raw.notes),
    created_at: str(raw.created_at),
    date: strOrNull(raw.date),
    stage: strOrNull(raw.stage),
    next_action: strOrNull(raw.next_action),
    next_action_date: strOrNull(raw.next_action_date),
    work_format: strOrNull(raw.work_format),
    city: strOrNull(raw.city),
    rating: numOrNull(raw.rating),
    referred_by: strOrNull(raw.referred_by),
    reject_reason: strOrNull(raw.reject_reason),
    updated_at: strOrNull(raw.updated_at),
    deleted_at: strOrNull(raw.deleted_at),
  }
}

/**
 * Status presentation. Soft tinted pills (Notion database style) with a colored
 * dot for fast scanning.
 */
export const STATUS_META: Record<Status, { label: string; badgeLabel: string; badge: string; dot: string }> = {
  sent: {
    label: 'Отправлено',
    badgeLabel: 'Отклик',
    badge: 'bg-sky-50/80 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-200',
    dot: 'bg-sky-500/80 dark:bg-cyan-300/80',
  },
  interview: {
    label: 'Интервью',
    badgeLabel: 'Интервью',
    badge: 'bg-violet-50/80 text-violet-700 dark:bg-violet-300/10 dark:text-violet-200',
    dot: 'bg-violet-500/80 dark:bg-violet-300/80',
  },
  test: {
    label: 'Тестовое задание',
    badgeLabel: 'Тест',
    badge: 'bg-orange-50/80 text-orange-700 dark:bg-orange-300/10 dark:text-orange-200',
    dot: 'bg-orange-500/80 dark:bg-orange-300/80',
  },
  offer: {
    label: 'Оффер',
    badgeLabel: 'Оффер',
    badge: 'bg-emerald-50/80 text-emerald-700 dark:bg-teal-300/10 dark:text-teal-200',
    dot: 'bg-emerald-500/80 dark:bg-teal-300/80',
  },
  rejected: {
    label: 'Отказ',
    badgeLabel: 'Отказ',
    badge: 'bg-rose-50/80 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200',
    dot: 'bg-rose-500/80 dark:bg-rose-300/80',
  },
  ghosted: {
    label: 'Нет ответа',
    badgeLabel: 'Нет ответа',
    badge: 'bg-slate-100/70 text-slate-500 dark:bg-slate-300/10 dark:text-slate-300',
    dot: 'bg-slate-300 dark:bg-slate-400/70',
  },
}

export const STATUS_ORDER: Status[] = ['sent', 'interview', 'test', 'offer', 'rejected', 'ghosted']

export const SOURCES = ['LinkedIn', 'Telegram', 'HeadHunter', 'hh.ru', 'Habr Career', 'Другое']

// ── Stage ─────────────────────────────────────────────────────────────────────
export const STAGE_OPTIONS = [
  { value: 'hr',                label: 'HR-скрининг'  },
  { value: 'tech',              label: 'Техническое'  },
  { value: 'final',             label: 'Финал'        },
  { value: 'offer_negotiation', label: 'Переговоры'   },
] as const
export const STAGE_LABEL: Record<string, string> =
  Object.fromEntries(STAGE_OPTIONS.map(o => [o.value, o.label]))

// ── Work format ───────────────────────────────────────────────────────────────
export const WORK_FORMAT_OPTIONS = [
  { value: 'office', label: 'Офис'      },
  { value: 'remote', label: 'Удалённо'  },
  { value: 'hybrid', label: 'Гибрид'    },
] as const
export const WORK_FORMAT_LABEL: Record<string, string> =
  Object.fromEntries(WORK_FORMAT_OPTIONS.map(o => [o.value, o.label]))
export const WORK_FORMAT_BADGE: Record<string, string> = {
  office: 'bg-sky-50/80 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-200',
  remote: 'bg-emerald-50/80 text-emerald-700 dark:bg-teal-300/10 dark:text-teal-200',
  hybrid: 'bg-amber-50/75 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200',
}

// ── Reject reason ─────────────────────────────────────────────────────────────
export const REJECT_REASON_OPTIONS = [
  { value: 'no_response', label: 'Нет ответа' },
  { value: 'skills',      label: 'Навыки'     },
  { value: 'salary',      label: 'Зарплата'   },
  { value: 'culture',     label: 'Культура'   },
  { value: 'other',       label: 'Другое'     },
] as const
export const REJECT_REASON_LABEL: Record<string, string> =
  Object.fromEntries(REJECT_REASON_OPTIONS.map(o => [o.value, o.label]))
