"use client";

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@repo/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditPageForm({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true
  });

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      fetchPage(p.slug);
    });
  }, [params]);

  const fetchPage = async (pageSlug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pages/${pageSlug}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          title: data.data.title,
          content: data.data.content,
          isActive: data.data.isActive
        });
      } else {
        alert('Sayfa bulunamadı.');
        router.push('/project-admin/pages');
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      alert('Sayfa yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/pages/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        router.push('/project-admin/pages');
      } else {
        alert('Sayfa güncellenirken bir hata oluştu: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Sayfa güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Sayfa yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/project-admin/pages">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sayfayı Düzenle</h1>
          <p className="text-gray-600">Sayfa içeriğini güncelleyin</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Sayfa Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slug (Read-only) */}
              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  type="text"
                  value={slug}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Slug değiştirilemez
                </p>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Hakkımızda"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">İçerik</Label>
                <textarea
                  id="content"
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sayfa içeriğini buraya yazın..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  HTML etiketleri kullanabilirsiniz
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Sayfa aktif (Web sitesinde görünsün)
                </Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Link href="/project-admin/pages" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    İptal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>Kaydediliyor...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

