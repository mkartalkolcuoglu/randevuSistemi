'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@repo/ui';

interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  items: any[];
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface AssignPackageModalProps {
  tenantId: string;
  package: Package;
  onClose: () => void;
  onAssign: () => void;
}

export default function AssignPackageModal({
  tenantId,
  package: pkg,
  onClose,
  onAssign
}: AssignPackageModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentType, setPaymentType] = useState('cash');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [tenantId]);

  useEffect(() => {
    // Filter customers based on search term
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.firstName.toLowerCase().includes(term) ||
            c.lastName.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            c.phone?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await fetch(`/api/customers?tenantId=${tenantId}`);
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
        setFilteredCustomers(result.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCustomer) {
      alert('Lütfen bir müşteri seçin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/packages/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          customerId: selectedCustomer.id,
          tenantId,
          paymentType,
          expiresAt: expiresAt || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        onAssign();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Error assigning package:', error);
      alert('Paket atanırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Paketi Müşteriye Ata</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{pkg.name}</span> - ₺{pkg.price.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Package Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Paket İçeriği:</h3>
            <ul className="space-y-1">
              {pkg.items.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {item.quantity}x {item.itemName}
                  <span className="ml-2 text-xs text-gray-500">
                    ({item.itemType === 'service' ? 'Hizmet' : 'Ürün'})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Seçin *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Müşteri ara (isim, email, telefon)..."
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
            {loadingCustomers ? (
              <div className="p-8 text-center text-gray-600">
                Müşteriler yükleniyor...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                {searchTerm ? 'Müşteri bulunamadı' : 'Henüz müşteri yok'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <div className="flex items-center">
                          <span className="text-blue-600 text-sm font-semibold">
                            ✓ Seçildi
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödeme Tipi *
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Nakit</option>
              <option value="card">Kredi Kartı</option>
              <option value="transfer">Havale/EFT</option>
            </select>
          </div>

          {/* Expiration Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Son Kullanma Tarihi (Opsiyonel)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Boş bırakılırsa süresiz olur
            </p>
          </div>

          {/* Selected Customer Summary */}
          {selectedCustomer && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2">Seçilen Müşteri:</h4>
              <p className="text-sm text-gray-700">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
              {selectedCustomer.phone && (
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            onClick={handleAssign}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || !selectedCustomer}
          >
            {loading ? 'Atanıyor...' : 'Paketi Ata ve Ödeme Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
}

