"use client";

import { useEffect, useState } from 'react';
import { Star, TrendingUp, MessageSquare, Users } from 'lucide-react';

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
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function PerformansPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      // Get tenant slug from pathname or use a default
      // For now, we'll need to get it from the global store or context
      const response = await fetch('/api/public/feedbacks');
      const data = await response.json();
      
      if (data.success) {
        setFeedbacks(data.data.feedbacks);
        setStats(data.data.stats);
      } else {
        setError(data.error || 'Veriler yüklenemedi');
      }
    } catch (err) {
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
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
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
    </div>
  );
}

