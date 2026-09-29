import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from './Header.jsx'
import MobileMenu from './MobileMenu.jsx'
import Sidebar from './Sidebar.jsx'

// Scroll to the top on page change, or to the element named in the URL hash (#id).
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    // Wait a frame so the target element has rendered.
    const frame = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])
}

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useScrollOnNavigate()

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar />
      </aside>

      <MobileMenu open={menuOpen} onClose={closeMenu} />

      <div className="min-w-0 flex-1">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
