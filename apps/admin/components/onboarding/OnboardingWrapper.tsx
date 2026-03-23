'use client';

import { useState, useEffect } from 'react';
import OnboardingWizard from './OnboardingWizard';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingWrapperProps {
  tenantId: string;
  userType: string;
}

export default function OnboardingWrapper({ tenantId, userType }: OnboardingWrapperProps) {
  const [status, setStatus] = useState<{
    completed: boolean;
    completedSteps: string[];
    totalSteps: number;
  } | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (userType !== 'owner') return;

    const dismissedKey = `onboarding_dismissed_${tenantId}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true';

    fetch('/api/onboarding/status')
      .then(res => res.json())
      .then(data => {
        if (data.success && !data.completed) {
          setStatus(data);
          if (wasDismissed) {
            setDismissed(true);
          } else {
            setShowWizard(true);
          }
        }
      })
      .catch(() => {});
  }, [tenantId, userType]);

  const handleDismiss = () => {
    setShowWizard(false);
    setDismissed(true);
    localStorage.setItem(`onboarding_dismissed_${tenantId}`, 'true');
  };

  const handleComplete = () => {
    setShowWizard(false);
    setDismissed(false);
    setStatus(null);
    localStorage.removeItem(`onboarding_dismissed_${tenantId}`);
  };

  const handleReopen = () => {
    setShowWizard(true);
    setDismissed(false);
  };

  if (!status || status.completed) return null;

  const progress = Math.round((status.completedSteps.length / status.totalSteps) * 100);

  return (
    <>
      {/* Banner when wizard is dismissed */}
      {dismissed && !showWizard && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  İşletme kurulumunuz %{progress} tamamlandı
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {status.completedSteps.length}/{status.totalSteps} adım tamamlandı. Randevu almaya başlamak için kurulumu tamamlayın.
                </p>
              </div>
            </div>
            <button
              onClick={handleReopen}
              className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition shrink-0"
            >
              Devam Et <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Mini progress bar */}
          <div className="mt-3 w-full bg-amber-200 rounded-full h-1.5">
            <div
              className="bg-amber-600 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Wizard modal */}
      {showWizard && (
        <OnboardingWizard
          completedSteps={status.completedSteps}
          onDismiss={handleDismiss}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
