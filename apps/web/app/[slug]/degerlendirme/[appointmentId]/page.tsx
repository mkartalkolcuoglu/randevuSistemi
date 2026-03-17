'use client';

import { useState, useEffect, use } from 'react';
import { Star, CheckCircle, AlertCircle, Calendar, Clock, User, Scissors } from 'lucide-react';

interface AppointmentData {
  id: string;
  customerName: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  status: string;
  hasFeedback: boolean;
  tenant: {
    businessName: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
  } | null;
}

const RATING_LABELS = ['', 'Cok Kotu', 'Kotu', 'Orta', 'Iyi', 'Mukemmel'];

export default function DegerlendirmePage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; appointmentId: string }>;
}) {
  const params = use(paramsPromise);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchAppointment();
  }, []);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.appointmentId}/public`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Randevu bulunamadi');
        return;
      }

      // Verify tenant slug matches
      if (data.data.tenant?.slug !== params.slug) {
        setError('Gecersiz degerlendirme linki');
        return;
      }

      if (data.data.hasFeedback) {
        setSubmitted(true);
      }

      setAppointment(data.data);
    } catch (err) {
      setError('Bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Lutfen bir puan seciniz');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: params.appointmentId,
          customerName: appointment?.customerName,
          customerPhone: '',
          rating,
          comment: comment.trim() || undefined,
          serviceName: appointment?.serviceName,
          staffName: appointment?.staffName,
          appointmentDate: appointment?.date,
        }),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Geri bildirim gonderilemedi');
      }
    } catch (err) {
      setError('Bir hata olustu');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = appointment?.tenant?.primaryColor || '#163974';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tesekkurler!</h2>
          <p className="text-gray-600 mb-4">
            Geri bildiriminiz basariyla kaydedildi. Degerli gorusleriniz icin tesekkur ederiz.
          </p>
          <p className="text-sm text-gray-400">
            {appointment?.tenant?.businessName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          {appointment?.tenant?.logo && (
            <img
              src={appointment.tenant.logo}
              alt={appointment.tenant.businessName}
              className="h-16 w-16 rounded-full mx-auto mb-3 object-cover"
            />
          )}
          <h1 className="text-xl font-bold text-gray-900">
            {appointment?.tenant?.businessName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Randevu Degerlendirmesi</p>
        </div>

        {/* Appointment Info */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Randevu Bilgileri</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{appointment?.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{appointment?.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="h-4 w-4 text-gray-400" />
              <span>{appointment?.staffName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Scissors className="h-4 w-4 text-gray-400" />
              <span>{appointment?.serviceName}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Puanlamaniz</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className="h-10 w-10 transition-colors"
                  fill={(hoverRating || rating) >= star ? '#FBBF24' : 'none'}
                  stroke={(hoverRating || rating) >= star ? '#FBBF24' : '#D1D5DB'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <p className="text-center text-sm font-medium" style={{ color: primaryColor }}>
              {RATING_LABELS[hoverRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Yorumunuz (Istege Bagli)</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Deneyiminizi paylasın..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:border-transparent resize-none"
            style={{ ['--tw-ring-color' as string]: primaryColor } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400 text-right">{comment.length}/500</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {submitting ? 'Gonderiliyor...' : 'Degerlendirmeyi Gonder'}
        </button>

        <p className="text-center text-xs text-gray-400">
          {appointment?.customerName} olarak degerlendirme yapiyorsunuz
        </p>
      </div>
    </div>
  );
}
