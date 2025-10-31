"use client";

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { FileText, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function PagesManagement() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<any>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pages');
      const data = await response.json();
      
      if (data.success) {
        setPages(data.data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      const response = await fetch(`/api/pages/${pageToDelete.slug}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setPages(pages.filter(p => p.slug !== pageToDelete.slug));
        setDeleteModalOpen(false);
        setPageToDelete(null);
      } else {
        alert('Sayfa silinirken bir hata oluştu: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Sayfa silinirken bir hata oluştu.');
    }
  };

  const togglePageStatus = async (page: any) => {
    try {
      const response = await fetch(`/api/pages/${page.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !page.isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        setPages(pages.map(p => 
          p.slug === page.slug ? { ...p, isActive: !p.isActive } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling page status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Sayfalar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">İçerik Yönetimi</h1>
            <p className="text-gray-600">Web sitesi sayfalarını yönetin</p>
          </div>
          <Link href="/project-admin/pages/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Sayfa Ekle
            </Button>
          </Link>
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="truncate">{page.title}</span>
                  </div>
                  <button
                    onClick={() => togglePageStatus(page)}
                    className={`p-1 rounded ${
                      page.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {page.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    /{page.slug}
                  </span>
                  <span className={`ml-2 inline-block px-2 py-1 text-xs rounded ${
                    page.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {page.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {page.content.substring(0, 100)}...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>
                    Güncelleme: {new Date(page.updatedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/project-admin/pages/${page.slug}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setPageToDelete(page);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pages.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Henüz sayfa eklenmemiş
              </h3>
              <p className="text-gray-600 mb-6">
                İlk sayfanızı oluşturarak başlayın
              </p>
              <Link href="/project-admin/pages/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Sayfa Ekle
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Sayfayı Sil</h2>
              <p className="text-gray-600 mb-6">
                <strong>{pageToDelete?.title}</strong> sayfasını silmek istediğinizden emin misiniz?
                Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setPageToDelete(null);
                  }}
                >
                  İptal
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                >
                  Sil
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

