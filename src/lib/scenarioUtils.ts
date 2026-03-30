import { Scenario } from '@/types/scenario'

export type ScenarioStatus = 'not_started' | 'in_progress' | 'completed'

export function getScenarioStatus(scenario: Scenario): ScenarioStatus {
  if (scenario.completedAt) return 'completed'
  if (scenario.blocks.length > 0) return 'in_progress'
  return 'not_started'
}

export function getCompletionStats(scenarios: Scenario[]) {
  const completed = scenarios.filter((s) => s.completedAt).length
  const inProgress = scenarios.filter((s) => !s.completedAt && s.blocks.length > 0).length
  const pct = scenarios.length > 0 ? Math.round((completed / scenarios.length) * 100) : 0
  return { completed, inProgress, pct }
}
