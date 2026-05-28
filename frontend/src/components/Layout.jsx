import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LogOut, ChevronLeft, Shield } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const onGamePage = /^\/games\/[^/]/.test(location.pathname)

  return (
    <div className="min-h-screen bg-background">
      {/* Header — mirrors Jamfinder: header is the flex parent, no inner max-width, px-6 py-4 */}
      <header className="bg-header text-header-foreground sticky top-0 z-40 flex items-center justify-between gap-4 flex-wrap px-6 py-4">

        {/* Logo group — same structure as Jamfinder's <div> > .logo + .logo-sub */}
        <div>
          <Link to="/" className="select-none font-display text-[1.75rem] font-bold tracking-[0.04em] leading-none block">
            <span className="text-header-foreground">HOME</span>
            <span className="text-primary">GAME</span>
          </Link>
          <p className="font-sans text-[0.72rem] text-header-foreground/50 tracking-[0.06em] uppercase mt-[3px]">
            Roller Derby Event Ops
          </p>
        </div>

        {/* Right side — same structure as Jamfinder's .header-right */}
        <div className="flex items-center gap-[10px] flex-wrap">
          {onGamePage && (
            <Link
              to="/"
              className="flex items-center gap-1 text-[0.72rem] text-header-foreground/45 border border-header-foreground/15 rounded-[20px] px-3 py-1 hover:text-header-foreground/80 hover:border-header-foreground/35 transition-colors"
            >
              <ChevronLeft size={13} />
              <span>All games</span>
            </Link>
          )}
          {user && (
            <Link
              to="/leagues"
              className="flex items-center gap-1 text-[0.72rem] text-header-foreground/45 border border-header-foreground/15 rounded-[20px] px-3 py-1 hover:text-header-foreground/80 hover:border-header-foreground/35 transition-colors"
            >
              <Shield size={13} />
              <span>Leagues</span>
            </Link>
          )}
          {user && (
            <>
              <span className="text-[0.72rem] text-header-foreground/45 hidden sm:block">{user.name ?? user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-[0.72rem] text-header-foreground/45 border border-header-foreground/15 rounded-[20px] px-3 py-1 hover:text-header-foreground/80 hover:border-header-foreground/35 transition-colors"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          )}
        </div>

      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
