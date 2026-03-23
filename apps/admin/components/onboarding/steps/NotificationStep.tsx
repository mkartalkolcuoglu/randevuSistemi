'use client';

import { useState } from 'react';

interface StepProps {
  onComplete: (key: string) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}

export default function NotificationStep({ onComplete, onNext, saving, setSaving }: StepProps) {
  const [confirmationChannel, setConfirmationChannel] = useState('whatsapp');
  const [reminderChannel, setReminderChannel] = useState('whatsapp');
  const [surveyChannel, setSurveyChannel] = useState('whatsapp');
  const [error, setError] = useState('');

  const channels = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'sms', label: 'SMS' },
    { value: 'smart', label: 'Akıllı (WhatsApp yoksa SMS)' },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tenant-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationSettings: {
            confirmationChannel,
            reminderChannel,
            surveyChannel,
            sendConfirmation: true,
            sendReminder: true,
            sendSurvey: true,
          },
        }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      onComplete('notifications');
      onNext();
    } catch {
      setError('Bildirim ayarları kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const ChannelSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {channels.map(ch => (
          <option key={ch.value} value={ch.value}>{ch.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Müşterilerinize gönderilecek bildirimlerin kanallarını seçin.</p>

      <div className="space-y-3">
        <ChannelSelect label="Randevu Onayı" value={confirmationChannel} onChange={setConfirmationChannel} />
        <ChannelSelect label="Randevu Hatırlatma" value={reminderChannel} onChange={setReminderChannel} />
        <ChannelSelect label="Memnuniyet Anketi" value={surveyChannel} onChange={setSurveyChannel} />
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
