"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Switch } from '@/components/ui';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import StaffAuthForm from '../../new/staff-form-with-auth';
import type { StaffPermissions } from '../../../../lib/permissions';

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    specializations: [],
    experience: '',
    rating: '',
    status: 'active',
    hireDate: '',
    salary: '',
    notes: '',
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOpen: true },
      tuesday: { start: '09:00', end: '18:00', isOpen: true },
      wednesday: { start: '09:00', end: '18:00', isOpen: true },
      thursday: { start: '09:00', end: '18:00', isOpen: true },
      friday: { start: '09:00', end: '18:00', isOpen: true },
      saturday: { start: '10:00', end: '17:00', isOpen: true },
      sunday: { start: 'off', end: 'off', isOpen: false }
    }
  });

  const [newSpecialization, setNewSpecialization] = useState('');

  // Auth state
  const [authData, setAuthData] = useState<{
    username: string;
    password: string;
    canLogin: boolean;
    permissions: StaffPermissions;
  } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchStaff();
    }
  }, [params.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const staffData = data.data;
        
        // Parse specializations if it's a string
        let specializations = [];
        if (typeof staffData.specializations === 'string') {
          try {
            specializations = JSON.parse(staffData.specializations);
          } catch {
            specializations = staffData.specializations ? [staffData.specializations] : [];
          }
        } else if (Array.isArray(staffData.specializations)) {
          specializations = staffData.specializations;
        }
        
        // Parse workingHours if it's a string
        let workingHours = {
          monday: { start: '09:00', end: '18:00', isOpen: true },
          tuesday: { start: '09:00', end: '18:00', isOpen: true },
          wednesday: { start: '09:00', end: '18:00', isOpen: true },
          thursday: { start: '09:00', end: '18:00', isOpen: true },
          friday: { start: '09:00', end: '18:00', isOpen: true },
          saturday: { start: '09:00', end: '18:00', isOpen: false },
          sunday: { start: '09:00', end: '18:00', isOpen: false }
        };
        
        if (staffData.workingHours) {
          if (typeof staffData.workingHours === 'string') {
            try {
              workingHours = { ...workingHours, ...JSON.parse(staffData.workingHours) };
            } catch {
              // Keep default workingHours if parsing fails
            }
          } else if (typeof staffData.workingHours === 'object') {
            workingHours = { ...workingHours, ...staffData.workingHours };
          }
        }
        
        setFormData({
          ...staffData,
          specializations,
          workingHours,
          experience: staffData.experience?.toString() || '',
          rating: staffData.rating?.toString() || '',
          salary: staffData.salary?.toString() || ''
        });

        // Load auth data
        console.log('📊 Raw staff data:', {
          username: staffData.username,
          canLogin: staffData.canLogin,
          permissions: staffData.permissions
        });

        let parsedPermissions = null;
        if (staffData.permissions) {
          try {
            const parsed = typeof staffData.permissions === 'string' 
              ? JSON.parse(staffData.permissions) 
              : staffData.permissions;
            // Only use parsed permissions if they're not empty
            if (parsed && Object.keys(parsed).length > 0) {
              parsedPermissions = parsed;
              console.log('✅ Parsed permissions:', parsedPermissions);
            }
          } catch (e) {
            console.error('❌ Failed to parse permissions:', e);
          }
        }

        const loadedAuthData = {
          username: staffData.username || '',
          password: '', // Never load existing password
          canLogin: staffData.canLogin || false,
          permissions: parsedPermissions // null if no permissions (StaffAuthForm will use defaults)
        };

        console.log('🔐 Setting authData:', loadedAuthData);
        setAuthData(loadedAuthData);
      } else {
        console.error('Staff not found');
        router.push('/admin/staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      router.push('/admin/staff');
    } finally {
      setLoading(false);
    }
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
    if (!Array.isArray(formData.specializations) || formData.specializations.length === 0) {
      alert('En az bir uzmanlık alanı eklemelisiniz!');
      return;
    }
    
    setIsLoading(true);

    // Auth validation
    if (authData?.canLogin) {
      if (!authData.username || authData.username.trim() === '') {
        alert('Giriş yetkisi verildi ama kullanıcı adı boş!');
        return;
      }
      if (authData.password && authData.password.length > 0 && authData.password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır!');
        return;
      }
    }

    try {
      // Prepare auth data - exclude empty password
      const authDataToSend = authData ? {
        username: authData.username,
        canLogin: authData.canLogin,
        permissions: authData.permissions,
        // Only include password if it's not empty
        ...(authData.password && authData.password.trim() !== '' ? { password: authData.password } : {})
      } : {};

      const submitData = {
        ...formData,
        experience: parseInt(formData.experience) || 0,
        rating: parseFloat(formData.rating) || 0,
        salary: parseFloat(formData.salary) || 0,
        ...authDataToSend // Merge auth data (without empty password)
      };

      console.log('💾 Submitting data:', { ...submitData, password: submitData.password ? '***' : 'not included' });

      const response = await fetch(`/api/staff/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Staff updated:', result);
      
      alert('Personel başarıyla güncellendi!');
      router.push(`/admin/staff/${params.id}`);
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Personel güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && Array.isArray(formData.specializations) && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...(Array.isArray(prev.specializations) ? prev.specializations : []), newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specializations: Array.isArray(prev.specializations) ? prev.specializations.filter((_, i) => i !== index) : []
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: string | boolean) => {
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

  const dayNames = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar'
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
        <Link href={`/admin/staff/${params.id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Personel Detayına Geri Dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personel Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Pozisyon *</Label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="vacation">İzinli</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Deneyim (Yıl)</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Değerlendirme (1-5)</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">İşe Başlama Tarihi</Label>
                <Input
                  id="hireDate"
                  name="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Maaş (₺)</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            {/* Specializations */}
            <div className="space-y-2">
              <Label>Uzmanlık Alanları</Label>
              <div className="flex gap-2">
                <Input
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                />
                <Button type="button" onClick={addSpecialization} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(formData.specializations) && formData.specializations.map((spec, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Çalışma Saatleri</Label>
              <div className="space-y-4">
                {Object.entries(formData.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={hours.isOpen}
                        onChange={(e) => handleWorkingHoursChange(day, 'isOpen', e.target.checked)}
                      />
                      <span className="font-medium w-20">{dayNames[day]}</span>
                    </div>
                    
                    {hours.isOpen ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={hours.start}
                          onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                          className="w-24"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={hours.end}
                          onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-500">Kapalı</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Authentication & Permissions Section */}
            <div className="mt-8">
              {!loading && (
                <StaffAuthForm 
                  key={authData?.username || 'new'}
                  onAuthDataChange={setAuthData}
                  initialAuthData={authData || {
                    username: '',
                    password: '',
                    canLogin: false,
                    permissions: {}
                  }}
                />
              )}
            </div>

            <div className="space-y-2 mt-8">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
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
                    Personeli Güncelle
                  </>
                )}
              </Button>
              <Link href={`/admin/staff/${params.id}`}>
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
