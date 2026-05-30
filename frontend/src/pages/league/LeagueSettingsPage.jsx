import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeague, updateLeague } from '../../api/games'
import { useAuth } from '../../lib/auth'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import { Shield, ArrowLeft } from 'lucide-react'
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
      </div>
    </Layout>
  )
}
