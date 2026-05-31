import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLeague, approveMember, rejectMember, promoteMember, demoteMember,
  seedBlueprint, clearBlueprint,
  addBlueprintTask, updateBlueprintTask, deleteBlueprintTask,
  addBlueprintRole, updateBlueprintRole, deleteBlueprintRole,
  addBlueprintInfoSection, updateBlueprintInfoSection, deleteBlueprintInfoSection,
  getLeagueSeasons, getLeagueSeason, createLeagueSeason, updateLeagueSeason, deleteLeagueSeason,
  addLeagueTeam, deleteLeagueTeam,
  addLeagueSkater, deleteLeagueSkater,
} from '../../api/games'
import { useAuth } from '../../lib/auth'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import BlockEditor from '../../components/BlockEditor'
import { parseBlocks, blocksToContent } from '../../lib/blocks'
import {
  Shield, BookOpen, Plus, Trash2, Check, X,
  Clock, ExternalLink, ChevronRight, Calendar, Pencil,
} from 'lucide-react'
import toast from 'react-hot-toast'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ league, isOwner, currentUserId }) {
  const queryClient = useQueryClient()

  const approveMut = useMutation({
    mutationFn: (userId) => approveMember(league.id, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['league', league.id] }); toast.success('Member approved') },
    onError: () => toast.error('Failed'),
  })
  const rejectMut = useMutation({
    mutationFn: (userId) => rejectMember(league.id, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['league', league.id] }); toast.success('Request rejected') },
    onError: () => toast.error('Failed'),
  })
  const promoteMut = useMutation({
    mutationFn: (userId) => promoteMember(league.id, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['league', league.id] }); toast.success('Promoted to owner') },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed'),
  })
  const demoteMut = useMutation({
    mutationFn: (userId) => demoteMember(league.id, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['league', league.id] }); toast.success('Demoted to member') },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Cannot demote the last owner'),
  })

  const pending = league.members.filter(m => m.status === 'PENDING')
  const active = league.members.filter(m => m.status === 'ACTIVE')
  const ownerCount = active.filter(m => m.role === 'OWNER').length

  return (
    <div className="space-y-6">
      {isOwner && pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-1.5">
            <Clock size={14} /> {pending.length} pending join request{pending.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {pending.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
                <button
                  onClick={() => approveMut.mutate(m.userId)}
                  disabled={approveMut.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 font-medium"
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  onClick={() => rejectMut.mutate(m.userId)}
                  disabled={rejectMut.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium"
                >
                  <X size={12} /> Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">{active.length} Active Member{active.length !== 1 ? 's' : ''}</p>
        </div>
        {active.map(m => {
          const isSelf = m.userId === currentUserId
          const isLastOwner = m.role === 'OWNER' && ownerCount <= 1
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {m.user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{m.user.name}{isSelf ? ' (you)' : ''}</p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <span className={`text-xs font-medium ${m.role === 'OWNER' ? 'text-primary' : 'text-muted-foreground'}`}>
                {m.role === 'OWNER' ? 'Owner' : 'Member'}
              </span>
              {isOwner && (
                <div className="flex items-center gap-1">
                  {m.role === 'MEMBER' && (
                    <button
                      onClick={() => promoteMut.mutate(m.userId)}
                      disabled={promoteMut.isPending}
                      className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                    >
                      Make owner
                    </button>
                  )}
                  {m.role === 'OWNER' && (isSelf || !isLastOwner) && (
                    <button
                      onClick={() => demoteMut.mutate(m.userId)}
                      disabled={demoteMut.isPending || isLastOwner}
                      title={isLastOwner ? 'Cannot demote the last owner' : undefined}
                      className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSelf ? 'Leave as owner' : 'Demote'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Blueprint tab ────────────────────────────────────────────────────────────

function TaskModal({ open, onClose, leagueId, task = null }) {
  const queryClient = useQueryClient()
  const isEdit = task != null
  const [form, setForm] = useState({
    category: task?.category ?? '',
    name: task?.name ?? '',
    leadTimeDays: task?.leadTimeDays != null ? String(task.leadTimeDays) : '',
    eventScope: task?.eventScope ?? 'BOTH',
  })


  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateBlueprintTask(leagueId, task.id, data)
      : addBlueprintTask(leagueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] })
      toast.success(isEdit ? 'Task updated' : 'Task added')
      onClose()
      if (!isEdit) setForm({ category: '', name: '', leadTimeDays: '', eventScope: 'BOTH' })
    },
    onError: () => toast.error(isEdit ? 'Failed to update task' : 'Failed to add task'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      category: form.category.trim(),
      name: form.name.trim(),
      leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays) : null,
      eventScope: form.eventScope,
    })
  }

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Blueprint Task' : 'Add Blueprint Task'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input value={form.category} onChange={set('category')} placeholder="e.g. Logistics" required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Task name</label>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Book venue" required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Lead time (days)</label>
            <input type="number" min={0} value={form.leadTimeDays} onChange={set('leadTimeDays')} placeholder="e.g. 14"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event scope</label>
            <select value={form.eventScope} onChange={set('eventScope')}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
              <option value="BOTH">Both</option>
              <option value="HOME_GAME">Home game</option>
              <option value="TOURNAMENT">Tournament</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Add Task'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

function RoleModal({ open, onClose, leagueId, role = null }) {
  const queryClient = useQueryClient()
  const isEdit = role != null
  const [form, setForm] = useState({ name: role?.name ?? '', headcount: role?.headcount ?? 'x1' })

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateBlueprintRole(leagueId, role.id, data)
      : addBlueprintRole(leagueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] })
      toast.success(isEdit ? 'Role updated' : 'Role added')
      onClose()
      if (!isEdit) setForm({ name: '', headcount: 'x1' })
    },
    onError: () => toast.error(isEdit ? 'Failed to update role' : 'Failed to add role'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Blueprint Role' : 'Add Blueprint Role'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Role name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. DJ" required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Headcount</label>
          <select value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card">
            <option value="x1">x1</option>
            <option value="x2">x2</option>
            <option value="x4">x4</option>
            <option value="ALL">ALL</option>
            <option value="ANYONE">ANYONE</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Add Role'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

function InfoSectionModal({ open, onClose, leagueId, section = null }) {
  const queryClient = useQueryClient()
  const isEdit = section != null
  const [title, setTitle] = useState(section?.title ?? '')
  const [blocks, setBlocks] = useState(() => parseBlocks(section?.content ?? ''))

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateBlueprintInfoSection(leagueId, section.id, data)
      : addBlueprintInfoSection(leagueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] })
      toast.success(isEdit ? 'Section updated' : 'Section added')
      onClose()
    },
    onError: () => toast.error(isEdit ? 'Failed to update section' : 'Failed to add section'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({ title: title.trim(), content: blocksToContent(blocks), imageUrl: null })
  }

  const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Info Section' : 'Add Info Section'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 mt-1">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Welcome, Venue Info" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Add Section'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

function BlueprintTab({ league, isOwner }) {
  const queryClient = useQueryClient()
  const [taskModal, setTaskModal] = useState(null) // null | 'add' | task object
  const [roleModal, setRoleModal] = useState(null) // null | 'add' | role object
  const [infoModal, setInfoModal] = useState(null) // null | 'add' | section object

  const seedMut = useMutation({
    mutationFn: () => seedBlueprint(league.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['league', league.id] }); toast.success('Blueprint seeded from generic templates!') },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to seed'),
  })

  const clearMut = useMutation({
    mutationFn: () => clearBlueprint(league.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['league', league.id] }); toast.success('Blueprint cleared') },
    onError: () => toast.error('Failed to clear blueprint'),
  })

  const delTaskMut = useMutation({
    mutationFn: (taskId) => deleteBlueprintTask(league.id, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['league', league.id] }),
    onError: () => toast.error('Failed to delete'),
  })

  const delRoleMut = useMutation({
    mutationFn: (roleId) => deleteBlueprintRole(league.id, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['league', league.id] }),
    onError: () => toast.error('Failed to delete'),
  })

  const delInfoMut = useMutation({
    mutationFn: (sectionId) => deleteBlueprintInfoSection(league.id, sectionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['league', league.id] }),
    onError: () => toast.error('Failed to delete'),
  })

  const tasks = league.blueprintTasks ?? []
  const roles = league.blueprintRoles ?? []
  const infoSections = league.blueprintInfoSections ?? []

  const tasksByCategory = tasks.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  const isEmpty = tasks.length === 0 && roles.length === 0

  const handleClearAll = () => {
    if (window.confirm('Delete all blueprint tasks, roles, and info sections? This cannot be undone.')) {
      clearMut.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Your league blueprint defines the default tasks and roles pre-populated when any league member creates a new game.
          {isEmpty && ' Start by seeding from the generic template, then customise.'}
        </p>
        {isOwner && !isEmpty && (
          <button
            onClick={handleClearAll}
            disabled={clearMut.isPending}
            className="text-xs text-destructive hover:underline shrink-0 whitespace-nowrap"
          >
            Delete all
          </button>
        )}
      </div>

      {isEmpty && isOwner && (
        <Button onClick={() => seedMut.mutate()} loading={seedMut.isPending} variant="secondary">
          <BookOpen size={15} /> Seed from generic template
        </Button>
      )}

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Pre-Bout Tasks ({tasks.length})
          </h3>
          {isOwner && (
            <button onClick={() => setTaskModal('add')} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus size={12} /> Add task
            </button>
          )}
        </div>

        {Object.entries(tasksByCategory).length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">No tasks yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(tasksByCategory).map(([cat, catTasks]) => (
              <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                </div>
                <div className="divide-y divide-border/50">
                  {catTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{task.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.leadTimeDays != null ? `${task.leadTimeDays}d before` : 'No deadline'} · {task.eventScope === 'BOTH' ? 'All events' : task.eventScope === 'HOME_GAME' ? 'Home game' : 'Tournament'}
                        </p>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setTaskModal(task)} className="text-muted-foreground hover:text-primary p-1">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => delTaskMut.mutate(task.id)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Day Roles ({roles.length})
          </h3>
          {isOwner && (
            <button onClick={() => setRoleModal('add')} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus size={12} /> Add role
            </button>
          )}
        </div>

        {roles.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">No roles yet</p>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border/50">
              {roles.map(role => (
                <div key={role.id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <div className="flex-1">
                    <p className="text-sm">{role.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{role.headcount}</span>
                  {isOwner && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setRoleModal(role)} className="text-muted-foreground hover:text-primary p-1">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => delRoleMut.mutate(role.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Pack Template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Info Pack Template ({infoSections.length})
          </h3>
          {isOwner && (
            <button onClick={() => setInfoModal('add')} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus size={12} /> Add section
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          These sections are copied into every new game created from this league.
          Sections marked <span className="font-medium text-primary">Auto</span> are populated automatically from game data.
        </p>

        {infoSections.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">No info sections yet</p>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border/50">
              {infoSections.map(section => {
                const isAuto = section.sectionType === 'AUTO_TEAMS' || section.sectionType === 'AUTO_SCHEDULE'
                return (
                  <div key={section.id} className={`flex items-center gap-3 px-4 py-2.5 group ${isAuto ? 'bg-primary/5' : ''}`}>
                    {section.imageUrl && !isAuto && (
                      <img src={section.imageUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{section.title}</p>
                        {isAuto && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            {section.sectionType === 'AUTO_TEAMS' ? 'Auto · Teams' : 'Auto · Schedule'}
                          </span>
                        )}
                      </div>
                      {!isAuto && section.content && (
                        <p className="text-xs text-muted-foreground truncate">{section.content}</p>
                      )}
                      {isAuto && (
                        <p className="text-xs text-muted-foreground italic">
                          {section.sectionType === 'AUTO_TEAMS' ? 'Populated from game team rosters' : 'Populated from timing blocks and bouts'}
                        </p>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setInfoModal(section)} className="text-muted-foreground hover:text-primary p-1">
                          <Pencil size={13} />
                        </button>
                        {!isAuto && (
                          <button onClick={() => delInfoMut.mutate(section.id)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <TaskModal
        key={taskModal?.id ?? 'add-task'}
        open={taskModal !== null}
        onClose={() => setTaskModal(null)}
        leagueId={league.id}
        task={taskModal !== 'add' ? taskModal : null}
      />
      <RoleModal
        key={roleModal?.id ?? 'add-role'}
        open={roleModal !== null}
        onClose={() => setRoleModal(null)}
        leagueId={league.id}
        role={roleModal !== 'add' ? roleModal : null}
      />
      <InfoSectionModal
        key={infoModal?.id ?? 'add-info'}
        open={infoModal !== null}
        onClose={() => setInfoModal(null)}
        leagueId={league.id}
        section={infoModal !== 'add' ? infoModal : null}
      />
    </div>
  )
}

// ── Roster tab ───────────────────────────────────────────────────────────────

function RosterTab({ league, isOwner }) {
  const queryClient = useQueryClient()
  const [selectedSeasonId, setSelectedSeasonId] = useState(null)
  const [showNewSeason, setShowNewSeason] = useState(false)
  const [newSeasonName, setNewSeasonName] = useState('')
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [addSkaterTeamId, setAddSkaterTeamId] = useState(null)
  const [newSkater, setNewSkater] = useState({ derbyName: '', skaterNumber: '', pronouns: '' })
  const [bulkTeamId, setBulkTeamId] = useState(null)
  const [bulkText, setBulkText] = useState('')

  const { data: seasons = [], isLoading: loadingSeasons } = useQuery({
    queryKey: ['league', league.id, 'seasons'],
    queryFn: () => getLeagueSeasons(league.id),
    staleTime: 30_000,
  })

  // Auto-select the active season on load
  const activeSeason = seasons.find(s => s.isActive)
  const effectiveSeasonId = selectedSeasonId ?? activeSeason?.id ?? seasons[0]?.id ?? null

  const { data: season } = useQuery({
    queryKey: ['league', league.id, 'seasons', effectiveSeasonId],
    queryFn: () => getLeagueSeason(league.id, effectiveSeasonId),
    enabled: !!effectiveSeasonId,
    staleTime: 30_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['league', league.id, 'seasons'] })
    if (effectiveSeasonId) {
      queryClient.invalidateQueries({ queryKey: ['league', league.id, 'seasons', effectiveSeasonId] })
    }
  }

  const createSeasonMut = useMutation({
    mutationFn: (data) => createLeagueSeason(league.id, data),
    onSuccess: (s) => { invalidate(); setShowNewSeason(false); setNewSeasonName(''); setSelectedSeasonId(s.id); toast.success('Season created') },
    onError: () => toast.error('Failed to create season'),
  })

  const activateSeasonMut = useMutation({
    mutationFn: (seasonId) => updateLeagueSeason(league.id, seasonId, { isActive: true }),
    onSuccess: () => { invalidate(); toast.success('Season set as active') },
    onError: () => toast.error('Failed'),
  })

  const deleteSeasonMut = useMutation({
    mutationFn: (seasonId) => deleteLeagueSeason(league.id, seasonId),
    onSuccess: () => { invalidate(); setSelectedSeasonId(null); toast.success('Season deleted') },
    onError: () => toast.error('Failed to delete season'),
  })

  const addTeamMut = useMutation({
    mutationFn: (data) => addLeagueTeam(league.id, effectiveSeasonId, data),
    onSuccess: () => { invalidate(); setAddTeamOpen(false); setNewTeamName(''); toast.success('Team added') },
    onError: () => toast.error('Failed to add team'),
  })

  const deleteTeamMut = useMutation({
    mutationFn: (teamId) => deleteLeagueTeam(league.id, effectiveSeasonId, teamId),
    onSuccess: () => { invalidate(); toast.success('Team removed') },
    onError: () => toast.error('Failed'),
  })

  const addSkaterMut = useMutation({
    mutationFn: ({ teamId, data }) => addLeagueSkater(league.id, effectiveSeasonId, teamId, data),
    onSuccess: () => { invalidate(); setAddSkaterTeamId(null); setNewSkater({ derbyName: '', skaterNumber: '', pronouns: '' }); toast.success('Skater added') },
    onError: () => toast.error('Failed to add skater'),
  })

  const deleteSkaterMut = useMutation({
    mutationFn: ({ teamId, skaterId }) => deleteLeagueSkater(league.id, effectiveSeasonId, teamId, skaterId),
    onSuccess: () => { invalidate(); toast.success('Skater removed') },
    onError: () => toast.error('Failed'),
  })

  const handleBulkImport = (teamId) => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const skaters = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return { derbyName: parts[0], skaterNumber: parts[1] ?? null, pronouns: parts[2] ?? null }
    }).filter(s => s.derbyName)
    if (!skaters.length) { toast.error('No valid skaters found'); return }
    Promise.all(skaters.map(s => addLeagueSkater(league.id, effectiveSeasonId, teamId, s)))
      .then(() => { invalidate(); setBulkTeamId(null); setBulkText(''); toast.success(`${skaters.length} skaters imported`) })
      .catch(() => toast.error('Some skaters failed to import'))
  }

  if (loadingSeasons) return <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5">
      {/* Season selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Season:</span>
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSeasonId(s.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              effectiveSeasonId === s.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            {s.name}
            {s.isActive && <span className="ml-1.5 text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5">Active</span>}
          </button>
        ))}
        {isOwner && !showNewSeason && (
          <button
            onClick={() => setShowNewSeason(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> New season
          </button>
        )}
      </div>

      {/* New season form */}
      {showNewSeason && (
        <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
          <input
            autoFocus
            value={newSeasonName}
            onChange={e => setNewSeasonName(e.target.value)}
            placeholder="e.g. 2026-27 Season"
            className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={e => { if (e.key === 'Enter') createSeasonMut.mutate({ name: newSeasonName }) }}
          />
          <Button size="sm" onClick={() => createSeasonMut.mutate({ name: newSeasonName })} loading={createSeasonMut.isPending}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowNewSeason(false); setNewSeasonName('') }}>Cancel</Button>
        </div>
      )}

      {seasons.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No seasons yet. Create a season to start building your roster.
        </div>
      )}

      {effectiveSeasonId && season && (
        <>
          {/* Season actions */}
          {isOwner && (
            <div className="flex items-center gap-3 text-xs">
              {!season.isActive && (
                <button
                  onClick={() => activateSeasonMut.mutate(effectiveSeasonId)}
                  className="text-primary hover:underline"
                >
                  Set as active (used for new games)
                </button>
              )}
              {season.isActive && (
                <span className="text-muted-foreground italic">This season&apos;s roster is copied to new games</span>
              )}
              <button
                onClick={() => { if (window.confirm('Delete this season and all its teams and skaters?')) deleteSeasonMut.mutate(effectiveSeasonId) }}
                className="text-destructive hover:underline ml-auto"
              >
                Delete season
              </button>
            </div>
          )}

          {/* Teams */}
          <div className="space-y-4">
            {season.teams?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">No teams yet. Add a team to start building the roster.</p>
            )}
            {season.teams?.map(team => (
              <div key={team.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                  <h3 className="flex-1 text-sm font-semibold" style={{ fontFamily: 'Oswald, sans-serif' }}>{team.name}</h3>
                  {team.jerseyColour && (
                    <span className="text-xs text-muted-foreground">{team.jerseyColour}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{team.skaters?.length ?? 0} skaters</span>
                  {isOwner && (
                    <button onClick={() => deleteTeamMut.mutate(team.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border/40">
                  {team.skaters?.map((skater, i) => (
                    <div key={skater.id} className="flex items-center gap-3 px-4 py-2.5 group">
                      <span className="text-muted-foreground text-xs w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{skater.derbyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {skater.skaterNumber && `#${skater.skaterNumber}`}
                          {skater.pronouns && ` · ${skater.pronouns}`}
                        </p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => deleteSkaterMut.mutate({ teamId: team.id, skaterId: skater.id })}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add skater inline */}
                  {isOwner && addSkaterTeamId === team.id ? (
                    <div className="px-4 py-3 bg-muted/30 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-3 sm:col-span-1">
                          <input
                            autoFocus
                            value={newSkater.derbyName}
                            onChange={e => setNewSkater(v => ({ ...v, derbyName: e.target.value }))}
                            placeholder="Derby name *"
                            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          />
                        </div>
                        <input
                          value={newSkater.skaterNumber}
                          onChange={e => setNewSkater(v => ({ ...v, skaterNumber: e.target.value }))}
                          placeholder="#Number"
                          className="border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />
                        <input
                          value={newSkater.pronouns}
                          onChange={e => setNewSkater(v => ({ ...v, pronouns: e.target.value }))}
                          placeholder="Pronouns"
                          className="border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { if (!newSkater.derbyName.trim()) { toast.error('Derby name required'); return } addSkaterMut.mutate({ teamId: team.id, data: newSkater }) }} loading={addSkaterMut.isPending}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAddSkaterTeamId(null); setNewSkater({ derbyName: '', skaterNumber: '', pronouns: '' }) }}>Cancel</Button>
                      </div>
                    </div>
                  ) : isOwner && bulkTeamId === team.id ? (
                    <div className="px-4 py-3 bg-muted/30 space-y-2">
                      <p className="text-xs text-muted-foreground">One skater per line: <span className="font-mono">Derby Name, #Number, Pronouns</span></p>
                      <textarea
                        autoFocus
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                        rows={5}
                        placeholder={"Hellz Bellz, 42, she/her\nRollzilla, 767\nDestructa"}
                        className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleBulkImport(team.id)}>Import</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setBulkTeamId(null); setBulkText('') }}>Cancel</Button>
                      </div>
                    </div>
                  ) : isOwner ? (
                    <div className="px-4 py-2 flex items-center gap-3">
                      <button onClick={() => { setAddSkaterTeamId(team.id); setBulkTeamId(null) }} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus size={11} /> Add skater
                      </button>
                      <button onClick={() => { setBulkTeamId(team.id); setAddSkaterTeamId(null) }} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                        Bulk import
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {/* Add team */}
            {isOwner && (
              <div>
                {addTeamOpen ? (
                  <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
                    <input
                      autoFocus
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="Team name"
                      className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={e => { if (e.key === 'Enter') addTeamMut.mutate({ name: newTeamName }) }}
                    />
                    <Button size="sm" onClick={() => { if (!newTeamName.trim()) { toast.error('Name required'); return } addTeamMut.mutate({ name: newTeamName }) }} loading={addTeamMut.isPending}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddTeamOpen(false); setNewTeamName('') }}>Cancel</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddTeamOpen(true)}
                    className="w-full border-2 border-dashed border-border hover:border-primary rounded-xl py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus size={14} className="inline mr-1" /> Add team
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Games tab ────────────────────────────────────────────────────────────────

function GamesTab({ league }) {
  const games = league.games ?? []
  const navigate = useNavigate()
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/games/new?leagueId=${league.id}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Plus size={13} /> New game in this league
        </button>
      </div>
      {games.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
          No games yet.{' '}
          <button onClick={() => navigate(`/games/new?leagueId=${league.id}`)} className="text-primary hover:underline">
            Create the first one.
          </button>
        </div>
      ) : (
        games.map(game => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <Calendar size={20} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{game.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(game.eventDate)} · {game.venueName ?? 'Venue TBC'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                {game.owners?.[0]?.user?.name ?? 'Unknown'}
              </p>
              <ChevronRight size={14} className="text-muted-foreground ml-auto" />
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

const TABS = ['games', 'roster', 'members', 'blueprint']

export default function LeaguePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tab, setTab] = useState('games')

  const { data: league, isLoading, isError } = useQuery({
    queryKey: ['league', id],
    queryFn: () => getLeague(id),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (isError || !league) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground text-sm">
          League not found or access denied.
        </div>
      </Layout>
    )
  }

  // isOwner: original creator OR any active member with OWNER role
  const isOwner = league.members.some(
    m => m.userId === user?.id && m.role === 'OWNER' && m.status === 'ACTIVE'
  ) || league.ownerId === user?.id
  const pendingCount = league.members.filter(m => m.status === 'PENDING').length

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Shield size={36} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display tracking-wider uppercase">{league.name}</h1>
            {league.description && <p className="text-muted-foreground text-sm mt-1">{league.description}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {league.members.filter(m => m.status === 'ACTIVE').length} members
              </span>
              {league.slackUrl && (
                <a href={league.slackUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={11} /> Slack
                </a>
              )}
              {league.discordUrl && (
                <a href={league.discordUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={11} /> Discord
                </a>
              )}
            </div>
          </div>
          {isOwner && (
            <Link to={`/leagues/${id}/settings`} className="text-xs text-muted-foreground hover:text-primary">
              Settings
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
              {t === 'members' && isOwner && pendingCount > 0 && (
                <span className="ml-1.5 bg-primary text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'games' && <GamesTab league={league} isOwner={isOwner} />}
        {tab === 'roster' && <RosterTab league={league} isOwner={isOwner} />}
        {tab === 'members' && <MembersTab league={league} isOwner={isOwner} currentUserId={user?.id} />}
        {tab === 'blueprint' && <BlueprintTab league={league} isOwner={isOwner} />}
      </div>
    </Layout>
  )
}
