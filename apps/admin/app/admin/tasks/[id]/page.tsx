"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, User, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.data);
      } else {
        console.error('Task not found');
        router.push('/admin/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      router.push('/admin/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/tasks/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Görev başarıyla silindi!');
          router.push('/admin/tasks');
        } else {
          throw new Error('Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Görev silinirken bir hata oluştu.');
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.data);
        alert('Görev durumu güncellendi!');
      } else {
        throw new Error('Durum güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Acil';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'pending':
        return 'Beklemede';
      default:
        return 'Bilinmiyor';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && task?.status !== 'completed';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">Görev bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/tasks" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Görevlere Geri Dön
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-gray-600">Görev Detayları</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/tasks/${task.id}/edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Görev Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Görev Başlığı</label>
                  <p className="text-lg font-semibold">{task.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Durum</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Öncelik</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Kategori</label>
                  <p>{task.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Atanan Kişi</label>
                  <p className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {task.assignedTo}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Son Tarih</label>
                  <p className={`flex items-center ${isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                    {isOverdue(task.dueDate) && (
                      <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                    )}
                  </p>
                </div>
              </div>
              
              {task.description && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Açıklama</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Tarihçe</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Oluşturulma Tarihi</span>
                    <span>{new Date(task.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Son Güncelleme</span>
                    <span>{new Date(task.updatedAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Durum Yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Durumu Değiştir</label>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="in_progress">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>

              {isOverdue(task.dueDate) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-800">Süre Geçmiş!</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Bu görevin son tarihi geçmiştir.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Görev İstatistikleri</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Kalan Gün</span>
                    <span className={isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : ''}>
                      {Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Toplam Süre</span>
                    <span>
                      {Math.ceil((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))} gün
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.status !== 'completed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('completed')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Görevi Tamamla
                </Button>
              )}
              {task.status === 'pending' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('in_progress')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Görevi Başlat
                </Button>
              )}
              <Link href={`/admin/tasks/${task.id}/edit`}>
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Görevi Düzenle
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
