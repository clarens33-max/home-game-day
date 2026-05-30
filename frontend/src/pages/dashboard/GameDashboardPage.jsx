import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGame } from '../../api/games'
import { useAuth } from '../../lib/auth'
import Layout from '../../components/Layout'
import PreBoutTab from './tabs/PreBoutTab'
import OnTheDayTab from './tabs/OnTheDayTab'
import RostersTab from './tabs/RostersTab'
import MatchesTab from './tabs/MatchesTab'
import SettingsTab from './tabs/SettingsTab'
import { Trophy, Home, Copy, Check, Calendar, ClipboardList, Users, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'Pre-Bout',   label: 'PRE-BOUT',  icon: ClipboardList },
  { id: 'On the Day', label: 'ON THE DAY', icon: Calendar },
  { id: 'Rosters',    label: 'ROSTERS',    icon: Users },
  { id: 'Matches',    label: 'MATCHES',    icon: Trophy },
  { id: 'Settings',   label: 'SETTINGS',   icon: Settings },
]

function CopyLinkButton({ label, url }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success(`${label} link copied!`)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/15 rounded text-sm transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-primary-foreground" /> : <Copy className="w-3.5 h-3.5 text-primary-foreground/70" />}
      <span className="text-primary-foreground/70 text-xs">{label}</span>
    </button>
  )
}

export default function GameDashboardPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('Pre-Bout')

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ['game', id],
    queryFn: () => getGame(id),
  })

  const onRefresh = () => queryClient.invalidateQueries({ queryKey: ['game', id] })
  const base = window.location.origin

  if (isLoading) {
    return (
      <Layout>
        <div className="h-24 bg-primary animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
        </div>
      </Layout>
    )
  }

  if (isError || !game) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-muted-foreground text-sm">Game not found or you don&apos;t have access.</p>
        </div>
      </Layout>
    )
  }

  const isTournament = game.eventType === 'TOURNAMENT'

  return (
    <Layout>
      {/* Event Title Bar — exact v0 */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground/90">
                  {isTournament ? <Trophy className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                  {isTournament ? 'Tournament' : 'Home Game'}
                </span>
                <span className="text-xs text-primary-foreground/70">{game.homeTeamName}</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wide uppercase text-primary-foreground">
                {game.title}
              </h1>
              {game.eventDate && (
                <div className="flex items-center gap-2 text-primary-foreground/90 mt-0.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {new Date(game.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {game.venueName ? ` · ${game.venueName}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-primary-foreground/60">Share:</span>
              <CopyLinkButton label="Guest Team" url={`${base}/g/${game.guestToken}`} />
              <CopyLinkButton label="Public" url={`${base}/p/${game.publicToken}`} />
              <CopyLinkButton label="Pre-Bout Volunteers" url={`${base}/v/${game.volunteerToken}`} />
              <CopyLinkButton label="On-the-Day Volunteers" url={`${base}/otd/${game.onTheDayToken}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — exact v0 */}
      <div className="bg-card border-b border-border sticky top-[74px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 font-display text-sm tracking-wider whitespace-nowrap transition-colors border-b-[3px] ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content — exact v0 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'Pre-Bout'   && <PreBoutTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'On the Day' && <OnTheDayTab  game={game} onRefresh={onRefresh} />}
        {activeTab === 'Rosters'    && <RostersTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'Matches'    && <MatchesTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'Settings'   && <SettingsTab  game={game} onRefresh={onRefresh} currentUserId={user?.id} />}
      </main>
    </Layout>
  )
}
