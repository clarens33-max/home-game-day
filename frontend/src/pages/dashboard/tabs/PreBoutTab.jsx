import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTask, addTask, deleteTask, addComment } from '../../../api/games'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { ChevronDown, ChevronRight, MessageSquare, Plus, Trash2, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CYCLE = { TO_DO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TO_DO' }

// Solid filled pills matching v0 screenshot exactly
const STATUS_STYLES = {
  TO_DO:       'bg-[#EAEAE0] text-[#666666]',
  IN_PROGRESS: 'bg-[#E91E8C] text-white',
  DONE:        'bg-green-500 text-white',
}
const STATUS_LABELS = { TO_DO: 'TO DO', IN_PROGRESS: 'IN PROGRESS', DONE: 'DONE' }

function formatShortDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getDeadline(task, eventDate) {
  if (task.deadlineOverride) return new Date(task.deadlineOverride)
  if (task.template?.leadTimeDays != null && eventDate) {
    return new Date(new Date(eventDate).getTime() - task.template.leadTimeDays * 86400000)
  }
  return null
}

function CommentsModal({ open, onClose, task, gameId, onRefresh }) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    try {
      await addComment(gameId, task.id, body.trim())
      setBody('')
      onRefresh()
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task?.name ?? task?.template?.name ?? 'Task'} size="lg">
      <div className="space-y-4">
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {task?.comments?.length === 0 && (
            <p className="text-sm text-[#666] text-center py-6">No comments yet.</p>
          )}
          {task?.comments?.map((c) => (
            <div key={c.id} className="bg-[#F5F5F0] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#1C1C1C]">{c.author?.name ?? 'Unknown'}</span>
                <span className="text-xs text-[#666]">
                  {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-[#1C1C1C]">{c.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 border border-[#E2E2DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
          <Button type="submit" size="sm" loading={loading} disabled={!body.trim()}>
            <Send size={14} />
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function DeadlineModal({ open, onClose, task, gameId, onRefresh }) {
  const [value, setValue] = useState(task?.deadlineOverride ? task.deadlineOverride.slice(0, 10) : '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateTask(gameId, task.id, { deadlineOverride: value || null })
      toast.success('Deadline updated')
      onRefresh()
      onClose()
    } catch {
      toast.error('Failed to update deadline')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Deadline" size="sm">
      <div className="space-y-4">
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-[#E2E2DC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} loading={loading}>Save</Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => setValue('')}>Clear override</Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function TaskRow({ task, game, onRefresh, isLast }) {
  const queryClient = useQueryClient()
  const [commentOpen, setCommentOpen] = useState(false)
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeVal, setAssigneeVal] = useState(task.assigneeName ?? task.assignee?.name ?? '')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = getDeadline(task, game.eventDate)
  const isOverdue = deadline && deadline < today && task.status !== 'DONE'
  const taskName = task.name ?? task.template?.name ?? 'Unnamed task'
  const commentCount = task.comments?.length ?? 0
  const isCustom = !task.templateId

  const statusMutation = useMutation({
    mutationFn: ({ status }) => updateTask(game.id, task.id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game', game.id] }),
    onError: () => toast.error('Failed to update task'),
  })

  const assigneeMutation = useMutation({
    mutationFn: ({ assigneeName }) => updateTask(game.id, task.id, { assigneeName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      setEditingAssignee(false)
    },
    onError: () => toast.error('Failed to update assignee'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(game.id, task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  return (
    <>
      <div
        className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-[#F5F5F0] transition-colors group ${
          !isLast ? 'border-b border-[#E2E2DC]' : ''
        }`}
      >
        {/* Status pill */}
        <button
          onClick={() => statusMutation.mutate({ status: STATUS_CYCLE[task.status] })}
          disabled={statusMutation.isPending}
          className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all hover:opacity-90 active:scale-95 ${STATUS_STYLES[task.status]}`}
        >
          <span className="hidden sm:inline">{STATUS_LABELS[task.status]}</span>
          <span className="sm:hidden">
            {task.status === 'TO_DO' ? 'TD' : task.status === 'IN_PROGRESS' ? 'IP' : 'DN'}
          </span>
        </button>

        {/* Task name */}
        <span className={`flex-1 min-w-0 truncate text-sm ${
          task.status === 'DONE' ? 'line-through text-[#999]' : 'text-[#1C1C1C]'
        }`}>
          {taskName}
        </span>

        {/* Deadline */}
        <button
          onClick={() => setDeadlineOpen(true)}
          className={`shrink-0 text-sm hover:underline ${
            isOverdue ? 'text-[#E91E8C] font-semibold' : 'text-[#666]'
          }`}
        >
          {deadline ? formatShortDate(deadline.toISOString()) : '—'}
        </button>

        {/* Assignee */}
        {editingAssignee ? (
          <input
            autoFocus
            value={assigneeVal}
            onChange={(e) => setAssigneeVal(e.target.value)}
            onBlur={() => assigneeMutation.mutate({ assigneeName: assigneeVal })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') assigneeMutation.mutate({ assigneeName: assigneeVal })
              if (e.key === 'Escape') setEditingAssignee(false)
            }}
            className="w-24 text-xs border border-[#E91E8C] rounded px-1.5 py-1 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingAssignee(true)}
            className="shrink-0 text-sm text-[#666] hover:text-[#E91E8C] hidden sm:block w-24 truncate text-right transition-colors"
          >
            {task.assigneeName ?? task.assignee?.name ?? 'Assign…'}
          </button>
        )}

        {/* Comments */}
        <button
          onClick={() => setCommentOpen(true)}
          className="flex items-center gap-1 text-xs text-[#666] hover:text-[#E91E8C] shrink-0 transition-colors"
        >
          <MessageSquare size={13} />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        {/* Delete (custom tasks only) */}
        {isCustom && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-red-500 transition-all shrink-0"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <CommentsModal open={commentOpen} onClose={() => setCommentOpen(false)} task={task} gameId={game.id} onRefresh={onRefresh} />
      <DeadlineModal open={deadlineOpen} onClose={() => setDeadlineOpen(false)} task={task} gameId={game.id} onRefresh={onRefresh} />
    </>
  )
}

function CategorySection({ category, tasks, game, onRefresh }) {
  const [expanded, setExpanded] = useState(true)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const queryClient = useQueryClient()

  const done = tasks.filter((t) => t.status === 'DONE').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const addMutation = useMutation({
    mutationFn: (name) => addTask(game.id, { name, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      setNewTaskName('')
      setAddingTask(false)
      toast.success('Task added')
    },
    onError: () => toast.error('Failed to add task'),
  })

  return (
    <div className="bg-white rounded-lg border border-[#E2E2DC] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#F5F5F0] transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded
            ? <ChevronDown className="w-5 h-5 text-[#E91E8C] shrink-0" />
            : <ChevronRight className="w-5 h-5 text-[#666] shrink-0" />
          }
          <h3
            className="text-base sm:text-lg font-bold tracking-wider truncate text-[#1C1C1C]"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {category}
          </h3>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <span className="text-sm text-[#666] hidden sm:inline">{done}/{total}</span>
          <div className="w-20 sm:w-32 h-2 bg-[#EAEAE0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: 'rgba(233,30,140,0.6)' }}
            />
          </div>
          <span className="text-sm font-medium w-10 text-right text-[#1C1C1C]">{pct}%</span>
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="border-t border-[#E2E2DC]">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              game={game}
              onRefresh={onRefresh}
              isLast={index === tasks.length - 1 && !addingTask}
            />
          ))}

          {addingTask ? (
            <div className="flex gap-2 p-4 border-t border-[#E2E2DC]">
              <input
                autoFocus
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTaskName.trim()) addMutation.mutate(newTaskName.trim())
                  if (e.key === 'Escape') { setAddingTask(false); setNewTaskName('') }
                }}
                placeholder="Task name…"
                className="flex-1 text-sm border border-[#E91E8C] rounded-lg px-3 py-1.5 focus:outline-none"
              />
              <Button size="sm" onClick={() => newTaskName.trim() && addMutation.mutate(newTaskName.trim())} loading={addMutation.isPending}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingTask(false); setNewTaskName('') }}>Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTask(true)}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-sm text-[#666] hover:text-[#E91E8C] transition-colors border-t border-[#E2E2DC] w-full"
            >
              <Plus size={14} />
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PreBoutTab({ game, onRefresh }) {
  const tasks = game.gameTasks ?? []
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'DONE').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const grouped = {}
  for (const task of tasks) {
    const cat = task.template?.category ?? task.category ?? 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(task)
  }
  const categories = Object.keys(grouped)

  return (
    <div className="space-y-6">
      {/* Overall progress card */}
      <div className="bg-white rounded-lg border border-[#E2E2DC] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              className="text-lg font-bold tracking-wider uppercase text-[#1C1C1C]"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Overall Progress
            </h2>
            <p className="text-sm text-[#666] mt-1">{done} of {total} tasks completed</p>
          </div>
          <div
            className="text-3xl sm:text-4xl font-bold text-[#E91E8C] shrink-0"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {pct}%
          </div>
        </div>
        <div className="mt-4 h-3 bg-[#EAEAE0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E91E8C] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-[#666] text-sm">No tasks found for this game.</div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <CategorySection key={cat} category={cat} tasks={grouped[cat]} game={game} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}
