import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

// items: [{ label, to? }] — the last item is the current page.
function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-4 text-slate-300" aria-hidden="true" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-indigo-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
