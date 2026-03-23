'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

const DAYS = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAY_LABELS: Record<string, string> = {
  Pazartesi: 'Pazartesi', Sali: 'Salı', Carsamba: 'Çarşamba',
  Persembe: 'Perşembe', Cuma: 'Cuma', Cumartesi: 'Cumartesi', Pazar: 'Pazar',
};

interface DayHours { start: string; end: string; closed: boolean; }

export default function WorkingHoursStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const h: Record<string, DayHours> = {};
    DAYS.forEach(d => {
      h[d] = d === 'Pazar'
        ? { start: '09:00', end: '17:00', closed: true }
        : { start: '09:00', end: '18:00', closed: false };
    });
    return h;
  });
  const [error, setError] = useState('');

  const updateDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tenant-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingHours: hours }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      onComplete('workingHours');
      onNext();
    } catch {
      setError('Çalışma saatleri kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {DAYS.map(day => (
        <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 w-28 shrink-0">
            <input
              type="checkbox"
              checked={!hours[day].closed}
              onChange={e => updateDay(day, 'closed', !e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className={`text-sm font-medium ${hours[day].closed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {DAY_LABELS[day]}
            </span>
          </label>
          {!hours[day].closed ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={hours[day].start}
                onChange={e => updateDay(day, 'start', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="time"
                value={hours[day].end}
                onChange={e => updateDay(day, 'end', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
            </div>
          ) : (
            <span className="text-sm text-gray-400">Kapalı</span>
          )}
        </div>
      ))}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam'}
      </button>
    </div>
  );
}
