import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LogOut, ChevronLeft } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Show "Back to games" when on a game page (not dashboard root)
  const onGamePage = /^\/games\/[^/]/.test(location.pathname)

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1C1C1C] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: logo + back link */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-white text-xl tracking-widest select-none"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              HOME GAME <span style={{ color: '#E91E8C' }}>DAY</span>
            </Link>
            {onGamePage && (
              <Link
                to="/"
                className="flex items-center gap-1 text-[#999] hover:text-white transition-colors text-sm"
              >
                <ChevronLeft size={16} />
                <span>All games</span>
              </Link>
            )}
          </div>

          {/* Right: user + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-[#999] text-sm hidden sm:block">{user.name ?? user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-[#999] hover:text-white transition-colors text-sm px-2 py-1 rounded hover:bg-white/10"
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
