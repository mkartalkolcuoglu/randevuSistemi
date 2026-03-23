'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Clock, Scissors, UserPlus, MapPin, Bell, Palette, FileText } from 'lucide-react';
import WorkingHoursStep from './steps/WorkingHoursStep';
import ServiceStep from './steps/ServiceStep';
import StaffStep from './steps/StaffStep';
import LocationStep from './steps/LocationStep';
import NotificationStep from './steps/NotificationStep';
import ThemeStep from './steps/ThemeStep';
import DocumentsStep from './steps/DocumentsStep';

const BASE_STEPS = [
  { key: 'workingHours', title: 'Çalışma Saatleri', icon: Clock, description: 'İşletmenizin açık olduğu saatleri belirleyin' },
  { key: 'services', title: 'İlk Hizmetiniz', icon: Scissors, description: 'Sunduğunuz hizmetleri ekleyin' },
  { key: 'staff', title: 'İlk Personeliniz', icon: UserPlus, description: 'Çalışanlarınızı ekleyin' },
  { key: 'location', title: 'Konum Bilgisi', icon: MapPin, description: 'İşletmenizin adresini girin' },
  { key: 'notifications', title: 'Bildirim Tercihleri', icon: Bell, description: 'Bildirim kanallarını ayarlayın' },
  { key: 'theme', title: 'Tema & Logo', icon: Palette, description: 'İşletmenizin görünümünü özelleştirin' },
];

const DOCUMENTS_STEP = { key: 'documents', title: 'Belgeler', icon: FileText, description: 'Kredi kartı ödemesi için gerekli belgeleri yükleyin' };

interface OnboardingWizardProps {
  completedSteps: string[];
  cardPaymentEnabled: boolean;
  onDismiss: () => void;
  onComplete: () => void;
}

export default function OnboardingWizard({ completedSteps: initialCompleted, cardPaymentEnabled, onDismiss, onComplete }: OnboardingWizardProps) {
  const STEPS = cardPaymentEnabled ? [...BASE_STEPS, DOCUMENTS_STEP] : BASE_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>(initialCompleted);
  const [saving, setSaving] = useState(false);

  // Start from first incomplete step
  useEffect(() => {
    const firstIncomplete = STEPS.findIndex(s => !initialCompleted.includes(s.key));
    if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
  }, [initialCompleted, STEPS]);

  const handleStepComplete = useCallback((stepKey: string) => {
    setCompletedSteps(prev => {
      const updated = prev.includes(stepKey) ? prev : [...prev, stepKey];
      if (updated.length === STEPS.length) {
        setTimeout(onComplete, 500);
      }
      return updated;
    });
  }, [onComplete]);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onDismiss();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const progress = Math.round((completedSteps.length / STEPS.length) * 100);
  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  const renderStep = () => {
    const props = { onComplete: handleStepComplete, onNext: goNext, saving, setSaving };
    switch (step.key) {
      case 'workingHours': return <WorkingHoursStep {...props} />;
      case 'services': return <ServiceStep {...props} />;
      case 'staff': return <StaffStep {...props} />;
      case 'location': return <LocationStep {...props} />;
      case 'notifications': return <NotificationStep {...props} />;
      case 'theme': return <ThemeStep {...props} />;
      case 'documents': return <DocumentsStep {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">İşletme Kurulumu</h2>
              <p className="text-sm text-gray-500">Adım {currentStep + 1} / {STEPS.length}</p>
            </div>
            <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {STEPS.map((s, i) => {
              const isCompleted = completedSteps.includes(s.key);
              const isCurrent = i === currentStep;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setCurrentStep(i)}
                  className={`flex flex-col items-center group ${isCurrent ? 'scale-110' : ''} transition-transform`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] mt-1 hidden sm:block ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {s.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <StepIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Önceki
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Sonra Tamamla
            </button>
            <button
              onClick={goNext}
              className="flex items-center px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {currentStep === STEPS.length - 1 ? 'Bitir' : 'Sonraki'} <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
