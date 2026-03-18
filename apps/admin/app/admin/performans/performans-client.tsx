"use client";

import { useEffect, useState } from 'react';
import { Star, TrendingUp, MessageSquare, Users } from 'lucide-react';
import AdminHeader from '../admin-header';
import type { ClientUser } from '../../../lib/client-permissions';

interface PerformansClientProps {
  user: ClientUser;
}

interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  createdAt: string;
}

interface Stats {
  totalFeedbacks: number;
  averageRating: number;
  satisfactionRate?: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface StaffRating {
  name: string;
  averageRating: number;
  feedbackCount: number;
  recentFeedbacks: {
    id: string;
    rating: number;
    comment: string | null;
    customerName: string;
    serviceName: string;
    appointmentDate: string;
    createdAt: string;
  }[];
}

interface ServiceRating {
  name: string;
  averageRating: number;
  feedbackCount: number;
}

export default function PerformansClient({ user }: PerformansClientProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [staffRatings, setStaffRatings] = useState<StaffRating[]>([]);
  const [serviceRatings, setServiceRatings] = useState<ServiceRating[]>([]);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      console.log('📊 Fetching feedbacks...');
      const response = await fetch('/api/public/feedbacks');
      console.log('📡 Feedbacks response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Feedbacks data:', data);
      
      if (data.success) {
        setFeedbacks(data.data.feedbacks);
        setStats(data.data.stats);
        setStaffRatings(data.data.staffRatings || []);
        setServiceRatings(data.data.serviceRatings || []);
      } else {
        setError(data.error || 'Veriler yüklenemedi');
      }
    } catch (err) {
      console.error('❌ Error fetching feedbacks:', err);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getProgressPercentage = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Performans</h1>
            <p className="text-gray-600">Müşteri geri bildirimlerini ve değerlendirmelerinizi görüntüleyin</p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Ortalama Puan */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Ortalama Puan</p>
                  <p className="text-4xl font-bold mt-1">{stats.averageRating.toFixed(1)}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Star className="w-8 h-8" />
                </div>
              </div>
              <div className="flex items-center">
                {renderStars(Math.round(stats.averageRating))}
              </div>
            </div>

            {/* Toplam Feedback */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Toplam Değerlendirme</p>
                  <p className="text-4xl font-bold mt-1">{stats.totalFeedbacks}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <MessageSquare className="w-8 h-8" />
                </div>
              </div>
              <p className="text-blue-100 text-sm">Müşteri geri bildirimi</p>
            </div>

            {/* Memnuniyet Oranı */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-100 text-sm font-medium">Memnuniyet Oranı</p>
                  <p className="text-4xl font-bold mt-1">
                    {stats.totalFeedbacks > 0
                      ? Math.round(((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalFeedbacks) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
              <p className="text-green-100 text-sm">4-5 yıldız</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Yıldız Dağılımı */}
          {stats && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Puan Dağılımı</h2>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-12">{rating} yıldız</span>
                      <div className="flex-1 mx-3">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${getProgressPercentage(
                                stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution],
                                stats.totalFeedbacks
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedbackler Listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Son Değerlendirmeler</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {feedbacks.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Henüz geri bildirim bulunmuyor</p>
                  </div>
                ) : (
                  feedbacks.map((feedback) => (
                    <div key={feedback.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{feedback.customerName}</h3>
                          <p className="text-sm text-gray-500">{feedback.serviceName} - {feedback.staffName}</p>
                        </div>
                        <div className="text-right">
                          {renderStars(feedback.rating)}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(feedback.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                          "{feedback.comment}"
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Randevu Tarihi: {new Date(feedback.appointmentDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Personel Performansı */}
        {staffRatings.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Personel Performansı</h2>
              </div>
              <div className="divide-y">
                {staffRatings.map((staff) => (
                  <div key={staff.name}>
                    <button
                      onClick={() => setExpandedStaff(expandedStaff === staff.name ? null : staff.name)}
                      className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">{staff.name.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-500">{staff.feedbackCount} değerlendirme</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-gray-900">{staff.averageRating}</span>
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </div>
                          {renderStars(Math.round(staff.averageRating))}
                        </div>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedStaff === staff.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>

                    {/* Personel Detay Yorumları */}
                    {expandedStaff === staff.name && staff.recentFeedbacks.length > 0 && (
                      <div className="bg-gray-50 px-5 pb-4 space-y-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider pt-2">Son Yorumlar</p>
                        {staff.recentFeedbacks.map((fb) => (
                          <div key={fb.id} className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-gray-900">{fb.customerName}</span>
                              <div className="flex items-center gap-2">
                                {renderStars(fb.rating)}
                                <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString('tr-TR')}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">{fb.serviceName}</p>
                            {fb.comment && <p className="text-sm text-gray-700 mt-2 italic">"{fb.comment}"</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hizmet Performansı */}
        {serviceRatings.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Hizmet Performansı</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {serviceRatings.map((service) => (
                  <div key={service.name} className="border rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{service.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900">{service.averageRating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                    {renderStars(Math.round(service.averageRating))}
                    <p className="text-xs text-gray-500 mt-2">{service.feedbackCount} değerlendirme</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

