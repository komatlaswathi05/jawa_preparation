function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {Icon && <Icon className="mx-auto size-10 text-slate-300" aria-hidden="true" />}
      <h3 className="mt-3 font-semibold text-slate-800">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
