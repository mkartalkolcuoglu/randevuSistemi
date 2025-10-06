"use client";

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Database,
  Globe,
  Server,
  Timer,
  Calendar,
  BarChart3,
  AlertCircle,
  Users,
  Monitor
} from 'lucide-react';

export default function SLATracking() {
  const [activeTab, setActiveTab] = useState('overview');

  const slaMetrics = {
    overallUptime: 99.94,
    apiUptime: 99.97,
    responseTime: 125,
    errorRate: 0.03,
    totalIncidents: 2,
    resolvedIncidents: 2,
    mttr: '15 min', // Mean Time To Recovery
    mtbf: '30 gün' // Mean Time Between Failures
  };

  const slaTargets = [
    {
      id: 'uptime',
      name: 'Sistem Çalışma Süresi',
      target: 99.9,
      current: 99.94,
      status: 'good',
      description: 'Aylık sistem erişilebilirlik oranı',
      icon: Server,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'api-response',
      name: 'API Yanıt Süresi',
      target: 200,
      current: 125,
      status: 'good',
      description: 'Ortalama API yanıt süresi (ms)',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'error-rate',
      name: 'Hata Oranı',
      target: 0.1,
      current: 0.03,
      status: 'good',
      description: 'API isteklerinde hata yüzdesi',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      id: 'support-response',
      name: 'Destek Yanıt Süresi',
      target: 2,
      current: 1.5,
      status: 'good',
      description: 'Ortalama destek yanıt süresi (saat)',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const incidents = [
    {
      id: 'INC-001',
      title: 'Ödeme API Geçici Kesinti',
      severity: 'medium',
      status: 'resolved',
      startTime: '2024-09-20 14:30',
      endTime: '2024-09-20 14:45',
      duration: '15 dakika',
      affectedServices: ['Ödeme API', 'Webhook'],
      impactedTenants: 12,
      rootCause: 'Iyzico API\'de geçici yavaşlama',
      resolution: 'Otomatik failover ile çözüldü'
    },
    {
      id: 'INC-002',
      title: 'SMS Gönderim Gecikmesi',
      severity: 'low',
      status: 'resolved',
      startTime: '2024-09-18 09:15',
      endTime: '2024-09-18 10:30',
      duration: '1 saat 15 dakika',
      affectedServices: ['SMS API'],
      impactedTenants: 45,
      rootCause: 'SMS sağlayıcısında kapasite sorunu',
      resolution: 'Alternatif SMS sağlayıcıya yönlendirme'
    }
  ];

  const serviceStatus = [
    {
      name: 'Web Uygulama',
      status: 'operational',
      uptime: 99.98,
      lastIncident: '15 gün önce'
    },
    {
      name: 'API Gateway',
      status: 'operational',
      uptime: 99.97,
      lastIncident: '5 gün önce'
    },
    {
      name: 'Veritabanı',
      status: 'operational',
      uptime: 99.99,
      lastIncident: '30 gün önce'
    },
    {
      name: 'SMS Servisi',
      status: 'degraded',
      uptime: 99.85,
      lastIncident: '2 gün önce'
    },
    {
      name: 'E-posta Servisi',
      status: 'operational',
      uptime: 99.95,
      lastIncident: '8 gün önce'
    },
    {
      name: 'Ödeme Sistemi',
      status: 'operational',
      uptime: 99.92,
      lastIncident: '5 gün önce'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      operational: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Operasyonel' },
      degraded: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: 'Yavaşlama' },
      partial: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, text: 'Kısmi Kesinti' },
      major: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Büyük Kesinti' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.operational;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getSLAStatus = (current: number, target: number, isLowerBetter = false) => {
    const ratio = isLowerBetter ? target / current : current / target;
    if (ratio >= 0.98) return 'good';
    if (ratio >= 0.95) return 'warning';
    return 'critical';
  };

  const getSLAStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: Activity },
    { id: 'targets', name: 'SLA Hedefleri', icon: Target },
    { id: 'incidents', name: 'Olaylar', icon: AlertTriangle },
    { id: 'reports', name: 'Raporlar', icon: BarChart3 }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Genel Çalışma Süresi</p>
                <p className="text-2xl font-bold text-green-600">{slaMetrics.overallUptime}%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Hedefin üzerinde
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Server className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Yanıt Süresi</p>
                <p className="text-2xl font-bold text-blue-600">{slaMetrics.responseTime}ms</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Hedefin altında
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hata Oranı</p>
                <p className="text-2xl font-bold text-yellow-600">{slaMetrics.errorRate}%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Düşük seviye
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MTTR</p>
                <p className="text-2xl font-bold text-purple-600">{slaMetrics.mttr}</p>
                <p className="text-sm text-gray-600">Ortalama çözüm süresi</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Servis Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceStatus.map((service) => (
              <div key={service.name} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  {getStatusBadge(service.status)}
                </div>
                <div className="text-sm text-gray-600">
                  <p>Çalışma Süresi: {service.uptime}%</p>
                  <p>Son Olay: {service.lastIncident}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Son Olaylar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.slice(0, 3).map((incident) => (
              <div key={incident.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{incident.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{incident.rootCause}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Süre: {incident.duration}</span>
                      <span>Etkilenen: {incident.impactedTenants} abone</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Çözüldü
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTargets = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slaTargets.map((target) => {
          const Icon = target.icon;
          const isLowerBetter = target.id === 'api-response' || target.id === 'error-rate' || target.id === 'support-response';
          const status = getSLAStatus(target.current, target.target, isLowerBetter);
          const statusColor = getSLAStatusColor(status);
          
          return (
            <Card key={target.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${target.bgColor} rounded-lg`}>
                      <Icon className={`w-6 h-6 ${target.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{target.name}</h3>
                      <p className="text-sm text-gray-600">{target.description}</p>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${statusColor}`}>
                    {target.id === 'uptime' ? `${target.current}%` : 
                     target.id === 'api-response' ? `${target.current}ms` :
                     target.id === 'error-rate' ? `${target.current}%` :
                     `${target.current}h`}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Hedef: {target.id === 'uptime' ? `${target.target}%` : 
                               target.id === 'api-response' ? `<${target.target}ms` :
                               target.id === 'error-rate' ? `<${target.target}%` :
                               `<${target.target}h`}</span>
                    <span className={statusColor}>
                      {status === 'good' ? 'Başarılı' : 
                       status === 'warning' ? 'Dikkat' : 'Kritik'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'good' ? 'bg-green-500' :
                        status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: isLowerBetter ? 
                          `${Math.min((target.target / target.current) * 100, 100)}%` :
                          `${Math.min((target.current / target.target) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SLA Agreement Summary */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Anlaşması Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Taahhütler</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 99.9% sistem çalışma süresi</li>
                <li>• API yanıt süresi 200ms altında</li>
                <li>• %0.1 altında hata oranı</li>
                <li>• 2 saat altında destek yanıtı</li>
                <li>• 15 dakika altında olay çözümü</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Tazminatlar</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 99.5% - 99.9%: %10 kredi</li>
                <li>• 99% - 99.5%: %25 kredi</li>
                <li>• 99% altında: %50 kredi</li>
                <li>• Büyük kesinti: Tam gün kredi</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncidents = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Olay Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{incident.title}</h4>
                    <p className="text-sm text-gray-600">{incident.id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                      incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {incident.severity === 'high' ? 'Yüksek' :
                       incident.severity === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Çözüldü
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Başlangıç:</strong> {incident.startTime}</p>
                    <p><strong>Bitiş:</strong> {incident.endTime}</p>
                    <p><strong>Süre:</strong> {incident.duration}</p>
                  </div>
                  <div>
                    <p><strong>Etkilenen Servisler:</strong> {incident.affectedServices.join(', ')}</p>
                    <p><strong>Etkilenen Aboneler:</strong> {incident.impactedTenants}</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Kök Neden:</strong> {incident.rootCause}</p>
                  <p className="text-sm mt-1"><strong>Çözüm:</strong> {incident.resolution}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SLA Raporları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Button variant="outline" className="h-24 flex-col">
              <Calendar className="w-6 h-6 mb-2" />
              <span>Aylık SLA Raporu</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              <span>Performans Analizi</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col">
              <AlertTriangle className="w-6 h-6 mb-2" />
              <span>Olay Raporu</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col">
              <TrendingUp className="w-6 h-6 mb-2" />
              <span>Trend Analizi</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col">
              <Users className="w-6 h-6 mb-2" />
              <span>Müşteri Etkisi</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col">
              <Target className="w-6 h-6 mb-2" />
              <span>SLA Uygunluk</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Rapor Dışa Aktarma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline">
              PDF İndir
            </Button>
            <Button variant="outline">
              Excel İndir
            </Button>
            <Button variant="outline">
              JSON İndir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'targets':
        return renderTargets();
      case 'incidents':
        return renderIncidents();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SLA Takibi</h1>
          <p className="text-gray-600">Hizmet seviyesi anlaşmalarını izleyin ve raporlayın</p>
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
