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
import { Trophy, Home, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['Pre-Bout', 'On the Day', 'Rosters', 'Matches', 'Settings']

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
      className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#E91E8C] transition-colors px-2 py-1 rounded-md hover:bg-[#F7F7F5]"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-8 bg-[#EAEAE4] rounded-lg animate-pulse w-72" />
          <div className="h-4 bg-[#EAEAE4] rounded animate-pulse w-48" />
          <div className="h-96 bg-white border border-[#EAEAE4] rounded-xl animate-pulse mt-6" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Game header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                isTournament ? 'bg-amber-100 text-amber-700' : 'bg-[#E91E8C]/10 text-[#E91E8C]'
              }`}>
                {isTournament ? <Trophy size={12} /> : <Home size={12} />}
                {isTournament ? 'Tournament' : 'Home Game'}
              </span>
              <span className="text-xs text-[#999]">{game.homeTeamName}</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] leading-tight"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              {game.title}
            </h1>
            {game.eventDate && (
              <p className="text-sm text-[#999] mt-1">{formatDate(game.eventDate)}{game.venueName ? ` · ${game.venueName}` : ''}</p>
            )}
          </div>

          {/* Quick share links */}
          <div className="flex items-center gap-1 bg-white border border-[#EAEAE4] rounded-lg px-2 py-1.5">
            <span className="text-xs text-[#999] px-1 font-medium">Share:</span>
            <CopyLinkButton label="Guest Team" url={`${base}/g/${game.guestToken}`} />
            <span className="text-[#EAEAE4]">|</span>
            <CopyLinkButton label="Public" url={`${base}/p/${game.publicToken}`} />
          </div>
        </div>

        {/* Tab nav */}
        <div className="bg-white border border-[#EAEAE4] rounded-xl overflow-hidden">
          <div className="flex border-b border-[#EAEAE4] overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-[#E91E8C] text-[#E91E8C]'
                    : 'border-transparent text-[#999] hover:text-[#1C1C1C] hover:border-[#EAEAE4]'
                }`}
                style={activeTab === tab ? { fontFamily: 'Oswald, sans-serif', letterSpacing: '0.04em' } : {}}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5 sm:p-6">
            {activeTab === 'Pre-Bout'   && <PreBoutTab   game={game} onRefresh={onRefresh} />}
            {activeTab === 'On the Day' && <OnTheDayTab  game={game} onRefresh={onRefresh} />}
            {activeTab === 'Rosters'    && <RostersTab   game={game} onRefresh={onRefresh} />}
            {activeTab === 'Matches'    && <MatchesTab   game={game} onRefresh={onRefresh} />}
            {activeTab === 'Settings'   && <SettingsTab  game={game} onRefresh={onRefresh} />}
          </div>
        </div>
      </div>
    </Layout>
  )
}
