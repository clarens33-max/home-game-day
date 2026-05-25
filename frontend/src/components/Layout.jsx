import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LogOut, ChevronLeft } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const onGamePage = /^\/games\/[^/]/.test(location.pathname)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm" style={{ backgroundColor: '#1C1C1C' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/" className="select-none">
                <div className="leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <span className="text-xl font-bold tracking-tight text-white">HOME</span>
                  <span className="text-xl font-bold tracking-tight" style={{ color: '#E91E8C' }}>GAME</span>
                  <span className="text-xl font-bold tracking-tight text-white"> DAY</span>
                </div>
                <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Roller Derby Event Ops
                </div>
              </Link>

              {onGamePage && (
                <Link
                  to="/"
                  className="flex items-center gap-1 text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <ChevronLeft size={16} />
                  <span>All games</span>
                </Link>
              )}
            </div>

            {/* User */}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm hidden sm:block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {user.name ?? user.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm px-2 py-1 rounded transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
