'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@repo/ui';

interface PackageItem {
  id?: string;
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
}

interface PackageModalProps {
  tenantId: string;
  package: Package | null;
  onClose: () => void;
  onSave: () => void;
}

export default function PackageModal({
  tenantId,
  package: existingPackage,
  onClose,
  onSave
}: PackageModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [items, setItems] = useState<PackageItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServicesAndProducts();

    if (existingPackage) {
      setName(existingPackage.name);
      setDescription(existingPackage.description || '');
      setPrice(existingPackage.price.toString());
      setItems(existingPackage.items);
    }
  }, [existingPackage]);

  const loadServicesAndProducts = async () => {
    try {
      // Load services
      const servicesRes = await fetch(`/api/services?tenantId=${tenantId}`);
      const servicesData = await servicesRes.json();
      if (servicesData.success) {
        setServices(servicesData.data);
      }

      // Load products
      const productsRes = await fetch(`/api/products?tenantId=${tenantId}`);
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data);
      }
    } catch (error) {
      console.error('Error loading services/products:', error);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemType: 'service',
        itemId: '',
        itemName: '',
        quantity: 1
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'itemId') {
      // When item is selected, also set the name
      const itemType = newItems[index].itemType;
      const selectedItem = itemType === 'service'
        ? services.find(s => s.id === value)
        : products.find(p => p.id === value);
      
      newItems[index].itemId = value;
      newItems[index].itemName = selectedItem?.name || '';
    } else {
      (newItems[index] as any)[field] = value;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price || items.length === 0) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Validate all items have selections
    const invalidItems = items.filter(item => !item.itemId || !item.quantity);
    if (invalidItems.length > 0) {
      alert('Lütfen tüm paket öğelerini eksiksiz doldurun');
      return;
    }

    setLoading(true);

    try {
      const method = existingPackage ? 'PUT' : 'POST';
      const body = {
        ...(existingPackage && { id: existingPackage.id }),
        tenantId,
        name,
        description,
        price: parseFloat(price),
        items: items.map(item => ({
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: parseInt(item.quantity.toString())
        }))
      };

      const response = await fetch('/api/packages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        onSave();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Paket kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingPackage ? 'Paketi Düzenle' : 'Yeni Paket Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paket Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Gold Paket"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paket hakkında açıklama..."
              rows={3}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paket Fiyatı (₺) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Package Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Paket İçeriği *
              </label>
              <Button
                type="button"
                onClick={handleAddItem}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Öğe Ekle
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600">
                  Henüz öğe eklenmedi. "Öğe Ekle" butonuna tıklayın.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Item Type */}
                    <select
                      value={item.itemType}
                      onChange={(e) =>
                        handleItemChange(index, 'itemType', e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="service">Hizmet</option>
                      <option value="product">Ürün</option>
                    </select>

                    {/* Item Selection */}
                    <select
                      value={item.itemId}
                      onChange={(e) =>
                        handleItemChange(index, 'itemId', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">
                        {item.itemType === 'service'
                          ? 'Hizmet Seçin'
                          : 'Ürün Seçin'}
                      </option>
                      {item.itemType === 'service'
                        ? services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} (₺{service.price})
                            </option>
                          ))
                        : products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Stok: {product.stock})
                            </option>
                          ))}
                    </select>

                    {/* Quantity */}
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Adet"
                      min="1"
                      required
                    />

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading
                ? 'Kaydediliyor...'
                : existingPackage
                ? 'Güncelle'
                : 'Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

