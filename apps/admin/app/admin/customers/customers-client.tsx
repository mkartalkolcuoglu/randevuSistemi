"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@repo/ui';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, User, AlertCircle, CheckCircle, AlertTriangle, XCircle, Download, Upload, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '../admin-header';
import { DataTable, Column } from '../../../components/DataTable';
import type { ClientUser } from '../../../lib/client-permissions';

interface CustomersClientProps {
  initialCustomers: any[];
  tenantId?: string;
  user: ClientUser;
}

export default function CustomersClient({ initialCustomers, tenantId, user }: CustomersClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [blacklistFilter, setBlacklistFilter] = useState('all'); // 'all', 'blacklisted', 'active'
  const [customers, setCustomers] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('İşlem başarıyla tamamlandı.');
  const [removeBlacklistModalOpen, setRemoveBlacklistModalOpen] = useState(false);
  const [customerToRemoveFromBlacklist, setCustomerToRemoveFromBlacklist] = useState<string | null>(null);
  
  // Import modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, [blacklistFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = '/api/customers';
      if (blacklistFilter === 'blacklisted') {
        url += '?blacklisted=true';
      } else if (blacklistFilter === 'active') {
        url += '?blacklisted=false';
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
        setTotalCustomers(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleRemoveFromBlacklistClick = (id: string) => {
    setCustomerToRemoveFromBlacklist(id);
    setRemoveBlacklistModalOpen(true);
  };

  const handleRemoveFromBlacklistConfirm = async () => {
    if (!customerToRemoveFromBlacklist) return;
    
    setRemoveBlacklistModalOpen(false);
    
    try {
      const response = await fetch(`/api/customers/${customerToRemoveFromBlacklist}/blacklist`, {
        method: 'PUT',
      });

      if (response.ok) {
        setSuccessMessage('Müşteri kara listeden başarıyla çıkarıldı.');
        setSuccessModalOpen(true);
        await fetchCustomers();
      } else {
        const errorData = await response.json();
        setErrorMessage({
          title: '❌ Hata',
          description: errorData.error || 'Kara listeden çıkarma işlemi başarısız oldu.'
        });
        setErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      setErrorMessage({
        title: '❌ Hata',
        description: 'Kara listeden çıkarılırken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setErrorModalOpen(true);
    } finally {
      setCustomerToRemoveFromBlacklist(null);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/customers/export-template', '_blank');
  };

  const handleExport = () => {
    window.open('/api/customers/export', '_blank');
  };

  const handleImportClick = () => {
    setImportFile(null);
    setImportErrors([]);
    setImportModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportErrors([]);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportModalOpen(false);
        setSuccessMessage(data.message || 'Müşteriler başarıyla içe aktarıldı');
        setSuccessModalOpen(true);
        await fetchCustomers();
      } else {
        if (data.validationErrors) {
          setImportErrors(data.validationErrors);
        } else {
          // Show detailed error message
          const errorDetails = data.details ? `\n\nDetay: ${data.details}` : '';
          setErrorMessage({
            title: '❌ İçe Aktarma Hatası',
            description: (data.error || 'Müşteriler içe aktarılırken hata oluştu') + errorDetails
          });
          setErrorModalOpen(true);
          setImportModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage({
        title: '❌ Hata',
        description: 'Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setErrorModalOpen(true);
      setImportModalOpen(false);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    setDeleteModalOpen(false);
    
    try {
      const response = await fetch(`/api/customers/${customerToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Müşteri başarıyla silindi.');
        setSuccessModalOpen(true);
        await fetchCustomers();
      } else {
        const errorData = await response.json();
        
        // Check for permission denied error
        if (response.status === 403 && errorData.code === 'INSUFFICIENT_PERMISSIONS') {
          setErrorMessage({
            title: '⛔ Yetki Hatası',
            description: 'Müşteri silme yetkiniz bulunmamaktadır. Lütfen yöneticiniz ile iletişime geçin.'
          });
          setErrorModalOpen(true);
          return;
        }
        
        // Check for active appointments (409 Conflict)
        if (response.status === 409) {
          setErrorMessage({
            title: '⚠️ Müşteri Silinemez',
            description: `${errorData.error}\n\n${errorData.details || ''}\n\nLütfen önce aktif randevuları iptal edin veya tamamlayın.`
          });
          setErrorModalOpen(true);
          return;
        }
        
        throw new Error(errorData.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      setErrorMessage({
        title: '❌ Hata',
        description: 'Müşteri silinirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setErrorModalOpen(true);
    } finally {
      setCustomerToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Pasif</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Bilinmiyor</Badge>;
    }
  };

  // Filter by status
  const statusFilteredCustomers = statusFilter === 'all' 
    ? customers 
    : customers.filter(c => c.status === statusFilter);

  // Define table columns
  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Müşteri',
      sortable: true,
      filterable: true,
      getValue: (customer) => `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      render: (customer) => (
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => window.location.href = `/admin/customers/${customer.id}`}
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-900">
              {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'İsimsiz'}
            </div>
            {customer.notes && (
              <div className="text-sm text-gray-500 truncate max-w-xs">{customer.notes}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'E-posta',
      sortable: true,
      filterable: true,
      render: (customer) => customer.email ? (
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
          {customer.email}
        </div>
      ) : '-'
    },
    {
      key: 'phone',
      label: 'Telefon',
      sortable: true,
      filterable: true,
      render: (customer) => customer.phone ? (
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-1 flex-shrink-0" />
          {customer.phone}
        </div>
      ) : '-'
    },
    {
      key: 'createdAt',
      label: 'Kayıt Tarihi',
      sortable: true,
      getValue: (customer) => new Date(customer.createdAt).getTime(),
      render: (customer) => (
        <div className="text-sm text-gray-900">
          {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      sortable: true,
      render: (customer) => getStatusBadge(customer.status)
    },
    {
      key: 'blacklist',
      label: 'Kara Liste',
      sortable: true,
      getValue: (customer) => customer.isBlacklisted ? 1 : 0,
      render: (customer) => {
        if (customer.isBlacklisted) {
          return (
            <div className="flex items-center">
              <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kara Listede
              </Badge>
              {customer.noShowCount > 0 && (
                <span className="ml-2 text-xs text-red-600">
                  ({customer.noShowCount} gelmedi)
                </span>
              )}
            </div>
          );
        }
        if (customer.noShowCount > 0) {
          return (
            <div className="flex items-center">
              <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {customer.noShowCount} Gelmedi
              </Badge>
            </div>
          );
        }
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Temiz
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (customer) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          {customer.isBlacklisted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveFromBlacklistClick(customer.id)}
              className="text-green-600 hover:bg-green-50"
              title="Kara Listeden Çıkar"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteClick(customer.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Müşteriler yükleniyor...</p>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">Müşteri Yönetimi</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Müşterilerinizi görüntüleyin ve yönetin</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleDownloadTemplate}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Şablon İndir
              </Button>
              
              <Button 
                onClick={handleExport}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50 w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Dışa Aktar
              </Button>
              
              <Button 
                onClick={handleImportClick}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                İçe Aktar
              </Button>
              
              <Link href="/admin/customers/new" className="w-full sm:w-auto flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Müşteri Ekle
                </Button>
              </Link>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mb-2 sm:mb-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Toplam Müşteri</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-green-100 rounded-lg mb-2 sm:mb-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Bu Ay Yeni</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => {
                        const customerDate = new Date(c.createdAt);
                        const now = new Date();
                        return customerDate.getMonth() === now.getMonth() && 
                               customerDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mb-2 sm:mb-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">E-posta Olan</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.email).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mb-2 sm:mb-0">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Telefon Olan</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.phone).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="p-2 bg-red-100 rounded-lg mb-2 sm:mb-0">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Kara Listede</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.isBlacklisted === true).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum Filtresi
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kara Liste Filtresi
                  </label>
                  <select
                    value={blacklistFilter}
                    onChange={(e) => setBlacklistFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tümü</option>
                    <option value="active">Sadece Aktif Müşteriler</option>
                    <option value="blacklisted">Sadece Kara Listedekiler</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Müşteri Listesi with DataTable */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : statusFilteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">
                    {statusFilter !== 'all' ? 'Bu durumda müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
                  </p>
                  {statusFilter === 'all' && (
                    <p className="text-gray-400">İlk müşterinizi eklemek için yukarıdaki butonu kullanın</p>
                  )}
                </div>
              ) : (
                <DataTable
                  data={statusFilteredCustomers}
                  columns={columns}
                  keyExtractor={(customer) => customer.id}
                  emptyMessage="Arama kriterlerinize uygun müşteri bulunamadı"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Remove from Blacklist Confirmation Modal */}
      <AlertDialog open={removeBlacklistModalOpen} onOpenChange={setRemoveBlacklistModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Kara Listeden Çıkarma Onayı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Bu müşteriyi kara listeden çıkarmak istediğinizden emin misiniz?
              <br /><br />
              <span className="text-yellow-600 font-medium">
                ⚠️ Not: Gelmedi sayacı sıfırlanmayacak. Sadece kara liste durumu kaldırılacak.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToRemoveFromBlacklist(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromBlacklistConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Evet, Çıkar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Müşteri Silme Onayı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>
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
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {errorMessage.title}
            </AlertDialogTitle>
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

      {/* Success Modal */}
      <AlertDialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Başarılı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessModalOpen(false)}>
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <AlertDialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Müşteri İçe Aktarma
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Nasıl İçe Aktarılır?</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Önce "Şablon İndir" butonuna tıklayarak Excel şablonunu indirin</li>
                  <li>Şablonu doldurun (örnek satırı silebilirsiniz)</li>
                  <li>Doldurduğunuz dosyayı aşağıdan seçin ve "İçe Aktar" butonuna tıklayın</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Excel Dosyası Seçin (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
                {importFile && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Seçilen dosya: {importFile.name}
                  </p>
                )}
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Doğrulama Hataları ({importErrors.length} satır)
                  </h4>
                  <div className="space-y-3">
                    {importErrors.map((error, index) => (
                      <div key={index} className="bg-white rounded p-3 text-sm">
                        <p className="font-semibold text-red-800 mb-1">
                          Satır {error.row}:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-red-700">
                          {error.errors.map((err: string, errIndex: number) => (
                            <li key={errIndex}>{err}</li>
                          ))}
                        </ul>
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Veri:</strong> {error.data['Ad']} {error.data['Soyad']} - {error.data['Telefon']}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>İptal</AlertDialogCancel>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  İçe Aktar
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
