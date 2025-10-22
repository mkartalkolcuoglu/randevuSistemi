"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Switch } from '@repo/ui';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import StaffAuthForm from './staff-form-with-auth';
import type { StaffPermissions } from '../../../../lib/permissions';
import AdminHeader from '../../admin-header';
import type { ClientUser } from '../../../../lib/client-permissions';

interface NewStaffFormProps {
  user: ClientUser;
}

export default function NewStaffForm({ user }: NewStaffFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    specializations: [],
    experience: 0,
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
    status: 'active',
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOpen: true },
      tuesday: { start: '09:00', end: '18:00', isOpen: true },
      wednesday: { start: '09:00', end: '18:00', isOpen: true },
      thursday: { start: '09:00', end: '18:00', isOpen: true },
      friday: { start: '09:00', end: '18:00', isOpen: true },
      saturday: { start: '10:00', end: '17:00', isOpen: true },
      sunday: { start: '11:00', end: '16:00', isOpen: false }
    },
    notes: ''
  });

  // Auth state
  const [authData, setAuthData] = useState<{
    username: string;
    password: string;
    canLogin: boolean;
    permissions: StaffPermissions;
  } | null>(null);

  const [newSpecialization, setNewSpecialization] = useState('');

  const dayNames = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar'
  };


  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkingHourChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim()) {
      alert('Ad alanı zorunludur!');
      return;
    }
    if (!formData.lastName.trim()) {
      alert('Soyad alanı zorunludur!');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Telefon alanı zorunludur!');
      return;
    }
    if (!formData.position.trim()) {
      alert('Pozisyon alanı zorunludur!');
      return;
    }
    if (formData.specializations.length === 0) {
      alert('En az bir uzmanlık alanı eklemelisiniz!');
      return;
    }

    // Auth validation
    if (authData?.canLogin) {
      if (!authData.username || authData.username.trim() === '') {
        alert('Giriş yetkisi verildi ama kullanıcı adı boş!');
        return;
      }
      if (!authData.password || authData.password.trim() === '') {
        alert('Giriş yetkisi verildi ama şifre boş!');
        return;
      }
      if (authData.password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır!');
        return;
      }
    }
    
    setIsLoading(true);

    try {
      // Merge form data with auth data
      const submitData = {
        ...formData,
        ...(authData || {})
      };

      // API call to create new staff member
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const result = await response.json();
      console.log('Staff created:', result);
      
      alert('Personel başarıyla eklendi!');
      router.push('/admin/staff');
    } catch (error: any) {
      console.error('Error creating staff:', error);
      alert(error.message || 'Personel eklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <div className="max-w-7xl mx-auto p-6">
        <main className="grid flex-1 items-start gap-4">
          <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/staff">
                <Button variant="outline" size="icon" className="h-7 w-7">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Geri</span>
                </Button>
              </Link>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                Yeni Personel Ekle
              </h1>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Link href="/admin/staff">
                  <Button variant="outline" size="sm">
                    İptal
                  </Button>
                </Link>
                <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Kaydediliyor...' : 'Personeli Kaydet'}
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
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="position">Pozisyon</Label>
                        <Input
                          id="position"
                          type="text"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Uzmanlık Alanları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex gap-2">
                        <Input
                          value={newSpecialization}
                          onChange={(e) => setNewSpecialization(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        />
                        <Button type="button" onClick={addSpecialization}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formData.specializations.map((spec, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                          >
                            <span>{spec}</span>
                            <button
                              type="button"
                              onClick={() => removeSpecialization(spec)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Çalışma Saatleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(formData.workingHours).map(([day, hours]) => (
                        <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Switch
                              checked={hours.isOpen}
                              onChange={(e) => handleWorkingHourChange(day, 'isOpen', e.target.checked)}
                            />
                            <span className="font-medium w-20">{dayNames[day]}</span>
                          </div>
                          
                          {hours.isOpen ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={hours.start}
                                onChange={(e) => handleWorkingHourChange(day, 'start', e.target.value)}
                                className="w-24"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={hours.end}
                                onChange={(e) => handleWorkingHourChange(day, 'end', e.target.value)}
                                className="w-24"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-500">Kapalı</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="grid auto-rows-max items-start gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>İş Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <Label htmlFor="experience">Deneyim (yıl)</Label>
                        <Input
                          id="experience"
                          type="number"
                          min="0"
                          value={formData.experience}
                          onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="salary">Maaş (₺)</Label>
                        <Input
                          id="salary"
                          type="number"
                          min="0"
                          value={formData.salary}
                          onChange={(e) => handleInputChange('salary', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="hireDate">İşe Başlama Tarihi</Label>
                        <Input
                          id="hireDate"
                          type="date"
                          value={formData.hireDate}
                          onChange={(e) => handleInputChange('hireDate', e.target.value)}
                        />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="status">Durum</Label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Aktif</option>
                          <option value="probation">Deneme Süreci</option>
                          <option value="inactive">Pasif</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="min-h-32"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Authentication & Permissions Section */}
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-3 mt-8">
              <StaffAuthForm onAuthDataChange={setAuthData} />
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden mt-8">
              <Link href="/admin/staff">
                <Button variant="outline" size="sm">
                  İptal
                </Button>
              </Link>
              <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Kaydediliyor...' : 'Personeli Kaydet'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

