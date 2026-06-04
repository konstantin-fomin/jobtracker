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

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  sent:      { label: 'Отправлено', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  interview: { label: 'Интервью',   color: 'bg-amber-50 text-amber-700 border-amber-100' },
  offer:     { label: 'Оффер',      color: 'bg-green-50 text-green-700 border-green-100' },
  rejected:  { label: 'Отказ',      color: 'bg-red-50 text-red-700 border-red-100' },
  ghosted:   { label: 'Нет ответа', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export const SOURCES = ['LinkedIn', 'Telegram', 'HeadHunter', 'hh.ru', 'Habr Career', 'Другое']
