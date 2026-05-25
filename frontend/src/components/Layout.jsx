import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LogOut, ChevronLeft } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Show "Back to games" when on a game page (not dashboard root)
  const onGamePage = /^\/games\/[^/]/.test(location.pathname)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-header shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: logo + back link */}
          <div className="flex items-center gap-4">
            <Link to="/" className="select-none flex flex-col">
              <h1 className="font-display text-xl font-bold tracking-tight leading-none">
                <span className="text-header-foreground">HOME</span>
                <span className="text-primary">GAME</span>
              </h1>
              <span className="text-[10px] text-header-foreground/50 tracking-widest uppercase">
                Roller Derby Event Ops
              </span>
            </Link>
            {onGamePage && (
              <Link
                to="/"
                className="flex items-center gap-1 text-muted-foreground hover:text-header-foreground transition-colors text-sm"
              >
                <ChevronLeft size={16} />
                <span>All games</span>
              </Link>
            )}
          </div>

          {/* Right: user + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm hidden sm:block">{user.name ?? user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-header-foreground transition-colors text-sm px-2 py-1 rounded hover:bg-header-foreground/10"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
