'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export default function DocumentsStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [iban, setIban] = useState('');
  const [identityDocument, setIdentityDocument] = useState('');
  const [taxDocument, setTaxDocument] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tenant-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: {
            iban: iban.trim() || undefined,
            identityDocument: identityDocument.trim() || undefined,
            taxDocument: taxDocument.trim() || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      onComplete('documents');
      onNext();
    } catch {
      setError('Belgeler kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Kredi kartı ile ödeme almak için gerekli belge bilgilerini girin.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
        <input
          type="text"
          value={iban}
          onChange={e => setIban(e.target.value)}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kimlik Belge No</label>
        <input
          type="text"
          value={identityDocument}
          onChange={e => setIdentityDocument(e.target.value)}
          placeholder="TC Kimlik No veya Vergi Kimlik No"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
        <input
          type="text"
          value={taxDocument}
          onChange={e => setTaxDocument(e.target.value)}
          placeholder="Vergi dairesi adı"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
      >
        {saving ? 'Kaydediliyor...' : 'Tamamla'}
      </button>
    </div>
  );
}
