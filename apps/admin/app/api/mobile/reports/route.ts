import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      staffId?: string;
      ownerId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get month name in Turkish
function getMonthName(month: number): string {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return months[month];
}

// GET - Get reports data
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only owners and staff can view reports
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const now = new Date();

    // Current month dates
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = now;

    // Last month dates
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Format dates for comparison
    const thisMonthStartStr = formatDate(thisMonthStart);
    const thisMonthEndStr = formatDate(thisMonthEnd);
    const lastMonthStartStr = formatDate(lastMonthStart);
    const lastMonthEndStr = formatDate(lastMonthEnd);

    // Fetch all data in parallel
    const [
      thisMonthTransactions,
      lastMonthTransactions,
      thisMonthAppointments,
      lastMonthAppointments,
      thisMonthCustomers,
      lastMonthCustomers,
      allAppointments,
      services,
      staff
    ] = await Promise.all([
      // This month transactions
      prisma.transaction.findMany({
        where: {
          tenantId: auth.tenantId,
          date: { gte: thisMonthStartStr, lte: thisMonthEndStr },
        },
      }),
      // Last month transactions
      prisma.transaction.findMany({
        where: {
          tenantId: auth.tenantId,
          date: { gte: lastMonthStartStr, lte: lastMonthEndStr },
        },
      }),
      // This month appointments
      prisma.appointment.findMany({
        where: {
          tenantId: auth.tenantId,
          date: { gte: thisMonthStartStr, lte: thisMonthEndStr },
        },
      }),
      // Last month appointments
      prisma.appointment.findMany({
        where: {
          tenantId: auth.tenantId,
          date: { gte: lastMonthStartStr, lte: lastMonthEndStr },
        },
      }),
      // This month new customers
      prisma.customer.count({
        where: {
          tenantId: auth.tenantId,
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      // Last month new customers
      prisma.customer.count({
        where: {
          tenantId: auth.tenantId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // All appointments for status distribution and service/staff stats
      prisma.appointment.findMany({
        where: {
          tenantId: auth.tenantId,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Services
      prisma.service.findMany({
        where: { tenantId: auth.tenantId },
      }),
      // Staff
      prisma.staff.findMany({
        where: { tenantId: auth.tenantId, status: 'active' },
      }),
    ]);

    // Calculate KPI metrics
    const incomeTypes = ['income', 'sale', 'appointment', 'package'];

    const thisMonthRevenue = thisMonthTransactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthRevenue = lastMonthTransactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthAppointmentCount = thisMonthAppointments
      .filter(a => a.status !== 'cancelled').length;

    const lastMonthAppointmentCount = lastMonthAppointments
      .filter(a => a.status !== 'cancelled').length;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0 && current > 0) return 100;
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueChange = calculateChange(thisMonthRevenue, lastMonthRevenue);
    const appointmentChange = calculateChange(thisMonthAppointmentCount, lastMonthAppointmentCount);
    const customerChange = calculateChange(thisMonthCustomers, lastMonthCustomers);

    const thisMonthAvgValue = thisMonthAppointmentCount > 0
      ? thisMonthRevenue / thisMonthAppointmentCount
      : 0;
    const lastMonthAvgValue = lastMonthAppointmentCount > 0
      ? lastMonthRevenue / lastMonthAppointmentCount
      : 0;
    const avgValueChange = calculateChange(thisMonthAvgValue, lastMonthAvgValue);

    // KPI Summary
    const kpiSummary = {
      monthlyRevenue: {
        value: thisMonthRevenue,
        previousValue: lastMonthRevenue,
        change: revenueChange,
        isPositive: revenueChange >= 0,
      },
      monthlyAppointments: {
        value: thisMonthAppointmentCount,
        previousValue: lastMonthAppointmentCount,
        change: appointmentChange,
        isPositive: appointmentChange >= 0,
      },
      newCustomers: {
        value: thisMonthCustomers,
        previousValue: lastMonthCustomers,
        change: customerChange,
        isPositive: customerChange >= 0,
      },
      averageBookingValue: {
        value: Math.round(thisMonthAvgValue),
        previousValue: Math.round(lastMonthAvgValue),
        change: avgValueChange,
        isPositive: avgValueChange >= 0,
      },
    };

    // Revenue trend (last 6 months)
    const revenueTrend: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStartStr = formatDate(monthDate);
      const monthEndStr = formatDate(monthEnd);

      // Filter transactions for this month
      const monthTransactions = await prisma.transaction.findMany({
        where: {
          tenantId: auth.tenantId,
          date: { gte: monthStartStr, lte: monthEndStr },
          type: { in: incomeTypes },
        },
      });

      const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

      revenueTrend.push({
        month: getMonthName(monthDate.getMonth()),
        revenue: monthRevenue,
      });
    }

    // Appointment status distribution
    const statusCounts = {
      completed: allAppointments.filter(a => a.status === 'completed').length,
      confirmed: allAppointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length,
      cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
      noShow: allAppointments.filter(a => a.status === 'no_show').length,
    };

    const appointmentStatusDistribution = [
      { name: 'Tamamlandı', value: statusCounts.completed, color: '#10B981' },
      { name: 'Onaylandı', value: statusCounts.confirmed, color: '#3B82F6' },
      { name: 'İptal', value: statusCounts.cancelled, color: '#EF4444' },
      { name: 'Gelmedi', value: statusCounts.noShow, color: '#6B7280' },
    ].filter(item => item.value > 0);

    // Top services (by appointment count)
    const serviceStats: Map<string, { name: string; count: number; revenue: number }> = new Map();

    allAppointments.forEach(apt => {
      if (apt.serviceId && apt.status !== 'cancelled') {
        const service = services.find(s => s.id === apt.serviceId);
        const serviceName = apt.serviceName || service?.name || 'Bilinmeyen Hizmet';

        const existing = serviceStats.get(apt.serviceId) || { name: serviceName, count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += apt.price || 0;
        serviceStats.set(apt.serviceId, existing);
      }
    });

    const topServices = Array.from(serviceStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        appointments: s.count,
        revenue: s.revenue,
        averageRevenue: s.count > 0 ? Math.round(s.revenue / s.count) : 0,
      }));

    // Staff performance
    const staffStats: Map<string, { name: string; completedCount: number; revenue: number }> = new Map();

    allAppointments
      .filter(apt => apt.status === 'completed' && apt.staffId)
      .forEach(apt => {
        const staffMember = staff.find(s => s.id === apt.staffId);
        const staffName = apt.staffName ||
          (staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Bilinmeyen Personel');

        const existing = staffStats.get(apt.staffId!) || { name: staffName, completedCount: 0, revenue: 0 };
        existing.completedCount++;
        existing.revenue += apt.price || 0;
        staffStats.set(apt.staffId!, existing);
      });

    const staffPerformance = Array.from(staffStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map(s => ({
        name: s.name,
        completedAppointments: s.completedCount,
        revenue: s.revenue,
        averageValue: s.completedCount > 0 ? Math.round(s.revenue / s.completedCount) : 0,
      }));

    // Total counts for context
    const totalAppointments = allAppointments.length;
    const completedAppointments = allAppointments.filter(a => a.status === 'completed').length;
    const totalRevenue = allAppointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        kpiSummary,
        revenueTrend,
        appointmentStatusDistribution,
        topServices,
        staffPerformance,
        summary: {
          totalAppointments,
          completedAppointments,
          totalRevenue,
          servicesCount: services.length,
          staffCount: staff.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Get reports error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
