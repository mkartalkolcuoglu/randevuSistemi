"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  HeadphonesIcon, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  User,
  Calendar,
  Tag,
  Paperclip,
  Send,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Timer,
  Activity
} from 'lucide-react';

export default function SupportSystem() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const stats = {
    totalTickets: 156,
    openTickets: 23,
    inProgressTickets: 12,
    resolvedTickets: 121,
    avgResponseTime: '2.4 saat',
    customerSatisfaction: 4.7
  };

  const tickets = [
    {
      id: 'TKT-001',
      title: 'Ödeme sistemi entegrasyonu sorunu',
      description: 'Iyzico ödeme sistemi ile bağlantı kurulamıyor, hata kodu: NETWORK_ERROR',
      status: 'open',
      priority: 'high',
      category: 'Teknik',
      tenant: 'Demo Güzellik Salonu',
      tenantId: 't1',
      customer: 'Ayşe Yılmaz',
      customerEmail: 'ayse@demosalon.com',
      assignedTo: 'Mert Özkan',
      createdAt: '2024-09-24 09:30',
      updatedAt: '2024-09-24 14:15',
      responseTime: '1.2 saat',
      tags: ['ödeme', 'iyzico', 'entegrasyon'],
      attachments: 2,
      messages: 5
    },
    {
      id: 'TKT-002',
      title: 'SMS gönderimi çalışmıyor',
      description: 'Randevu hatırlatma SMS\'leri müşterilere gönderilmiyor',
      status: 'in-progress',
      priority: 'medium',
      category: 'Teknik',
      tenant: 'Demo Berber',
      tenantId: 't2',
      customer: 'Mehmet Can',
      customerEmail: 'mehmet@demoberber.com',
      assignedTo: 'Zeynep Demir',
      createdAt: '2024-09-23 16:45',
      updatedAt: '2024-09-24 11:30',
      responseTime: '3.1 saat',
      tags: ['sms', 'bildirim', 'hatırlatma'],
      attachments: 1,
      messages: 8
    },
    {
      id: 'TKT-003',
      title: 'Fatura bilgileri eksik',
      description: 'Aylık faturamda bazı işlemler görünmüyor',
      status: 'resolved',
      priority: 'low',
      category: 'Faturalandırma',
      tenant: 'Demo Klinik',
      tenantId: 't3',
      customer: 'Dr. Zeynep Demir',
      customerEmail: 'zeynep@demoklinik.com',
      assignedTo: 'Can Yılmaz',
      createdAt: '2024-09-22 14:20',
      updatedAt: '2024-09-24 10:15',
      responseTime: '4.2 saat',
      tags: ['fatura', 'ödeme', 'raporlama'],
      attachments: 3,
      messages: 12
    },
    {
      id: 'TKT-004',
      title: 'Yeni özellik talebi: Toplu SMS',
      description: 'Tüm müşterilere aynı anda SMS gönderebilmek istiyoruz',
      status: 'open',
      priority: 'low',
      category: 'Özellik Talebi',
      tenant: 'Spa Merkezi',
      tenantId: 't4',
      customer: 'Selin Kaya',
      customerEmail: 'selin@spamerkezi.com',
      assignedTo: null,
      createdAt: '2024-09-24 13:10',
      updatedAt: '2024-09-24 13:10',
      responseTime: null,
      tags: ['özellik', 'sms', 'toplu-işlem'],
      attachments: 0,
      messages: 1
    },
    {
      id: 'TKT-005',
      title: 'Hesap erişim sorunu',
      description: 'Admin paneline giriş yapamıyorum, şifremi unuttum',
      status: 'in-progress',
      priority: 'medium',
      category: 'Hesap',
      tenant: 'Vintage Kuaför',
      tenantId: 't5',
      customer: 'Deniz Özkan',
      customerEmail: 'deniz@vintage.com',
      assignedTo: 'Elif Demir',
      createdAt: '2024-09-24 08:15',
      updatedAt: '2024-09-24 12:45',
      responseTime: '2.8 saat',
      tags: ['hesap', 'şifre', 'erişim'],
      attachments: 0,
      messages: 4
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Açık' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'İşlemde' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Çözüldü' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Kapalı' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };

    const priorityText = {
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority as keyof typeof priorityColors]}`}>
        {priorityText[priority as keyof typeof priorityText]}
      </span>
    );
  };

  const tabs = [
    { id: 'tickets', name: 'Talepler', icon: HeadphonesIcon },
    { id: 'analytics', name: 'Analitik', icon: TrendingUp },
    { id: 'team', name: 'Ekip', icon: Users },
    { id: 'settings', name: 'Ayarlar', icon: Clock }
  ];

  const renderTickets = () => (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Talep ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
          
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Tüm Durumlar</option>
            <option>Açık</option>
            <option>İşlemde</option>
            <option>Çözüldü</option>
          </select>
          
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Tüm Öncelikler</option>
            <option>Yüksek</option>
            <option>Orta</option>
            <option>Düşük</option>
          </select>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Talep
        </Button>
      </div>

      {/* Tickets List */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Talep</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Müşteri</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Öncelik</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Atanan</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Oluşturulma</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-sm text-gray-500">{ticket.id} • {ticket.category}</div>
                        <div className="flex items-center mt-1 space-x-4">
                          <span className="text-xs text-gray-500 flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {ticket.messages}
                          </span>
                          {ticket.attachments > 0 && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Paperclip className="w-3 h-3 mr-1" />
                              {ticket.attachments}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{ticket.customer}</div>
                        <div className="text-sm text-gray-500">{ticket.tenant}</div>
                        <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="py-4 px-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {ticket.assignedTo || 'Atanmamış'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{ticket.createdAt}</div>
                      {ticket.responseTime && (
                        <div className="text-sm text-gray-500">
                          Yanıt: {ticket.responseTime}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama Yanıt Süresi</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  %15 azaldı
                </p>
              </div>
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Müşteri Memnuniyeti</p>
                <p className="text-2xl font-bold text-green-600">{stats.customerSatisfaction}</p>
                <div className="flex items-center mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(stats.customerSatisfaction) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Çözüm Oranı</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((stats.resolvedTickets / stats.totalTickets) * 100)}%
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  %8 arttı
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Talep Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Teknik</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Faturalandırma</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Hesap</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">10%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Özellik Talebi</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Haftalık Talep Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pazartesi</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <span className="text-sm font-medium">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Salı</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-medium">9</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Çarşamba</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-sm font-medium">15</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Perşembe</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-sm font-medium">6</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cuma</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-sm font-medium">11</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tickets':
        return renderTickets();
      case 'analytics':
        return renderAnalytics();
      case 'team':
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Ekip yönetimi sayfası yakında eklenecek</p>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Destek ayarları sayfası yakında eklenecek</p>
            </CardContent>
          </Card>
        );
      default:
        return renderTickets();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Destek Sistemi</h1>
          <p className="text-gray-600">Müşteri destek taleplerini yönetin ve takip edin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HeadphonesIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Açık</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">İşlemde</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Çözüldü</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Timer className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ort. Yanıt</p>
                  <p className="text-lg font-bold text-gray-900">{stats.avgResponseTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Memnuniyet</p>
                  <p className="text-lg font-bold text-gray-900">{stats.customerSatisfaction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
