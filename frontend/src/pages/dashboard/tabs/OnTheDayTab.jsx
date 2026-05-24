import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDayRoleSlot, addDayRole } from '../../../api/games'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { Plus, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'

function SlotChip({ slot, roleId, slotIndex, game, onRefresh }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(slot?.personName ?? slot?.user?.name ?? '')

  const filled = slot?.personName || slot?.user?.name
  const displayName = slot?.personName || slot?.user?.name

  const mutation = useMutation({
    mutationFn: (data) => updateDayRoleSlot(game.id, roleId, slotIndex, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      setEditing(false)
      onRefresh()
    },
    onError: () => toast.error('Failed to update slot'),
  })

  const save = () => {
    mutation.mutate({ personName: value || null })
  }

  const clear = (e) => {
    e.stopPropagation()
    mutation.mutate({ personName: null })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="text-xs border border-[#E91E8C] rounded px-2 py-1 focus:outline-none w-28"
          placeholder="Name…"
        />
      </div>
    )
  }

  if (filled) {
    return (
      <span className="inline-flex items-center gap-1 bg-[#E91E8C]/10 text-[#E91E8C] text-xs px-2.5 py-1 rounded-full font-medium">
        {displayName}
        <button
          onClick={clear}
          className="hover:text-[#c4167a] ml-0.5 transition-colors"
          disabled={mutation.isPending}
        >
          <X size={11} />
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 border border-dashed border-[#EAEAE4] text-[#999] hover:border-[#E91E8C] hover:text-[#E91E8C] text-xs px-2.5 py-1 rounded-full transition-colors"
    >
      <Plus size={11} />
      Add person
    </button>
  )
}

function parseHeadcount(raw) {
  if (!raw) return 1
  if (raw === 'ALL' || raw === 'ANYONE') return 4
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? 1 : Math.max(1, Math.min(n, 8))
}

function RoleRow({ role, game, onRefresh }) {
  const headcountRaw = role.template?.headcount ?? role.headcount ?? 'x1'
  const headcount = parseHeadcount(headcountRaw)
  const name = role.template?.name ?? role.name

  // Build slot array up to headcount
  const slots = []
  for (let i = 0; i < headcount; i++) {
    slots.push(role.slots?.find((s) => s.slotIndex === i) ?? null)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-4 border-b border-[#EAEAE4] last:border-b-0">
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="font-medium text-sm text-[#1C1C1C]">{name}</span>
        <span className="bg-[#EAEAE4] text-[#999] text-xs px-2 py-0.5 rounded-full font-medium">
          {headcountRaw}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => (
          <SlotChip
            key={i}
            slot={slot}
            roleId={role.id}
            slotIndex={i}
            game={game}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  )
}

function AddRoleModal({ open, onClose, game, onRefresh }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [headcount, setHeadcount] = useState(1)

  const mutation = useMutation({
    mutationFn: (data) => addDayRole(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Role added')
      setName('')
      setHeadcount(1)
      onClose()
      onRefresh()
    },
    onError: () => toast.error('Failed to add role'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim(), headcount: Number(headcount) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Custom Role" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Role name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            placeholder="e.g. Penalty Tracker"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Headcount</label>
          <input
            type="number"
            min={1}
            max={20}
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={mutation.isPending}>Add Role</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function OnTheDayTab({ game, onRefresh }) {
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const dayRoles = game.gameDayRoles ?? []

  return (
    <div className="space-y-6">
      {/* Roles list */}
      <div className="bg-white border border-[#EAEAE4] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EAEAE4] flex items-center gap-2">
          <Users size={16} className="text-[#999]" />
          <h2
            className="text-sm font-semibold uppercase tracking-wider text-[#1C1C1C]"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Day-of Roles
          </h2>
        </div>

        {dayRoles.length === 0 ? (
          <div className="py-10 text-center text-[#999] text-sm">
            No roles defined yet. Add a custom role below.
          </div>
        ) : (
          dayRoles.map((role) => (
            <RoleRow key={role.id} role={role} game={game} onRefresh={onRefresh} />
          ))
        )}
      </div>

      {/* Add custom role */}
      <Button variant="secondary" onClick={() => setAddRoleOpen(true)}>
        <Plus size={16} />
        Add custom role
      </Button>

      <AddRoleModal
        open={addRoleOpen}
        onClose={() => setAddRoleOpen(false)}
        game={game}
        onRefresh={onRefresh}
      />
    </div>
  )
}
