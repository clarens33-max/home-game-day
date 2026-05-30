import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicPortal } from '../../api/games'
import { parseBlocks } from '../../lib/blocks'
import { MapPin, ExternalLink, Trophy, Home } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function AutoTeamsSection({ game }) {
  const homeTeam = game.teams?.find(t => t.role === 'HOME')
  const visitingTeams = game.teams?.filter(t => t.role === 'VISITING') ?? []
  const allTeams = [homeTeam, ...visitingTeams].filter(Boolean)

  if (allTeams.length === 0) return null

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {allTeams.map(team => (
        <div key={team.name} className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#E91E8C]/20 border border-[#E91E8C]/40 flex items-center justify-center">
                {team.role === 'HOME' ? <Home size={16} className="text-[#E91E8C]" /> : <Trophy size={16} className="text-white/60" />}
              </div>
            )}
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{team.name}</p>
              <p className="text-xs text-[#999]">{team.role === 'HOME' ? 'Home' : 'Visiting'}</p>
            </div>
          </div>
          {team.jerseyColour && (
            <p className="text-xs text-[#999] mb-2">Jersey: {team.jerseyColour}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function AutoScheduleSection({ game }) {
  const blocks = game.timingBlocks ?? []
  const matches = game.matches ?? []

  // Merge blocks and matches into a unified timeline, sorted by time
  const items = [
    ...blocks.map(b => ({ sortKey: b.time, type: 'block', data: b })),
    ...matches.map(m => ({ sortKey: m.scheduledTime ? formatTime(m.scheduledTime) : '99:99', type: 'match', data: m })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  if (items.length === 0) return <p className="text-[#999] text-sm">Schedule to be confirmed.</p>

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        if (item.type === 'block') {
          const b = item.data
          return (
            <div key={b.id} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
              <span className="font-mono text-[#E91E8C] text-sm font-bold w-14 shrink-0">{b.time}</span>
              <span className="text-sm text-[#ccc]">{b.activity}</span>
            </div>
          )
        }
        const m = item.data
        return (
          <div key={m.id} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
            <span className="font-mono text-[#E91E8C] text-sm font-bold w-14 shrink-0">
              {m.scheduledTime ? formatTime(m.scheduledTime) : `Bout ${i + 1}`}
            </span>
            <span className="text-sm font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {m.homeTeam} <span className="text-[#E91E8C]">vs</span> {m.awayTeam}
            </span>
            <span className="text-xs text-[#666] ml-auto shrink-0">{m.durationMinutes}min</span>
          </div>
        )
      })}
    </div>
  )
}

function SectionBlocks({ content, imageUrl, title }) {
  const rawBlocks = parseBlocks(content)
  // Filter out empty text blocks for rendering
  const blocks = rawBlocks.filter(b => (b.type === 'text' && b.value) || (b.type === 'image' && b.url))

  // Legacy sections with no blocks but a top-level imageUrl
  if (blocks.length === 0 && !imageUrl) return null

  if (blocks.length === 0 && imageUrl) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full max-h-64 object-cover" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.type === 'image' && block.url) {
          return (
            <figure key={i} className="space-y-2">
              <img src={block.url} alt={block.caption ?? title} className="w-full max-h-80 object-cover rounded-xl border border-white/10" />
              {block.caption && (
                <figcaption className="text-xs text-[#666] italic px-1">{block.caption}</figcaption>
              )}
            </figure>
          )
        }
        if (block.type === 'text' && block.value) {
          return (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{block.value}</p>
            </div>
          )
        }
        return null
      })}
    </div>
  )
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

  const hasSections = game.publicSections?.length > 0

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #E91E8C 0, #E91E8C 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="text-[#E91E8C] text-xs uppercase tracking-[0.3em] font-semibold mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Roller Derby Event
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.03em' }}>
            {game.title}
          </h1>

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

      <div className="h-px bg-gradient-to-r from-transparent via-[#E91E8C] to-transparent" />

      {hasSections ? (
        /* ── Section-based layout (new games with info pack) ── */
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
          {game.publicSections.map(section => {
            if (!section.visible) return null

            return (
              <div key={section.id}>
                <h2 className="text-xs uppercase tracking-widest text-[#E91E8C] mb-4 font-semibold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {section.title}
                </h2>

                {section.sectionType === 'AUTO_TEAMS' ? (
                  <AutoTeamsSection game={game} />
                ) : section.sectionType === 'AUTO_SCHEDULE' ? (
                  <AutoScheduleSection game={game} />
                ) : (
                  <SectionBlocks content={section.content} imageUrl={section.imageUrl} title={section.title} />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Legacy layout (old games with no sections) ── */
        <>
          {/* Teams matchup */}
          {(game.teams?.length > 0) && (
            <div className="max-w-4xl mx-auto px-4 py-12">
              {game.matches && game.matches.length > 0 ? (
                <div>
                  <h2 className="text-center text-xs uppercase tracking-widest text-[#999] mb-8" style={{ fontFamily: 'Oswald, sans-serif' }}>Bouts</h2>
                  <div className="space-y-4">
                    {game.matches.map((match) => (
                      <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl px-6 py-5 flex flex-wrap items-center gap-4">
                        {match.scheduledTime && (
                          <div className="text-[#E91E8C] font-mono text-sm font-bold w-14 shrink-0">{formatTime(match.scheduledTime)}</div>
                        )}
                        <div className="flex-1 flex items-center justify-center gap-4">
                          <span className="text-lg font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>{match.homeTeam}</span>
                          <span className="text-[#E91E8C] font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>VS</span>
                          <span className="text-lg font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>{match.awayTeam}</span>
                        </div>
                        <div className="text-xs text-[#666] shrink-0">{match.durationMinutes}min · {match.periods}P{match.boutType && ` · ${match.boutType}`}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const homeTeam = game.teams?.find(t => t.role === 'HOME')
                  const visitingTeams = game.teams?.filter(t => t.role === 'VISITING') ?? []
                  return homeTeam && visitingTeams.length > 0 ? (
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
                        <div key={team.name} className="text-center">
                          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-3 mx-auto">
                            <Trophy size={28} className="text-white/60" />
                          </div>
                          <p className="font-bold text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{team.name}</p>
                          <p className="text-xs text-[#999]">Visiting</p>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()
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
                    <h2 className="text-xs uppercase tracking-widest text-[#E91E8C] mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>Venue</h2>
                    <p className="font-semibold text-lg mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{game.venueName}</p>
                    {game.venueAddress && <p className="text-[#999] text-sm">{game.venueAddress}</p>}
                    {game.venueMapUrl && (
                      <a href={game.venueMapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#E91E8C] hover:underline">
                        <MapPin size={14} /> View on map
                      </a>
                    )}
                  </div>
                )}
                {game.description && (
                  <div>
                    <h2 className="text-xs uppercase tracking-widest text-[#E91E8C] mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>About</h2>
                    <p className="text-[#ccc] text-sm leading-relaxed">{game.description}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div className="border-t border-white/10 py-8 text-center">
        <p className="text-[#666] text-xs">{game.title} · Organised with Home Game Day</p>
      </div>
    </div>
  )
}
