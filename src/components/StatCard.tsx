interface Props {
  label: string
  value: number
  color?: 'amber' | 'green' | 'red'
}

const colorMap = {
  amber: 'text-amber-600',
  green: 'text-green-600',
  red:   'text-red-500',
}

export default function StatCard({ label, value, color }: Props) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium text-stone-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color ? colorMap[color] : 'text-stone-900'}`}>{value}</p>
    </div>
  )
}
