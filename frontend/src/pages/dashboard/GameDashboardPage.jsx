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
  { id: 'Pre-Bout',   label: 'PRE-BOUT',    icon: ClipboardList },
  { id: 'On the Day', label: 'ON THE DAY',   icon: Calendar },
  { id: 'Rosters',    label: 'ROSTERS',      icon: Users },
  { id: 'Matches',    label: 'MATCHES',      icon: Trophy },
  { id: 'Settings',   label: 'SETTINGS',     icon: Settings },
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
      className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors px-2.5 py-1 rounded-md hover:bg-white/10 border border-white/20"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {label}
    </button>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
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
        <div className="h-20 bg-[#E91E8C] animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-96 bg-white border border-[#E8E8E2] rounded-xl animate-pulse" />
        </div>
      </Layout>
    )
  }

  if (isError || !game) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-[#999] text-sm">Game not found or you don&apos;t have access.</p>
        </div>
      </Layout>
    )
  }

  const isTournament = game.eventType === 'TOURNAMENT'

  return (
    <Layout>
      {/* Pink event title bar */}
      <div className="bg-[#E91E8C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                  {isTournament ? <Trophy size={10} /> : <Home size={10} />}
                  {isTournament ? 'Tournament' : 'Home Game'}
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white leading-tight"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {game.title}
              </h1>
              {game.eventDate && (
                <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatDate(game.eventDate)}
                  {game.venueName ? ` · ${game.venueName}` : ''}
                </p>
              )}
            </div>

            {/* Share links */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-white/60 font-medium">Share:</span>
              <CopyLinkButton label="Guest Team" url={`${base}/g/${game.guestToken}`} />
              <CopyLinkButton label="Public" url={`${base}/p/${game.publicToken}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="bg-white border-b border-[#E8E8E2] sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-4 text-xs sm:text-sm font-medium tracking-wider whitespace-nowrap border-b-[3px] transition-colors ${
                  activeTab === tabId
                    ? 'border-[#E91E8C] text-[#E91E8C]'
                    : 'border-transparent text-[#999] hover:text-[#1C1C1C] hover:border-[#E8E8E2]'
                }`}
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'Pre-Bout'   && <PreBoutTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'On the Day' && <OnTheDayTab  game={game} onRefresh={onRefresh} />}
        {activeTab === 'Rosters'    && <RostersTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'Matches'    && <MatchesTab   game={game} onRefresh={onRefresh} />}
        {activeTab === 'Settings'   && <SettingsTab  game={game} onRefresh={onRefresh} />}
      </div>
    </Layout>
  )
}
