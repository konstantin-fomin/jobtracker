'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Job, Status, STATUS_META } from '@/lib/types'
import JobModal from '@/components/JobModal'
import StatCard from '@/components/StatCard'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) return
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    setJobs(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchQ = !q || j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)
    const matchS = !filterStatus || j.status === filterStatus
    return matchQ && matchS
  })

  const counts = {
    total: jobs.length,
    interview: jobs.filter(j => j.status === 'interview').length,
    offer: jobs.filter(j => j.status === 'offer').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
  }

  const openNew = () => { setEditingJob(null); setModalOpen(true) }
  const openEdit = (j: Job) => { setEditingJob(j); setModalOpen(true) }

  const deleteJob = async (id: string) => {
    if (!confirm('Удалить эту вакансию?')) return
    await supabase.from('jobs').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const onSave = () => { load(); setModalOpen(false) }

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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💼</span>
            <span className="font-semibold text-stone-900">JobTracker</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden sm:block">
              {user?.user_metadata?.full_name ?? user?.email}
            </span>
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" alt="" />
            )}
            <button onClick={signOut} className="btn-ghost text-xs px-3 py-1.5">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Всего откликов" value={counts.total} />
          <StatCard label="Интервью" value={counts.interview} color="amber" />
          <StatCard label="Офферов" value={counts.offer} color="green" />
          <StatCard label="Отказов" value={counts.rejected} color="red" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Поиск по компании или должности…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | '')} className="sm:w-44">
            <option value="">Все статусы</option>
            {(Object.entries(STATUS_META) as [Status, typeof STATUS_META[Status]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={openNew} className="btn-primary whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Добавить
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-stone-400 text-sm">Загрузка…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-stone-500 text-sm">
                {jobs.length === 0 ? 'Нет откликов. Добавьте первый!' : 'Ничего не найдено по фильтрам'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    {['#', 'Компания', 'Должность', 'Дата', 'Статус', 'ЗП вилка', 'Источник', 'Контакт', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-stone-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job, i) => {
                    const s = STATUS_META[job.status]
                    return (
                      <tr key={job.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-stone-900">{job.company}</td>
                        <td className="px-4 py-3">
                          <div className="text-stone-700">{job.role}</div>
                          {job.url && (
                            <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                              открыть ↗
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{fmtDate(job.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">{fmtSalary(job.salary_from, job.salary_to)}</td>
                        <td className="px-4 py-3">
                          {job.source && (
                            <span className="inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-500">
                              {job.source}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-xs">{job.contact || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEdit(job)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition"
                              title="Редактировать"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition"
                              title="Удалить"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <JobModal
          job={editingJob}
          userId={user?.id ?? ''}
          onSave={onSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
