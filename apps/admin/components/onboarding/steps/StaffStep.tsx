'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export default function StaffStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!firstName.trim()) { setError('Ad gerekli'); return; }
    if (!lastName.trim()) { setError('Soyad gerekli'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          position: 'Personel',
          status: 'active',
          canLogin: false,
          role: 'staff',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kaydedilemedi');
      }
      onComplete('staff');
      onNext();
    } catch (err: any) {
      setError(err.message || 'Personel eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Randevularda görevlendirilecek bir personel ekleyin. Daha fazlasını sonra ekleyebilirsiniz.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Ad"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Soyad"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="05XX XXX XX XX"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Ekleniyor...' : 'Personel Ekle ve Devam'}
      </button>
    </div>
  );
}
