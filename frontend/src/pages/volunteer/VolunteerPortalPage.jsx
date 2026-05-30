import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVolunteerPortal, volunteerUpdateTask } from '../../api/games'
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

function TaskCard({ task, token }) {
  const queryClient = useQueryClient()
  const [claimName, setClaimName] = useState('')
  const [showClaim, setShowClaim] = useState(false)

  const taskName = task.name ?? task.template?.name ?? 'Untitled task'
  const status = task.status
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  const updateMutation = useMutation({
    mutationFn: (data) => volunteerUpdateTask(token, task.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['volunteer', token] }),
    onError: () => toast.error('Failed to update task'),
  })

  const cycleStatus = () => updateMutation.mutate({ status: STATUS_CYCLE[status] })

  const handleClaim = (e) => {
    e.preventDefault()
    if (!claimName.trim()) return
    updateMutation.mutate({ assigneeName: claimName.trim(), status: status === 'TO_DO' ? 'IN_PROGRESS' : status })
    setClaimName('')
    setShowClaim(false)
    toast.success("You're on it!")
  }

  const handleUnclaim = () => {
    updateMutation.mutate({ assigneeName: null, status: 'TO_DO' })
    toast.success('Unassigned')
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${status === 'DONE' ? 'border-green-200 bg-green-50/30' : 'border-[#EAEAE4] bg-white'}`}>
      <div className="flex items-start gap-3">
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
            <p className="text-xs text-[#999] mt-0.5">
              Assigned to: <span className="font-medium text-[#E91E8C]">{task.assigneeName}</span>
            </p>
          )}
        </div>

        {status !== 'DONE' && (
          <div className="shrink-0 flex gap-2">
            <button
              onClick={() => setShowClaim(v => !v)}
              className="text-xs text-[#E91E8C] hover:underline font-medium"
            >
              {task.assigneeName ? 'Reassign' : 'Volunteer'}
            </button>
            {task.assigneeName && (
              <button onClick={handleUnclaim} className="text-xs text-[#999] hover:text-[#1C1C1C]">
                Clear
              </button>
            )}
          </div>
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
          <button type="submit" className="px-3 py-1.5 bg-[#E91E8C] text-white text-sm rounded-lg hover:opacity-90 font-medium">
            Save
          </button>
          <button type="button" onClick={() => setShowClaim(false)} className="px-3 py-1.5 border border-[#EAEAE4] text-sm rounded-lg text-[#999]">
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}

function CategorySection({ category, tasks, token }) {
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
            <TaskCard key={task.id} task={task} token={token} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function VolunteerPortalPage() {
  const { token } = useParams()

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['volunteer', token],
    queryFn: () => getVolunteerPortal(token),
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
      <div className="bg-[#E91E8C] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-sm font-medium text-white/70 mb-1 uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Pre-Bout Volunteers
          </p>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {game.title}
          </h1>
          <p className="text-sm text-white/80">{formatDate(game.eventDate)}</p>
          {game.venueName && <p className="text-sm text-white/70 mt-0.5">{game.venueName}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {totalTasks > 0 ? (
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#EAEAE4]">
              <Check size={16} className="text-[#E91E8C] shrink-0" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C1C1C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  Pre-Bout Checklist
                </h2>
                <p className="text-xs text-[#999]">{doneTasks} of {totalTasks} tasks done</p>
              </div>
            </div>

            <div className="h-2 bg-[#EAEAE4] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#E91E8C] rounded-full transition-all"
                style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-6">
              {Object.entries(tasksByCategory).map(([category, tasks]) => (
                <CategorySection key={category} category={category} tasks={tasks} token={token} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-center text-[#999] py-12">No tasks yet — check back later.</p>
        )}

        <p className="text-xs text-center text-[#999] pb-4">
          Changes are saved immediately and visible to all volunteers.
        </p>
      </div>
    </div>
  )
}
