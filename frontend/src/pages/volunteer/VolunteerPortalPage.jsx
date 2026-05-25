import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVolunteerPortal, volunteerUpdateTask, volunteerUpdateDayRoleSlot } from '../../api/games'
import { Check, Clock, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_CONFIG = {
  TO_DO:       { label: 'To do',       icon: Circle,  classes: 'text-[#999] bg-[#F7F7F5]' },
  IN_PROGRESS: { label: 'In progress', icon: Clock,   classes: 'text-amber-700 bg-amber-50' },
  DONE:        { label: 'Done',        icon: Check,   classes: 'text-green-700 bg-green-100' },
}

const STATUS_CYCLE = { TO_DO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TO_DO' }

function TaskCard({ task, token, onRefresh }) {
  const queryClient = useQueryClient()
  const [claimName, setClaimName] = useState('')
  const [showClaim, setShowClaim] = useState(false)

  const taskName = task.name ?? task.template?.name ?? 'Untitled task'
  const status = task.status
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  const updateMutation = useMutation({
    mutationFn: (data) => volunteerUpdateTask(token, task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer', token] })
      onRefresh()
    },
    onError: () => toast.error('Failed to update task'),
  })

  const cycleStatus = () => updateMutation.mutate({ status: STATUS_CYCLE[status] })

  const handleClaim = (e) => {
    e.preventDefault()
    if (!claimName.trim()) return
    updateMutation.mutate({ assigneeName: claimName.trim(), status: status === 'TO_DO' ? 'IN_PROGRESS' : status })
    setClaimName('')
    setShowClaim(false)
    toast.success('You\'re on it!')
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${status === 'DONE' ? 'border-green-200 bg-green-50/30' : 'border-[#EAEAE4] bg-white'}`}>
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={cycleStatus}
          disabled={updateMutation.isPending}
          className={`shrink-0 mt-0.5 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${cfg.classes} hover:opacity-80`}
          title="Click to change status"
        >
          <Icon size={11} />
          {cfg.label}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${status === 'DONE' ? 'line-through text-[#999]' : 'text-[#1C1C1C]'}`}>
            {taskName}
          </p>
          {task.assigneeName && (
            <p className="text-xs text-[#999] mt-0.5">Assigned to: {task.assigneeName}</p>
          )}
        </div>

        {/* Volunteer button */}
        {status !== 'DONE' && (
          <button
            onClick={() => setShowClaim(v => !v)}
            className="shrink-0 text-xs text-[#E91E8C] hover:underline font-medium"
          >
            {task.assigneeName ? 'Reassign' : 'Volunteer'}
          </button>
        )}
      </div>

      {showClaim && (
        <form onSubmit={handleClaim} className="mt-3 flex gap-2">
          <input
            autoFocus
            value={claimName}
            onChange={e => setClaimName(e.target.value)}
            placeholder="Your name"
            className="flex-1 border border-[#EAEAE4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#E91E8C] text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowClaim(false)}
            className="px-3 py-1.5 border border-[#EAEAE4] text-sm rounded-lg text-[#999] hover:text-[#1C1C1C]"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}

function CategorySection({ category, tasks, token, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false)
  const done = tasks.filter(t => t.status === 'DONE').length

  return (
    <div>
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between py-2 mb-2 border-b border-[#EAEAE4]"
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
          {category}
        </span>
        <span className="flex items-center gap-2 text-xs text-[#999]">
          {done}/{tasks.length} done
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} token={token} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

function DayRoleSlot({ role, slot, slotIndex, token, onRefresh }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(slot?.personName ?? '')

  const mutation = useMutation({
    mutationFn: (personName) => volunteerUpdateDayRoleSlot(token, role.id, slotIndex, personName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer', token] })
      setEditing(false)
      onRefresh()
      toast.success('Saved!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const currentName = slot?.personName

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {currentName ? (
          <span className="text-sm text-[#1C1C1C] font-medium">{currentName}</span>
        ) : (
          <span className="text-sm text-[#999] italic">Open</span>
        )}
        <button
          onClick={() => { setName(currentName ?? ''); setEditing(true) }}
          className="text-xs text-[#E91E8C] hover:underline"
        >
          {currentName ? 'Change' : 'Volunteer'}
        </button>
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

export default function VolunteerPortalPage() {
  const { token } = useParams()
  const queryClient = useQueryClient()

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['volunteer', token],
    queryFn: () => getVolunteerPortal(token),
    staleTime: 30_000,
  })

  const onRefresh = () => queryClient.invalidateQueries({ queryKey: ['volunteer', token] })

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

  // Group tasks by category
  const tasksByCategory = (game.gameTasks ?? []).reduce((acc, task) => {
    const cat = task.category ?? task.template?.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(task)
    return acc
  }, {})

  const totalTasks = game.gameTasks?.length ?? 0
  const doneTasks = game.gameTasks?.filter(t => t.status === 'DONE').length ?? 0

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-[#E91E8C] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-sm font-medium text-white/70 mb-1 uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Volunteer Portal
          </p>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {game.title}
          </h1>
          <p className="text-sm text-white/80">{formatDate(game.eventDate)}</p>
          {game.venueName && <p className="text-sm text-white/70 mt-0.5">{game.venueName}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Progress bar */}
        {totalTasks > 0 && (
          <div>
            <div className="flex justify-between text-xs text-[#999] mb-1.5">
              <span>Pre-bout tasks</span>
              <span>{doneTasks}/{totalTasks} done</span>
            </div>
            <div className="h-2 bg-[#EAEAE4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E91E8C] rounded-full transition-all"
                style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Tasks by category */}
        {Object.keys(tasksByCategory).length > 0 && (
          <div className="space-y-6">
            {Object.entries(tasksByCategory).map(([category, tasks]) => (
              <CategorySection
                key={category}
                category={category}
                tasks={tasks}
                token={token}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}

        {/* On-the-day roles */}
        {game.gameDayRoles?.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 border-b border-[#EAEAE4] pb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
              On-the-Day Roles
            </h2>
            <div className="space-y-3">
              {game.gameDayRoles.map(role => {
                const roleName = role.name ?? role.template?.name ?? 'Role'
                const headcount = role.headcount ?? role.template?.headcount ?? 'x1'
                // Determine how many slots to show
                let slotCount = 1
                if (headcount === 'ALL' || headcount === 'ANYONE') slotCount = 1
                else {
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
                            onRefresh={onRefresh}
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

        <p className="text-xs text-center text-[#999] pb-4">
          Changes are saved immediately and visible to all volunteers.
        </p>
      </div>
    </div>
  )
}
