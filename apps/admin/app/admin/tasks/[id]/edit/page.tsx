"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending',
    assignedTo: '',
    category: ''
  });

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
        setFormData({
          ...data.data,
          dueDate: data.data.dueDate ? data.data.dueDate.split('T')[0] : ''
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Task updated:', result);
      
      alert('Görev başarıyla güncellendi!');
      router.push(`/admin/tasks/${params.id}`);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Görev güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/admin/tasks/${params.id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Görev Detayına Geri Dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Görev Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Görev Başlığı *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Görev başlığını girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Atanan Kişi *</Label>
                <Input
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  placeholder="Görevi atanan kişi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kategori seçin</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">İnsan Kaynakları</option>
                  <option value="Inventory">Stok Yönetimi</option>
                  <option value="Customer Service">Müşteri Hizmetleri</option>
                  <option value="Finance">Finans</option>
                  <option value="Operations">Operasyon</option>
                  <option value="General">Genel</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Son Tarih *</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="in_progress">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Görev hakkında detaylı açıklama..."
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Güncelleniyor...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Görevi Güncelle
                  </>
                )}
              </Button>
              <Link href={`/admin/tasks/${params.id}`}>
                <Button type="button" variant="outline">
                  İptal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
