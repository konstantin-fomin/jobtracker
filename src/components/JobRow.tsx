'use client'
import { useEffect, useRef, useState } from 'react'
import { Job, JobInsert, Status, STATUS_META, STATUS_ORDER, SOURCES } from '@/lib/types'
import { IconCheck, IconX, IconEdit, IconTrash, IconExternal } from './icons'

const emptyDraft = (): JobInsert => ({
  company: '',
  role: '',
  status: 'sent',
  source: 'LinkedIn',
  date: new Date().toISOString().split('T')[0],
  salary_from: '',
  salary_to: '',
  contact: '',
  url: '',
  notes: '',
})

const fromJob = (j: Job): JobInsert => ({
  company: j.company,
  role: j.role,
  status: j.status,
  source: j.source || 'LinkedIn',
  date: j.date ?? '',
  salary_from: j.salary_from,
  salary_to: j.salary_to,
  contact: j.contact,
  url: j.url,
  notes: j.notes,
})

const fmtDate = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

const fmtSalary = (from: string, to: string) => {
  if (!from && !to) return '—'
  if (from && to) return `${from} – ${to}`
  return from || to
}

interface Props {
  job?: Job // undefined => new draft row
  index?: number
  editing: boolean
  onStartEdit: () => void
  onCancel: () => void
  onSubmit: (data: JobInsert) => Promise<void>
  onDelete?: () => void
}

export default function JobRow({ job, index, editing, onStartEdit, onCancel, onSubmit, onDelete }: Props) {
  const [draft, setDraft] = useState<JobInsert>(job ? fromJob(job) : emptyDraft())
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const firstField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(job ? fromJob(job) : emptyDraft())
      setShowErrors(false)
      // focus first field on next frame
      requestAnimationFrame(() => firstField.current?.focus())
    }
  }, [editing, job])

  const set = (k: keyof JobInsert, v: string) => setDraft(f => ({ ...f, [k]: v }))

  const valid = draft.company.trim() && draft.role.trim()

  const submit = async () => {
    if (!valid) {
      setShowErrors(true)
      firstField.current?.focus()
      return
    }
    setSaving(true)
    await onSubmit(draft)
    setSaving(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  // ---------- EDIT MODE ----------
  if (editing) {
    return (
      <tr
        className="animate-fade-in"
        style={{ background: 'var(--row-edit-bg)' }}
        onKeyDown={onKeyDown}
      >
        <td className="px-3 py-2 align-top">
          <span className="inline-block h-2 w-2 rounded-full bg-accent mt-2.5" />
        </td>
        <td className="px-3 py-2 align-top">
          <input
            ref={firstField}
            value={draft.company}
            onChange={e => set('company', e.target.value)}
            placeholder="Компания *"
            className={`cell-input ${showErrors && !draft.company.trim() ? 'invalid' : ''}`}
          />
        </td>
        <td className="px-3 py-2 align-top">
          <input
            value={draft.role}
            onChange={e => set('role', e.target.value)}
            placeholder="Должность *"
            className={`cell-input ${showErrors && !draft.role.trim() ? 'invalid' : ''}`}
          />
          <input
            value={draft.url}
            onChange={e => set('url', e.target.value)}
            placeholder="ссылка на вакансию"
            className="cell-input mt-1.5 text-xs"
          />
        </td>
        <td className="px-3 py-2 align-top">
          <input
            type="date"
            value={draft.date ?? ''}
            onChange={e => set('date', e.target.value)}
            className="cell-input"
          />
        </td>
        <td className="px-3 py-2 align-top">
          <select value={draft.status} onChange={e => set('status', e.target.value as Status)} className="cell-input">
            {STATUS_ORDER.map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2 align-top">
          <div className="flex gap-1">
            <input value={draft.salary_from} onChange={e => set('salary_from', e.target.value)} placeholder="от" className="cell-input" />
            <input value={draft.salary_to} onChange={e => set('salary_to', e.target.value)} placeholder="до" className="cell-input" />
          </div>
        </td>
        <td className="px-3 py-2 align-top">
          <select value={draft.source} onChange={e => set('source', e.target.value)} className="cell-input">
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td className="px-3 py-2 align-top">
          <input value={draft.contact} onChange={e => set('contact', e.target.value)} placeholder="@hr / email" className="cell-input" />
        </td>
        <td className="px-3 py-2 align-top">
          <div className="flex gap-1">
            <button onClick={submit} disabled={saving} className="icon-btn !text-white !bg-accent hover:!bg-accent-hover disabled:opacity-50" title="Сохранить (Enter)">
              <IconCheck size={16} />
            </button>
            <button onClick={onCancel} className="icon-btn" title="Отмена (Esc)">
              <IconX size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  // ---------- VIEW MODE ----------
  const s = STATUS_META[job!.status]
  return (
    <tr
      className="group border-t border-hairline hover:bg-surface-2 transition-colors cursor-pointer"
      onClick={onStartEdit}
    >
      <td className="px-3 py-3 text-ink-subtle text-sm tabular-nums">{index}</td>
      <td className="px-3 py-3 font-semibold text-ink">{job!.company}</td>
      <td className="px-3 py-3">
        <span className="text-ink-muted">{job!.role}</span>
        {job!.url && (
          <a
            href={job!.url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="ml-1.5 inline-flex items-center text-accent align-middle hover:opacity-80"
            title="Открыть вакансию"
          >
            <IconExternal size={13} />
          </a>
        )}
      </td>
      <td className="px-3 py-3 text-ink-muted text-sm whitespace-nowrap tabular-nums">{fmtDate(job!.date)}</td>
      <td className="px-3 py-3">
        <span className={`badge ${s.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </td>
      <td className="px-3 py-3 text-ink-muted text-sm whitespace-nowrap">{fmtSalary(job!.salary_from, job!.salary_to)}</td>
      <td className="px-3 py-3">
        {job!.source && (
          <span className="inline-flex items-center rounded-md border border-hairline bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">
            {job!.source}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-ink-muted text-sm">{job!.contact || '—'}</td>
      <td className="px-3 py-3">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onStartEdit() }} className="icon-btn" title="Редактировать">
            <IconEdit size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete?.() }}
            className="icon-btn hover:!text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-500/10"
            title="Удалить"
          >
            <IconTrash size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
