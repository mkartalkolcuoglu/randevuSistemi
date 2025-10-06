"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';

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
        setFormData({
          ...data.data,
          experience: data.data.experience?.toString() || '',
          rating: data.data.rating?.toString() || '',
          salary: data.data.salary?.toString() || ''
        });
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
    setIsLoading(true);

    try {
      const response = await fetch(`/api/staff/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          experience: parseInt(formData.experience) || 0,
          rating: parseFloat(formData.rating) || 0,
          salary: parseFloat(formData.salary) || 0
        })
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
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
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
                  placeholder="Personel adı"
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
                  placeholder="Personel soyadı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+90 555 123 45 67"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Pozisyon *</Label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pozisyon seçin</option>
                  <option value="Kuaför">Kuaför</option>
                  <option value="Berber">Berber</option>
                  <option value="Estetisyen">Estetisyen</option>
                  <option value="Masaj Terapisti">Masaj Terapisti</option>
                  <option value="Nail Technician">Nail Technician</option>
                  <option value="Resepsiyon">Resepsiyon</option>
                  <option value="Temizlik">Temizlik</option>
                </select>
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
                  placeholder="5"
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
                  placeholder="4.5"
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
                  placeholder="8000"
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
                  placeholder="Yeni uzmanlık alanı ekleyin"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                />
                <Button type="button" onClick={addSpecialization} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specializations.map((spec, index) => (
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
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Personel hakkında notlar..."
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
