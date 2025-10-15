'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
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
      const payload = {
        tenantId,
        type: 'sale',
        amount: totalAmount,
        description: `${selectedProduct.name} satışı`,
        paymentType: formData.paymentType,
        customerId: formData.customerId,
        customerName: `${selectedCustomer?.firstName} ${selectedCustomer?.lastName}`,
        productId: formData.productId,
        productName: selectedProduct.name,
        quantity: formData.quantity,
        date: formData.date
      };

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
        alert(data.error || 'Satış eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Satış eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingTransaction ? 'Satışı Düzenle' : 'Yeni Satış'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Ürün Seçiniz</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ₺{product.price} (Stok: {product.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Müşteri Seçiniz</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </option>
              ))}
            </select>
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Maliyet:</span>
                <span className="font-semibold text-red-600">₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Toplam:</span>
                <span className="font-bold text-lg text-green-600">₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Kâr:</span>
                <span className="font-bold text-lg text-blue-600">₺{profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
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

