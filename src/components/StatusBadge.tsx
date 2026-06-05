import { Status, STATUS_META } from '@/lib/types'

/**
 * Colored status pill. Colors live in STATUS_META (single source of truth,
 * with light + dark variants) so badges stay theme-aware. Includes the dot
 * affordance for fast scanning.
 */
export default function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_META[status] ?? STATUS_META.sent
  return (
    <span className={`badge shrink-0 whitespace-nowrap ${s.badge}`} title={s.label}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.badgeLabel}
    </span>
  )
}
