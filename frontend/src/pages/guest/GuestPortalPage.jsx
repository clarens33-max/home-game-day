import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGuestPortal, guestAddSkater, guestSignWaiver } from '../../api/games'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { Check, Pen, MapPin, Clock, Calendar, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import SignaturePad from 'signature_pad'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function WaiverModal({ open, onClose, skater, token, onRefresh }) {
  const canvasRef = useRef(null)
  const spRef = useRef(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !canvasRef.current) return
    spRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: '#1C1C1C',
    })
    // Resize canvas to display size
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvasRef.current.width = canvasRef.current.offsetWidth * ratio
    canvasRef.current.height = canvasRef.current.offsetHeight * ratio
    canvasRef.current.getContext('2d').scale(ratio, ratio)
    spRef.current.clear()
    return () => spRef.current?.off()
  }, [open])

  const handleSubmit = async () => {
    if (!spRef.current || spRef.current.isEmpty()) {
      toast.error('Please sign before submitting')
      return
    }
    setLoading(true)
    try {
      await guestSignWaiver(token, skater.id, spRef.current.toDataURL())
      toast.success('Waiver signed!')
      onRefresh()
      onClose()
    } catch {
      toast.error('Failed to submit waiver')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Waiver — ${skater?.derbyName ?? ''}`} size="md">
      <div className="space-y-4">
        <div className="bg-[#F7F7F5] border border-[#EAEAE4] rounded-lg p-4 text-sm text-[#666] leading-relaxed">
          <p className="font-medium text-[#1C1C1C] mb-2">Participant Waiver & Release</p>
          <p>
            By signing below, I confirm that I am physically fit to participate in this roller derby event.
            I understand the nature of the sport and its associated risks. I hereby release the host
            team, venue, and event organisers from liability for any injury, loss, or damage sustained
            during participation. I confirm that I have read and understood this waiver.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Sign below:</p>
          <div className="border-2 border-[#EAEAE4] rounded-xl overflow-hidden" style={{ height: 160 }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full block touch-none"
              style={{ cursor: 'crosshair' }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} loading={loading}>
            <Check size={14} /> Submit Signature
          </Button>
          <Button variant="ghost" onClick={() => spRef.current?.clear()}>
            Clear
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AddSkaterForm({ token, teamId, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ derbyName: '', skaterNumber: '', pronouns: '' })
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  const mutation = useMutation({
    mutationFn: (data) => guestAddSkater(token, teamId, data),
    onSuccess: () => {
      toast.success('Skater added!')
      setForm({ derbyName: '', skaterNumber: '', pronouns: '' })
      setOpen(false)
      onRefresh()
    },
    onError: () => toast.error('Failed to add skater'),
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-[#EAEAE4] hover:border-[#E91E8C] rounded-xl py-4 text-sm text-[#999] hover:text-[#E91E8C] transition-colors"
      >
        + Add your skater
      </button>
    )
  }

  return (
    <div className="border border-[#E91E8C]/30 rounded-xl p-4 bg-[#F7F7F5] space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3 sm:col-span-1">
          <label className="block text-xs font-medium text-[#999] mb-1">Derby name *</label>
          <input
            autoFocus
            value={form.derbyName}
            onChange={set('derbyName')}
            placeholder="Rollzilla"
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1">Number</label>
          <input value={form.skaterNumber} onChange={set('skaterNumber')} placeholder="42" className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1">Pronouns</label>
          <input value={form.pronouns} onChange={set('pronouns')} placeholder="she/her" className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { if (!form.derbyName.trim()) { toast.error('Derby name required'); return } mutation.mutate({ ...form }) }} loading={mutation.isPending}>
          Add Skater
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

export default function GuestPortalPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState(() => searchParams.get('teamId'))
  const [waiverSkater, setWaiverSkater] = useState(null)

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['guest', token],
    queryFn: () => getGuestPortal(token),
  })

  const onRefresh = () => queryClient.invalidateQueries({ queryKey: ['guest', token] })

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
        <p className="text-[#999] text-sm">Link not found or invalid.</p>
      </div>
    )
  }

  const visitingTeams = game.teams?.filter(t => t.role === 'VISITING') ?? []
  const activeTeam = visitingTeams.find(t => t.id === selectedTeamId) ?? visitingTeams[0] ?? null

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="bg-[#1C1C1C] text-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-xs text-[#999] uppercase tracking-widest font-medium mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Guest Team Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {game.title}
          </h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Event info */}
        <div className="bg-white border border-[#EAEAE4] rounded-xl p-5 space-y-2">
          {game.eventDate && (
            <div className="flex items-center gap-2 text-sm text-[#666]">
              <Calendar size={15} className="text-[#E91E8C] shrink-0" />
              {formatDate(game.eventDate)}
              {game.doorsOpen && ` · Doors open ${formatTime(game.doorsOpen)}`}
            </div>
          )}
          {game.venueName && (
            <div className="flex items-center gap-2 text-sm text-[#666]">
              <MapPin size={15} className="text-[#E91E8C] shrink-0" />
              {game.venueName}
              {game.venueAddress && ` — ${game.venueAddress}`}
            </div>
          )}
          {game.matches?.length > 0 && (
            <div className="pt-2 border-t border-[#EAEAE4] mt-2 space-y-1">
              {game.matches.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 text-sm text-[#666]">
                  <Clock size={13} className="text-[#999] shrink-0" />
                  <span>{m.scheduledTime ? formatTime(m.scheduledTime) : `Match ${i + 1}`}</span>
                  <span className="font-medium text-[#1C1C1C]">{m.homeTeam} <span className="text-[#E91E8C] font-bold">vs</span> {m.awayTeam}</span>
                  <span className="text-xs text-[#999]">{m.durationMinutes}min</span>
                </div>
              ))}
            </div>
          )}
          {game.publicToken && (
            <div className="pt-2 border-t border-[#EAEAE4] mt-2">
              <a
                href={`/p/${game.publicToken}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#E91E8C] hover:underline"
              >
                <BookOpen size={14} />
                View event info pack
              </a>
            </div>
          )}
        </div>

        {/* Team selector if multiple visiting teams */}
        {visitingTeams.length > 1 && (
          <div>
            <p className="text-sm font-medium text-[#999] mb-2 uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif' }}>Select your team</p>
            <div className="flex flex-wrap gap-2">
              {visitingTeams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    (activeTeam?.id === t.id)
                      ? 'border-[#E91E8C] bg-[#E91E8C]/10 text-[#E91E8C]'
                      : 'border-[#EAEAE4] bg-white text-[#666] hover:border-[#E91E8C]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Roster section */}
        {activeTeam ? (
          <div className="bg-white border border-[#EAEAE4] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EAEAE4]">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {activeTeam.name} — Roster
              </h2>
              <p className="text-sm text-[#999] mt-0.5">
                {activeTeam.skaters?.filter(s => s.waiverSigned).length ?? 0} of {activeTeam.skaters?.length ?? 0} waivers signed
              </p>
            </div>

            {activeTeam.skaters?.length > 0 ? (
              <div className="divide-y divide-[#EAEAE4]">
                {activeTeam.skaters.map((skater, i) => (
                  <div key={skater.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-[#999] text-xs w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1C1C1C] text-sm">{skater.derbyName}</p>
                      <p className="text-xs text-[#999]">
                        {skater.skaterNumber && `#${skater.skaterNumber}`}
                        {skater.pronouns && ` · ${skater.pronouns}`}
                      </p>
                    </div>
                    {skater.waiverSigned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full shrink-0">
                        <Check size={11} /> Signed
                      </span>
                    ) : (
                      <button
                        onClick={() => setWaiverSkater(skater)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E91E8C] border border-[#E91E8C] px-3 py-1.5 rounded-full hover:bg-[#E91E8C] hover:text-white transition-all shrink-0"
                      >
                        <Pen size={11} /> Sign Waiver
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-[#999]">No skaters added yet.</p>
            )}

            <div className="px-5 py-4 border-t border-[#EAEAE4]">
              <AddSkaterForm token={token} teamId={activeTeam.id} onRefresh={onRefresh} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-[#999] text-sm">
            No visiting team set up yet. Check back later.
          </div>
        )}
      </div>

      {/* Waiver modal */}
      <WaiverModal
        open={!!waiverSkater}
        onClose={() => setWaiverSkater(null)}
        skater={waiverSkater}
        token={token}
        onRefresh={onRefresh}
      />
    </div>
  )
}
