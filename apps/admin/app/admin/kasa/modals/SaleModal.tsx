'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  editingTransaction?: any;
}

export default function SaleModal({ isOpen, onClose, onSuccess, tenantId, editingTransaction }: SaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [customerPackages, setCustomerPackages] = useState<any[]>([]);
  const [matchingUsage, setMatchingUsage] = useState<any>(null);

  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    paymentType: 'cash',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCustomers();
      
      if (editingTransaction) {
        setFormData({
          productId: editingTransaction.productId || '',
          customerId: editingTransaction.customerId || '',
          quantity: editingTransaction.quantity || 1,
          paymentType: editingTransaction.paymentType || 'cash',
          date: editingTransaction.date
        });
      }
    }
  }, [isOpen, editingTransaction]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?tenantId=${tenantId}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.filter((p: Product) => p.stock > 0));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?tenantId=${tenantId}`);
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const selectedProduct = products.find(p => p.id === formData.productId);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  // Fetch customer packages when customer changes
  useEffect(() => {
    if (!formData.customerId || !selectedCustomer?.phone) {
      setCustomerPackages([]);
      setMatchingUsage(null);
      return;
    }
    fetch('/api/customer-packages/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: selectedCustomer.phone })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.hasPackages) setCustomerPackages(data.packages || []);
        else setCustomerPackages([]);
      })
      .catch(() => setCustomerPackages([]));
  }, [formData.customerId]);

  // Check if selected product matches a customer package
  useEffect(() => {
    if (!formData.productId || customerPackages.length === 0) {
      setMatchingUsage(null);
      return;
    }
    for (const pkg of customerPackages) {
      const match = (pkg.usages || []).find((u: any) =>
        u.itemType === 'product' && u.itemId === formData.productId && u.remainingQuantity > 0
      );
      if (match) {
        setMatchingUsage({ ...match, packageName: pkg.package?.name, customerPackageId: pkg.id });
        return;
      }
    }
    setMatchingUsage(null);
  }, [formData.productId, customerPackages]);

  const totalAmount = selectedProduct ? selectedProduct.price * formData.quantity : 0;
  const totalCost = selectedProduct ? selectedProduct.cost * formData.quantity : 0;
  const profit = totalAmount - totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.customerId) {
      alert('Lütfen ürün ve müşteri seçiniz');
      return;
    }

    if (!selectedProduct || selectedProduct.stock < formData.quantity) {
      alert('Yetersiz stok!');
      return;
    }

    setLoading(true);

    try {
      const isPackage = formData.paymentType === 'package' && matchingUsage;

      const payload: any = {
        tenantId,
        type: 'sale',
        amount: isPackage ? 0 : totalAmount,
        description: isPackage
          ? `${selectedProduct.name} satışı (Paketten - ${matchingUsage.packageName})`
          : `${selectedProduct.name} satışı`,
        paymentType: formData.paymentType,
        customerId: formData.customerId,
        customerName: `${selectedCustomer?.firstName} ${selectedCustomer?.lastName}`,
        productId: formData.productId,
        productName: selectedProduct.name,
        quantity: formData.quantity,
        date: formData.date
      };

      // Add package info for deduction
      if (isPackage) {
        payload.packageInfo = {
          customerPackageId: matchingUsage.customerPackageId,
          usageId: matchingUsage.id,
          packageName: matchingUsage.packageName,
          productId: formData.productId,
        };
      }

      const url = editingTransaction 
        ? `/api/transactions/${editingTransaction.id}`
        : '/api/transactions';
      
      const method = editingTransaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        const errorMsg = data.details || data.error || 'Satış eklenirken hata oluştu';
        alert(errorMsg);
        console.error('Sale error:', data);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Satış eklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => {
        setShowProductList(false);
        setShowCustomerList(false);
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingTransaction ? 'Satışı Düzenle' : 'Yeni Satış'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün *
            </label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductList(true);
                // Clear selection if user types
                if (formData.productId) {
                  setFormData({ ...formData, productId: '' });
                }
              }}
              onFocus={() => setShowProductList(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ürün ara..."
              required
            />
            {showProductList && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {products
                  .filter(p => 
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    productSearch === ''
                  )
                  .map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setFormData({ ...formData, productId: product.id });
                        setProductSearch(`${product.name} - ₺${product.price}`);
                        setShowProductList(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        ₺{product.price.toLocaleString('tr-TR')} • Stok: {product.stock}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri *
            </label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerList(true);
                // Clear selection if user types
                if (formData.customerId) {
                  setFormData({ ...formData, customerId: '' });
                }
              }}
              onFocus={() => setShowCustomerList(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Müşteri ara..."
              required
            />
            {showCustomerList && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {customers
                  .filter(c => 
                    `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    customerSearch === ''
                  )
                  .map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setFormData({ ...formData, customerId: customer.id });
                        setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
                        setShowCustomerList(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {customer.firstName} {customer.lastName}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adet *
            </label>
            <input
              type="number"
              min="1"
              max={selectedProduct?.stock || 999}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            {selectedProduct && (
              <p className="text-sm text-gray-500 mt-1">
                Mevcut Stok: {selectedProduct.stock} adet
              </p>
            )}
          </div>

          {/* Package Banner */}
          {matchingUsage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                🎁 Bu ürün müşterinin paketinde mevcut!
              </p>
              <p className="text-xs text-green-600 mt-1">
                {matchingUsage.packageName} - {matchingUsage.itemName} ({matchingUsage.remainingQuantity} kalan)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödeme Tipi *
            </label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="cash">Nakit</option>
              <option value="card">Kart</option>
              <option value="transfer">Havale</option>
              {matchingUsage && (
                <option value="package">Paket ({matchingUsage.packageName} - {matchingUsage.remainingQuantity} kalan)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Summary */}
          {selectedProduct && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Birim Fiyat:</span>
                <span className="font-semibold">₺{selectedProduct.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Adet:</span>
                <span className="font-semibold">{formData.quantity}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Toplam:</span>
                <span className="font-bold text-2xl text-green-600">
                  {formData.paymentType === 'package' && matchingUsage ? '🎁 Paketten' : `₺${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Kaydediliyor...' : editingTransaction ? 'Güncelle' : 'Satışı Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

