'use client';

import { useState, useEffect } from 'react';

export const ONBOARDING_KEYS = {
  HAS_VISITED: 'tebiki-chart_has_visited',
  TOUR_COMPLETED: 'tebiki-chart_tour_completed',
  TOUR_STATE: 'tebiki-chart_tour_state',
} as const;

interface OnboardingState {
  hasVisited: boolean;
  tourCompleted: boolean;
  markVisited: () => void;
  completeTour: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): OnboardingState {
  const [hydrated, setHydrated] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    setHasVisited(localStorage.getItem(ONBOARDING_KEYS.HAS_VISITED) === 'true');
    setTourCompleted(localStorage.getItem(ONBOARDING_KEYS.TOUR_COMPLETED) === 'true');
    setHydrated(true);
  }, []);

  const markVisited = () => {
    localStorage.setItem(ONBOARDING_KEYS.HAS_VISITED, 'true');
    setHasVisited(true);
  };

  const completeTour = () => {
    localStorage.setItem(ONBOARDING_KEYS.TOUR_COMPLETED, 'true');
    setTourCompleted(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEYS.HAS_VISITED);
    localStorage.removeItem(ONBOARDING_KEYS.TOUR_COMPLETED);
    localStorage.removeItem(ONBOARDING_KEYS.TOUR_STATE);
    setHasVisited(false);
    setTourCompleted(false);
  };

  if (!hydrated) {
    return {
      hasVisited: false,
      tourCompleted: false,
      markVisited,
      completeTour,
      resetOnboarding,
    };
  }

  return { hasVisited, tourCompleted, markVisited, completeTour, resetOnboarding };
}
