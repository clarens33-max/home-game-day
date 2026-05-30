import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOnTheDayPortal, onTheDayUpdateDayRoleSlot } from '../../api/games'
import { Users, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function DayRoleSlot({ role, slot, slotIndex, token }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(slot?.personName ?? '')

  const mutation = useMutation({
    mutationFn: (personName) => onTheDayUpdateDayRoleSlot(token, role.id, slotIndex, personName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['on-the-day', token] })
      setEditing(false)
      toast.success('Saved!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const currentName = slot?.personName

  const handleClear = () => mutation.mutate(null)

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {currentName ? (
          <>
            <span className="text-sm font-medium text-[#E91E8C]">{currentName}</span>
            <button
              onClick={() => { setName(currentName); setEditing(true) }}
              className="text-xs text-[#999] hover:text-[#1C1C1C]"
            >
              Change
            </button>
            <button onClick={handleClear} className="text-xs text-[#999] hover:text-[#1C1C1C]">
              Clear
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-[#999] italic">Open</span>
            <button
              onClick={() => { setName(''); setEditing(true) }}
              className="text-xs text-[#E91E8C] hover:underline font-medium"
            >
              Volunteer
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate(name.trim() || null) }} className="flex gap-2">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name"
        className="flex-1 border border-[#EAEAE4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
      />
      <button type="submit" className="px-2 py-1 bg-[#E91E8C] text-white text-xs rounded hover:opacity-90">Save</button>
      <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 border border-[#EAEAE4] text-xs rounded text-[#999]">Cancel</button>
    </form>
  )
}

export default function OnTheDayPortalPage() {
  const { token } = useParams()

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['on-the-day', token],
    queryFn: () => getOnTheDayPortal(token),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !game) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <p className="text-[#999] text-sm">Link not found — check with your organiser.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="bg-[#1C1C1C] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-sm font-medium text-white/50 mb-1 uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
            On-the-Day Volunteers
          </p>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {game.title}
          </h1>
          <p className="text-sm text-white/70">{formatDate(game.eventDate)}</p>
          {game.venueName && <p className="text-sm text-white/50 mt-0.5">{game.venueName}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Roles */}
        {game.gameDayRoles?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#EAEAE4]">
              <Users size={16} className="text-[#E91E8C] shrink-0" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  On-the-Day Roles
                </h2>
                <p className="text-xs text-[#999]">Sign up for a role on the day</p>
              </div>
            </div>
            <div className="space-y-3">
              {game.gameDayRoles.map(role => {
                const roleName = role.name ?? role.template?.name ?? 'Role'
                const headcount = role.headcount ?? role.template?.headcount ?? 'x1'
                let slotCount = 1
                if (headcount !== 'ALL' && headcount !== 'ANYONE') {
                  const n = parseInt(headcount.replace('x', ''))
                  if (!isNaN(n)) slotCount = n
                }

                return (
                  <div key={role.id} className="bg-white border border-[#EAEAE4] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#1C1C1C]">{roleName}</h3>
                      <span className="text-xs text-[#999] bg-[#F7F7F5] px-2 py-0.5 rounded-full">{headcount}</span>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: slotCount }, (_, i) => {
                        const slotIndex = i + 1
                        const slot = role.slots?.find(s => s.slotIndex === slotIndex)
                        return (
                          <DayRoleSlot
                            key={slotIndex}
                            role={role}
                            slot={slot}
                            slotIndex={slotIndex}
                            token={token}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Match schedule */}
        {game.matches?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#EAEAE4]">
              <Calendar size={16} className="text-[#E91E8C] shrink-0" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  Match Schedule
                </h2>
                <p className="text-xs text-[#999]">{game.matches.length} bout{game.matches.length !== 1 ? 's' : ''} on the day</p>
              </div>
            </div>
            <div className="space-y-2">
              {game.matches.map((match, index) => (
                <div key={match.id} className="bg-white border border-[#EAEAE4] rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1C1C]">
                        Bout {index + 1}: {match.homeTeam} vs {match.awayTeam}
                      </p>
                      {match.notes && (
                        <p className="text-xs text-[#999] mt-0.5">{match.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {match.scheduledTime && (
                        <p className="text-sm font-medium text-[#E91E8C]">{formatTime(match.scheduledTime)}</p>
                      )}
                      {match.boutType && (
                        <p className="text-xs text-[#999]">{match.boutType}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!game.gameDayRoles?.length && !game.matches?.length && (
          <p className="text-sm text-center text-[#999] py-12">Nothing posted yet — check back closer to the day.</p>
        )}

        <p className="text-xs text-center text-[#999] pb-4">
          Changes are saved immediately and visible to all volunteers.
        </p>
      </div>
    </div>
  )
}
