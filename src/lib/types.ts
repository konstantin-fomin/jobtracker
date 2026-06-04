export type Status = 'sent' | 'interview' | 'offer' | 'rejected' | 'ghosted'

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
  contact: string
  url: string
  notes: string
  created_at: string
}

export type JobInsert = Omit<Job, 'id' | 'user_id' | 'created_at'>

/**
 * Status presentation. Soft tinted pills (Notion database style) with a colored
 * dot for fast scanning. Each badge carries light + dark variants so themes share
 * one source of truth. "Оффер" is anchored to the emerald accent (positive milestone).
 */
export const STATUS_META: Record<Status, { label: string; badge: string; dot: string }> = {
  sent: {
    label: 'Отправлено',
    badge: 'bg-stone-100 text-stone-600 dark:bg-white/[0.06] dark:text-stone-300',
    dot: 'bg-stone-400 dark:bg-stone-500',
  },
  interview: {
    label: 'Интервью',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  offer: {
    label: 'Оффер',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Отказ',
    badge: 'bg-rose-50 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  ghosted: {
    label: 'Нет ответа',
    badge: 'bg-stone-100 text-stone-400 dark:bg-white/[0.04] dark:text-stone-500',
    dot: 'bg-stone-300 dark:bg-stone-600',
  },
}

export const STATUS_ORDER: Status[] = ['sent', 'interview', 'offer', 'rejected', 'ghosted']

export const SOURCES = ['LinkedIn', 'Telegram', 'HeadHunter', 'hh.ru', 'Habr Career', 'Другое']
