import { Link, NavLink } from 'react-router-dom'
import { Moon, Sun, Zap } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'

const AppLayout = ({ children }) => {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const isDark = theme === 'dark'

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur dark:border-ink-800/60 dark:bg-ink-950/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-glow">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900 dark:text-white">CareFlow Exchange</p>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">
                MediMatch Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            {user?.role === 'doctor' && (
              <nav className="hidden items-center gap-4 text-sm font-medium text-ink-600 dark:text-ink-200 md:flex">
                <NavLink to="/intake" className={({ isActive }) => (isActive ? 'text-brand-600' : '')}>
                  Intake
                </NavLink>
                <NavLink to="/matching" className={({ isActive }) => (isActive ? 'text-brand-600' : '')}>
                  Matching
                </NavLink>
                <NavLink to="/flowglad" className={({ isActive }) => (isActive ? 'text-brand-600' : '')}>
                  FlowGlad
                </NavLink>
              </nav>
            )}

            {user?.role === 'patient' && (
              <nav className="hidden items-center gap-4 text-sm font-medium text-ink-600 dark:text-ink-200 md:flex">
                <NavLink to="/patient" className={({ isActive }) => (isActive ? 'text-brand-600' : '')}>
                  Patient Portal
                </NavLink>
              </nav>
            )}

            {user?.role === 'doctor' && (
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/intake">New Patient Intake</Link>
              </Button>
            )}

            <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-2 py-1 shadow-sm dark:border-ink-800 dark:bg-ink-900/70">
              <Sun className={`h-4 w-4 ${!isDark ? 'text-amber-500' : 'text-ink-400'}`} />
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="relative h-6 w-12 rounded-full bg-ink-200/80 transition dark:bg-ink-700/80"
                aria-label="Toggle theme"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-ink-900 ${
                    isDark ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <Moon className={`h-4 w-4 ${isDark ? 'text-brand-300' : 'text-ink-400'}`} />
            </div>

            {user && (
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

export default AppLayout
