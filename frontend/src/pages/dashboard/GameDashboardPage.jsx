import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGame } from '../../api/games'
import Layout from '../../components/Layout'
import PreBoutTab from './tabs/PreBoutTab'
import OnTheDayTab from './tabs/OnTheDayTab'
import RostersTab from './tabs/RostersTab'
import MatchesTab from './tabs/MatchesTab'
import SettingsTab from './tabs/SettingsTab'
import { Trophy, Home, Copy, Check, Calendar, ClipboardList, Users, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
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
      className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors border border-white/30 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {label}
    </button>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GameDashboardPage() {
  const { id } = useParams()
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
        <div className="h-24 bg-[#E91E8C] animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-96 bg-white border border-[#E2E2DC] rounded-lg animate-pulse" />
        </div>
      </Layout>
    )
  }

  if (isError || !game) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-[#666] text-sm">Game not found or you don&apos;t have access.</p>
        </div>
      </Layout>
    )
  }

  const isTournament = game.eventType === 'TOURNAMENT'

  return (
    <Layout>
      {/* Pink event title bar */}
      <div style={{ backgroundColor: '#E91E8C' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                  {isTournament ? <Trophy className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                  {isTournament ? 'Tournament' : 'Home Game'}
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {game.title}
              </h1>
              {game.eventDate && (
                <div className="flex items-center gap-2 text-white/80 mt-0.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatDate(game.eventDate)}
                    {game.venueName ? ` · ${game.venueName}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-white/60">Share:</span>
              <CopyLinkButton label="Guest Team" url={`${base}/g/${game.guestToken}`} />
              <CopyLinkButton label="Public" url={`${base}/p/${game.publicToken}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="bg-white border-b border-[#E2E2DC] sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto -mb-px">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                style={{ fontFamily: 'Oswald, sans-serif' }}
                className={`flex items-center gap-2 px-4 py-4 text-sm tracking-wider whitespace-nowrap border-b-[3px] transition-colors ${
                  activeTab === tabId
                    ? 'border-[#E91E8C] text-[#E91E8C]'
                    : 'border-transparent text-[#666] hover:text-[#1C1C1C] hover:border-[#EAEAE0]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'Pre-Bout'   && <PreBoutTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'On the Day' && <OnTheDayTab  game={game} onRefresh={onRefresh} />}
        {activeTab === 'Rosters'    && <RostersTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'Matches'    && <MatchesTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'Settings'   && <SettingsTab  game={game} onRefresh={onRefresh} />}
      </main>
    </Layout>
  )
}
