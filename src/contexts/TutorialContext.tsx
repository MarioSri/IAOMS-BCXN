import React, { createContext, useContext, ReactNode } from 'react';
import { useTutorial } from '@/hooks/useTutorial';

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  getCurrentStep: () => any;
  isCurrentRoute: (route: string) => boolean;
  navigateToCurrentStep: (navigate: (path: string) => void) => void;
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  steps: any[];
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const tutorial = useTutorial();

  return (
    <TutorialContext.Provider value={tutorial}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorialContext() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
}