"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { 
  ChevronLeft,
  Server,
  Activity,
  Clock,
  Database,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Settings,
  RotateCcw,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cron-jobs' | 'health' | 'logs'>('overview');

  // Mock data - gerçek implementasyonda API'den gelecek
  const systemMetrics = {
    uptime: '7 gün 14 saat',
    memoryUsage: 68,
    cpuUsage: 45,
    diskUsage: 34,
    activeConnections: 1247,
    requestsPerMinute: 342,
    responseTime: '145ms',
    errorRate: 0.2,
  };

  const cronJobs = [
    {
      id: '1',
      name: 'daily-summary',
      title: 'Günlük Özet Gönderimi',
      schedule: '0 8 * * *',
      description: 'Tüm tenant\'lara günlük iş özeti gönderir',
      status: 'active',
      lastRun: '2024-07-20 08:00:15',
      lastDuration: '45s',
      successRate: 98.5,
      totalRuns: 147,
    },
    {
      id: '2',
      name: 'appointment-reminders',
      title: 'Randevu Hatırlatmaları',
      schedule: '0 18 * * *',
      description: 'Ertesi gün randevu hatırlatmalarını gönderir',
      status: 'active',
      lastRun: '2024-07-20 18:00:08',
      lastDuration: '2m 15s',
      successRate: 96.2,
      totalRuns: 147,
    },
    {
      id: '3',
      name: 'birthday-greetings',
      title: 'Doğum Günü Kutlamaları',
      schedule: '0 9 * * *',
      description: 'Doğum günü olan müşterilere kutlama mesajları gönderir',
      status: 'active',
      lastRun: '2024-07-20 09:00:32',
      lastDuration: '1m 8s',
      successRate: 99.1,
      totalRuns: 147,
    },
    {
      id: '4',
      name: 'system-health-check',
      title: 'Sistem Sağlık Kontrolü',
      schedule: '*/30 * * * *',
      description: 'Sistem bileşenlerinin sağlığını kontrol eder',
      status: 'active',
      lastRun: '2024-07-20 15:30:00',
      lastDuration: '5s',
      successRate: 100,
      totalRuns: 4320,
    },
    {
      id: '5',
      name: 'data-cleanup',
      title: 'Veri Temizleme',
      schedule: '0 2 * * *',
      description: 'Eski verileri temizler ve optimize eder',
      status: 'paused',
      lastRun: '2024-07-19 02:00:15',
      lastDuration: '15m 23s',
      successRate: 94.7,
      totalRuns: 145,
    },
    {
      id: '6',
      name: 'backup-database',
      title: 'Veritabanı Yedekleme',
      schedule: '0 3 * * *',
      description: 'Veritabanının günlük yedeğini alır',
      status: 'error',
      lastRun: '2024-07-20 03:00:00',
      lastDuration: '0s',
      successRate: 89.2,
      totalRuns: 146,
    },
  ];

  const healthChecks = [
    { name: 'Database Connection', status: 'healthy', response: '12ms', lastCheck: '30s ago' },
    { name: 'Redis Cache', status: 'healthy', response: '3ms', lastCheck: '30s ago' },
    { name: 'Email Service', status: 'healthy', response: '245ms', lastCheck: '1m ago' },
    { name: 'SMS Service', status: 'warning', response: '1.2s', lastCheck: '2m ago' },
    { name: 'Payment Gateway', status: 'healthy', response: '156ms', lastCheck: '1m ago' },
    { name: 'File Storage', status: 'healthy', response: '45ms', lastCheck: '30s ago' },
    { name: 'Background Jobs', status: 'error', response: 'N/A', lastCheck: '5m ago' },
    { name: 'API Rate Limits', status: 'healthy', response: '2ms', lastCheck: '30s ago' },
  ];

  const recentLogs = [
    {
      id: '1',
      timestamp: '2024-07-20 15:30:15',
      level: 'ERROR',
      service: 'background-jobs',
      message: 'Failed to process birthday greetings for tenant: tenant_xyz',
      details: 'Connection timeout after 30s',
    },
    {
      id: '2',
      timestamp: '2024-07-20 15:25:08',
      level: 'WARN',
      service: 'sms-service',
      message: 'High response time detected: 1.2s',
      details: 'SMS provider latency increased',
    },
    {
      id: '3',
      timestamp: '2024-07-20 15:20:00',
      level: 'INFO',
      service: 'cron-scheduler',
      message: 'Daily summary job completed successfully',
      details: 'Processed 118 tenants in 45s',
    },
    {
      id: '4',
      timestamp: '2024-07-20 15:15:33',
      level: 'INFO',
      service: 'auth-service',
      message: 'New admin user logged in',
      details: 'User: admin@example.com from IP: 192.168.1.100',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Durduruldu</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Hata</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800">ERROR</Badge>;
      case 'WARN':
        return <Badge className="bg-yellow-100 text-yellow-800">WARN</Badge>;
      case 'INFO':
        return <Badge className="bg-blue-100 text-blue-800">INFO</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/project-admin">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Project Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sistem Yönetimi</h1>
                <p className="text-sm text-gray-600">Platform sistem durumu ve otomatik görevler</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Sistem Ayarları
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Server className="w-4 h-4 inline mr-2" />
                Sistem Özeti
              </button>
              <button
                onClick={() => setActiveTab('cron-jobs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cron-jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Cron Jobs
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'health'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Sistem Sağlığı
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Sistem Logları
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{systemMetrics.uptime}</p>
                    </div>
                    <Server className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CPU Kullanımı</p>
                      <p className="text-2xl font-bold text-gray-900">{systemMetrics.cpuUsage}%</p>
                    </div>
                    <Cpu className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${systemMetrics.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">RAM Kullanımı</p>
                      <p className="text-2xl font-bold text-gray-900">{systemMetrics.memoryUsage}%</p>
                    </div>
                    <MemoryStick className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${systemMetrics.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Disk Kullanımı</p>
                      <p className="text-2xl font-bold text-gray-900">{systemMetrics.diskUsage}%</p>
                    </div>
                    <HardDrive className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${systemMetrics.diskUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Wifi className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Aktif Bağlantılar</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.activeConnections.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">İstek/Dakika</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.requestsPerMinute.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Yanıt Süresi</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.responseTime}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Hata Oranı</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.errorRate}%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Cron Jobs Tab */}
        {activeTab === 'cron-jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Cron Jobs</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Job
              </Button>
            </div>

            <div className="space-y-4">
              {cronJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <p className="text-gray-600 mb-4">{job.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Zamanlama:</span>
                            <code className="block bg-gray-100 px-2 py-1 rounded mt-1">{job.schedule}</code>
                          </div>
                          <div>
                            <span className="text-gray-500">Son Çalışma:</span>
                            <span className="block mt-1">{job.lastRun}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Süre:</span>
                            <span className="block mt-1">{job.lastDuration}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Başarı Oranı:</span>
                            <span className="block mt-1 font-medium">{job.successRate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {job.status === 'active' ? (
                          <Button variant="outline" size="sm">
                            <Pause className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Sistem Sağlığı</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {healthChecks.map((check, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getHealthStatusIcon(check.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{check.name}</h3>
                          <p className="text-sm text-gray-500">Son kontrol: {check.lastCheck}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{check.response}</p>
                        <p className="text-xs text-gray-500 capitalize">{check.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Son Sistem Logları</h2>
              <Button variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getLogLevelBadge(log.level)}
                            <span className="text-sm text-gray-500">{log.timestamp}</span>
                            <span className="text-sm font-medium text-gray-700">{log.service}</span>
                          </div>
                          <p className="text-gray-900 mb-1">{log.message}</p>
                          <p className="text-sm text-gray-500">{log.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
