import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createLeague } from '../../api/games'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import toast from 'react-hot-toast'

export default function CreateLeaguePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', description: '', slackUrl: '', discordUrl: '' })

  const mutation = useMutation({
    mutationFn: createLeague,
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      toast.success('League created!')
      navigate(`/leagues/${league.id}`)
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to create league'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    mutation.mutate(form)
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-display tracking-wider uppercase">Create a League</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A league maps to your roller derby club — you'll invite members and manage a shared game blueprint.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">League name *</label>
            <input
              autoFocus
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Badlands Brawl Roller Derby"
              required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="A short description of your league…"
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Slack URL</label>
              <input
                value={form.slackUrl}
                onChange={set('slackUrl')}
                placeholder="https://…"
                type="url"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Discord URL</label>
              <input
                value={form.discordUrl}
                onChange={set('discordUrl')}
                placeholder="https://discord.gg/…"
                type="url"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending}>Create League</Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/leagues')}>Cancel</Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
