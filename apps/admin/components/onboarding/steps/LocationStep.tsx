'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export default function LocationStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!address.trim()) { setError('Adres gerekli'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tenant-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAddress: address.trim(),
          location: {
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
          },
        }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      onComplete('location');
      onNext();
    } catch {
      setError('Konum bilgisi kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Müşterilerinizin sizi bulabilmesi için adres bilgilerini girin.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Mahalle, cadde, sokak, bina no, daire no, ilçe, il"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enlem (opsiyonel)</label>
          <input
            type="text"
            value={latitude}
            onChange={e => setLatitude(e.target.value)}
            placeholder="Örn: 41.0082"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boylam (opsiyonel)</label>
          <input
            type="text"
            value={longitude}
            onChange={e => setLongitude(e.target.value)}
            placeholder="Örn: 28.9784"
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
        {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam'}
      </button>
    </div>
  );
}
