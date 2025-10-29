"use client";

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../../../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Star, ChevronUp, ChevronDown, Package } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  durationDays: number;
  price: number;
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  features: string | null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<SubscriptionPackage | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (pkg: SubscriptionPackage) => {
    setPackageToDelete(pkg);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;

    setDeleteModalOpen(false);

    try {
      const response = await fetch(`/api/packages/${packageToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await fetchPackages();
      } else {
        // Check for active tenants error (409 Conflict)
        if (response.status === 409) {
          setErrorMessage({
            title: '⚠️ Paket Silinemez',
            description: `${data.error}\n\n${data.details || ''}`
          });
          setErrorModalOpen(true);
          return;
        }

        throw new Error(data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      setErrorMessage({
        title: '❌ Hata',
        description: 'Paket silinirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setErrorModalOpen(true);
    } finally {
      setPackageToDelete(null);
    }
  };

  const handleReorder = async (packageId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch('/api/packages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, direction })
      });

      if (response.ok) {
        await fetchPackages();
      }
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Ücretsiz' : `₺${price.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Paketler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 mr-3" />
                Abonelik Paketleri
              </h1>
              <p className="text-gray-600 mt-2">İşletmelerin kullanabileceği abonelik paketlerini yönetin</p>
            </div>

            <Link href="/project-admin/packages/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Paket Ekle
              </Button>
            </Link>
          </div>

          {/* Package Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <Card key={pkg.id} className={pkg.isFeatured ? 'border-2 border-yellow-400 relative' : ''}>
                {pkg.isFeatured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-400 text-gray-900 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Öne Çıkan
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{pkg.name}</span>
                        {!pkg.isActive && (
                          <Badge className="bg-gray-400 text-white">Pasif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-normal mt-1">{pkg.slug}</p>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{formatPrice(pkg.price)}</p>
                      <p className="text-sm text-gray-500">{pkg.durationDays} gün geçerli</p>
                    </div>

                    {pkg.description && (
                      <p className="text-sm text-gray-600">{pkg.description}</p>
                    )}

                    {pkg.features && (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {JSON.parse(pkg.features).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <span className="mr-2">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(pkg.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(pkg.id, 'down')}
                          disabled={index === packages.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/project-admin/packages/${pkg.id}/edit`}>
                          <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(pkg)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {packages.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Henüz paket eklenmemiş</p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paket Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <strong>{packageToDelete?.name}</strong> paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPackageToDelete(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Modal */}
      <AlertDialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorMessage.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-base whitespace-pre-line">
              {errorMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorModalOpen(false)}>
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

