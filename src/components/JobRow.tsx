'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Job, Status, STATUS_META, STATUS_ORDER, ColumnKey,
  STAGE_LABEL,
  WORK_FORMAT_LABEL, WORK_FORMAT_BADGE,
  REJECT_REASON_LABEL,
} from '@/lib/types'
import StatusBadge from './StatusBadge'
import { IconCheck, IconEdit, IconTrash, IconExternal, IconChevronRight } from './icons'

// ── small display helpers ─────────────────────────────────────────────────────

function Stars({ value }: { value: number | null | undefined }) {
  const v = Math.min(5, Math.max(0, value ?? 0))
  return (
    <span>
      <span className="text-amber-400">{'★'.repeat(v)}</span>
      <span className="text-ink-subtle opacity-30">{'★'.repeat(5 - v)}</span>
    </span>
  )
}

function WorkFormatBadge({ value }: { value: string }) {
  return (
    <span className={`badge ${WORK_FORMAT_BADGE[value] ?? 'bg-surface-2 text-ink-muted'}`}>
      {WORK_FORMAT_LABEL[value] ?? value}
    </span>
  )
}

// Clickable status badge with a lightweight quick-change menu. The menu is
// rendered through a portal with fixed positioning so it escapes the table's
// clipped cells (`.table-clip` overflow:hidden) and the card's overflow:hidden.
function StatusPicker({ status, onSelect }: { status: Status; onSelect: (s: Status) => void }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onReflow = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [open])

  const toggle = () => {
    if (open) { setOpen(false); return }
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) setCoords({ top: r.bottom + 4, left: r.left })
    setOpen(true)
  }

  const choose = (s: Status) => {
    setOpen(false)
    if (s !== status) onSelect(s)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={e => { e.stopPropagation(); toggle() }}
        className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        title="Изменить статус"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Изменить статус"
      >
        <StatusBadge status={status} />
      </button>
      {open && coords && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 50 }}
          className="min-w-[164px] rounded-lg border border-hairline bg-surface p-1 shadow-lg"
        >
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              type="button"
              role="menuitemradio"
              aria-checked={s === status}
              onClick={e => { e.stopPropagation(); choose(s) }}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <StatusBadge status={s} />
              {s === status && <IconCheck size={14} className="shrink-0 text-accent" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

// ── form helpers ──────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y?.slice(-2)}`
}

const fmtFullDate = (d: string | null | undefined) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

const fmtDateTime = (d: string | null | undefined) => {
  if (!d) return '—'
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return '—'
  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

const todayKey = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const isDueDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= todayKey()

const titleOrUndefined = (value: string | null | undefined) =>
  value?.trim() ? value : undefined

const fmtSalary = (from: string, to: string) => {
  if (!from && !to) return '—'
  const compact = (value: string) => {
    const normalized = value.replace(/\s/g, '')
    if (!/^\d+$/.test(normalized)) return value
    const amount = Number(normalized)
    if (amount >= 1000) return `${Math.round(amount / 1000)}к`
    return value
  }
  if (from && to) return `${compact(from)}–${compact(to)}`
  return compact(from || to)
}

const fmtSalaryFull = (from: string, to: string) => {
  if (!from && !to) return '—'
  if (from && to) return `${from} – ${to}`
  return from || to
}

const shortSource = (source: string) => {
  if (source === 'HeadHunter') return 'HH'
  if (source === 'Habr Career') return 'Habr'
  return source
}

const shortUrl = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url.slice(0, 24) }
}

function DetailItem({
  label,
  children,
  wide = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`min-w-0 space-y-1 ${wide ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
      <div className="text-[11px] font-medium text-ink-subtle">{label}</div>
      <div className="min-w-0 text-sm leading-5 text-ink">{children}</div>
    </div>
  )
}

function DetailSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="space-y-1.5">
      <div className="text-[11px] font-medium text-ink-subtle">
        {label}
      </div>
      {children}
    </section>
  )
}

// ── props ─────────────────────────────────────────────────────────────────────

interface Props {
  job: Job
  expanded?: boolean
  deleted?: boolean
  activeColumns: ColumnKey[]
  onStartEdit: () => void
  onChangeStatus?: (status: Status) => void
  onDelete?: () => void
  onRestore?: () => void
  onPermanentDelete?: () => void
  onToggleExpand?: () => void
}

// ── component ─────────────────────────────────────────────────────────────────

export default function JobRow({
  job, expanded, deleted = false, activeColumns,
  onStartEdit, onChangeStatus, onDelete, onRestore, onPermanentDelete, onToggleExpand,
}: Props) {
  const ac = new Set(activeColumns)
  const has = (k: ColumnKey) => ac.has(k)
  const totalCols = activeColumns.length + 4 // 3 fixed + active toggleable + 1 actions

  // ── VIEW MODE ────────────────────────────────────────────────────────────────
  const nextAction = job.next_action?.trim() ?? ''
  const nextActionDate = job.next_action_date?.trim() ?? ''
  const hasNextAction = Boolean(nextAction || nextActionDate)
  const nextActionDue = isDueDate(nextActionDate)
  const salaryFull = fmtSalaryFull(job.salary_from, job.salary_to)
  const salaryTitle = salaryFull === '—' ? undefined : salaryFull
  const dateTitle = job.date ? fmtFullDate(job.date) : undefined
  const nextActionTitle = [nextAction, nextActionDate ? fmtFullDate(nextActionDate) : '']
    .filter(Boolean)
    .join(' · ') || undefined
  const nextActionDateTitle = job.next_action_date ? fmtFullDate(job.next_action_date) : undefined
  const stageTitle = job.stage ? STAGE_LABEL[job.stage] ?? job.stage : undefined
  const workFormatTitle = job.work_format ? WORK_FORMAT_LABEL[job.work_format] ?? job.work_format : undefined
  const ratingTitle = job.rating ? `${job.rating} из 5` : undefined
  const rejectReasonTitle = job.status === 'rejected' && job.reject_reason
    ? REJECT_REASON_LABEL[job.reject_reason] ?? job.reject_reason
    : undefined
  const rejectReasonDetail = job.reject_reason
    ? REJECT_REASON_LABEL[job.reject_reason] ?? job.reject_reason
    : ''
  const updatedAtTitle = job.updated_at ? fmtDateTime(job.updated_at) : undefined
  const deletedAtTitle = job.deleted_at ? fmtDateTime(job.deleted_at) : undefined
  const hasContactLinks = Boolean(job.referred_by || job.url)

  return (
    <>
      <tr
        className={`group cursor-pointer transition-colors hover:bg-surface-2 ${deleted ? 'bg-surface-2/50' : ''}`}
        onClick={onToggleExpand}
      >
        {/* company — fixed */}
        <td className="px-4 py-3.5 font-medium text-ink" title={job.company}>
          <span className={deleted ? 'text-ink-muted' : undefined}>{job.company}</span>
          {deleted && (
            <span className="ml-2 inline-flex rounded-full border border-hairline bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Удалено
            </span>
          )}
        </td>
        {/* role — fixed; link icon when url column is OFF */}
        <td className="px-4 py-3.5" title={job.role}>
          <span className="text-ink-muted">{job.role}</span>
          {!has('url') && job.url && (
            <a href={job.url} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="ml-1.5 inline-flex items-center align-middle text-accent hover:opacity-80"
              title="Открыть вакансию">
              <IconExternal size={13} />
            </a>
          )}
        </td>
        {has('date') && (
          <td className="px-3 py-3.5 whitespace-nowrap tabular-nums text-ink-muted" title={dateTitle}>
            {fmtDate(job.date)}
          </td>
        )}
        {/* status — fixed; click to quick-change (active rows only) */}
        <td className="px-2 py-3.5" title={STATUS_META[job.status].label}>
          {deleted || !onChangeStatus
            ? <StatusBadge status={job.status} />
            : <StatusPicker status={job.status} onSelect={onChangeStatus} />}
        </td>
        {has('salary') && (
          <td
            className="px-3 py-3.5 whitespace-nowrap text-ink-muted"
            title={salaryTitle}
          >
            {fmtSalary(job.salary_from, job.salary_to)}
          </td>
        )}
        {has('source') && (
          <td className="px-3 py-3.5 text-ink-muted" title={titleOrUndefined(job.source)}>
            {job.source ? shortSource(job.source) : '—'}
          </td>
        )}
        {has('url') && (
          <td className="px-4 py-3.5" title={titleOrUndefined(job.url)}>
            {job.url ? (
              <a href={job.url} target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-accent hover:opacity-80" title={job.url}>
                <IconExternal size={13} />
                <span className="max-w-[120px] truncate text-xs">{shortUrl(job.url)}</span>
              </a>
            ) : <span className="text-ink-subtle">—</span>}
          </td>
        )}
        {has('contact') && (
          <td className="px-4 py-3.5 text-ink-muted" title={titleOrUndefined(job.contact)}>{job.contact || '—'}</td>
        )}
        {has('notes') && (
          <td className="px-4 py-3.5 max-w-[160px]" title={titleOrUndefined(job.notes)}>
            <span className="block truncate text-ink-muted">{job.notes || '—'}</span>
          </td>
        )}
        {has('stage') && (
          <td className="px-4 py-3.5 text-ink-muted" title={stageTitle}>{STAGE_LABEL[job.stage ?? ''] || '—'}</td>
        )}
        {has('work_format') && (
          <td className="px-4 py-3.5" title={workFormatTitle}>
            {job.work_format
              ? <WorkFormatBadge value={job.work_format} />
              : <span className="text-ink-subtle">—</span>}
          </td>
        )}
        {has('city') && (
          <td className="px-4 py-3.5 text-ink-muted" title={titleOrUndefined(job.city)}>{job.city || '—'}</td>
        )}
        {has('next_action') && (
          <td className="px-3 py-2.5 max-w-[190px]" title={nextActionTitle}>
            {hasNextAction ? (
              <div
                className={`min-w-0 rounded-md px-2 py-1 whitespace-normal ${
                  nextActionDue ? 'bg-amber-50/70 dark:bg-amber-300/10' : ''
                }`}
              >
                {nextAction && (
                  <span className={`block truncate ${nextActionDue ? 'text-ink' : 'text-ink-muted'}`}>
                    {nextAction}
                  </span>
                )}
                {nextActionDate && (
                  <span className={`block text-xs tabular-nums ${
                    nextActionDue ? 'text-amber-700 dark:text-amber-200' : 'text-ink-subtle'
                  }`}>
                    {fmtDate(nextActionDate)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-ink-subtle">—</span>
            )}
          </td>
        )}
        {has('next_action_date') && (
          <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-ink-muted" title={nextActionDateTitle}>{fmtDate(job.next_action_date)}</td>
        )}
        {has('rating') && (
          <td className="px-4 py-3.5" title={ratingTitle}>
            {job.rating ? <Stars value={job.rating} /> : <span className="text-ink-subtle">—</span>}
          </td>
        )}
        {has('reject_reason') && (
          <td className="px-4 py-3.5 text-ink-muted" title={rejectReasonTitle}>
            {job.status === 'rejected'
              ? REJECT_REASON_LABEL[job.reject_reason ?? ''] || <span className="text-ink-subtle">—</span>
              : <span className="text-ink-subtle">—</span>}
          </td>
        )}
        {has('updated_at') && (
          <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-ink-muted" title={updatedAtTitle}>
            {job.updated_at ? fmtDateTime(job.updated_at) : <span className="text-ink-subtle">—</span>}
          </td>
        )}
        {/* actions — only the expand chevron here; edit/delete and
            restore/permanent-delete live in the expanded panel so a
            destructive action is never one misclick away from expanding */}
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-end">
            <button
              onClick={e => { e.stopPropagation(); onToggleExpand?.() }}
              className="text-ink-muted transition-colors hover:text-ink"
              title={expanded ? 'Свернуть' : 'Подробнее'}
              aria-label={expanded ? 'Свернуть' : 'Подробнее'}
              aria-expanded={expanded}
            >
              <IconChevronRight
                size={14}
                className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
          </div>
        </td>
      </tr>

      {/* Expand panel - full details for clipped table values */}
      {expanded && (
        <tr className="bg-surface">
          <td
            colSpan={totalCols}
            className="border-t border-hairline px-4 py-3"
            style={{ overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{job.company}</span>
                    <StatusBadge status={job.status} />
                    {deleted && (
                      <span className="inline-flex rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-subtle">
                        Удалено
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-ink-muted">{job.role}</div>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 text-xs font-semibold text-accent transition-colors hover:bg-surface-2"
                    >
                      <IconExternal size={13} />
                      Открыть ссылку
                    </a>
                  )}
                  {deleted ? (
                    <>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onRestore?.() }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent-soft px-2.5 text-xs font-semibold text-accent transition-colors hover:bg-surface-2"
                      >
                        <IconCheck size={13} />
                        Восстановить
                      </button>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onPermanentDelete?.() }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-surface px-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <IconTrash size={13} />
                        Удалить навсегда
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onStartEdit() }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        <IconEdit size={13} />
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onDelete?.() }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 text-xs font-semibold text-ink-subtle transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                      >
                        <IconTrash size={13} />
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {job.date && <DetailItem label="Дата отклика">{fmtFullDate(job.date)}</DetailItem>}
                {job.source && <DetailItem label="Источник">{job.source}</DetailItem>}
                {salaryFull !== '—' && <DetailItem label="Зарплата">{salaryFull}</DetailItem>}
                {job.stage && <DetailItem label="Этап">{STAGE_LABEL[job.stage] ?? job.stage}</DetailItem>}
                {job.work_format && (
                  <DetailItem label="Формат">
                    <WorkFormatBadge value={job.work_format} />
                  </DetailItem>
                )}
                {job.city && <DetailItem label="Город">{job.city}</DetailItem>}
                {job.rating && <DetailItem label="Оценка"><Stars value={job.rating} /></DetailItem>}
                {job.contact && <DetailItem label="Контакт">{job.contact}</DetailItem>}
              </div>

              {rejectReasonDetail && (
                <DetailSection label="Причина отказа">
                  <div className="text-sm leading-5 text-ink">{rejectReasonDetail}</div>
                </DetailSection>
              )}

              {hasNextAction && (
                <DetailSection label="Следующий шаг">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-5">
                    {nextAction && <span className="text-ink">{nextAction}</span>}
                    {nextAction && nextActionDate && <span className="text-ink-subtle">·</span>}
                    {nextActionDate && (
                      <span className={`text-xs tabular-nums ${nextActionDue ? 'text-amber-700 dark:text-amber-200' : 'text-ink-subtle'}`}>
                        {fmtFullDate(nextActionDate)}
                      </span>
                    )}
                  </div>
                </DetailSection>
              )}

              {hasContactLinks && (
                <DetailSection label="Контакты и ссылки">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {job.referred_by && <DetailItem label="Кто рекомендовал">{job.referred_by}</DetailItem>}
                    {job.url && (
                      <div className="min-w-0 space-y-1">
                        <div className="text-[11px] font-medium text-ink-subtle">Ссылка</div>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="break-all text-sm leading-5 text-accent transition-opacity hover:opacity-80"
                        >
                          {job.url}
                        </a>
                      </div>
                    )}
                  </div>
                </DetailSection>
              )}

              {job.notes && (
                <DetailSection label="Заметки">
                  <div className="whitespace-pre-wrap text-sm leading-5 text-ink">{job.notes}</div>
                </DetailSection>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-hairline pt-2 text-[11px] text-ink-subtle">
                <span><span className="font-medium">Создано:</span> {fmtDateTime(job.created_at)}</span>
                {job.updated_at && <span><span className="font-medium">Изменено:</span> {fmtDateTime(job.updated_at)}</span>}
                {deletedAtTitle && <span><span className="font-medium">Удалено:</span> {deletedAtTitle}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
