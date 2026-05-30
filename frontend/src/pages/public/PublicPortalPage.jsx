import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicPortal } from '../../api/games'
import { MapPin, Clock, ExternalLink, Trophy, Home } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function PublicPortalPage() {
  const { token } = useParams()

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['public', token],
    queryFn: () => getPublicPortal(token),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !game) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center">
        <p className="text-[#999] text-sm">Event not found.</p>
      </div>
    )
  }

  const homeTeam = game.teams?.find(t => t.role === 'HOME')
  const visitingTeams = game.teams?.filter(t => t.role === 'VISITING') ?? []

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #E91E8C 0, #E91E8C 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="text-[#E91E8C] text-xs uppercase tracking-[0.3em] font-semibold mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Roller Derby Event
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.03em' }}>
            {game.title}
          </h1>

          {/* Date + venue */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#ccc] mb-8">
            {game.eventDate && (
              <span className="flex items-center gap-2">
                <span className="text-[#E91E8C]">📅</span>
                {formatDate(game.eventDate)}
                {game.doorsOpen && ` · Doors ${formatTime(game.doorsOpen)}`}
              </span>
            )}
            {game.venueName && (
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-[#E91E8C] shrink-0" />
                {game.venueName}
              </span>
            )}
          </div>

          {/* Ticket CTA */}
          {game.ticketingUrl && (
            <a
              href={game.ticketingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#E91E8C] hover:bg-[#c4167a] text-white font-bold px-8 py-4 rounded-xl text-base transition-colors uppercase tracking-wider"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Get Tickets <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#E91E8C] to-transparent" />

      {/* Teams matchup */}
      {(homeTeam || visitingTeams.length > 0) && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          {game.matches && game.matches.length > 0 ? (
            <div>
              <h2 className="text-center text-xs uppercase tracking-widest text-[#999] mb-8" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Bouts
              </h2>
              <div className="space-y-4">
                {game.matches.map((match, i) => (
                  <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl px-6 py-5 flex flex-wrap items-center gap-4">
                    {match.scheduledTime && (
                      <div className="text-[#E91E8C] font-mono text-sm font-bold w-14 shrink-0">
                        {formatTime(match.scheduledTime)}
                      </div>
                    )}
                    <div className="flex-1 flex items-center justify-center gap-4">
                      <span className="text-lg font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>{match.homeTeam}</span>
                      <span className="text-[#E91E8C] font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>VS</span>
                      <span className="text-lg font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>{match.awayTeam}</span>
                    </div>
                    <div className="text-xs text-[#666] shrink-0">
                      {match.durationMinutes}min · {match.periods}P
                      {match.boutType && ` · ${match.boutType}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            homeTeam && visitingTeams.length > 0 && (
              <div className="flex items-center justify-center gap-8 sm:gap-16">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[#E91E8C]/20 border-2 border-[#E91E8C] flex items-center justify-center mb-3 mx-auto">
                    <Home size={28} className="text-[#E91E8C]" />
                  </div>
                  <p className="font-bold text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{homeTeam.name}</p>
                  <p className="text-xs text-[#999]">Home</p>
                </div>
                <div className="text-4xl font-black text-[#E91E8C]" style={{ fontFamily: 'Oswald, sans-serif' }}>VS</div>
                {visitingTeams.map(team => (
                  <div key={team.id} className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-3 mx-auto">
                      <Trophy size={28} className="text-white/60" />
                    </div>
                    <p className="font-bold text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{team.name}</p>
                    <p className="text-xs text-[#999]">Visiting</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Venue + info */}
      {(game.venueName || game.venueAddress || game.venueMapUrl || game.description) && (
        <>
          <div className="h-px bg-white/10 mx-auto max-w-4xl" />
          <div className="max-w-4xl mx-auto px-4 py-12 grid sm:grid-cols-2 gap-8">
            {(game.venueName || game.venueAddress) && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-[#E91E8C] mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  Venue
                </h2>
                <p className="font-semibold text-lg mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{game.venueName}</p>
                {game.venueAddress && <p className="text-[#999] text-sm">{game.venueAddress}</p>}
                {game.venueMapUrl && (
                  <a
                    href={game.venueMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#E91E8C] hover:underline"
                  >
                    <MapPin size={14} /> View on map
                  </a>
                )}
              </div>
            )}
            {game.description && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-[#E91E8C] mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  About
                </h2>
                <p className="text-[#ccc] text-sm leading-relaxed">{game.description}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Info pack sections */}
      {game.publicSections?.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
          {game.publicSections.map(section => (
            <div key={section.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {section.imageUrl && (
                <img
                  src={section.imageUrl}
                  alt={section.title}
                  className="w-full max-h-64 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-xs uppercase tracking-widest text-[#E91E8C] mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 py-8 text-center">
        <p className="text-[#666] text-xs">{game.title} · Organised with Home Game Day</p>
      </div>
    </div>
  )
}
