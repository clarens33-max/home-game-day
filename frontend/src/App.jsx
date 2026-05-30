import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Dashboard pages
import GamesListPage from './pages/dashboard/GamesListPage'
import CreateGamePage from './pages/dashboard/CreateGamePage'
import GameDashboardPage from './pages/dashboard/GameDashboardPage'

// League pages
import LeagueListPage from './pages/league/LeagueListPage'
import CreateLeaguePage from './pages/league/CreateLeaguePage'
import LeaguePage from './pages/league/LeaguePage'

// Portals (no auth)
import GuestPortalPage from './pages/guest/GuestPortalPage'
import PublicPortalPage from './pages/public/PublicPortalPage'
import VolunteerPortalPage from './pages/volunteer/VolunteerPortalPage'
import OnTheDayPortalPage from './pages/volunteer/OnTheDayPortalPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-[#999] font-[Oswald]">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Owner dashboard */}
      <Route path="/" element={<RequireAuth><GamesListPage /></RequireAuth>} />
      <Route path="/games/new" element={<RequireAuth><CreateGamePage /></RequireAuth>} />
      <Route path="/games/:id/*" element={<RequireAuth><GameDashboardPage /></RequireAuth>} />

      {/* Leagues */}
      <Route path="/leagues" element={<RequireAuth><LeagueListPage /></RequireAuth>} />
      <Route path="/leagues/new" element={<RequireAuth><CreateLeaguePage /></RequireAuth>} />
      <Route path="/leagues/:id" element={<RequireAuth><LeaguePage /></RequireAuth>} />

      {/* Portals — public, no auth required */}
      <Route path="/g/:token" element={<GuestPortalPage />} />
      <Route path="/p/:token" element={<PublicPortalPage />} />
      <Route path="/v/:token" element={<VolunteerPortalPage />} />
      <Route path="/otd/:token" element={<OnTheDayPortalPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
