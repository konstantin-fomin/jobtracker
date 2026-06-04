'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Job, JobInsert, Status, STATUS_META, SOURCES } from '@/lib/types'

interface Props {
  job: Job | null
  userId: string
  onSave: () => void
  onClose: () => void
}

const EMPTY: JobInsert = {
  company: '', role: '', status: 'sent', source: 'LinkedIn',
  date: '', salary_from: '', salary_to: '', contact: '', url: '', notes: ''
}

export default function JobModal({ job, userId, onSave, onClose }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState<JobInsert>(
    job
      ? { company: job.company, role: job.role, status: job.status, source: job.source,
          date: job.date ?? '', salary_from: job.salary_from, salary_to: job.salary_to,
          contact: job.contact, url: job.url, notes: job.notes }
      : { ...EMPTY, date: new Date().toISOString().split('T')[0] }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof JobInsert, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.company.trim() || !form.role.trim()) {
      setError('Укажите компанию и должность')
      return
    }
    setSaving(true)
    setError('')
    const payload = { ...form, user_id: userId }

    let err
    if (job) {
      ({ error: err } = await supabase.from('jobs').update(payload).eq('id', job.id))
    } else {
      ({ error: err } = await supabase.from('jobs').insert(payload))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    onSave()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">{job ? 'Редактировать' : 'Новая вакансия'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Компания *</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Google" className="w-full" />
            </div>
            <div>
              <label className="label">Должность *</label>
              <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Product Manager" className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Статус</label>
              <select value={form.status} onChange={e => set('status', e.target.value as Status)} className="w-full">
                {(Object.entries(STATUS_META) as [Status, typeof STATUS_META[Status]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Дата отклика</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ЗП от</label>
              <input value={form.salary_from} onChange={e => set('salary_from', e.target.value)} placeholder="150 000 ₽" className="w-full" />
            </div>
            <div>
              <label className="label">ЗП до</label>
              <input value={form.salary_to} onChange={e => set('salary_to', e.target.value)} placeholder="200 000 ₽" className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Источник</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className="w-full">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Контакт</label>
              <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="@hr или email" className="w-full" />
            </div>
          </div>

          <div>
            <label className="label">Ссылка на вакансию</label>
            <input type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" className="w-full" />
          </div>

          <div>
            <label className="label">Заметки</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Этапы, впечатления, follow-up…" rows={3} className="w-full" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end px-6 pb-5">
          <button onClick={onClose} className="btn-ghost">Отмена</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
