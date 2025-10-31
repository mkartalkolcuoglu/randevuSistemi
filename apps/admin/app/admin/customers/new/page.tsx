"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, formatPhone, normalizePhone, PHONE_PLACEHOLDER, PHONE_MAX_LENGTH } from '@repo/ui';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    notes: '',
    status: 'active',
    whatsappNotifications: true
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // API call to create new customer
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for permission denied error
        if (response.status === 403 && errorData.code === 'INSUFFICIENT_PERMISSIONS') {
          alert('⛔ Yetki Hatası: Müşteri ekleme yetkiniz bulunmamaktadır.\n\nLütfen yöneticiniz ile iletişime geçin.');
          return;
        }
        
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const result = await response.json();
      console.log('Customer created:', result);
      
      alert('Müşteri başarıyla eklendi!');
      router.push('/admin/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Müşteri eklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/customers">
                <Button variant="outline" size="icon" className="h-7 w-7">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Geri</span>
                </Button>
              </Link>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                Yeni Müşteri Ekle
              </h1>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Link href="/admin/customers">
                  <Button variant="outline" size="sm">
                    İptal
                  </Button>
                </Link>
                <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3 lg:gap-8">
              {/* Main Information */}
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="firstName">Ad</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="lastName">Soyad</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="email">E-posta</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formatPhone(formData.phone)}
                            onChange={(e) => handleInputChange('phone', normalizePhone(e.target.value))}
                            placeholder={PHONE_PLACEHOLDER}
                            maxLength={PHONE_MAX_LENGTH}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="birthDate">Doğum Tarihi</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="gender">Cinsiyet</Label>
                          <select
                            id="gender"
                            value={formData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seçin</option>
                            <option value="Kadın">Kadın</option>
                            <option value="Erkek">Erkek</option>
                            <option value="Diğer">Diğer</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="address">Adres</Label>
                        <Input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Tam adres"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="grid auto-rows-max items-start gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Durum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Label htmlFor="status">Müşteri Durumu</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Müşteri hakkında notlar, tercihler, alerjiler vb..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="min-h-32"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bildirim Tercihleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="whatsappNotifications"
                        checked={formData.whatsappNotifications}
                        onChange={(e) => handleInputChange('whatsappNotifications', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="whatsappNotifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                        📱 WhatsApp ile randevu bildirimleri alsın
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-6">
                      Randevu onayları ve hatırlatmalar WhatsApp üzerinden gönderilecektir.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bilgilendirme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>• Müşteri kaydedildikten sonra randevu oluşturabilirsiniz</p>
                      <p>• E-posta ve telefon bilgileri hatırlatmalar için kullanılacaktır</p>
                      <p>• Doğum tarihi bilgisi özel günlerde hatırlatma için kullanılır</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Link href="/admin/customers">
                <Button variant="outline" size="sm">
                  İptal
                </Button>
              </Link>
              <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
