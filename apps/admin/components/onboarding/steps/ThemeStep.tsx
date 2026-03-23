'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export default function ThemeStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [primaryColor, setPrimaryColor] = useState('#163974');
  const [secondaryColor, setSecondaryColor] = useState('#0F2A52');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');

  const presetColors = [
    { primary: '#163974', secondary: '#0F2A52', name: 'Mavi' },
    { primary: '#065F46', secondary: '#064E3B', name: 'Yeşil' },
    { primary: '#7C3AED', secondary: '#6D28D9', name: 'Mor' },
    { primary: '#DC2626', secondary: '#B91C1C', name: 'Kırmızı' },
    { primary: '#D97706', secondary: '#B45309', name: 'Turuncu' },
    { primary: '#111827', secondary: '#1F2937', name: 'Koyu' },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tenant-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeSettings: {
            primaryColor,
            secondaryColor,
            logo: logoUrl || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      onComplete('theme');
      onNext();
    } catch {
      setError('Tema kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">İşletmenizin renk temasını seçin ve logonuzu ekleyin.</p>

      {/* Preset colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hazır Temalar</label>
        <div className="grid grid-cols-3 gap-2">
          {presetColors.map(preset => (
            <button
              key={preset.name}
              onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); }}
              className={`p-3 rounded-lg border-2 transition ${primaryColor === preset.primary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                <span className="text-xs font-medium">{preset.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ana Renk</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İkincil Renk</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              className="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (opsiyonel)</label>
        <input
          type="url"
          value={logoUrl}
          onChange={e => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: primaryColor }}>
        <p className="text-white text-sm font-medium">Tema Önizleme</p>
        <p className="text-white/70 text-xs mt-1">İşletmeniz bu renklerle görünecek</p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam'}
      </button>
    </div>
  );
}
