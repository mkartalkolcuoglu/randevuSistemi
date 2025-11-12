"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    isActive: true
  });

  useEffect(() => {
    if (params.id) {
      fetchService();
    }
  }, [params.id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data.data,
          category: data.data.category || '',
          price: data.data.price.toString(),
          duration: data.data.duration.toString(),
          isActive: data.data.status === 'active'
        });
      } else {
        console.error('Service not found');
        router.push('/admin/services');
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      router.push('/admin/services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/services/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          status: formData.isActive ? 'active' : 'inactive'
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Service updated:', result);
      
      alert('Hizmet başarıyla güncellendi!');
      router.push(`/admin/services/${params.id}`);
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Hizmet güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
        <Link href={`/admin/services/${params.id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Hizmet Detayına Geri Dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hizmet Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Hizmet Adı *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (₺) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Süre (Dakika) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  max="480"
                  step="15"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isActive">Hizmet aktif</Label>
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
                    Hizmeti Güncelle
                  </>
                )}
              </Button>
              <Link href={`/admin/services/${params.id}`}>
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