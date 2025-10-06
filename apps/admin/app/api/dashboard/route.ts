import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Mock dashboard statistics
  // In production, these would be calculated from database
  const stats = {
    totalAppointments: 156,
    todayAppointments: 12,
    totalCustomers: 89,
    monthlyRevenue: 45600,
    pendingAppointments: 8,
    completedToday: 7,
    activeStaff: 4,
    totalServices: 12,
    
    // Recent appointments for today
    recentAppointments: [
      {
        id: '1',
        customer: 'Ayşe Kaya',
        service: 'Saç Kesimi',
        time: '14:00',
        status: 'confirmed',
        staff: 'Merve Hanım'
      },
      {
        id: '2',
        customer: 'Mehmet Demir',
        service: 'Saç Kesimi + Sakal',
        time: '15:30',
        status: 'pending',
        staff: 'Ahmet Bey'
      },
      {
        id: '3',
        customer: 'Fatma Öz',
        service: 'Cilt Bakımı',
        time: '16:00',
        status: 'confirmed',
        staff: 'Elif Hanım'
      }
    ],

    // Monthly growth percentages
    growth: {
      appointments: 15.3,
      revenue: 12.5,
      customers: 8.7,
      services: 4.2
    },

    // Popular services this month
    popularServices: [
      { name: 'Saç Kesimi', bookings: 45, revenue: 6750 },
      { name: 'Saç Boyama', bookings: 38, revenue: 9500 },
      { name: 'Manikür', bookings: 60, revenue: 4800 },
      { name: 'Cilt Bakımı', bookings: 25, revenue: 7500 }
    ],

    // Staff performance
    staffPerformance: [
      { name: 'Merve Kaya', appointments: 65, revenue: 9750, rating: 4.8 },
      { name: 'Ahmet Demir', appointments: 72, revenue: 8640, rating: 4.9 },
      { name: 'Elif Can', appointments: 48, revenue: 7200, rating: 4.7 },
      { name: 'Zeynep Yılmaz', appointments: 55, revenue: 4400, rating: 4.6 }
    ],

    // Revenue chart data (last 7 days)
    revenueChart: [
      { date: '2024-09-18', revenue: 1200 },
      { date: '2024-09-19', revenue: 1800 },
      { date: '2024-09-20', revenue: 1500 },
      { date: '2024-09-21', revenue: 2100 },
      { date: '2024-09-22', revenue: 1900 },
      { date: '2024-09-23', revenue: 2300 },
      { date: '2024-09-24', revenue: 1700 }
    ],

    // Appointment status breakdown
    appointmentStatus: {
      pending: 8,
      confirmed: 45,
      completed: 89,
      cancelled: 14
    }
  };

  return NextResponse.json({ 
    success: true, 
    data: stats 
  });
}
