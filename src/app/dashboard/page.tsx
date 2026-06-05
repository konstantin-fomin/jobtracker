'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Job, JobInsert, RawJob, Status, STATUS_META, STATUS_ORDER, ColumnKey, normalizeJob } from '@/lib/types'
import { MOCK_JOBS } from '@/lib/mockJobs'
import { useColumns, TOGGLEABLE_COLUMNS, isDetailedColumnMode } from '@/lib/useColumns'
import StatCard from '@/components/StatCard'
import JobRow from '@/components/JobRow'
import JobAddForm from '@/components/JobAddForm'
import ColumnPanel from '@/components/ColumnPanel'
import ThemeToggle from '@/components/ThemeToggle'
import ToastContainer from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import {
  IconBriefcase, IconSearch, IconPlus, IconInbox, IconLogout, IconUsers, IconSliders,
  IconClock, IconCheck, IconX,
} from '@/components/icons'
import type { User } from '@supabase/supabase-js'

type QuickFilter = 'all' | 'active' | 'waiting' | 'interview' | 'offer' | 'archive' | 'deleted'
type QuickFilterChip = QuickFilter | 'needs_action'
type LoadError = 'auth' | 'jobs' | null
type SortKey = 'company' | 'role' | 'status' | ColumnKey
type SortDirection = 'asc' | 'desc'
type HeaderSort = { key: SortKey; direction: SortDirection } | null

const DEMO_JOBS_ENABLED =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_DEMO_JOBS === 'true'
const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111'

const createLocalJobId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const toJobInsert = (job: Job): JobInsert => ({
  company: job.company,
  role: job.role,
  status: job.status,
  source: job.source ?? '',
  date: job.date ?? '',
  salary_from: job.salary_from ?? '',
  salary_to: job.salary_to ?? '',
  contact: job.contact ?? '',
  url: job.url ?? '',
  notes: job.notes ?? '',
  stage: job.stage ?? null,
  next_action: job.next_action ?? null,
  next_action_date: job.next_action_date ?? null,
  work_format: job.work_format ?? null,
  city: job.city ?? null,
  rating: job.rating ?? null,
  referred_by: job.referred_by ?? null,
  reject_reason: job.reject_reason ?? null,
})

const STATUS_SORT_ORDER: Record<Status, number> = {
  sent: 0,
  interview: 1,
  offer: 2,
  rejected: 3,
  ghosted: 4,
}

const SORTABLE_KEYS = new Set<SortKey>([
  'company',
  'role',
  'date',
  'status',
  'salary',
  'source',
  'url',
  'contact',
  'notes',
  'stage',
  'work_format',
  'city',
  'next_action',
  'next_action_date',
  'rating',
  'reject_reason',
  'updated_at',
])

const FIXED_SORT_KEYS = new Set<SortKey>(['company', 'role', 'status'])

const emptyLast = (aEmpty: boolean, bEmpty: boolean) => {
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1
  return null
}

const compareText = (a: string | null | undefined, b: string | null | undefined, direction: SortDirection) => {
  const av = a?.trim() ?? ''
  const bv = b?.trim() ?? ''
  const empty = emptyLast(!av, !bv)
  if (empty !== null) return empty
  const result = av.localeCompare(bv, 'ru', { numeric: true, sensitivity: 'base' })
  return direction === 'asc' ? result : -result
}

const compareDate = (a: string | null | undefined, b: string | null | undefined, direction: SortDirection) => {
  const av = a?.trim() ?? ''
  const bv = b?.trim() ?? ''
  const empty = emptyLast(!av, !bv)
  if (empty !== null) return empty
  const result = av.localeCompare(bv)
  return direction === 'asc' ? result : -result
}

const parseNumber = (value: string | number | null | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = value?.replace(/\s/g, '').replace(',', '.').trim() ?? ''
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const compareNumber = (a: string | number | null | undefined, b: string | number | null | undefined, direction: SortDirection) => {
  const av = parseNumber(a)
  const bv = parseNumber(b)
  const empty = emptyLast(av === null, bv === null)
  if (empty !== null) return empty
  const result = av! - bv!
  return direction === 'asc' ? result : -result
}

const compareByHeaderSort = (a: Job, b: Job, sort: Exclude<HeaderSort, null>) => {
  const direction = sort.direction
  switch (sort.key) {
    case 'company':
      return compareText(a.company, b.company, direction)
    case 'role':
      return compareText(a.role, b.role, direction)
    case 'date':
      return compareDate(a.date, b.date, direction)
    case 'status': {
      const result = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
      return direction === 'asc' ? result : -result
    }
    case 'salary': {
      const byFrom = compareNumber(a.salary_from, b.salary_from, direction)
      return byFrom || compareNumber(a.salary_to, b.salary_to, direction)
    }
    case 'source':
      return compareText(a.source, b.source, direction)
    case 'next_action': {
      const byDate = compareDate(a.next_action_date, b.next_action_date, direction)
      return byDate || compareText(a.next_action, b.next_action, direction)
    }
    case 'next_action_date':
      return compareDate(a.next_action_date, b.next_action_date, direction)
    case 'rating':
      return compareNumber(a.rating, b.rating, direction)
    case 'updated_at':
      return compareDate(a.updated_at, b.updated_at, direction)
    case 'url':
      return compareText(a.url, b.url, direction)
    case 'contact':
      return compareText(a.contact, b.contact, direction)
    case 'notes':
      return compareText(a.notes, b.notes, direction)
    case 'stage':
      return compareText(a.stage, b.stage, direction)
    case 'work_format':
      return compareText(a.work_format, b.work_format, direction)
    case 'city':
      return compareText(a.city, b.city, direction)
    case 'reject_reason':
      return compareText(a.reject_reason, b.reject_reason, direction)
    default:
      return 0
  }
}

export default function Dashboard() {
  const supabase = DEMO_JOBS_ENABLED ? null : createClient()
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [needsActionOnly, setNeedsActionOnly] = useState(false)
  const [sortMode, setSortMode] = useState<'default' | 'urgent'>('default')
  const [headerSort, setHeaderSort] = useState<HeaderSort>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [editId, setEditId] = useState<string | 'new' | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const { active: activeColumns, toggle: toggleColumn, reset: resetColumns, setPreset: setColumnPreset } = useColumns()
  const { toasts, show: showToast, dismiss: dismissToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    if (DEMO_JOBS_ENABLED) {
      setUser(null)
      setJobs(MOCK_JOBS.map(job => ({ ...job })))
      setEditId(null)
      setLoading(false)
      return
    }

    if (!supabase) {
      setUser(null)
      setJobs([])
      setEditId(null)
      setLoadError('jobs')
      setLoading(false)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      setUser(null)
      setJobs([])
      setEditId(null)
      setLoadError('auth')
      setLoading(false)
      return
    }

    const currentUser = authData.user
    setUser(currentUser)
    // P0 fix: always resolve loading, even when there's no session
    if (!currentUser) {
      setJobs([])
      setEditId(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setJobs([])
      setEditId(null)
      setLoadError('jobs')
      setLoading(false)
      return
    }

    setJobs((data ?? []).map(normalizeJob))
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (DEMO_JOBS_ENABLED) {
      console.info('JobTracker demo mode: using local mock jobs. Supabase auth and jobs queries are skipped.')
    }
  }, [])

  const signOut = async () => {
    if (!supabase) {
      window.location.href = '/auth'
      return
    }
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const hasActionValue = (value?: string | null) => Boolean(value?.trim())
  const inactiveStatuses: Status[] = ['offer', 'rejected', 'ghosted']
  const isFinalStatus = (status: Status) => inactiveStatuses.includes(status)
  const matchesQuickFilter = (job: Job) => {
    if (quickFilter === 'active') return !isFinalStatus(job.status)
    if (quickFilter === 'waiting') return job.status === 'sent'
    if (quickFilter === 'interview') return job.status === 'interview'
    if (quickFilter === 'offer') return job.status === 'offer'
    if (quickFilter === 'archive') return job.status === 'rejected' || job.status === 'ghosted'
    return true
  }
  const needsAction = (job: Job) =>
    !isFinalStatus(job.status) &&
    (hasActionValue(job.next_action) || hasActionValue(job.next_action_date))

  const todayKey = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const isDateKey = (date?: string | null) => Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date))
  const urgentRank = (job: Job) => {
    if (isFinalStatus(job.status)) return { group: 5, date: '' }
    const date = job.next_action_date?.trim() ?? ''
    if (isDateKey(date)) {
      return date <= todayKey()
        ? { group: 1, date }
        : { group: 2, date }
    }
    if (hasActionValue(job.next_action)) return { group: 3, date: '' }
    return { group: 4, date: '' }
  }

  const activeJobs = jobs.filter(job => !job.deleted_at)
  const deletedJobs = jobs.filter(job => job.deleted_at)
  const deletedView = quickFilter === 'deleted'
  const baseJobs = deletedView ? deletedJobs : activeJobs

  const filtered = baseJobs.filter(j => {
    const q = search.toLowerCase()
    const matchQ = !q || j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)
    const matchS = !filterStatus || j.status === filterStatus
    const matchQuick = matchesQuickFilter(j)
    const matchAction = deletedView || !needsActionOnly || needsAction(j)
    return matchQ && matchS && matchQuick && matchAction
  })

  const visibleJobs = sortMode === 'urgent'
    ? [...filtered].sort((a, b) => {
      const ar = urgentRank(a)
      const br = urgentRank(b)
      if (ar.group !== br.group) return ar.group - br.group
      if (ar.date && br.date && ar.date !== br.date) return ar.date.localeCompare(br.date)
      return 0
    })
    : headerSort
      ? [...filtered].sort((a, b) => compareByHeaderSort(a, b, headerSort))
    : filtered

  const counts = {
    total:     activeJobs.length,
    interview: activeJobs.filter(j => j.status === 'interview').length,
    offer:     activeJobs.filter(j => j.status === 'offer').length,
    rejected:  activeJobs.filter(j => j.status === 'rejected').length,
    needsAction: activeJobs.filter(needsAction).length,
  }

  const convRate = counts.total > 0 ? Math.round((counts.offer / counts.total) * 100) : null
  const quickFilters: { key: QuickFilterChip; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'needs_action', label: 'Нужно действие' },
    { key: 'active', label: 'Активные' },
    { key: 'waiting', label: 'Жду ответ' },
    { key: 'interview', label: 'Интервью' },
    { key: 'offer', label: 'Оффер' },
    { key: 'archive', label: 'Архив' },
    { key: 'deleted', label: 'Удалённые' },
  ]
  const handleQuickFilterChange = (filter: QuickFilterChip) => {
    setFilterStatus('')
    const activeChip: QuickFilterChip = needsActionOnly ? 'needs_action' : quickFilter
    if (filter === 'all' || filter === activeChip) {
      setQuickFilter('all')
      setNeedsActionOnly(false)
      return
    }
    if (filter === 'needs_action') {
      setQuickFilter('all')
      setNeedsActionOnly(true)
      return
    }
    if (filter === 'deleted') {
      setQuickFilter('deleted')
      setNeedsActionOnly(false)
      return
    }
    setQuickFilter(filter)
    setNeedsActionOnly(false)
  }
  const handleStatusFilterChange = (status: Status | '') => {
    setFilterStatus(status)
    if (quickFilter === 'deleted') {
      setNeedsActionOnly(false)
      return
    }
    setQuickFilter('all')
    setNeedsActionOnly(false)
  }
  const handleSortModeChange = (mode: 'default' | 'urgent') => {
    setSortMode(mode)
    if (mode === 'urgent') setHeaderSort(null)
  }
  const handleHeaderSort = (key: SortKey) => {
    setSortMode('default')
    setHeaderSort(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }
  const resetFilters = () => {
    setSearch('')
    setFilterStatus('')
    setQuickFilter('all')
    setNeedsActionOnly(false)
  }
  // Reset search/status inside the Deleted view without leaving it.
  const resetDeletedFilters = () => {
    setSearch('')
    setFilterStatus('')
    setNeedsActionOnly(false)
  }
  const showNeedsAction = () => {
    setSearch('')
    setFilterStatus('')
    setQuickFilter('all')
    setNeedsActionOnly(true)
  }
  const filterByStatStatus = (status: Status) => {
    setSearch('')
    setFilterStatus(status)
    setQuickFilter('all')
    setNeedsActionOnly(false)
  }
  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(filterStatus) ||
    quickFilter !== 'all' ||
    needsActionOnly
  const hasDeletedViewFilters = deletedView && (Boolean(search.trim()) || Boolean(filterStatus))
  const hasCleanStatusFilter = !search.trim() && quickFilter === 'all' && !needsActionOnly
  const authRequired = !DEMO_JOBS_ENABLED && !loading && !loadError && !user
  const canAddJob = DEMO_JOBS_ENABLED || (Boolean(user) && !loadError)
  const editingJob = editId && editId !== 'new'
    ? jobs.find(job => job.id === editId) ?? null
    : null
  const editingDraft = useMemo(
    () => (editingJob ? toJobInsert(editingJob) : undefined),
    [editingJob]
  )

  // ── Add / edit ──
  const startAdd = () => {
    if (!canAddJob) return
    setSearch('')
    setFilterStatus('')
    setQuickFilter('all')
    setNeedsActionOnly(false)
    setEditId('new')
  }

  const createJob = async (data: JobInsert) => {
    if (DEMO_JOBS_ENABLED) {
      const now = new Date().toISOString()
      const inserted: Job = {
        ...data,
        id: createLocalJobId(),
        user_id: DEMO_USER_ID,
        created_at: now,
        updated_at: now,
      }
      setJobs(prev => [inserted, ...prev])
      setEditId(null)
      showToast('Отклик добавлен', 'success')
      return
    }

    if (!supabase) return

    const userId = user?.id ?? '00000000-0000-0000-0000-000000000000'
    const { data: inserted, error } = await supabase
      .from('jobs')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) { showToast('Не удалось сохранить отклик', 'error'); return }
    if (inserted) setJobs(prev => [normalizeJob(inserted as RawJob), ...prev])
    setEditId(null)
    showToast('Отклик добавлен', 'success')
  }

  const updateJob = async (id: string, data: JobInsert) => {
    if (DEMO_JOBS_ENABLED) {
      setJobs(prev => prev.map(j => (
        j.id === id ? { ...j, ...data, updated_at: new Date().toISOString() } : j
      )))
      setEditId(null)
      return
    }

    if (!supabase) return

    const { error } = await supabase.from('jobs').update(data).eq('id', id)
    if (error) { showToast('Не удалось сохранить изменения', 'error'); return }
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...data } : j)))
    setEditId(null)
  }

  const startEdit = (id: string) => {
    setExpandedId(null)
    setEditId(id)
  }

  const toggleExpand = (id: string) => setExpandedId(cur => (cur === id ? null : id))

  // Optimistic soft delete with undo toast.
  const deleteJob = async (id: string) => {
    const deletedAt = new Date().toISOString()
    const previous = jobs.find(j => j.id === id)
    if (!previous) return

    setExpandedId(cur => (cur === id ? null : cur))
    setJobs(prev => prev.map(j => (
      j.id === id ? { ...j, deleted_at: deletedAt } : j
    )))

    if (!DEMO_JOBS_ENABLED && supabase) {
      const { error } = await supabase
        .from('jobs')
        .update({ deleted_at: deletedAt })
        .eq('id', id)

      if (error) {
        setJobs(prev => prev.map(j => (j.id === id ? previous : j)))
        showToast('Не удалось удалить отклик', 'error')
        return
      }
    }

    showToast('Отклик удалён', 'info', {
      label: 'Отменить',
      onClick: () => {
        setJobs(prev => prev.map(j => (
          j.id === id ? { ...j, deleted_at: null } : j
        )))

        if (!DEMO_JOBS_ENABLED && supabase) {
          void supabase
            .from('jobs')
            .update({ deleted_at: null })
            .eq('id', id)
            .then(({ error }) => {
              if (error) showToast('Не удалось восстановить отклик', 'error')
            })
        }
      },
    })
  }

  const restoreJob = async (id: string) => {
    const previous = jobs.find(j => j.id === id)
    if (!previous) return

    setJobs(prev => prev.map(j => (
      j.id === id ? { ...j, deleted_at: null } : j
    )))

    if (!DEMO_JOBS_ENABLED && supabase) {
      const { error } = await supabase
        .from('jobs')
        .update({ deleted_at: null })
        .eq('id', id)

      if (error) {
        setJobs(prev => prev.map(j => (j.id === id ? previous : j)))
        showToast('Не удалось восстановить отклик', 'error')
        return
      }
    }

    showToast('Отклик восстановлен', 'success')
  }

  const permanentlyDeleteJob = async (id: string) => {
    const previous = jobs.find(j => j.id === id)
    if (!previous?.deleted_at) return
    if (!window.confirm('Удалить отклик навсегда? Это действие нельзя отменить.')) return

    setExpandedId(cur => (cur === id ? null : cur))
    setJobs(prev => prev.filter(j => j.id !== id))

    if (!DEMO_JOBS_ENABLED && supabase) {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)

      if (error) {
        setJobs(prev => [previous, ...prev])
        showToast('Не удалось удалить отклик навсегда', 'error')
        return
      }
    }

    showToast('Отклик удалён навсегда', 'success')
  }

  // Build header array in fixed display order, filtering by activeColumns
  const COL_LABELS: Record<string, string> = {
    company: 'Компания', role: 'Должность', date: 'Дата', status: 'Статус',
    salary: 'ЗП', source: 'Источник', url: 'Ссылка', contact: 'Контакт', notes: 'Заметки',
    stage: 'Этап', work_format: 'Формат', city: 'Город',
    next_action: 'Следующий шаг', next_action_date: 'Дата шага',
    rating: 'Оценка', reject_reason: 'Причина отказа', updated_at: 'Изменено',
  }
  const FULL_COL_ORDER = [
    'company', 'role', 'date', 'status', 'salary', 'source',
    'url', 'contact', 'notes',
    'stage', 'work_format', 'city',
    'next_action', 'next_action_date',
    'rating', 'reject_reason', 'updated_at',
  ]
  const activeSet = new Set(activeColumns)
  const detailedColumnMode = isDetailedColumnMode(activeColumns)
  const HEADER_COLUMNS: Array<{ key: SortKey | 'actions'; label: string; sortable: boolean }> = [
    ...FULL_COL_ORDER
      .filter(k => FIXED_SORT_KEYS.has(k as SortKey) || activeSet.has(k as ColumnKey))
      .map(k => ({ key: k as SortKey, label: COL_LABELS[k], sortable: SORTABLE_KEYS.has(k as SortKey) })),
    { key: 'actions', label: '', sortable: false },
  ]

  useEffect(() => {
    if (!headerSort || FIXED_SORT_KEYS.has(headerSort.key)) return
    if (!activeColumns.includes(headerSort.key as ColumnKey)) setHeaderSort(null)
  }, [activeColumns, headerSort])

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
              <IconBriefcase size={17} />
            </span>
            <span className="font-extrabold text-ink tracking-tight">JobTracker</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user && (
              <>
                <div className="h-5 w-px bg-hairline-strong hidden sm:block" aria-hidden />
                <span className="text-sm text-ink-muted hidden sm:block max-w-[180px] truncate">
                  {user.user_metadata?.full_name ?? user.email}
                </span>
                {user.user_metadata?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                )}
                <button onClick={signOut} className="icon-btn" title="Выйти" aria-label="Выйти">
                  <IconLogout size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── PageHeader ── */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink tracking-tight">Мои отклики</h1>
            {DEMO_JOBS_ENABLED && (
              <span className="inline-flex h-6 items-center rounded-full border border-hairline bg-surface px-2 text-xs font-medium text-ink-muted">
                Локальные демо-данные
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted">
            {loading
              ? 'Загружаем твои отклики…'
              : counts.total > 0
                ? `${counts.total} ${plural(counts.total, 'отклик', 'отклика', 'откликов')} · ${convRate}% конверсия в оффер`
                : 'Добавь первый отклик и начни отслеживать прогресс'}
          </p>
        </div>

        {/* ── StatsRow ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Всего откликов"
            value={counts.total}
            icon={<IconBriefcase size={16} />}
            onClick={resetFilters}
            active={!hasActiveFilters}
            title="Показать все отклики"
          />
          <StatCard
            label="Интервью"
            value={counts.interview}
            icon={<IconUsers size={16} />}
            onClick={() => filterByStatStatus('interview')}
            active={filterStatus === 'interview' && hasCleanStatusFilter}
            title="Показать отклики со статусом Интервью"
          />
          <StatCard
            label="Нужно действие"
            value={counts.needsAction}
            icon={<IconClock size={16} />}
            onClick={showNeedsAction}
            active={needsActionOnly}
            title="Показать отклики, где нужен следующий шаг"
          />
          <StatCard
            label="Офферов"
            value={counts.offer}
            icon={<IconCheck size={16} />}
            onClick={() => filterByStatStatus('offer')}
            active={filterStatus === 'offer' && hasCleanStatusFilter}
            title="Показать отклики со статусом Оффер"
          />
          <StatCard
            label="Отказов"
            value={counts.rejected}
            icon={<IconX size={16} />}
            onClick={() => filterByStatStatus('rejected')}
            active={filterStatus === 'rejected' && hasCleanStatusFilter}
            title="Показать отклики со статусом Отказ"
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Поиск по компании или должности…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 !pl-9"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => handleStatusFilterChange(e.target.value as Status | '')}
            className="h-10 w-40"
            aria-label="Фильтр по статусу"
          >
            <option value="">Все статусы</option>
            {STATUS_ORDER.map(k => (
              <option key={k} value={k}>{STATUS_META[k].label}</option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={e => handleSortModeChange(e.target.value as 'default' | 'urgent')}
            className="h-10 w-40"
            aria-label="Сортировка"
          >
            <option value="default">Обычный порядок</option>
            <option value="urgent">Сначала срочные</option>
          </select>
          {/* Toggle on mouse down so the panel's click-outside handler cannot
              close-then-reopen the panel during the same pointer gesture. */}
          <button
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
              setPanelOpen(v => !v)
            }}
            onClick={e => {
              if (e.detail === 0) setPanelOpen(v => !v)
            }}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors
              ${panelOpen
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-hairline-strong bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink'}`}
            title="Настроить колонки"
            aria-label="Настроить колонки таблицы"
            aria-expanded={panelOpen}
          >
            <IconSliders size={16} />
          </button>
          <button
            onClick={startAdd}
            disabled={!canAddJob}
            className="btn-primary h-10 whitespace-nowrap"
            title={canAddJob ? undefined : 'Чтобы добавить отклик, нужно войти'}
          >
            <IconPlus size={16} />
            Добавить
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {quickFilters.map(filter => {
              const active = filter.key === 'needs_action'
                ? needsActionOnly
                : !needsActionOnly && quickFilter === filter.key
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => handleQuickFilterChange(filter.key)}
                  className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors
                    ${active
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-hairline bg-surface text-ink-muted hover:border-hairline-strong hover:bg-surface-2 hover:text-ink'}`}
                  aria-pressed={active}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
          {hasActiveFilters && (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-hairline bg-transparent px-3 text-xs font-semibold text-ink-muted transition-colors hover:border-hairline-strong hover:bg-surface-2 hover:text-ink"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        {baseJobs.length > 0 && (
          <div className="text-xs font-medium text-ink-muted">
            {deletedView
              ? hasDeletedViewFilters
                ? `Показано: ${visibleJobs.length} из ${deletedJobs.length} удалённых`
                : `Удалённых: ${deletedJobs.length}`
              : hasActiveFilters
                ? `Показано: ${visibleJobs.length} из ${activeJobs.length}`
                : `Всего: ${activeJobs.length}`}
          </div>
        )}

        {/* ── Column configurator panel ── */}
        {panelOpen && (
          <ColumnPanel
            active={activeColumns}
            onToggle={toggleColumn}
            onPreset={setColumnPreset}
            onReset={resetColumns}
            onClose={() => setPanelOpen(false)}
          />
        )}

        {editId === 'new' && canAddJob && (
          <JobAddForm
            key="new"
            mode="create"
            onSubmit={createJob}
            onCancel={() => setEditId(null)}
          />
        )}

        {editingJob && editingDraft && (
          <JobAddForm
            key={editingJob.id}
            mode="edit"
            initialValue={editingDraft}
            onSubmit={(data) => updateJob(editingJob.id, data)}
            onCancel={() => setEditId(null)}
          />
        )}

        {/* ── Table ── */}
        {!(activeJobs.length === 0 && !deletedView && editId === 'new' && canAddJob) && (
        <div className="card overflow-hidden">
          {loading ? (
            <TableSkeleton />
          ) : authRequired ? (
            <AuthRequiredState />
          ) : loadError ? (
            <LoadErrorState kind={loadError} onRetry={load} />
          ) : deletedView && deletedJobs.length === 0 ? (
            <DeletedEmptyState />
          ) : visibleJobs.length === 0 && editId !== 'new' ? (
            deletedView ? (
              <EmptyState
                hasJobs
                onAdd={startAdd}
                onReset={resetDeletedFilters}
                title="Среди удалённых ничего не найдено"
                description="Измени поиск или сбрось фильтры. Удалённые отклики останутся в Корзине."
              />
            ) : (
              <EmptyState hasJobs={baseJobs.length > 0} onAdd={startAdd} onReset={resetFilters} />
            )
          ) : (
            <div>
              <div className={detailedColumnMode ? 'overflow-x-auto overscroll-x-contain' : undefined}>
              <table
                className="text-sm table-clip"
                style={detailedColumnMode ? { minWidth: 1760 } : undefined}
              >
                {/* <colgroup> drives column widths with table-layout:fixed.
                    company + role have no explicit width → they share remaining space.
                    All other columns get fixed px widths from the spec. */}
                <colgroup>
                  <col />{/* company — flex */}
                  <col />{/* role    — flex */}
                  {activeSet.has('date')             && <col style={{ width: 84  }} />}
                  <col style={{ width: 112 }} />{/* status */}
                  {activeSet.has('salary')           && <col style={{ width: 116 }} />}
                  {activeSet.has('source')           && <col style={{ width: 96 }} />}
                  {activeSet.has('url')              && <col style={{ width: 80  }} />}
                  {activeSet.has('contact')          && <col style={{ width: 100 }} />}
                  {activeSet.has('notes')            && <col style={{ width: 120 }} />}
                  {activeSet.has('stage')            && <col style={{ width: 100 }} />}
                  {activeSet.has('work_format')      && <col style={{ width: 100 }} />}
                  {activeSet.has('city')             && <col style={{ width: 90  }} />}
                  {activeSet.has('next_action')      && <col style={{ width: 168 }} />}
                  {activeSet.has('next_action_date') && <col style={{ width: 90  }} />}
                  {activeSet.has('rating')           && <col style={{ width: 80  }} />}
                  {activeSet.has('reject_reason')    && <col style={{ width: 110 }} />}
                  {activeSet.has('updated_at')       && <col style={{ width: 100 }} />}
                  <col style={{ width: 56 }} />{/* actions */}
                </colgroup>
                <thead>
                  <tr className="border-b border-hairline">
                    {HEADER_COLUMNS.map(col => {
                      const activeSort = headerSort?.key === col.key ? headerSort : null
                      return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={
                          col.sortable
                            ? activeSort?.direction === 'asc'
                              ? 'ascending'
                              : activeSort?.direction === 'desc'
                                ? 'descending'
                                : 'none'
                            : undefined
                        }
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-subtle"
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            onClick={() => handleHeaderSort(col.key as SortKey)}
                            className={`group inline-flex max-w-full items-center gap-1 rounded-sm text-left uppercase tracking-wider transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                              activeSort ? 'text-ink' : ''
                            }`}
                          >
                            <span className="truncate">{col.label}</span>
                            {activeSort && (
                              <span className="shrink-0 text-[11px] leading-none" aria-hidden>
                                {activeSort.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    )})}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {visibleJobs.map(job => (
                    <JobRow
                      key={job.id}
                      job={job}
                      expanded={expandedId === job.id}
                      deleted={deletedView}
                      activeColumns={activeColumns}
                      onStartEdit={() => startEdit(job.id)}
                      onDelete={() => deleteJob(job.id)}
                      onRestore={() => restoreJob(job.id)}
                      onPermanentDelete={() => permanentlyDeleteJob(job.id)}
                      onToggleExpand={() => toggleExpand(job.id)}
                    />
                  ))}
                </tbody>
              </table>
              </div>

            </div>
          )}
        </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function AuthRequiredState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl border text-accent"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-ring)' }}
      >
        <IconBriefcase size={22} />
      </span>
      <p className="text-sm font-medium text-ink">Нужно войти</p>
      <p className="text-xs text-ink-subtle">
        Войди в аккаунт, чтобы видеть и сохранять отклики.
      </p>
      <a href="/auth" className="btn-primary h-9 mt-2">
        Войти
      </a>
    </div>
  )
}

function LoadErrorState({
  kind,
  onRetry,
}: {
  kind: Exclude<LoadError, null>
  onRetry: () => Promise<void>
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl border text-accent"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-ring)' }}
      >
        <IconInbox size={22} />
      </span>
      <p className="text-sm font-medium text-ink">
        {kind === 'auth' ? 'Не удалось проверить вход' : 'Не удалось загрузить отклики'}
      </p>
      <p className="text-xs text-ink-subtle">
        {kind === 'auth'
          ? 'Обнови страницу или попробуй войти заново.'
          : 'Проверь интернет-соединение и попробуй ещё раз.'}
      </p>
      <button
        type="button"
        onClick={() => { void onRetry() }}
        className="btn-ghost h-9 mt-2"
      >
        Повторить
      </button>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3" aria-label="Загрузка…" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-surface-2 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({
  hasJobs,
  onAdd,
  onReset,
  title,
  description,
}: {
  hasJobs: boolean
  onAdd: () => void
  onReset: () => void
  title?: string
  description?: string
}) {
  const resolvedTitle = title ?? (hasJobs ? 'Ничего не найдено' : 'Пока нет откликов')
  const resolvedDescription =
    description ?? (hasJobs ? 'Попробуй изменить поиск или сбросить фильтры.' : 'Добавь первый — это займёт 10 секунд')
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl border text-accent"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-ring)' }}
      >
        <IconInbox size={22} />
      </span>
      <p className="text-sm font-medium text-ink">
        {resolvedTitle}
      </p>
      <p className="text-xs text-ink-subtle">
        {resolvedDescription}
      </p>
      {hasJobs ? (
        <button onClick={onReset} className="btn-ghost h-9 mt-2">
          Сбросить фильтры
        </button>
      ) : (
        <button onClick={onAdd} className="btn-primary h-9 mt-2">
          <IconPlus size={15} />
          Добавить первый отклик
        </button>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function DeletedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl border text-accent"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-ring)' }}
      >
        <IconInbox size={22} />
      </span>
      <p className="text-sm font-medium text-ink">Удалённых откликов нет</p>
      <p className="text-xs text-ink-subtle">
        Здесь появятся отклики, которые ты удалишь.
      </p>
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}
