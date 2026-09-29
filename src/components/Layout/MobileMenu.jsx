import { X } from 'lucide-react'
import { useEffect } from 'react'
import Sidebar from './Sidebar.jsx'

// Slide-in navigation drawer for phones and tablets.
function MobileMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative h-full w-72 max-w-[85vw] bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-3 z-10 cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  )
}

export default MobileMenu
