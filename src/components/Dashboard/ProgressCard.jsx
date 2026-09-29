import { Link } from 'react-router'
import ProgressBar from '../Progress/ProgressBar.jsx'

function ProgressCard({ title, percent, detail, icon: Icon, to }) {
  const content = (
    <>
      <div className="mb-4 flex items-center gap-3">
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {detail && <p className="text-xs text-slate-500">{detail}</p>}
        </div>
        <span className="ml-auto text-2xl font-bold text-slate-900 tabular-nums">{percent}%</span>
      </div>
      <ProgressBar value={percent} showValue={false} />
    </>
  )

  const classes = 'block rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
  return to ? (
    <Link to={to} className={`${classes} transition-colors hover:border-indigo-300`}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}

export default ProgressCard
