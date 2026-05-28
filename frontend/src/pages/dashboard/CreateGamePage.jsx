import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createGame, getLeagues } from '../../api/games'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const eventTypes = [
  {
    value: 'HOME_GAME',
    icon: '🏠',
    label: 'Home Game',
    description: '2 teams, full WFTDA bouts',
  },
  {
    value: 'TOURNAMENT',
    icon: '🏆',
    label: 'Tournament',
    description: 'Multiple teams, round-robin or bracket',
  },
]

export default function CreateGamePage() {
  const navigate = useNavigate()
  const [eventType, setEventType] = useState('HOME_GAME')
  const [leagueId, setLeagueId] = useState('')
  const [form, setForm] = useState({
    title: '',
    homeTeamName: '',
    eventDate: '',
    doorsOpen: '',
    venueName: '',
    venueAddress: '',
    ticketingUrl: '',
  })

  const { data: myLeagues = [] } = useQuery({
    queryKey: ['leagues'],
    queryFn: getLeagues,
    staleTime: 60_000,
  })
  const activeLeagues = myLeagues.filter(l => l.status === 'ACTIVE')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const mutation = useMutation({
    mutationFn: (data) => createGame(data),
    onSuccess: (game) => {
      toast.success('Game created!')
      navigate(`/games/${game.id}`)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create game')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.eventDate) {
      toast.error('Title and event date are required')
      return
    }
    mutation.mutate({ eventType, ...form, ...(leagueId && { leagueId }) })
  }

  const inputClass =
    'w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent bg-white'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1
          className="text-3xl font-semibold text-[#1C1C1C] mb-8"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          New Game
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Event type */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider text-[#999] mb-3"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Event Type
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {eventTypes.map((et) => {
                const selected = eventType === et.value
                return (
                  <button
                    key={et.value}
                    type="button"
                    onClick={() => setEventType(et.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all text-center ${
                      selected
                        ? 'border-[#E91E8C] bg-[#E91E8C]/5'
                        : 'border-[#EAEAE4] bg-white hover:border-[#E91E8C]/40'
                    }`}
                  >
                    <span className="text-4xl">{et.icon}</span>
                    <div>
                      <p
                        className={`text-base font-semibold ${selected ? 'text-[#E91E8C]' : 'text-[#1C1C1C]'}`}
                        style={{ fontFamily: 'Oswald, sans-serif' }}
                      >
                        {et.label}
                      </p>
                      <p className="text-xs text-[#999] mt-0.5">{et.description}</p>
                    </div>
                    {selected && (
                      <span className="w-2 h-2 rounded-full bg-[#E91E8C]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 1b: League association */}
          {activeLeagues.length > 0 && (
            <div>
              <h2
                className="text-sm font-semibold uppercase tracking-wider text-[#999] mb-3"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                League <span className="normal-case font-normal text-xs">(optional)</span>
              </h2>
              <div className="flex items-center gap-3 bg-white border border-[#EAEAE4] rounded-xl p-4">
                <Shield size={20} className="text-[#E91E8C] shrink-0" />
                <div className="flex-1">
                  <select
                    value={leagueId}
                    onChange={e => setLeagueId(e.target.value)}
                    className="w-full text-sm bg-transparent focus:outline-none text-[#1C1C1C]"
                  >
                    <option value="">No league — standalone game</option>
                    {activeLeagues.map(({ league }) => (
                      <option key={league.id} value={league.id}>{league.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {leagueId && (
                <p className="text-xs text-[#999] mt-1.5 ml-1">
                  Tasks and roles will be pre-filled from your league blueprint (if one exists).
                </p>
              )}
            </div>
          )}

          {/* Step 2: Game details */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider text-[#999] mb-4"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Event Details
            </h2>
            <div className="bg-white border border-[#EAEAE4] rounded-xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">
                    Game title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={set('title')}
                    className={inputClass}
                    placeholder="e.g. Spring Smackdown 2025"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">
                    {eventType === 'TOURNAMENT' ? 'Organising team name' : 'Home team name'}
                  </label>
                  <input
                    type="text"
                    value={form.homeTeamName}
                    onChange={set('homeTeamName')}
                    className={inputClass}
                    placeholder="e.g. River City Rollers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Event date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={set('eventDate')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Doors open <span className="text-[#999] font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    type="time"
                    value={form.doorsOpen}
                    onChange={set('doorsOpen')}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Venue name</label>
                  <input
                    type="text"
                    value={form.venueName}
                    onChange={set('venueName')}
                    className={inputClass}
                    placeholder="e.g. Civic Centre Sports Hall"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Venue address</label>
                  <input
                    type="text"
                    value={form.venueAddress}
                    onChange={set('venueAddress')}
                    className={inputClass}
                    placeholder="123 Main St, Cityville"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">
                    Ticketing URL <span className="text-[#999] font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={form.ticketingUrl}
                    onChange={set('ticketingUrl')}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              size="lg"
              loading={mutation.isPending}
            >
              Create Game
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
