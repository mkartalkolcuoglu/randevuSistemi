'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export default function ServiceStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Hizmet adı gerekli'); return; }
    if (!price.trim()) { setError('Fiyat gerekli'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          duration: parseInt(duration),
          price: parseFloat(price),
          status: 'active',
          category: 'Genel',
        }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      onComplete('services');
      onNext();
    } catch {
      setError('Hizmet eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Müşterilerinize sunduğunuz bir hizmet ekleyin. Daha fazla hizmeti sonra ekleyebilirsiniz.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Adı *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Örn: Saç Kesimi, Manikür, Masaj"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dakika) *</label>
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {[15, 30, 45, 60, 75, 90, 120].map(m => (
              <option key={m} value={m}>{m} dk</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL) *</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Ekleniyor...' : 'Hizmet Ekle ve Devam'}
      </button>
    </div>
  );
}
