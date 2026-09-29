// A row of small toggle buttons, e.g. for difficulty filters.
function FilterChips({ label, options, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-sm font-medium text-slate-500">{label}</span>}
      {options.map((option) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
              active
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export default FilterChips
