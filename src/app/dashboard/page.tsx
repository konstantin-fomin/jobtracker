'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Job, JobInsert, Status, STATUS_META, STATUS_ORDER } from '@/lib/types'
import StatCard from '@/components/StatCard'
import JobRow from '@/components/JobRow'
import ThemeToggle from '@/components/ThemeToggle'
import ToastContainer from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import {
  IconBriefcase, IconSearch, IconPlus, IconInbox, IconLogout,
  IconUsers, IconTrendUp, IconCheck, IconX,
} from '@/components/icons'
import type { User } from '@supabase/supabase-js'

type EditId = string | 'new' | null

// Tiny inline icons for stat chips
function IconCheckMini() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5"/></svg>
}
function IconXMini() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6 6 18M6 6l12 12"/></svg>
}

export default function Dashboard() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [editId, setEditId] = useState<EditId>(null)
  const { toasts, show: showToast, dismiss: dismissToast } = useToast()

  // Tracks pending deletes: id → timer so undo can cancel the Supabase call
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    // P0 fix: always resolve loading, even when there's no session
    if (!user) { setLoading(false); return }
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
    total:     jobs.length,
    interview: jobs.filter(j => j.status === 'interview').length,
    offer:     jobs.filter(j => j.status === 'offer').length,
    rejected:  jobs.filter(j => j.status === 'rejected').length,
  }

  // Conversion rate: offers / total (excluding ghosted from "relevant")
  const convRate = counts.total > 0
    ? Math.round((counts.offer / counts.total) * 100)
    : null
  const interviewRate = counts.total > 0
    ? Math.round((counts.interview / counts.total) * 100)
    : null

  const createJob = async (data: JobInsert) => {
    const userId = user?.id ?? '00000000-0000-0000-0000-000000000000'
    const { data: inserted, error } = await supabase
      .from('jobs')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) {
      showToast('Не удалось сохранить отклик', 'error')
      return
    }
    if (inserted) setJobs(prev => [inserted as Job, ...prev])
    setEditId(null)
    showToast('Отклик добавлен', 'success')
  }

  const updateJob = async (id: string, data: JobInsert) => {
    const { error } = await supabase.from('jobs').update(data).eq('id', id)
    if (error) {
      showToast('Не удалось сохранить изменения', 'error')
      return
    }
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...data } : j)))
    setEditId(null)
  }

  // Optimistic delete with undo toast (Notion/Linear pattern)
  const deleteJob = (id: string) => {
    const removed = jobs.find(j => j.id === id)
    if (!removed) return

    // Optimistically remove from UI immediately
    setJobs(prev => prev.filter(j => j.id !== id))

    // Schedule the actual Supabase delete after toast duration
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(id)
      await supabase.from('jobs').delete().eq('id', id)
    }, 4200)

    pendingDeletes.current.set(id, timer)

    showToast('Отклик удалён', 'info', {
      label: 'Отменить',
      onClick: () => {
        // Cancel the pending delete
        const t = pendingDeletes.current.get(id)
        if (t) { clearTimeout(t); pendingDeletes.current.delete(id) }
        // Restore the row
        setJobs(prev =>
          [...prev, removed].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        )
      },
    })
  }

  const startAdd = () => { setSearch(''); setFilterStatus(''); setEditId('new') }

  const COLS = ['#', 'Компания', 'Должность', 'Дата', 'Статус', 'ЗП', 'Источник', 'Контакт', '']

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
              <IconBriefcase size={17} />
            </span>
            <span className="font-extrabold text-ink tracking-tight">JobTracker</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="h-5 w-px bg-hairline-strong hidden sm:block" aria-hidden />
            <span className="text-sm text-ink-muted hidden sm:block max-w-[180px] truncate">
              {user?.user_metadata?.full_name ?? user?.email}
            </span>
            {user?.user_metadata?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" alt="" />
            )}
            <button onClick={signOut} className="icon-btn" title="Выйти" aria-label="Выйти">
              <IconLogout size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-9">

        {/* ── Title ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Мои отклики</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {counts.total > 0
              ? `${counts.total} ${plural(counts.total, 'отклик', 'отклика', 'откликов')} · ${convRate}% конверсия в оффер`
              : 'Добавь первый отклик и начни отслеживать прогресс'}
          </p>
        </div>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
          <StatCard
            label="Всего откликов"
            value={counts.total}
            tone="default"
            icon={<IconBriefcase size={14} />}
          />
          <StatCard
            label="Интервью"
            value={counts.interview}
            tone="amber"
            icon={<IconUsers size={14} />}
            hint={interviewRate !== null && counts.interview > 0 ? `${interviewRate}% от откликов` : undefined}
          />
          <StatCard
            label="Офферов"
            value={counts.offer}
            tone="emerald"
            icon={<IconCheckMini />}
            hint={convRate !== null && counts.offer > 0 ? `${convRate}% конверсия` : undefined}
            featured
          />
          <StatCard
            label="Отказов"
            value={counts.rejected}
            tone="rose"
            icon={<IconXMini />}
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">
              <IconSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Поиск по компании или должности…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full !pl-9"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | '')}
            className="sm:w-48"
            aria-label="Фильтр по статусу"
          >
            <option value="">Все статусы</option>
            {STATUS_ORDER.map(k => (
              <option key={k} value={k}>{STATUS_META[k].label}</option>
            ))}
          </select>
          <button onClick={startAdd} className="btn-primary whitespace-nowrap">
            <IconPlus size={16} />
            Добавить
          </button>
        </div>

        {/* ── Table ── */}
        <div className="card overflow-hidden">
          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 && editId !== 'new' ? (
            <EmptyState hasJobs={jobs.length > 0} onAdd={startAdd} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-2">
                    {COLS.map((h, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-3 py-2.5 text-left text-xs font-semibold text-ink-muted whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editId === 'new' && (
                    <JobRow
                      editing
                      onStartEdit={() => {}}
                      onCancel={() => setEditId(null)}
                      onSubmit={createJob}
                    />
                  )}
                  {filtered.map((job, i) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      index={i + 1}
                      editing={editId === job.id}
                      onStartEdit={() => setEditId(job.id)}
                      onCancel={() => setEditId(null)}
                      onSubmit={(data) => updateJob(job.id, data)}
                      onDelete={() => deleteJob(job.id)}
                    />
                  ))}
                </tbody>
              </table>

              {/* Ghost row — Notion-style inline affordance */}
              {editId !== 'new' && (
                <button
                  onClick={startAdd}
                  className="flex w-full items-center gap-2 border-t border-hairline px-3 py-3
                    text-sm font-medium text-ink-subtle hover:bg-surface-2 hover:text-accent
                    transition-colors cursor-pointer"
                >
                  <IconPlus size={15} />
                  Добавить отклик
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

// ── Skeleton loader (rows of shimmer instead of bare "Загрузка…") ────────────
function TableSkeleton() {
  return (
    <div className="p-4 space-y-3" aria-label="Загрузка…" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-surface-2 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ hasJobs, onAdd }: { hasJobs: boolean; onAdd: () => void }) {
  return (
    <div className="py-16 sm:py-20 text-center px-4">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-subtle mb-4">
        <IconInbox size={26} />
      </span>
      <p className="text-ink font-semibold">
        {hasJobs ? 'Ничего не найдено' : 'Пока нет откликов'}
      </p>
      <p className="text-sm text-ink-muted mt-1 mb-5">
        {hasJobs
          ? 'Попробуй изменить поиск или фильтр'
          : 'Добавь первый отклик — это займёт 10 секунд'}
      </p>
      {!hasJobs && (
        <button onClick={onAdd} className="btn-primary mx-auto">
          <IconPlus size={16} />
          Добавить первый отклик
        </button>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}
