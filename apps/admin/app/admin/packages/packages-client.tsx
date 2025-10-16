'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '../admin-header';
import { Card, CardContent, Button } from '@repo/ui';
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
  const [showAssignedCustomersModal, setShowAssignedCustomersModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageToAssign, setPackageToAssign] = useState<Package | null>(null);
  const [assignedCustomers, setAssignedCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

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

  const handleViewAssignedCustomers = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowAssignedCustomersModal(true);
    setLoadingCustomers(true);

    console.log('🔍 Loading assigned customers for package:', pkg.id, pkg.name);

    try {
      const url = `/api/packages/assign?packageId=${pkg.id}`;
      console.log('📡 Fetching:', url);
      
      const response = await fetch(url);
      const result = await response.json();

      console.log('📦 API Response:', result);
      console.log('👥 Assigned customers count:', result.data?.length || 0);

      if (result.success) {
        setAssignedCustomers(result.data || []);
        console.log('✅ Customers loaded:', result.data);
      } else {
        console.error('❌ Failed to load assigned customers:', result.error);
        setAssignedCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error loading assigned customers:', error);
      setAssignedCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleRemoveCustomerPackage = async (customerPackageId: string) => {
    if (!confirm('Bu müşteriden paketi kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/packages/assign?customerPackageId=${customerPackageId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Paket müşteriden başarıyla kaldırıldı');
        // Reload assigned customers
        if (selectedPackage) {
          handleViewAssignedCustomers(selectedPackage);
        }
        // Reload packages to update counts
        loadPackages();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Error removing customer package:', error);
      alert('Paket kaldırılırken hata oluştu');
    }
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
                  <div className="mb-4">
                    <button
                      onClick={() => handleViewAssignedCustomers(pkg)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      <span>
                        {pkg._count.customerPackages} müşteriye atanmış
                      </span>
                    </button>
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

      {/* Assigned Customers Modal */}
      {showAssignedCustomersModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold">
                {selectedPackage.name} - Atanan Müşteriler
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                Bu pakete atanmış müşterileri görüntüleyin ve yönetin
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loadingCustomers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : assignedCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Bu pakete henüz müşteri atanmamış</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedCustomers.map((cp: any) => (
                    <div
                      key={cp.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {cp.customer.firstName} {cp.customer.lastName}
                          </h3>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <p>📧 {cp.customer.email}</p>
                            <p>📞 {cp.customer.phone}</p>
                            <p className="text-xs text-gray-500">
                              Atanma: {new Date(cp.assignedAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          
                          {/* Package Usage Details */}
                          {cp.usages && cp.usages.length > 0 && (
                            <div className="mt-3 bg-gray-50 rounded p-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Paket Kullanımı:
                              </p>
                              <div className="space-y-1">
                                {cp.usages.map((usage: any) => (
                                  <div key={usage.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{usage.itemName}</span>
                                    <span className={`font-semibold ${
                                      usage.remainingQuantity === 0 
                                        ? 'text-red-600' 
                                        : usage.remainingQuantity <= 2 
                                        ? 'text-orange-600' 
                                        : 'text-green-600'
                                    }`}>
                                      {usage.remainingQuantity} / {usage.totalQuantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleRemoveCustomerPackage(cp.id)}
                          variant="outline"
                          size="sm"
                          className="ml-4 text-red-600 hover:bg-red-50 border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <Button
                onClick={() => {
                  setShowAssignedCustomersModal(false);
                  setSelectedPackage(null);
                  setAssignedCustomers([]);
                }}
                variant="outline"
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

