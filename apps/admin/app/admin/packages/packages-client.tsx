'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '../admin-header';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Plus, Edit, Trash2, Users, Package as PackageIcon } from 'lucide-react';
import PackageModal from './modals/PackageModal';
import AssignPackageModal from './modals/AssignPackageModal';

interface PackageItem {
  id: string;
  itemType: 'service' | 'product';
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  items: PackageItem[];
  _count: {
    customerPackages: number;
  };
  createdAt: string;
}

interface PackagesClientProps {
  tenantId: string;
  user: any;
}

export default function PackagesClient({ tenantId, user }: PackagesClientProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageToAssign, setPackageToAssign] = useState<Package | null>(null);

  useEffect(() => {
    loadPackages();
  }, [tenantId]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packages?tenantId=${tenantId}`);
      const result = await response.json();

      if (result.success) {
        setPackages(result.data);
      } else {
        console.error('Failed to load packages:', result.error);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = () => {
    setSelectedPackage(null);
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPackageModal(true);
  };

  const handleDeletePackage = async (pkg: Package) => {
    if (pkg._count.customerPackages > 0) {
      alert(`Bu paket ${pkg._count.customerPackages} müşteriye atanmış. Önce müşteri atamalarını kaldırın.`);
      return;
    }

    if (!confirm(`"${pkg.name}" paketini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/packages?id=${pkg.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Paket başarıyla silindi');
        loadPackages();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Paket silinirken hata oluştu');
    }
  };

  const handleAssignPackage = (pkg: Package) => {
    setPackageToAssign(pkg);
    setShowAssignModal(true);
  };

  const handlePackageSaved = () => {
    setShowPackageModal(false);
    setSelectedPackage(null);
    loadPackages();
  };

  const handlePackageAssigned = () => {
    setShowAssignModal(false);
    setPackageToAssign(null);
    loadPackages();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
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
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paketler</h1>
            <p className="text-gray-600 mt-2">
              Hizmet ve ürün paketleri oluşturun ve müşterilere atayın
            </p>
          </div>
          <Button
            onClick={handleCreatePackage}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Paket Oluştur
          </Button>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Henüz paket yok
              </h3>
              <p className="text-gray-600 mb-6">
                İlk paketinizi oluşturmak için yukarıdaki butona tıklayın
              </p>
              <Button
                onClick={handleCreatePackage}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Paket Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Package Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {pkg.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        pkg.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {pkg.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  {/* Package Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-blue-600">
                      ₺{pkg.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Package Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Paket İçeriği:
                    </h4>
                    <ul className="space-y-1">
                      {pkg.items.map((item) => (
                        <li
                          key={item.id}
                          className="text-sm text-gray-600 flex items-center"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {item.quantity}x {item.itemName}
                          <span className="ml-2 text-xs text-gray-500">
                            ({item.itemType === 'service' ? 'Hizmet' : 'Ürün'})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Assigned Count */}
                  <div className="mb-4 flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    <span>
                      {pkg._count.customerPackages} müşteriye atanmış
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAssignPackage(pkg)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Müşteriye Ata
                    </Button>
                    <Button
                      onClick={() => handleEditPackage(pkg)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeletePackage(pkg)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showPackageModal && (
        <PackageModal
          tenantId={tenantId}
          package={selectedPackage}
          onClose={() => {
            setShowPackageModal(false);
            setSelectedPackage(null);
          }}
          onSave={handlePackageSaved}
        />
      )}

      {showAssignModal && packageToAssign && (
        <AssignPackageModal
          tenantId={tenantId}
          package={packageToAssign}
          onClose={() => {
            setShowAssignModal(false);
            setPackageToAssign(null);
          }}
          onAssign={handlePackageAssigned}
        />
      )}
    </div>
  );
}

