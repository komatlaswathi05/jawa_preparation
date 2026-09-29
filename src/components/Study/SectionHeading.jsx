function SectionHeading({ id, icon: Icon, title, count }) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
      {Icon && <Icon className="size-5 text-indigo-600" aria-hidden="true" />}
      {title}
      {count !== undefined && <span className="text-base font-normal text-slate-400">({count})</span>}
    </h2>
  )
}

export default SectionHeading
