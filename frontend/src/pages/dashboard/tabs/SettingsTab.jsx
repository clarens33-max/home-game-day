import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGame, addCoOwner, removeCoOwner, deleteGame } from '../../../api/games'
import Button from '../../../components/Button'
import { UserPlus, Copy, ExternalLink, Check, X, AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <label className="block text-xs font-medium text-[#999] mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-[#F7F7F5] border border-[#EAEAE4] rounded-lg px-3 py-2.5 font-mono text-[#1C1C1C] truncate">
          {value}
        </code>
        <button
          onClick={copy}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border border-[#EAEAE4] rounded-lg text-xs text-[#666] hover:border-[#E91E8C] hover:text-[#E91E8C] transition-colors bg-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 p-2.5 border border-[#EAEAE4] rounded-lg text-[#999] hover:text-[#E91E8C] hover:border-[#E91E8C] transition-colors bg-white"
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}

export default function SettingsTab({ game, onRefresh, currentUserId }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const base = window.location.origin

  const [form, setForm] = useState({
    title: game.title ?? '',
    homeTeamName: game.homeTeamName ?? '',
    eventDate: game.eventDate ? game.eventDate.slice(0, 10) : '',
    doorsOpen: game.doorsOpen ? game.doorsOpen.slice(0, 16) : '',
    venueName: game.venueName ?? '',
    venueAddress: game.venueAddress ?? '',
    venueMapUrl: game.venueMapUrl ?? '',
    ticketingUrl: game.ticketingUrl ?? '',
    description: game.description ?? '',
  })
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  const [inviteEmail, setInviteEmail] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data) => updateGame(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Settings saved')
      onRefresh()
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const inviteMutation = useMutation({
    mutationFn: (email) => addCoOwner(game.id, email),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success(`${data.user.name} added as co-owner`)
      setInviteEmail('')
      onRefresh()
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to add co-owner'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId) => removeCoOwner(game.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Co-owner removed')
      onRefresh()
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to remove co-owner'),
  })

  const handleSave = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      ...form,
      eventDate: form.eventDate || undefined,
      doorsOpen: form.doorsOpen || null,
    })
  }

  const handleInvite = (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    inviteMutation.mutate(inviteEmail.trim())
  }

  // Delete game
  const [confirmTitle, setConfirmTitle] = useState('')
  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(game.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['game', game.id] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success('Game deleted')
      navigate('/')
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to delete game'),
  })

  const handleDelete = (e) => {
    e.preventDefault()
    if (confirmTitle !== game.title) { toast.error('Game title does not match'); return }
    deleteMutation.mutate()
  }

  const inputClass = 'w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]'

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Shareable links */}
      <div className="bg-white border border-[#EAEAE4] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Shareable Links
        </h2>
        {/* Guest team links — one per visiting team, or generic if none added yet */}
        {(game.teams?.filter(t => t.role === 'VISITING') ?? []).length === 0 ? (
          <CopyField label="Guest Team Portal" value={`${base}/g/${game.guestToken}`} />
        ) : (
          game.teams.filter(t => t.role === 'VISITING').map(team => (
            <CopyField
              key={team.id}
              label={`Guest Portal — ${team.name}`}
              value={`${base}/g/${game.guestToken}?teamId=${team.id}`}
            />
          ))
        )}
        <CopyField label="Public Info Page" value={`${base}/p/${game.publicToken}`} />
        <CopyField label="Pre-Bout Volunteers" value={`${base}/v/${game.volunteerToken}`} />
        <CopyField label="On-the-Day Volunteers" value={`${base}/otd/${game.onTheDayToken}`} />
      </div>

      {/* Game details */}
      <div className="bg-white border border-[#EAEAE4] rounded-xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Game Details
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Game title *</label>
              <input value={form.title} onChange={set('title')} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Home team name *</label>
              <input value={form.homeTeamName} onChange={set('homeTeamName')} className={inputClass} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Event date *</label>
              <input type="date" value={form.eventDate} onChange={set('eventDate')} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Doors open</label>
              <input type="datetime-local" value={form.doorsOpen} onChange={set('doorsOpen')} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Venue name</label>
            <input value={form.venueName} onChange={set('venueName')} className={inputClass} placeholder="e.g. Milton Keynes Leisure Centre" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Venue address</label>
            <input value={form.venueAddress} onChange={set('venueAddress')} className={inputClass} placeholder="Full address" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Map link</label>
            <input value={form.venueMapUrl} onChange={set('venueMapUrl')} className={inputClass} placeholder="Google Maps or similar URL" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Ticketing URL</label>
            <input value={form.ticketingUrl} onChange={set('ticketingUrl')} className={inputClass} placeholder="External ticket link (Eventbrite, etc.)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className={inputClass}
              placeholder="Brief event description for the public page"
            />
          </div>
          <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
        </form>
      </div>

      {/* Co-owners */}
      <div className="bg-white border border-[#EAEAE4] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Co-Owners
        </h2>
        <div className="space-y-2">
          {game.owners?.map(({ user }) => {
            const isMe = user.id === currentUserId
            const isLast = game.owners.length === 1
            return (
              <div key={user.id} className="flex items-center gap-3 py-2 px-3 bg-[#F7F7F5] rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[#E91E8C] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1C1C]">{user.name}{isMe && <span className="ml-1.5 text-xs text-[#999]">(you)</span>}</p>
                  <p className="text-xs text-[#999]">{user.email}</p>
                </div>
                {!isMe && !isLast && (
                  <button
                    onClick={() => removeMutation.mutate(user.id)}
                    disabled={removeMutation.isPending}
                    className="shrink-0 p-1.5 text-[#999] hover:text-red-500 transition-colors rounded"
                    title="Remove co-owner"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
          <Button type="submit" size="md" loading={inviteMutation.isPending}>
            <UserPlus size={15} /> Invite
          </Button>
        </form>
        <p className="text-xs text-[#999]">The person must already have an account. They&apos;ll get immediate access.</p>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-red-200 rounded-xl overflow-hidden">
        <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Danger Zone — Delete Game</h2>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 space-y-1">
              <p className="font-semibold">This action cannot be undone.</p>
              <p>Deleting this game will permanently remove all tasks, rosters, matches, roles, signs, the info pack, and all associated data. This cannot be reversed.</p>
            </div>
          </div>

          <form onSubmit={handleDelete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Type <span className="font-mono bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-red-700">{game.title}</span> to confirm
              </label>
              <input
                value={confirmTitle}
                onChange={e => setConfirmTitle(e.target.value)}
                placeholder={game.title}
                className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={confirmTitle !== game.title || deleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Trash2 size={15} />
              {deleteMutation.isPending ? 'Deleting…' : 'Delete game permanently'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
