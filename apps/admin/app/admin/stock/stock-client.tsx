"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Plus, Package, Edit, Trash2, Save, X, Search } from 'lucide-react';
import AdminHeader from '../admin-header';
import type { AuthenticatedUser } from '../../../lib/auth-utils';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StockClientProps {
  initialProducts: Product[];
  tenantId?: string;
  user: AuthenticatedUser;
}

export default function StockClient({ initialProducts, tenantId, user }: StockClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
      } else {
        alert('Ürünler yüklenirken hata oluştu: ' + result.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.price) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Ürün başarıyla eklendi!');
        setFormData({ name: '', quantity: '', price: '' });
        setShowAddForm(false);
        fetchProducts();
      } else {
        alert('Ürün eklenirken hata oluştu: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Ürün eklenirken hata oluştu');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      quantity: product.quantity.toString(),
      price: product.price.toString()
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Ürün başarıyla güncellendi!');
        setEditingProduct(null);
        setFormData({ name: '', quantity: '', price: '' });
        fetchProducts();
      } else {
        alert('Ürün güncellenirken hata oluştu: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ürün güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Ürün başarıyla silindi!');
        fetchProducts();
      } else {
        alert('Ürün silinirken hata oluştu: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ürün silinirken hata oluştu');
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({ name: '', quantity: '', price: '' });
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">Stokta Yok</Badge>;
    } else if (quantity <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Az Stok</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Stokta</Badge>;
    }
  };

  // Filtrelenmiş ürünleri hesapla
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'out-of-stock') {
      matchesStatus = product.quantity === 0;
    } else if (statusFilter === 'low-stock') {
      matchesStatus = product.quantity > 0 && product.quantity <= 5;
    } else if (statusFilter === 'in-stock') {
      matchesStatus = product.quantity > 5;
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Ürünler yükleniyor...</p>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 mr-3" />
                Stok Yönetimi
              </h1>
              <p className="text-gray-600 mt-2">Ürünlerinizi ekleyin, düzenleyin ve stok durumlarını takip edin</p>
            </div>
            
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün Ekle
            </Button>
          </div>

          {/* Yeni Ürün Ekleme Formu */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Yeni Ürün Ekle</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="name">Ürün Adı *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ürün adını girin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Adet *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Stok miktarı"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Fiyat (₺) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Ürün Düzenleme Formu */}
          {editingProduct && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Ürün Düzenle</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Ürün Adı *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ürün adını girin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-quantity">Adet *</Label>
                    <Input
                      id="edit-quantity"
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Stok miktarı"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-price">Fiyat (₺) *</Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Güncelle
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Arama ve Filtre */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Ürün adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">Tüm Ürünler</option>
                    <option value="in-stock">Stokta Var</option>
                    <option value="low-stock">Az Stok</option>
                    <option value="out-of-stock">Stokta Yok</option>
                  </select>
                </div>
              </div>
              
              {/* Sonuç sayısı */}
              <div className="mt-4 text-sm text-gray-600">
                {searchTerm || statusFilter !== 'all' ? (
                  <span>
                    {filteredProducts.length} ürün bulundu
                    {searchTerm && ` "${searchTerm}" araması için`}
                    {statusFilter !== 'all' && ` (${
                      statusFilter === 'in-stock' ? 'Stokta Var' :
                      statusFilter === 'low-stock' ? 'Az Stok' :
                      statusFilter === 'out-of-stock' ? 'Stokta Yok' : ''
                    })`}
                  </span>
                ) : (
                  <span>Toplam {products.length} ürün</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ürün Listesi */}
          <Card>
            <CardHeader>
              <CardTitle>Ürün Listesi ({filteredProducts.length} ürün)</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  {products.length === 0 ? (
                    <>
                      <p className="text-gray-500 text-lg">Henüz ürün eklenmemiş</p>
                      <p className="text-gray-400">İlk ürününüzü eklemek için yukarıdaki butonu kullanın</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-lg">Arama kriterlerinize uygun ürün bulunamadı</p>
                      <p className="text-gray-400">Farklı arama terimleri deneyebilir veya filtreleri temizleyebilirsiniz</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Ürün Adı</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Stok Miktarı</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Birim Fiyat</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Toplam Değer</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-lg font-semibold">{product.quantity} adet</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-green-600 font-semibold">₺{product.price.toFixed(2)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-blue-600 font-semibold">
                              ₺{(product.quantity * product.price).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStockStatus(product.quantity)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product.id, product.name)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Özet Bilgiler */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900">
                          {searchTerm || statusFilter !== 'all' ? 'Filtrelenmiş Ürün Sayısı' : 'Toplam Ürün Sayısı'}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">{filteredProducts.length}</p>
                        {(searchTerm || statusFilter !== 'all') && (
                          <p className="text-sm text-blue-700 mt-1">Toplam: {products.length}</p>
                        )}
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-900">
                          {searchTerm || statusFilter !== 'all' ? 'Filtrelenmiş Stok Adedi' : 'Toplam Stok Adedi'}
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {filteredProducts.reduce((sum, product) => sum + product.quantity, 0)} adet
                        </p>
                        {(searchTerm || statusFilter !== 'all') && (
                          <p className="text-sm text-green-700 mt-1">
                            Toplam: {products.reduce((sum, product) => sum + product.quantity, 0)} adet
                          </p>
                        )}
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-900">
                          {searchTerm || statusFilter !== 'all' ? 'Filtrelenmiş Stok Değeri' : 'Toplam Stok Değeri'}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">
                          ₺{filteredProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0).toFixed(2)}
                        </p>
                        {(searchTerm || statusFilter !== 'all') && (
                          <p className="text-sm text-purple-700 mt-1">
                            Toplam: ₺{products.reduce((sum, product) => sum + (product.quantity * product.price), 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
