const COLORS = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
}

const DIFFICULTY_COLORS = {
  Beginner: 'green',
  Easy: 'green',
  Intermediate: 'amber',
  Medium: 'amber',
  Advanced: 'red',
  Hard: 'red',
}

function Badge({ color = 'slate', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${COLORS[color]} ${className}`}
    >
      {children}
    </span>
  )
}

export function DifficultyBadge({ level }) {
  return <Badge color={DIFFICULTY_COLORS[level] ?? 'slate'}>{level}</Badge>
}

export default Badge
