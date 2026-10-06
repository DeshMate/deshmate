import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Districts', to: '/districts' },
  { label: 'Travel Planner', to: '/travel-planner' },
  { label: 'Life Tools', to: '/tools' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function MainLayout({ theme, setTheme, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm">D</div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">DESHMATE</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Bangladesh guide</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Open navigation"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-base font-medium ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <div className="mb-3 text-lg font-extrabold text-slate-900 dark:text-white">DESHMATE</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">বাংলাদেশকে জানুন, জীবনের হিসাব করুন।</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">Explore</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li><Link to="/districts">Districts</Link></li>
              <li><Link to="/travel-planner">Travel Planner</Link></li>
              <li><Link to="/tools">Life Tools</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
