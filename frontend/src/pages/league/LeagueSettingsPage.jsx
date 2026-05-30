import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeague, updateLeague, deleteLeague } from '../../api/games'
import { useAuth } from '../../lib/auth'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import { Shield, ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeagueSettingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: league, isLoading, isError } = useQuery({
    queryKey: ['league', id],
    queryFn: () => getLeague(id),
    staleTime: 30_000,
  })

  const [form, setForm] = useState(null)
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  // Initialise form once league loads
  if (league && form === null) {
    setForm({
      name: league.name ?? '',
      description: league.description ?? '',
      slackUrl: league.slackUrl ?? '',
      discordUrl: league.discordUrl ?? '',
    })
  }

  const mutation = useMutation({
    mutationFn: (data) => updateLeague(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', id] })
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      toast.success('League settings saved')
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to save'),
  })

  // Delete league
  const [deleteGames, setDeleteGames] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const deleteMutation = useMutation({
    mutationFn: () => deleteLeague(id, deleteGames),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['league', id] })
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      toast.success('League deleted')
      navigate('/leagues')
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to delete league'),
  })

  const handleDelete = (e) => {
    e.preventDefault()
    if (confirmName !== league.name) {
      toast.error('League name does not match')
      return
    }
    deleteMutation.mutate()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || null,
      slackUrl: form.slackUrl.trim() || null,
      discordUrl: form.discordUrl.trim() || null,
    })
  }

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
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground text-sm">
          League not found or access denied.
        </div>
      </Layout>
    )
  }

  const isOwner = league.members.some(
    m => m.userId === user?.id && m.role === 'OWNER' && m.status === 'ACTIVE'
  ) || league.ownerId === user?.id

  if (!isOwner) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground text-sm">
          Only league owners can access settings.
        </div>
      </Layout>
    )
  }

  const inputClass = 'w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent bg-white'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/leagues/${id}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h1 className="text-xl font-display tracking-wider uppercase">{league.name} — Settings</h1>
          </div>
        </div>

        <div className="bg-white border border-[#EAEAE4] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                League name <span className="text-red-500">*</span>
              </label>
              <input
                value={form?.name ?? ''}
                onChange={set('name')}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description <span className="text-[#999] font-normal text-xs">(optional)</span>
              </label>
              <textarea
                value={form?.description ?? ''}
                onChange={set('description')}
                rows={3}
                className={inputClass}
                placeholder="What is this league about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Slack URL <span className="text-[#999] font-normal text-xs">(optional)</span>
              </label>
              <input
                type="url"
                value={form?.slackUrl ?? ''}
                onChange={set('slackUrl')}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Discord URL <span className="text-[#999] font-normal text-xs">(optional)</span>
              </label>
              <input
                type="url"
                value={form?.discordUrl ?? ''}
                onChange={set('discordUrl')}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={mutation.isPending}>
                Save changes
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(`/leagues/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* ── Danger Zone ── */}
        <div className="border-2 border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Danger Zone</h2>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 space-y-1">
                <p className="font-semibold">This action cannot be undone.</p>
                <p>Deleting this league will permanently remove all members, the blueprint, and all info pack templates. This cannot be reversed.</p>
              </div>
            </div>

            <form onSubmit={handleDelete} className="space-y-4">
              {/* What happens to games */}
              <div>
                <p className="text-sm font-medium mb-2">What should happen to this league&apos;s games?</p>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="deleteGames"
                      checked={!deleteGames}
                      onChange={() => setDeleteGames(false)}
                      className="mt-0.5 accent-red-600 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium">Keep games — unlink from this league</p>
                      <p className="text-xs text-[#666]">Games will remain in the system and be accessible to their owners, but will no longer be associated with this league.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="deleteGames"
                      checked={deleteGames}
                      onChange={() => setDeleteGames(true)}
                      className="mt-0.5 accent-red-600 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-red-700">Delete all games too</p>
                      <p className="text-xs text-[#666]">
                        All {league.games?.length ?? 0} game{(league.games?.length ?? 0) !== 1 ? 's' : ''} belonging to this league — including all tasks, rosters, matches, and data — will be permanently deleted.{' '}
                        <span className="font-semibold text-red-600">This cannot be undone.</span>
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Confirm by typing name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Type <span className="font-mono bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-red-700">{league.name}</span> to confirm
                </label>
                <input
                  value={confirmName}
                  onChange={e => setConfirmName(e.target.value)}
                  placeholder={league.name}
                  className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={confirmName !== league.name || deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Trash2 size={15} />
                {deleteMutation.isPending ? 'Deleting…' : deleteGames ? 'Delete league and all games' : 'Delete league'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
