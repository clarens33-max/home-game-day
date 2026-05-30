import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addInfoSection, updateInfoSection, deleteInfoSection } from '../../../api/games'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { Plus, Pencil, Trash2, Eye, EyeOff, Image, Users, Clock, Lock, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

function SectionModal({ open, onClose, gameId, section, onSuccess }) {
  const isEdit = !!section
  const [form, setForm] = useState({
    title: section?.title ?? '',
    content: section?.content ?? '',
    imageUrl: section?.imageUrl ?? '',
  })
  const [imagePreview, setImagePreview] = useState(section?.imageUrl ?? null)
  const fileRef = useRef(null)

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target.result)
      setForm(v => ({ ...v, imageUrl: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImagePreview(null)
    setForm(v => ({ ...v, imageUrl: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const addMutation = useMutation({
    mutationFn: (data) => addInfoSection(gameId, data),
    onSuccess: () => { toast.success('Section added'); onSuccess(); onClose() },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to add section'),
  })

  const editMutation = useMutation({
    mutationFn: (data) => updateInfoSection(gameId, section.id, data),
    onSuccess: () => { toast.success('Section updated'); onSuccess(); onClose() },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to update section'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      title: form.title.trim(),
      content: form.content,
      imageUrl: form.imageUrl || null,
    }
    if (isEdit) editMutation.mutate(payload)
    else addMutation.mutate(payload)
  }

  const isPending = addMutation.isPending || editMutation.isPending

  const inputClass = 'w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit section' : 'Add section'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 mt-1">
        <div>
          <label className="block text-sm font-medium mb-1.5">Section title *</label>
          <input value={form.title} onChange={set('title')} required className={inputClass} placeholder="e.g. Welcome, Venue Info, Schedule" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Content</label>
          <textarea
            value={form.content}
            onChange={set('content')}
            rows={6}
            className={inputClass}
            placeholder="Write the section content here…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Image <span className="text-[#999] font-normal text-xs">(optional, max 5 MB)</span></label>
          {imagePreview ? (
            <div className="space-y-2">
              <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover rounded-lg border border-[#EAEAE4]" />
              <button type="button" onClick={clearImage} className="text-xs text-red-500 hover:underline">Remove image</button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#EAEAE4] rounded-lg p-6 cursor-pointer hover:border-[#E91E8C] hover:bg-[#fdf5f9] transition-colors"
            >
              <Image size={24} className="text-[#ccc]" />
              <span className="text-sm text-[#999]">Click to upload image</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={isPending}>{isEdit ? 'Save changes' : 'Add section'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

function AutoTeamsPreview({ game }) {
  const teams = game.teams ?? []
  return (
    <div className="mt-2 space-y-1">
      {teams.length === 0 ? (
        <p className="text-xs text-[#999] italic">No teams added yet — will show team rosters here.</p>
      ) : (
        teams.map(t => (
          <div key={t.id} className="flex items-center gap-2 text-xs text-[#666]">
            <Users size={11} className="text-[#E91E8C] shrink-0" />
            <span className="font-medium text-[#1C1C1C]">{t.name}</span>
            <span className="text-[#999]">({t.role === 'HOME' ? 'Home' : 'Visiting'} · {t.skaters?.length ?? 0} skaters)</span>
          </div>
        ))
      )}
    </div>
  )
}

function AutoSchedulePreview({ game }) {
  const blocks = game.timingBlocks ?? []
  const matches = game.matches ?? []
  return (
    <div className="mt-2 space-y-1">
      {blocks.length === 0 && matches.length === 0 ? (
        <p className="text-xs text-[#999] italic">No schedule added yet — timing blocks and bouts will appear here.</p>
      ) : (
        <>
          {blocks.map(b => (
            <div key={b.id} className="flex items-center gap-2 text-xs text-[#666]">
              <Clock size={11} className="text-[#E91E8C] shrink-0" />
              <span className="font-mono text-[#1C1C1C]">{b.time}</span>
              <span>{b.activity}</span>
            </div>
          ))}
          {matches.map((m, i) => (
            <div key={m.id} className="flex items-center gap-2 text-xs text-[#666]">
              <Clock size={11} className="text-[#999] shrink-0" />
              <span className="font-mono text-[#1C1C1C]">{m.scheduledTime ? new Date(m.scheduledTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : `Bout ${i + 1}`}</span>
              <span>{m.homeTeam} <span className="text-[#E91E8C] font-semibold">vs</span> {m.awayTeam}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function InfoPackTab({ game, onRefresh }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editSection, setEditSection] = useState(null)

  const sections = game.publicSections ?? []
  const base = window.location.origin

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['game', game.id] })
    onRefresh()
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, visible }) => updateInfoSection(game.id, id, { visible }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['game', game.id] }); onRefresh() },
    onError: () => toast.error('Failed to update visibility'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteInfoSection(game.id, id),
    onSuccess: () => {
      toast.success('Section deleted')
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
      onRefresh()
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to delete section'),
  })

  const handleDelete = (section) => {
    if (!confirm(`Delete section "${section.title}"?`)) return
    deleteMutation.mutate(section.id)
  }

  const openAdd = () => { setEditSection(null); setModalOpen(true) }
  const openEdit = (s) => { setEditSection(s); setModalOpen(true) }

  const isAuto = (s) => s.sectionType === 'AUTO_TEAMS' || s.sectionType === 'AUTO_SCHEDULE'

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-display uppercase tracking-wider">Info Pack</h2>
          <p className="text-sm text-[#999] mt-0.5">
            Sections shown on the public event page, linked from guest and volunteer portals.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`${base}/p/${game.publicToken}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#EAEAE4] rounded-lg text-xs font-medium text-[#666] hover:border-[#E91E8C] hover:text-[#E91E8C] transition-colors bg-white"
          >
            <BookOpen size={13} /> Preview Info Pack
          </a>
          <Button onClick={openAdd} size="sm">
            <Plus size={14} /> Add section
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white border border-[#EAEAE4] rounded-xl p-10 text-center">
          <p className="text-sm text-[#999] mb-4">No info pack sections yet.</p>
          <Button onClick={openAdd} size="sm" variant="ghost">
            <Plus size={14} /> Add your first section
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const auto = isAuto(section)
            return (
              <div
                key={section.id}
                className={`bg-white border rounded-xl p-4 ${
                  auto
                    ? 'border-[#E91E8C]/20 bg-[#fdf5f9]'
                    : section.visible
                      ? 'border-[#EAEAE4]'
                      : 'border-dashed border-[#D0D0C8] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {section.imageUrl && !auto && (
                    <img
                      src={section.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#EAEAE4]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-sm text-[#1C1C1C]">{section.title}</p>
                      {auto && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#E91E8C]/10 text-[#E91E8C] px-1.5 py-0.5 rounded font-medium">
                          <Lock size={9} />
                          {section.sectionType === 'AUTO_TEAMS' ? 'Auto · Teams' : 'Auto · Schedule'}
                        </span>
                      )}
                      {!auto && !section.visible && (
                        <span className="text-xs bg-[#F0F0EB] text-[#999] px-1.5 py-0.5 rounded">Hidden</span>
                      )}
                    </div>
                    {auto ? (
                      section.sectionType === 'AUTO_TEAMS'
                        ? <AutoTeamsPreview game={game} />
                        : <AutoSchedulePreview game={game} />
                    ) : (
                      section.content && (
                        <p className="text-xs text-[#666] line-clamp-2 whitespace-pre-wrap">{section.content}</p>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!auto && (
                      <button
                        onClick={() => toggleMutation.mutate({ id: section.id, visible: !section.visible })}
                        className="p-1.5 text-[#999] hover:text-[#1C1C1C] transition-colors rounded"
                        title={section.visible ? 'Hide from public page' : 'Show on public page'}
                      >
                        {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(section)}
                      className="p-1.5 text-[#999] hover:text-[#E91E8C] transition-colors rounded"
                      title={auto ? 'Edit section title' : 'Edit section'}
                    >
                      <Pencil size={14} />
                    </button>
                    {!auto && (
                      <button
                        onClick={() => handleDelete(section)}
                        className="p-1.5 text-[#999] hover:text-red-500 transition-colors rounded"
                        title="Delete section"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <SectionModal
          key={editSection?.id ?? 'new'}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          gameId={game.id}
          section={editSection}
          onSuccess={onSuccess}
        />
      )}
    </div>
  )
}
