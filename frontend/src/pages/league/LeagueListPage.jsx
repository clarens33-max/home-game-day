import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeagues, searchLeagues, joinLeague } from '../../api/games'
import Layout from '../../components/Layout'
import Button from '../../components/Button'
import { Shield, Plus, Users, Search, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function useDebounce(value, ms = 400) {
  const [debounced, setDebounced] = useState(value)
  useState(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  })
  return debounced
}

export default function LeagueListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQ, setSearchQ] = useState('')
  const debouncedQ = useDebounce(searchQ)

  const { data: myLeagues = [], isLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: getLeagues,
    staleTime: 30_000,
  })

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['leagues', 'search', debouncedQ],
    queryFn: () => searchLeagues(debouncedQ),
    enabled: debouncedQ.length >= 2,
    staleTime: 10_000,
  })

  const joinMutation = useMutation({
    mutationFn: joinLeague,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      toast.success('Join request sent!')
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to send request'),
  })

  const myLeagueIds = new Set(myLeagues.map(l => l.league.id))

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display tracking-wider uppercase">My Leagues</h1>
            <p className="text-muted-foreground text-sm mt-1">Your roller derby club connections</p>
          </div>
          <Button onClick={() => navigate('/leagues/new')}>
            <Plus size={16} /> Create League
          </Button>
        </div>

        {/* My leagues */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myLeagues.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
            <Shield size={32} className="mx-auto mb-3 opacity-30" />
            You're not in any league yet. Create one or search below to join.
          </div>
        ) : (
          <div className="space-y-3">
            {myLeagues.map(({ league, role, status }) => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}`}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <Shield size={28} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{league.name}</p>
                  {league.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{league.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {league._count?.members ?? 0} member{league._count?.members !== 1 ? 's' : ''} · {league._count?.games ?? 0} game{league._count?.games !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Clock size={11} /> Pending
                    </span>
                  ) : role === 'OWNER' ? (
                    <span className="text-xs text-primary font-medium">Owner</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Member</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Search / join another league */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
            Find a League to Join
          </h2>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by league name…"
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
            />
          </div>

          {debouncedQ.length >= 2 && (
            <div className="space-y-2">
              {searching && (
                <p className="text-xs text-muted-foreground text-center py-2">Searching…</p>
              )}
              {!searching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No leagues found. Want to <Link to="/leagues/new" className="text-primary hover:underline">create one</Link>?</p>
              )}
              {searchResults.map(league => {
                const alreadyMember = myLeagueIds.has(league.id)
                return (
                  <div key={league.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                    <Shield size={22} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{league.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {league._count?.members ?? 0} active member{league._count?.members !== 1 ? 's' : ''} · owned by {league.owner?.name}
                      </p>
                    </div>
                    {alreadyMember ? (
                      <span className="text-xs text-muted-foreground">Already joined</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => joinMutation.mutate(league.id)}
                        loading={joinMutation.isPending && joinMutation.variables === league.id}
                      >
                        <Users size={13} /> Request to Join
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
