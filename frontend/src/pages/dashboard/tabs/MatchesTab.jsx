import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addMatch, updateMatch, deleteMatch, generateRoundRobin } from '../../../api/games'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { Plus, Trash2, Zap, Edit2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function MatchCard({ match, game, onRefresh }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    scheduledTime: match.scheduledTime ? match.scheduledTime.slice(0, 16) : '',
    durationMinutes: match.durationMinutes ?? 30,
    periods: match.periods ?? 2,
    boutType: match.boutType ?? '',
  })
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  const updateMutation = useMutation({
    mutationFn: (data) => updateMatch(game.id, match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      setEditing(false)
      toast.success('Match updated')
      onRefresh()
    },
    onError: () => toast.error('Failed to update match'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMatch(game.id, match.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Match removed')
      onRefresh()
    },
    onError: () => toast.error('Failed to delete match'),
  })

  if (editing) {
    return (
      <div className="bg-white border border-[#E91E8C]/40 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[#999]">Home team</label>
            <input value={form.homeTeam} onChange={set('homeTeam')} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[#999]">Away team</label>
            <input value={form.awayTeam} onChange={set('awayTeam')} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[#999]">Start time</label>
            <input type="datetime-local" value={form.scheduledTime} onChange={set('scheduledTime')} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[#999]">Duration (min)</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={set('durationMinutes')} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[#999]">Periods</label>
            <select value={form.periods} onChange={set('periods')} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]">
              <option value={1}>1 period</option>
              <option value={2}>2 periods</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[#999]">Bout type (optional)</label>
          <input value={form.boutType} onChange={set('boutType')} placeholder="e.g. WFTDA, MRDA, Open" className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => updateMutation.mutate({ ...form, durationMinutes: Number(form.durationMinutes), periods: Number(form.periods) })} loading={updateMutation.isPending}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#EAEAE4] rounded-xl p-4 flex items-center gap-4 group hover:border-[#E91E8C]/30 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {match.homeTeam}
          </span>
          <span className="text-[#E91E8C] font-bold text-sm">VS</span>
          <span className="font-semibold text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {match.awayTeam}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#999]">
          {match.scheduledTime && (
            <span className="flex items-center gap-1"><Clock size={11} />{formatTime(match.scheduledTime)}</span>
          )}
          <span>{match.durationMinutes} min · {match.periods} period{match.periods > 1 ? 's' : ''}</span>
          {match.boutType && <span className="bg-[#F5F5F0] px-2 py-0.5 rounded-full">{match.boutType}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 text-[#999] hover:text-[#E91E8C] transition-colors rounded-lg hover:bg-[#F7F7F5]">
          <Edit2 size={14} />
        </button>
        <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="p-1.5 text-[#999] hover:text-red-500 transition-colors rounded-lg hover:bg-[#F7F7F5]">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function AddMatchModal({ open, onClose, game, onRefresh }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ homeTeam: '', awayTeam: '', scheduledTime: '', durationMinutes: 30, periods: 2, boutType: '' })
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  const mutation = useMutation({
    mutationFn: (data) => addMatch(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Match added')
      setForm({ homeTeam: '', awayTeam: '', scheduledTime: '', durationMinutes: 30, periods: 2, boutType: '' })
      onClose()
      onRefresh()
    },
    onError: () => toast.error('Failed to add match'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.homeTeam.trim() || !form.awayTeam.trim()) { toast.error('Both teams required'); return }
    mutation.mutate({ ...form, durationMinutes: Number(form.durationMinutes), periods: Number(form.periods) })
  }

  const inputClass = 'w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]'

  return (
    <Modal open={open} onClose={onClose} title="Add Match">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Home team *</label>
            <input value={form.homeTeam} onChange={set('homeTeam')} className={inputClass} placeholder="Team name" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Away team *</label>
            <input value={form.awayTeam} onChange={set('awayTeam')} className={inputClass} placeholder="Team name" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Start time</label>
          <input type="datetime-local" value={form.scheduledTime} onChange={set('scheduledTime')} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Duration (minutes)</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={set('durationMinutes')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Periods</label>
            <select value={form.periods} onChange={set('periods')} className={inputClass}>
              <option value={1}>1 period</option>
              <option value={2}>2 periods</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Bout type</label>
          <input value={form.boutType} onChange={set('boutType')} className={inputClass} placeholder="e.g. WFTDA, MRDA, Open, Rookie" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={mutation.isPending}>Add Match</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

function RoundRobinGenerator({ game, onRefresh }) {
  const queryClient = useQueryClient()
  const [teams, setTeams] = useState(['', '', '', ''])
  const [duration, setDuration] = useState(30)
  const [periods, setPeriods] = useState(1)
  const [boutType, setBoutType] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => generateRoundRobin(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Round robin schedule generated!')
      onRefresh()
    },
    onError: () => toast.error('Failed to generate schedule'),
  })

  const updateTeam = (i, val) => setTeams(ts => { const next = [...ts]; next[i] = val; return next })
  const addTeam = () => setTeams(ts => [...ts, ''])
  const removeTeam = (i) => setTeams(ts => ts.filter((_, j) => j !== i))
  const filledTeams = teams.filter(t => t.trim())

  const generate = () => {
    if (filledTeams.length < 2) { toast.error('Add at least 2 teams'); return }
    mutation.mutate({ teams: filledTeams, durationMinutes: Number(duration), periods: Number(periods), boutType })
  }

  const matchCount = (filledTeams.length * (filledTeams.length - 1)) / 2

  return (
    <div className="bg-white border border-[#EAEAE4] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-[#E91E8C]" />
        <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Round Robin Generator
        </h3>
      </div>
      <p className="text-xs text-[#999]">Enter team names to auto-generate all matchups. This will replace any existing matches.</p>

      <div className="space-y-2">
        {teams.map((team, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={team}
              onChange={(e) => updateTeam(i, e.target.value)}
              placeholder={`Team ${i + 1}`}
              className="flex-1 border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
            {teams.length > 2 && (
              <button onClick={() => removeTeam(i)} className="text-[#999] hover:text-red-500 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addTeam} className="flex items-center gap-1.5 text-sm text-[#999] hover:text-[#E91E8C] transition-colors py-1">
          <Plus size={14} /> Add team
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-[#999]">Duration (min)</label>
          <input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[#999]">Periods</label>
          <select value={periods} onChange={(e) => setPeriods(e.target.value)} className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]">
            <option value={1}>1 period</option>
            <option value={2}>2 periods</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[#999]">Bout type</label>
          <input value={boutType} onChange={(e) => setBoutType(e.target.value)} placeholder="WFTDA…" className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
        </div>
      </div>

      {filledTeams.length >= 2 && (
        <p className="text-xs text-[#999]">
          Will generate <strong>{matchCount} match{matchCount !== 1 ? 'es' : ''}</strong> for {filledTeams.length} teams.
        </p>
      )}

      <Button onClick={generate} loading={mutation.isPending} disabled={filledTeams.length < 2}>
        <Zap size={14} /> Generate Schedule
      </Button>
    </div>
  )
}

export default function MatchesTab({ game, onRefresh }) {
  const [addOpen, setAddOpen] = useState(false)
  const matches = game.matches ?? []
  const isTournament = game.eventType === 'TOURNAMENT'

  return (
    <div className="space-y-6">
      {isTournament && <RoundRobinGenerator game={game} onRefresh={onRefresh} />}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Matches {matches.length > 0 && `(${matches.length})`}
        </h3>
        <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add match
        </Button>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-10 text-[#999] text-sm bg-white border border-[#EAEAE4] rounded-xl">
          {isTournament ? 'Generate a round robin schedule above, or add matches manually.' : 'No matches yet. Add your first match.'}
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <div key={match.id} className="flex items-start gap-3">
              <span className="text-[#999] text-xs font-medium pt-4 w-6 shrink-0">#{i + 1}</span>
              <div className="flex-1">
                <MatchCard match={match} game={game} onRefresh={onRefresh} />
              </div>
            </div>
          ))}
        </div>
      )}

      <AddMatchModal open={addOpen} onClose={() => setAddOpen(false)} game={game} onRefresh={onRefresh} />
    </div>
  )
}
