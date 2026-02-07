import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Laptop, Moon, Sun, Zap, LogOut, User } from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../../contexts/AuthContext'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop }
]

const AppLayout = () => {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { user, userProfile, logout, isAuthenticated, isDoctor, isPatient } = useAuth()
  const activeOption = themeOptions.find((option) => option.value === theme) || themeOptions[2]
  const ActiveIcon = activeOption.icon

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur dark:border-ink-800/60 dark:bg-ink-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
          <div className="flex items-center gap-3">
            {isAuthenticated && isDoctor && (
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/patient/intake">New Patient Intake</Link>
              </Button>
            )}
            {isAuthenticated && isPatient && (
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/patient/matching">Find Appointments</Link>
              </Button>
            )}

            {isAuthenticated && userProfile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-ink-900/60 border border-ink-200 dark:border-ink-800">
                <User className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  {userProfile.fullName || user.email}
                </span>
              </div>
            )}

            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-2 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-white dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-200">
                    <ActiveIcon className="h-4 w-4" />
                    {activeOption.label}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onSelect={() => setTheme(option.value)}
                        className={theme === option.value ? 'bg-ink-100 dark:bg-ink-800' : ''}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </DropdownMenuItem>
                    )
                  })}
                  {isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleLogout} className="text-red-600 dark:text-red-400">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
