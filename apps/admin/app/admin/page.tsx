import { Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';

export const dynamic = 'force-dynamic';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  User
} from 'lucide-react';
import Link from 'next/link';
import { requireAuth } from '../../lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import AdminHeader from './admin-header';

const prisma = new PrismaClient();

// Server-side data fetching functions
async function getDashboardData(tenantId: string, userType: string, staffId?: string) {
  try {
    console.log('📊 [Dashboard] Fetching data for tenant:', tenantId);
    console.log('👤 [Dashboard] User type:', userType);
    console.log('🆔 [Dashboard] Staff ID:', staffId);

    // Build where clause for appointments
    const appointmentWhere: any = { tenantId: tenantId };
    
    // If user is staff, only show their appointments
    if (userType === 'staff' && staffId) {
      appointmentWhere.staffId = staffId;
      console.log('📌 [Dashboard] Filtering appointments by staffId:', staffId);
    }

    // Get real data from PostgreSQL database using Prisma
    const appointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      orderBy: { createdAt: 'desc' }
    });

    // Customers query - show all for tenant (staff can see all customers)
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    console.log('📊 [Dashboard] Found', appointments.length, 'appointments and', customers.length, 'customers');

    // Calculate stats
    const totalAppointments = appointments.length;
    
    // Today's appointments
    const todayAppointments = appointments.filter((app) => {
      const today = new Date().toISOString().split('T')[0];
      return app.date === today;
    }).length;
    
    // This month's appointments
    const thisMonthAppointments = appointments.filter((app) => {
      const appointmentDate = new Date(app.date);
      const now = new Date();
      return appointmentDate.getMonth() === now.getMonth() && 
             appointmentDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Monthly revenue (exclude package usage)
    const monthlyRevenue = appointments
      .filter((app) => {
        const appointmentDate = new Date(app.date);
        const now = new Date();
        return appointmentDate.getMonth() === now.getMonth() && 
               appointmentDate.getFullYear() === now.getFullYear() &&
               !app.packageInfo; // Exclude package usage appointments from revenue
      })
      .reduce((sum, app) => sum + (Number(app.price) || 0), 0);

    // Completed appointments count
    const completedAppointments = appointments.filter((app) => 
      app.status === 'completed' || app.status === 'confirmed'
    ).length;

    const recentAppointments = appointments.slice(0, 5);

    return {
      totalAppointments,
      todayAppointments,
      thisMonthAppointments,
      completedAppointments,
      totalCustomers: customers.length,
      monthlyRevenue,
      recentAppointments,
      appointmentsByStatus: {
        scheduled: appointments.filter((app) => app.status === 'scheduled').length,
        completed: appointments.filter((app) => app.status === 'completed' || app.status === 'confirmed').length,
        cancelled: appointments.filter((app) => app.status === 'cancelled').length,
        pending: appointments.filter((app) => app.status === 'pending').length,
      }
    };
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    return {
      totalAppointments: 0,
      todayAppointments: 0,
      thisMonthAppointments: 0,
      completedAppointments: 0,
      totalCustomers: 0,
      monthlyRevenue: 0,
      recentAppointments: [],
      appointmentsByStatus: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
      }
    };
  } finally {
    await prisma.$disconnect();
  }
}

export default async function AdminDashboard() {
  // Require authentication and get user data
  const user = await requireAuth();
  const dashboardData = await getDashboardData(user.tenantId, user.userType, user.staffId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'confirmed':
        return 'Tamamlandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'pending':
        return 'Beklemede';
      case 'no_show':
        return 'Gelmedi ve Bilgi Vermedi';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hoş Geldiniz, {user.ownerName}</h1>
          <p className="text-gray-600">{user.businessName} yönetim paneli</p>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="p-2 bg-blue-100 rounded-lg mb-2 sm:mb-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam Randevu</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.totalAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="p-2 bg-green-100 rounded-lg mb-2 sm:mb-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Bu Ay</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.thisMonthAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="p-2 bg-purple-100 rounded-lg mb-2 sm:mb-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.completedAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="p-2 bg-orange-100 rounded-lg mb-2 sm:mb-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Bu Ay Gelir</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.monthlyRevenue.toLocaleString('tr-TR')}₺</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Yönetim Modülleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/appointments" className="block">
                <div className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-900">Randevu Yönetimi</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/customers" className="block">
                <div className="p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-medium text-green-900">Müşteri Yönetimi</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/services" className="block">
                <div className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="font-medium text-purple-900">Hizmet Yönetimi</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/staff" className="block">
                <div className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="font-medium text-orange-900">Personel Yönetimi</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/reports" className="block">
                <div className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600 mr-3" />
                    <span className="font-medium text-indigo-900">Raporlama</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/settings" className="block">
                <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-900">Ayarlar</span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Appointment Status Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Randevu Durumları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Planlandı</span>
                </div>
                <span className="font-semibold">{dashboardData.appointmentsByStatus.scheduled}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-600">Beklemede</span>
                </div>
                <span className="font-semibold">{dashboardData.appointmentsByStatus.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Tamamlandı</span>
                </div>
                <span className="font-semibold">{dashboardData.appointmentsByStatus.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-gray-600">İptal Edildi</span>
                </div>
                <span className="font-semibold">{dashboardData.appointmentsByStatus.cancelled}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Son Randevular</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz randevu bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{appointment.customerName}</p>
                        <p className="text-xs text-gray-500">{appointment.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{appointment.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}