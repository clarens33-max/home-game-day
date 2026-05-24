import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addSkater,
  deleteSkater,
  addTeam,
} from '../../../api/games'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { Check, X, Trash2, Plus, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

function WaiverBadge({ signed }) {
  return signed ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <Check size={11} /> Signed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
      <X size={11} /> Not signed
    </span>
  )
}

function AddSkaterForm({ game, team, onRefresh }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [derbyName, setDerbyName] = useState('')
  const [skaterNumber, setSkaterNumber] = useState('')
  const [pronouns, setPronouns] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => addSkater(game.id, team.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      setDerbyName('')
      setSkaterNumber('')
      setPronouns('')
      setOpen(false)
      toast.success('Skater added')
      onRefresh()
    },
    onError: () => toast.error('Failed to add skater'),
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[#999] hover:text-[#E91E8C] transition-colors py-2"
      >
        <UserPlus size={14} />
        Add skater
      </button>
    )
  }

  return (
    <div className="mt-3 p-3 bg-[#F7F7F5] rounded-lg border border-[#EAEAE4]">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="col-span-3 sm:col-span-1">
          <label className="block text-xs font-medium mb-1 text-[#999]">Derby name *</label>
          <input
            autoFocus
            value={derbyName}
            onChange={(e) => setDerbyName(e.target.value)}
            placeholder="Hellz Bellz"
            className="w-full border border-[#EAEAE4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[#999]">Number</label>
          <input
            value={skaterNumber}
            onChange={(e) => setSkaterNumber(e.target.value)}
            placeholder="42"
            className="w-full border border-[#EAEAE4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-[#999]">Pronouns</label>
          <input
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="she/her"
            className="w-full border border-[#EAEAE4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (!derbyName.trim()) { toast.error('Derby name required'); return }
            mutation.mutate({ derbyName: derbyName.trim(), skaterNumber: skaterNumber.trim(), pronouns: pronouns.trim() })
          }}
          loading={mutation.isPending}
        >
          Add Skater
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

function TeamSection({ team, game, onRefresh }) {
  const queryClient = useQueryClient()
  const isHome = team.role === 'HOME'

  const deleteMutation = useMutation({
    mutationFn: ({ teamId, skaterId }) => deleteSkater(game.id, teamId, skaterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Skater removed')
      onRefresh()
    },
    onError: () => toast.error('Failed to remove skater'),
  })

  return (
    <div className="bg-white border border-[#EAEAE4] rounded-xl overflow-hidden">
      {/* Team header */}
      <div className="px-5 py-4 border-b border-[#EAEAE4] flex flex-wrap items-center gap-3">
        <h2
          className="text-xl font-semibold text-[#1C1C1C]"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          {team.name}
        </h2>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isHome
              ? 'bg-[#E91E8C]/10 text-[#E91E8C]'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isHome ? 'HOME' : 'VISITING'}
        </span>
        {team.jerseyColour && (
          <span
            className="w-4 h-4 rounded-full border border-[#EAEAE4] shrink-0"
            style={{ backgroundColor: team.jerseyColour }}
            title={`Jersey: ${team.jerseyColour}`}
          />
        )}
        {!isHome && team.contactName && (
          <span className="text-sm text-[#999] ml-auto">
            Contact: {team.contactName}
            {team.contactEmail && ` · ${team.contactEmail}`}
          </span>
        )}
      </div>

      {/* Skater table */}
      <div className="overflow-x-auto">
        {team.skaters?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#999] text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-2.5 font-medium w-12">#</th>
                <th className="text-left px-5 py-2.5 font-medium">Derby Name</th>
                <th className="text-left px-5 py-2.5 font-medium hidden sm:table-cell">Number</th>
                <th className="text-left px-5 py-2.5 font-medium hidden md:table-cell">Pronouns</th>
                <th className="text-left px-5 py-2.5 font-medium">Waiver</th>
                <th className="px-5 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE4]">
              {team.skaters.map((skater, idx) => (
                <tr key={skater.id} className="hover:bg-[#F7F7F5] transition-colors group">
                  <td className="px-5 py-3 text-[#999] text-xs">{idx + 1}</td>
                  <td className="px-5 py-3 font-medium text-[#1C1C1C]">{skater.derbyName}</td>
                  <td className="px-5 py-3 text-[#999] hidden sm:table-cell">
                    {skater.skaterNumber ?? skater.number ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-[#999] hidden md:table-cell">
                    {skater.pronouns ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <WaiverBadge signed={skater.waiverSigned} />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => deleteMutation.mutate({ teamId: team.id, skaterId: skater.id })}
                      className="opacity-0 group-hover:opacity-100 text-[#999] hover:text-red-500 transition-all"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-4 text-sm text-[#999]">No skaters yet.</div>
        )}
      </div>

      {/* Add skater */}
      <div className="px-5 pb-4">
        <AddSkaterForm game={game} team={team} onRefresh={onRefresh} />
      </div>
    </div>
  )
}

function AddVisitingTeamModal({ open, onClose, game, onRefresh }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    jerseyColour: '',
  })
  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }))

  const mutation = useMutation({
    mutationFn: (data) => addTeam(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Visiting team added')
      setForm({ name: '', contactName: '', contactEmail: '', jerseyColour: '' })
      onClose()
      onRefresh()
    },
    onError: () => toast.error('Failed to add team'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    mutation.mutate({ ...form, role: 'VISITING' })
  }

  const inputClass =
    'w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]'

  return (
    <Modal open={open} onClose={onClose} title="Add Visiting Team">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Team name *</label>
          <input required value={form.name} onChange={set('name')} className={inputClass} placeholder="e.g. Capital Crushers" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Contact name</label>
          <input value={form.contactName} onChange={set('contactName')} className={inputClass} placeholder="Team captain name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Contact email</label>
          <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className={inputClass} placeholder="captain@team.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Jersey colour</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.jerseyColour || '#000000'} onChange={set('jerseyColour')} className="h-10 w-14 border border-[#EAEAE4] rounded-lg cursor-pointer" />
            <input value={form.jerseyColour} onChange={set('jerseyColour')} className={`${inputClass} flex-1`} placeholder="#FF0000 or red" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={mutation.isPending}>Add Team</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function RostersTab({ game, onRefresh }) {
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const teams = game.teams ?? []

  return (
    <div className="space-y-6">
      {teams.length === 0 ? (
        <div className="text-center py-12 text-[#999] text-sm">No teams yet.</div>
      ) : (
        teams.map((team) => (
          <TeamSection key={team.id} team={team} game={game} onRefresh={onRefresh} />
        ))
      )}

      {/* Add visiting team */}
      <Button variant="secondary" onClick={() => setAddTeamOpen(true)}>
        <Plus size={16} />
        Add visiting team
      </Button>

      <AddVisitingTeamModal
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        game={game}
        onRefresh={onRefresh}
      />
    </div>
  )
}
