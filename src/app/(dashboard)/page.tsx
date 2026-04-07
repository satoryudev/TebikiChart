'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scenario } from '@/types/scenario'
import { loadScenarios, deleteScenario, saveScenario, DEMO_SCENARIO } from '@/lib/scenarioStorage'
import { useOnboarding } from '@/hooks/useOnboarding'
import WelcomeModal from '@/components/onboarding/WelcomeModal'
import ScenarioWizard from '@/components/onboarding/ScenarioWizard'
import ScenarioTaskCard from '@/components/dashboard/ScenarioTaskCard'

export default function HomePage() {
  const router = useRouter()
  const { hasVisited, markVisited, resetOnboarding } = useOnboarding()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [wizardOpen, setWizardOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    setScenarios(loadScenarios())
  }, [])

  useEffect(() => {
    const handler = () => setWelcomeOpen(true)
    document.addEventListener('govguide:open-onboarding', handler)
    return () => document.removeEventListener('govguide:open-onboarding', handler)
  }, [])

  const openWizard = () => setWizardOpen(true)

  const handleWizardComplete = ({
    title,
    useTemplate,
  }: {
    title: string
    useTemplate: boolean
  }) => {
    const id = `scenario-${Date.now()}`
    const now = new Date().toISOString()
    const startId = `block-${Date.now()}-start`
    const endId = `block-${Date.now()}-end`
    const category: Scenario['category'] = 'moving'
    const scenario: Scenario = useTemplate
      ? { ...DEMO_SCENARIO, id, title, category, createdAt: now, updatedAt: now }
      : {
          id, title, category, createdAt: now, updatedAt: now,
          startBlockId: startId,
          blocks: [
            { id: startId, type: 'start', nextId: endId },
            { id: endId,   type: 'end' },
          ],
        }
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
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            シナリオ一覧
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">({scenarios.length}件)</span>
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
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 dark:text-gray-400 mb-5">シナリオがまだありません。最初のシナリオを作ってみましょう！</p>
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

      {/* Welcome modal (first visit or triggered from sidebar) */}
      {(!hasVisited || welcomeOpen) && (
        <WelcomeModal
          onStart={() => { resetOnboarding(); markVisited(); setWelcomeOpen(false); openWizard() }}
          onSkip={() => { markVisited(); setWelcomeOpen(false) }}
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
