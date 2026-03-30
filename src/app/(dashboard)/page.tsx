'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scenario } from '@/types/scenario'
import { loadScenarios, deleteScenario, saveScenario, DEMO_SCENARIO } from '@/lib/scenarioStorage'
import { getCompletionStats } from '@/lib/scenarioUtils'
import { useOnboarding } from '@/hooks/useOnboarding'
import WelcomeModal from '@/components/onboarding/WelcomeModal'
import ScenarioWizard from '@/components/onboarding/ScenarioWizard'
import ScenarioTaskCard from '@/components/dashboard/ScenarioTaskCard'

export default function HomePage() {
  const router = useRouter()
  const { hasVisited, markVisited } = useOnboarding()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    setScenarios(loadScenarios())
  }, [])

  const { completed, inProgress, pct } = getCompletionStats(scenarios)

  const openWizard = () => setWizardOpen(true)

  const handleWizardComplete = ({
    category,
    title,
    useTemplate,
  }: {
    category: Scenario['category']
    title: string
    useTemplate: boolean
  }) => {
    const id = `scenario-${Date.now()}`
    const now = new Date().toISOString()
    const scenario: Scenario = useTemplate
      ? { ...DEMO_SCENARIO, id, title, category, createdAt: now, updatedAt: now }
      : { id, title, category, blocks: [], startBlockId: null, createdAt: now, updatedAt: now }
    saveScenario(scenario)
    router.push(`/editor/${id}`)
  }

  const handleDelete = (id: string) => {
    if (!confirm('このシナリオを削除しますか？')) return
    deleteScenario(id)
    setScenarios(loadScenarios())
  }

  return (
    <div className="min-h-full">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7">
        <h1 className="text-2xl font-bold text-white">おはようございます 👋</h1>
        <p className="text-blue-200 text-sm mt-1">行政手続きナビゲーター管理ダッシュボード</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
            {scenarios.length} シナリオ
          </span>
          <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
            {completed} 完了
          </span>
          <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
            {inProgress} 作成中
          </span>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Progress overview card */}
        {scenarios.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">全体の進捗</span>
              <span className="text-sm text-gray-500">{completed} / {scenarios.length} 完了</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{pct}% 完了</p>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            シナリオ一覧
            <span className="ml-2 text-sm font-normal text-gray-400">({scenarios.length}件)</span>
          </h2>
          <button
            onClick={openWizard}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
              px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            + 新規作成
          </button>
        </div>

        {/* Scenario task cards */}
        {scenarios.length === 0 && hasVisited ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 mb-5">シナリオがまだありません。最初のシナリオを作ってみましょう！</p>
            <button
              onClick={openWizard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              最初のシナリオを作る →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
            {scenarios.map((s) => (
              <ScenarioTaskCard key={s.id} scenario={s} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Welcome modal (first visit) */}
      {!hasVisited && (
        <WelcomeModal
          onStart={() => { markVisited(); openWizard() }}
          onSkip={markVisited}
        />
      )}

      {/* Scenario creation wizard */}
      {wizardOpen && (
        <ScenarioWizard
          onComplete={handleWizardComplete}
          onCancel={() => setWizardOpen(false)}
        />
      )}
    </div>
  )
}
