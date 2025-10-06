"use client";

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  Plug, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Key,
  Globe,
  Smartphone,
  Mail,
  CreditCard,
  Calendar,
  MessageSquare,
  Database,
  BarChart3,
  Shield,
  Clock,
  Users,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

export default function IntegrationsManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const stats = {
    totalIntegrations: 24,
    activeIntegrations: 18,
    pendingIntegrations: 3,
    failedIntegrations: 3
  };

  const integrationCategories = [
    { id: 'overview', name: 'Genel Bakış', icon: Activity },
    { id: 'payments', name: 'Ödeme Sistemleri', icon: CreditCard },
    { id: 'communications', name: 'İletişim', icon: MessageSquare },
    { id: 'analytics', name: 'Analitik', icon: BarChart3 },
    { id: 'calendar', name: 'Takvim', icon: Calendar },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'api-keys', name: 'API Anahtarları', icon: Key }
  ];

  const integrations = [
    {
      id: 'iyzico',
      name: 'Iyzico',
      category: 'payments',
      description: 'Kredi kartı ödemeleri için güvenli ödeme altyapısı',
      status: 'active',
      icon: '💳',
      version: 'v2.1.0',
      lastSync: '2024-09-24 14:30',
      connectedTenants: 85,
      monthlyRequests: 12450,
      successRate: 99.2,
      settings: {
        sandbox: false,
        webhook: 'https://api.randevu.com/webhooks/iyzico',
        apiKey: 'iy_xxxxxxxxxxxxxxxxx',
        secretKey: 'sk_xxxxxxxxxxxxxxxxx'
      }
    },
    {
      id: 'paytr',
      name: 'PayTR',
      category: 'payments',
      description: 'Alternatif ödeme yöntemleri ve havale/EFT',
      status: 'active',
      icon: '🏦',
      version: 'v1.5.2',
      lastSync: '2024-09-24 13:15',
      connectedTenants: 42,
      monthlyRequests: 6780,
      successRate: 98.8,
      settings: {
        merchantId: 'M123456',
        merchantKey: 'mk_xxxxxxxxxxxxxxxxx',
        merchantSalt: 'ms_xxxxxxxxxxxxxxxxx'
      }
    },
    {
      id: 'twilio',
      name: 'Twilio SMS',
      category: 'communications',
      description: 'SMS gönderimi ve doğrulama kodları',
      status: 'active',
      icon: '📱',
      version: 'v3.2.0',
      lastSync: '2024-09-24 14:45',
      connectedTenants: 95,
      monthlyRequests: 28560,
      successRate: 97.5,
      settings: {
        accountSid: 'AC_xxxxxxxxxxxxxxxxx',
        authToken: 'at_xxxxxxxxxxxxxxxxx',
        fromNumber: '+1234567890'
      }
    },
    {
      id: 'netgsm',
      name: 'NetGSM',
      category: 'communications',
      description: 'Türkiye yerel SMS servisi',
      status: 'pending',
      icon: '🇹🇷',
      version: 'v2.0.1',
      lastSync: 'Henüz yapılandırılmadı',
      connectedTenants: 0,
      monthlyRequests: 0,
      successRate: 0,
      settings: {
        username: '',
        password: '',
        header: ''
      }
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      category: 'calendar',
      description: 'Randevuları Google Calendar ile senkronize et',
      status: 'active',
      icon: '📅',
      version: 'v4.0.0',
      lastSync: '2024-09-24 14:20',
      connectedTenants: 67,
      monthlyRequests: 15230,
      successRate: 99.8,
      settings: {
        clientId: 'google_client_id',
        clientSecret: 'google_client_secret',
        scopes: ['calendar.events']
      }
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Web sitesi ve uygulama analitikleri',
      status: 'active',
      icon: '📊',
      version: 'GA4',
      lastSync: '2024-09-24 12:00',
      connectedTenants: 73,
      monthlyRequests: 89760,
      successRate: 99.9,
      settings: {
        trackingId: 'G-XXXXXXXXXX',
        measurementId: 'G-XXXXXXXXXX'
      }
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'communications',
      description: 'E-posta gönderimi ve şablonları',
      status: 'failed',
      icon: '📧',
      version: 'v3.10.0',
      lastSync: '2024-09-23 09:30',
      connectedTenants: 0,
      monthlyRequests: 0,
      successRate: 0,
      settings: {
        apiKey: 'sg_xxxxxxxxxxxxxxxxx',
        fromEmail: 'noreply@randevu.com'
      }
    },
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'automation',
      description: 'Otomatik iş akışları ve entegrasyonlar',
      status: 'active',
      icon: '⚡',
      version: 'v2.1.0',
      lastSync: '2024-09-24 11:45',
      connectedTenants: 23,
      monthlyRequests: 4560,
      successRate: 98.2,
      settings: {
        webhookUrl: 'https://hooks.zapier.com/hooks/catch/...',
        apiKey: 'zp_xxxxxxxxxxxxxxxxx'
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Aktif' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Beklemede' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Hatalı' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Pasif' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const toggleApiKeyVisibility = (integrationId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }));
  };

  const maskApiKey = (key: string, show: boolean) => {
    if (show) return key;
    return key.substring(0, 8) + 'x'.repeat(key.length - 8);
  };

  const filteredIntegrations = activeTab === 'overview' 
    ? integrations 
    : integrations.filter(integration => integration.category === activeTab);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plug className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Entegrasyon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIntegrations}</p>
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
                <p className="text-sm font-medium text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeIntegrations}</p>
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
                <p className="text-sm font-medium text-gray-600">Beklemede</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hatalı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">API Gateway</p>
                  <p className="text-xs text-green-600">99.9% uptime</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Webhook Delivery</p>
                  <p className="text-xs text-green-600">Ortalama 120ms</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Rate Limits</p>
                  <p className="text-xs text-yellow-600">%78 kullanımda</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationList = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredIntegrations.map((integration) => (
        <Card key={integration.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{integration.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.version}</p>
                </div>
              </div>
              {getStatusBadge(integration.status)}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{integration.description}</p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{integration.connectedTenants}</p>
                <p className="text-xs text-gray-600">Bağlı Abone</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{integration.successRate}%</p>
                <p className="text-xs text-gray-600">Başarı Oranı</p>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-lg font-semibold text-blue-600">{integration.monthlyRequests.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Aylık İstek</p>
            </div>

            {/* Last Sync */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Son Senkronizasyon</p>
              <p className="text-sm font-medium text-gray-900">{integration.lastSync}</p>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" className="flex-1" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                Loglar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderApiKeys = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform API Anahtarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Master API Key
            </label>
            <div className="flex space-x-2">
              <input
                type={showApiKeys['master'] ? "text" : "password"}
                value="randevu_live_mk_xxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <Button
                variant="outline"
                onClick={() => toggleApiKeyVisibility('master')}
              >
                {showApiKeys['master'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public API Key
            </label>
            <div className="flex space-x-2">
              <input
                type={showApiKeys['public'] ? "text" : "password"}
                value="randevu_live_pk_xxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <Button
                variant="outline"
                onClick={() => toggleApiKeyVisibility('public')}
              >
                {showApiKeys['public'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <div className="flex space-x-2">
              <input
                type={showApiKeys['webhook'] ? "text" : "password"}
                value="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <Button
                variant="outline"
                onClick={() => toggleApiKeyVisibility('webhook')}
              >
                {showApiKeys['webhook'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Kullanım İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">2.4M</p>
              <p className="text-sm text-blue-800">Bu Ay Toplam İstek</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">99.2%</p>
              <p className="text-sm text-green-800">Başarı Oranı</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">145ms</p>
              <p className="text-sm text-purple-800">Ortalama Yanıt Süresi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return renderOverview();
    } else if (activeTab === 'api-keys') {
      return renderApiKeys();
    } else {
      return renderIntegrationList();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Entegrasyonlar</h1>
          <p className="text-gray-600">Platform entegrasyonlarını yönetin ve izleyin</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {integrationCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === category.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {category.name}
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
