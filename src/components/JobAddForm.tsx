'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  JobInsert,
  Status,
  SalaryCurrency,
  STATUS_META,
  STATUS_ORDER,
  SOURCES,
  CURRENCY_OPTIONS,
  STAGE_OPTIONS,
  WORK_FORMAT_OPTIONS,
  REJECT_REASON_OPTIONS,
} from '@/lib/types'
import { IconCheck, IconChevronRight, IconX } from './icons'

const emptyDraft = (): JobInsert => ({
  company: '',
  role: '',
  status: 'sent',
  source: '',
  date: new Date().toISOString().split('T')[0],
  salary_from: '',
  salary_to: '',
  salary_currency: 'RUB',
  contact: '',
  url: '',
  notes: '',
  stage: null,
  next_action: null,
  next_action_date: null,
  work_format: null,
  city: null,
  rating: null,
  referred_by: null,
  reject_reason: null,
})

function StarPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex h-10 items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? null : n)}
          className={`text-lg leading-none transition-colors ${
            (value ?? 0) >= n
              ? 'text-amber-400'
              : 'text-ink-subtle opacity-30 hover:opacity-60 hover:text-amber-300'
          }`}
          aria-label={`${n} из 5`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`min-w-0 space-y-1.5 ${className}`}>
      <span className="text-xs font-medium text-ink-subtle">{label}</span>
      {children}
    </label>
  )
}

const ENTER_SUBMIT_INPUT_TYPES = new Set([
  '',
  'text',
  'url',
  'email',
  'search',
  'tel',
  'number',
  'password',
])

const normalizeDate = (value: string | null | undefined) =>
  value?.trim() ? value : null

function canSubmitWithEnter(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.getAttribute('role') === 'button') return false
  if (target instanceof HTMLInputElement) {
    return ENTER_SUBMIT_INPUT_TYPES.has(target.type)
  }
  return false
}

type FormMode = 'create' | 'edit'

interface Props {
  mode?: FormMode
  initialValue?: JobInsert
  onSubmit: (data: JobInsert) => Promise<void>
  onCancel: () => void
}

export default function JobAddForm({ mode = 'create', initialValue, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<JobInsert>(() => initialValue ?? emptyDraft())
  const [saving, setSaving] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [touched, setTouched] = useState({ company: false, role: false })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const firstField = useRef<HTMLInputElement>(null)
  const roleField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(initialValue ?? emptyDraft())
    setSaving(false)
    setSubmitAttempted(false)
    setTouched({ company: false, role: false })
    setDetailsOpen(false)
    requestAnimationFrame(() => firstField.current?.focus())
  }, [initialValue, mode])

  const set = <K extends keyof JobInsert>(key: K, value: JobInsert[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const valid = draft.company.trim() && draft.role.trim()
  const companyInvalid = !draft.company.trim() && (submitAttempted || touched.company)
  const roleInvalid = !draft.role.trim() && (submitAttempted || touched.role)
  const title = mode === 'edit' ? 'Редактировать отклик' : 'Новый отклик'
  const description = mode === 'edit'
    ? 'Обнови данные по вакансии и сохрани изменения.'
    : 'Заполни основное, детали можно добавить позже.'

  const submit = async () => {
    if (!valid) {
      setSubmitAttempted(true)
      if (!draft.company.trim()) firstField.current?.focus()
      else roleField.current?.focus()
      return
    }
    setSaving(true)
    await onSubmit({
      ...draft,
      date: normalizeDate(draft.date),
      next_action_date: normalizeDate(draft.next_action_date),
    })
    setSaving(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
      if (!canSubmitWithEnter(e.target)) return
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <section className="card w-full p-4 sm:p-5 animate-fade-in" onKeyDown={onKeyDown}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="icon-btn self-start"
            title="Отмена (Esc)"
            aria-label="Отмена"
          >
            <IconX size={17} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Компания" className="sm:col-span-1 lg:col-span-2">
            <input
              ref={firstField}
              value={draft.company}
              onChange={e => set('company', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, company: true }))}
              placeholder="Компания *"
              className={`h-10 w-full ${companyInvalid ? 'invalid-field' : ''}`}
              aria-invalid={companyInvalid}
            />
            {companyInvalid && <span className="text-xs text-rose-500">Укажи компанию</span>}
          </Field>
          <Field label="Должность" className="sm:col-span-1 lg:col-span-2">
            <input
              ref={roleField}
              value={draft.role}
              onChange={e => set('role', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, role: true }))}
              placeholder="Должность *"
              className={`h-10 w-full ${roleInvalid ? 'invalid-field' : ''}`}
              aria-invalid={roleInvalid}
            />
            {roleInvalid && <span className="text-xs text-rose-500">Укажи должность</span>}
          </Field>
          <Field label="Статус">
            <select
              value={draft.status}
              onChange={e => set('status', e.target.value as Status)}
              className="h-10 w-full"
            >
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Дата отклика">
            <input
              type="date"
              value={draft.date ?? ''}
              onChange={e => set('date', e.target.value)}
              className="h-10 w-full"
            />
          </Field>
          <Field label="Источник">
            <select
              value={draft.source}
              onChange={e => set('source', e.target.value)}
              className="h-10 w-full"
            >
              <option value="">—</option>
              {SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
          </Field>
          <Field label="Ссылка">
            <input
              value={draft.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://…"
              className="h-10 w-full"
            />
          </Field>
          <Field label="ЗП от">
            <input
              value={draft.salary_from}
              onChange={e => set('salary_from', e.target.value)}
              placeholder="от"
              className="h-10 w-full"
            />
          </Field>
          <Field label="ЗП до">
            <input
              value={draft.salary_to}
              onChange={e => set('salary_to', e.target.value)}
              placeholder="до"
              className="h-10 w-full"
            />
          </Field>
          <Field label="Валюта">
            <select
              value={draft.salary_currency}
              onChange={e => set('salary_currency', e.target.value as SalaryCurrency)}
              className="h-10 w-full"
            >
              {CURRENCY_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="border-t border-hairline pt-3">
          <button
            type="button"
            onClick={() => setDetailsOpen(v => !v)}
            className="flex w-full cursor-pointer items-center gap-1.5 rounded-md text-left text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-expanded={detailsOpen}
            aria-controls="job-details-panel"
          >
            <IconChevronRight
              size={15}
              className={`transition-transform duration-200 ${detailsOpen ? 'rotate-90' : ''}`}
            />
            Детали
          </button>

          {detailsOpen && (
            <div id="job-details-panel" className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Следующий шаг" className="sm:col-span-1 lg:col-span-3">
                <input
                  value={draft.next_action ?? ''}
                  onChange={e => set('next_action', e.target.value || null)}
                  placeholder="Написать рекрутеру, подготовиться к интервью…"
                  className="h-10 w-full"
                />
              </Field>
              <Field label="Дата шага">
                <input
                  type="date"
                  value={draft.next_action_date ?? ''}
                  onChange={e => set('next_action_date', e.target.value || null)}
                  className="h-10 w-full"
                />
              </Field>
              <Field label="Контакт">
                <input
                  value={draft.contact}
                  onChange={e => set('contact', e.target.value)}
                  placeholder="@hr / email"
                  className="h-10 w-full"
                />
              </Field>
              <Field label="Этап">
                <select
                  value={draft.stage ?? ''}
                  onChange={e => set('stage', e.target.value || null)}
                  className="h-10 w-full"
                >
                  <option value="">—</option>
                  {STAGE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Формат">
                <select
                  value={draft.work_format ?? ''}
                  onChange={e => set('work_format', e.target.value || null)}
                  className="h-10 w-full"
                >
                  <option value="">—</option>
                  {WORK_FORMAT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Город">
                <input
                  value={draft.city ?? ''}
                  onChange={e => set('city', e.target.value || null)}
                  placeholder="Москва…"
                  className="h-10 w-full"
                />
              </Field>
              <Field label="Оценка">
                <StarPicker value={draft.rating ?? null} onChange={v => set('rating', v)} />
              </Field>
              <Field label="Кто рекомендовал">
                <input
                  value={draft.referred_by ?? ''}
                  onChange={e => set('referred_by', e.target.value || null)}
                  placeholder="Имя / контакт"
                  className="h-10 w-full"
                />
              </Field>
              {draft.status === 'rejected' && (
                <Field label="Причина отказа">
                  <select
                    value={draft.reject_reason ?? ''}
                    onChange={e => set('reject_reason', e.target.value || null)}
                    className="h-10 w-full"
                  >
                    <option value="">—</option>
                    {REJECT_REASON_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Заметки" className="sm:col-span-2 lg:col-span-3">
                <textarea
                  value={draft.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Коротко: контекст, ожидания, что важно не забыть…"
                  className="min-h-[80px] w-full"
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-ghost h-10 justify-center">
            Отмена
          </button>
          <button type="button" onClick={submit} disabled={saving} className="btn-primary h-10 justify-center">
            <IconCheck size={16} />
            {saving ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </section>
  )
}
