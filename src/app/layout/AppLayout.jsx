import { Link } from 'react-router-dom'
import { Laptop, Moon, Sun, Zap } from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu'
import { useTheme } from '../providers/ThemeProvider'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop }
]

const AppLayout = ({ children }) => {
  const { theme, setTheme } = useTheme()
  const activeOption = themeOptions.find((option) => option.value === theme) || themeOptions[2]
  const ActiveIcon = activeOption.icon

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
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/intake">New Patient Intake</Link>
            </Button>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

export default AppLayout
