import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getGames } from '../../api/games'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { Plus, MapPin, Users, Trophy, Home } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function GameCard({ game }) {
  const total = game._count?.gameTasks ?? 0
  const done = game._count?.doneTasksCount ?? game.doneTasksCount ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const isTournament = game.eventType === 'TOURNAMENT'

  return (
    <Link
      to={`/games/${game.id}`}
      className="block bg-white border border-[#EAEAE4] rounded-xl overflow-hidden hover:shadow-md hover:border-[#E91E8C]/30 transition-all group"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isTournament ? 'bg-amber-400' : 'bg-[#E91E8C]'}`} />

      <div className="p-5">
        {/* Event type badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isTournament
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[#E91E8C]/10 text-[#E91E8C]'
            }`}
          >
            {isTournament ? <Trophy size={11} /> : <Home size={11} />}
            {isTournament ? 'Tournament' : 'Home Game'}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-xl font-semibold text-[#1C1C1C] group-hover:text-[#E91E8C] transition-colors leading-tight mb-3"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          {game.title}
        </h2>

        {/* Meta */}
        <div className="space-y-1.5 mb-4">
          {game.eventDate && (
            <p className="text-sm text-[#999] flex items-center gap-1.5">
              <span>📅</span>
              {formatDate(game.eventDate)}
            </p>
          )}
          {game.venueName && (
            <p className="text-sm text-[#999] flex items-center gap-1.5">
              <MapPin size={13} />
              {game.venueName}
            </p>
          )}
          {game.homeTeamName && (
            <p className="text-sm text-[#999] flex items-center gap-1.5">
              <Users size={13} />
              {game.homeTeamName}
            </p>
          )}
        </div>

        {/* Task progress */}
        {total > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#999]">Tasks</span>
              <span className="text-xs font-medium text-[#1C1C1C]">
                {done} / {total}
              </span>
            </div>
            <div className="h-1.5 bg-[#EAEAE4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E91E8C] rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {total === 0 && (
          <p className="text-xs text-[#999]">No tasks yet</p>
        )}
      </div>
    </Link>
  )
}

export default function GamesListPage() {
  const { data: games, isLoading, isError } = useQuery({
    queryKey: ['games'],
    queryFn: getGames,
  })

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl font-semibold text-[#1C1C1C]"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            My Games
          </h1>
          <Link to="/games/new">
            <Button size="md">
              <Plus size={16} />
              New Game
            </Button>
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-[#EAEAE4] rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
            Failed to load games. Please refresh and try again.
          </div>
        )}

        {/* Game list */}
        {!isLoading && !isError && (
          <>
            {games && games.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🏟️"
                title="No games yet"
                subtitle="Create your first home game to get started."
                action={
                  <Link to="/games/new">
                    <Button>
                      <Plus size={16} />
                      Create a game
                    </Button>
                  </Link>
                }
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
