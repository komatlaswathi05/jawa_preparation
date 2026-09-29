const COLORS = {
  indigo: 'bg-indigo-600',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
}

const HEIGHTS = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
}

function ProgressBar({ value, label, size = 'md', color, showValue = true, className = '' }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  const barColor = COLORS[color ?? (percent === 100 ? 'green' : 'indigo')]

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showValue && <span className="ml-auto font-semibold text-slate-900 tabular-nums">{percent}%</span>}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 ${HEIGHTS[size]}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
