"use client";

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Building2, Edit, Globe, ExternalLink, RefreshCw, FileText, Download, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TenantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TenantDetailPage({ params }: TenantDetailPageProps) {
  const [tenantId, setTenantId] = useState<string>('');
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setTenantId(resolvedParams.id);
      fetchTenant(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  const fetchTenant = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenants/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setTenant(data.data);
      } else {
        alert('Abone bulunamadı');
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
      alert('Abone bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateLanding = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/tenants/generate-landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Landing sayfası başarıyla yeniden oluşturuldu!');
      } else {
        alert('Landing sayfası oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Error regenerating landing page:', error);
      alert('Bir hata oluştu');
    } finally {
      setRegenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Aktif' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', text: 'Askıda' },
      inactive: { color: 'bg-red-100 text-red-800', text: 'Pasif' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planColors = {
      'Trial': 'bg-gray-100 text-gray-800',
      'Standard': 'bg-blue-100 text-blue-800',
      'Premium': 'bg-purple-100 text-purple-800',
      'Enterprise': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planColors[plan as keyof typeof planColors] || planColors.Standard}`}>
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Abone bilgileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Abone Bulunamadı</h2>
            <Link href="/project-admin/tenants">
              <Button>Aboneler Listesine Dön</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/project-admin/tenants">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tenant.businessName}</h1>
              <p className="text-gray-600">Abone detayları ve landing sayfası yönetimi</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRegenerateLanding}
                disabled={regenerating}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                {regenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Landing Sayfasını Yenile
                  </>
                )}
              </Button>
              <Link href={`/project-admin/tenants/${tenant.id}/edit`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Düzenle
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  İşletme Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
                    <p className="text-gray-900 font-medium">{tenant.businessName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                    <p className="text-gray-900 font-medium">{tenant.slug}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Türü</label>
                    <p className="text-gray-900 font-medium capitalize">{tenant.businessType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                    <p className="text-gray-900 font-medium">{tenant.domain}</p>
                  </div>
                </div>
                
                {tenant.businessDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <p className="text-gray-900">{tenant.businessDescription}</p>
                  </div>
                )}
                
                {tenant.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <p className="text-gray-900">{tenant.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Sahip Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sahip Adı</label>
                    <p className="text-gray-900 font-medium">{tenant.ownerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <p className="text-gray-900 font-medium">{tenant.ownerEmail}</p>
                  </div>
                  {tenant.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <p className="text-gray-900 font-medium">{tenant.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Tema Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ana Renk</label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: tenant.theme?.primaryColor || '#EC4899' }}
                      ></div>
                      <span className="text-gray-900 font-medium">{tenant.theme?.primaryColor || '#EC4899'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İkincil Renk</label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: tenant.theme?.secondaryColor || '#f3f4f6' }}
                      ></div>
                      <span className="text-gray-900 font-medium">{tenant.theme?.secondaryColor || '#f3f4f6'}</span>
                    </div>
                  </div>
                </div>

                {tenant.theme?.logo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <img src={tenant.theme.logo} alt="Logo" className="h-12 w-auto" />
                  </div>
                )}

                {tenant.theme?.headerImage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Header Görseli</label>
                    <img src={tenant.theme.headerImage} alt="Header" className="h-24 w-auto rounded" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Ödeme Belgeleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.theme?.documents ? (
                  <>
                    {/* IBAN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                      {tenant.theme.documents.iban ? (
                        <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">{tenant.theme.documents.iban}</p>
                      ) : (
                        <p className="text-gray-400 italic">Yüklenmemiş</p>
                      )}
                    </div>

                    {/* Kimlik Belgesi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kimlik Belgesi</label>
                      {tenant.theme.documents.identityDocument ? (
                        <div className="space-y-2">
                          {tenant.theme.documents.identityDocument.startsWith('data:image/') ? (
                            <img
                              src={tenant.theme.documents.identityDocument}
                              alt="Kimlik Belgesi"
                              className="max-w-full max-h-48 rounded border border-gray-200 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(tenant.theme.documents.identityDocument, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-sm text-gray-600">PDF Belgesi</span>
                              <a
                                href={tenant.theme.documents.identityDocument}
                                download="kimlik-belgesi.pdf"
                                className="ml-auto text-blue-600 hover:text-blue-800"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Yüklenmemiş</p>
                      )}
                    </div>

                    {/* Vergi Levhası */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Levhası</label>
                      {tenant.theme.documents.taxDocument ? (
                        <div className="space-y-2">
                          {tenant.theme.documents.taxDocument.startsWith('data:image/') ? (
                            <img
                              src={tenant.theme.documents.taxDocument}
                              alt="Vergi Levhası"
                              className="max-w-full max-h-48 rounded border border-gray-200 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(tenant.theme.documents.taxDocument, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-sm text-gray-600">PDF Belgesi</span>
                              <a
                                href={tenant.theme.documents.taxDocument}
                                download="vergi-levhasi.pdf"
                                className="ml-auto text-blue-600 hover:text-blue-800"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Yüklenmemiş</p>
                      )}
                    </div>

                    {/* İmza Sirküleri */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İmza Sirküleri</label>
                      {tenant.theme.documents.signatureDocument ? (
                        <div className="space-y-2">
                          {tenant.theme.documents.signatureDocument.startsWith('data:image/') ? (
                            <img
                              src={tenant.theme.documents.signatureDocument}
                              alt="İmza Sirküleri"
                              className="max-w-full max-h-48 rounded border border-gray-200 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(tenant.theme.documents.signatureDocument, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-sm text-gray-600">PDF Belgesi</span>
                              <a
                                href={tenant.theme.documents.signatureDocument}
                                download="imza-sirkuleri.pdf"
                                className="ml-auto text-blue-600 hover:text-blue-800"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Yüklenmemiş</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Henüz belge yüklenmemiş</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Durum ve Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  {getStatusBadge(tenant.status)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  {getPlanBadge(tenant.plan)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oluşturulma Tarihi</label>
                  <p className="text-gray-900">{new Date(tenant.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                {tenant.lastLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Son Giriş</label>
                    <p className="text-gray-900">{new Date(tenant.lastLogin).toLocaleDateString('tr-TR')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>İstatistikler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aylık Gelir</span>
                  <span className="font-semibold text-green-600">₺{tenant.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Randevu Sayısı</span>
                  <span className="font-semibold">{tenant.appointmentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Müşteri Sayısı</span>
                  <span className="font-semibold">{tenant.customerCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href={`https://netrandevu.com/${tenant.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Landing Sayfası</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                
                <a 
                  href={`https://netrandevu.com/${tenant.slug}/randevu`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Randevu Sayfası</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
