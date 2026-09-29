import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

// A collapsible panel. `header` is always visible; `children` show when open.
// `actions` render next to the header without toggling the panel.
function Accordion({ id, header, actions, defaultOpen = false, highlighted = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `${id}-panel`

  return (
    <div
      id={id}
      className={`rounded-xl border bg-white shadow-sm transition-colors ${highlighted ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}
    >
      <div className="flex items-start gap-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
        >
          <ChevronDown
            className={`mt-0.5 size-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">{header}</div>
        </button>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {open && (
        <div id={panelId} className="border-t border-slate-100 px-4 pt-4 pb-5 sm:pl-12">
          {children}
        </div>
      )}
    </div>
  )
}

export default Accordion
