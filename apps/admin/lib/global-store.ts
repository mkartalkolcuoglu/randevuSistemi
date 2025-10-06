// Global store for Next.js development environment
// In production, this would be replaced with actual database

declare global {
  var mockStaff: any[] | undefined;
  var mockCustomers: any[] | undefined;
  var mockServices: any[] | undefined;
  var mockAppointments: any[] | undefined;
  var mockTasks: any[] | undefined;
}

// Initialize mock data if not exists
if (!global.mockCustomers) {
  global.mockCustomers = [
    {
      id: "1",
      firstName: "Ayşe",
      lastName: "Kaya",
      email: "ayse.kaya@email.com",
      phone: "+90 555 123 45 67",
      dateOfBirth: "1990-05-15",
      gender: "Kadın",
      address: "Kadıköy, İstanbul",
      registrationDate: "2024-01-15",
      lastVisit: "2024-09-20",
      totalAppointments: 12,
      totalSpent: 1850,
      status: "active",
      notes: "Saç boyasına alerjisi var",
      favoriteServices: ["Saç Kesimi", "Manikür"],
    },
    {
      id: "2", 
      firstName: "Mehmet",
      lastName: "Demir",
      email: "mehmet.demir@email.com",
      phone: "+90 555 987 65 43",
      dateOfBirth: "1985-08-22",
      gender: "Erkek",
      address: "Şişli, İstanbul",
      registrationDate: "2024-02-10",
      lastVisit: "2024-09-18",
      totalAppointments: 8,
      totalSpent: 1200,
      status: "active",
      notes: "Genellikle hafta sonları geliyor",
      favoriteServices: ["Saç Kesimi", "Sakal Düzenleme"],
    },
    {
      id: "3",
      firstName: "Fatma",
      lastName: "Öz",
      email: "fatma.oz@email.com", 
      phone: "+90 555 456 78 90",
      dateOfBirth: "1992-12-03",
      gender: "Kadın",
      address: "Beşiktaş, İstanbul",
      registrationDate: "2024-03-05",
      lastVisit: "2024-08-15",
      totalAppointments: 5,
      totalSpent: 750,
      status: "inactive",
      notes: "Son zamanlarda gelmiyor",
      favoriteServices: ["Cilt Bakımı", "Kaş Alma"],
    },
  ];
}

if (!global.mockServices) {
  global.mockServices = [
    {
      id: "1",
      name: "Saç Kesimi",
      description: "Profesyonel saç kesimi hizmeti",
      duration: 45,
      price: 150,
      category: "Saç Bakımı",
      isActive: true,
      popularity: 85,
      monthlyBookings: 45,
      totalRevenue: 6750,
      staff: ["Merve Kaya", "Ahmet Öz"],
    },
    {
      id: "2",
      name: "Saç Boyama",
      description: "Saç kesimi ve profesyonel fön hizmeti",
      duration: 90,
      price: 250,
      category: "Saç Bakımı",
      isActive: true,
      popularity: 92,
      monthlyBookings: 38,
      totalRevenue: 9500,
      staff: ["Merve Kaya"],
    },
    {
      id: "3",
      name: "Manikür",
      description: "El ve tırnak bakımı",
      duration: 60,
      price: 80,
      category: "Tırnak Bakımı",
      isActive: true,
      popularity: 78,
      monthlyBookings: 60,
      totalRevenue: 4800,
      staff: ["Zeynep Demir"],
    },
    {
      id: "4",
      name: "Cilt Bakımı",
      description: "Derinlemesine cilt temizliği ve bakımı",
      duration: 120,
      price: 300,
      category: "Cilt Bakımı",
      isActive: true,
      popularity: 95,
      monthlyBookings: 25,
      totalRevenue: 7500,
      staff: ["Elif Can"],
    }
  ];
}

if (!global.mockAppointments) {
  global.mockAppointments = [
    {
      id: "1",
      customer: {
        name: "Ayşe Kaya",
        phone: "+90 555 123 45 67",
        email: "ayse.kaya@email.com"
      },
      service: {
        name: "Saç Kesimi",
        duration: 60,
        price: 150
      },
      staff: "Merve Hanım",
      date: "2024-09-25",
      time: "14:00",
      status: "confirmed",
      notes: "Katman kesim istiyor",
      createdAt: "2024-09-20T10:30:00Z",
      paymentStatus: "paid"
    },
    {
      id: "2", 
      customer: {
        name: "Mehmet Demir",
        phone: "+90 555 987 65 43",
        email: "mehmet.demir@email.com"
      },
      service: {
        name: "Saç Kesimi + Sakal",
        duration: 45,
        price: 120
      },
      staff: "Ahmet Bey",
      date: "2024-09-25",
      time: "16:30",
      status: "pending",
      notes: "İlk defa geliyor",
      createdAt: "2024-09-23T14:20:00Z",
      paymentStatus: "pending"
    },
    {
      id: "3",
      customer: {
        name: "Fatma Öz",
        phone: "+90 555 456 78 90", 
        email: "fatma.oz@email.com"
      },
      service: {
        name: "Cilt Bakımı",
        duration: 90,
        price: 200
      },
      staff: "Elif Hanım",
      date: "2024-09-26",
      time: "10:00",
      status: "confirmed",
      notes: "Hassas cilt",
      createdAt: "2024-09-22T16:45:00Z",
      paymentStatus: "paid"
    }
  ];
}

if (!global.mockTasks) {
  global.mockTasks = [
    {
      id: "1",
      title: "Yeni kampanya taslağını onayla",
      description: "Yaz kampanyası için hazırlanan tasarımları incele ve onayla",
      dueDate: "2024-09-26",
      priority: "high",
      status: "pending",
      assignedTo: "Admin",
      category: "Marketing",
      createdAt: "2024-09-20T09:00:00Z",
      updatedAt: "2024-09-20T09:00:00Z"
    },
    {
      id: "2",
      title: "Personel toplantısı",
      description: "Aylık performans değerlendirmesi ve yeni hedefler",
      dueDate: "2024-09-27",
      priority: "medium",
      status: "pending",
      assignedTo: "HR Manager",
      category: "HR",
      createdAt: "2024-09-21T10:30:00Z",
      updatedAt: "2024-09-21T10:30:00Z"
    },
    {
      id: "3",
      title: "Stok kontrolü yap",
      description: "Tüm ürünlerin stok durumunu kontrol et ve eksikleri belirle",
      dueDate: "2024-09-25",
      priority: "urgent",
      status: "in_progress",
      assignedTo: "Stok Manager",
      category: "Inventory",
      createdAt: "2024-09-24T14:00:00Z",
      updatedAt: "2024-09-25T09:00:00Z"
    }
  ];
}

if (!global.mockStaff) {
  global.mockStaff = [
    {
      id: "1",
      firstName: "Merve",
      lastName: "Kaya",
      email: "merve.kaya@salon.com",
      phone: "+90 555 111 22 33",
      position: "Kuaför",
      specializations: ["Saç Kesimi", "Saç Boyama", "Fön"],
      experience: 5,
      rating: 4.8,
      status: "active",
      hireDate: "2021-03-15",
      salary: 8000,
      workingHours: {
        monday: { start: "09:00", end: "18:00", isOpen: true },
        tuesday: { start: "09:00", end: "18:00", isOpen: true },
        wednesday: { start: "09:00", end: "18:00", isOpen: true },
        thursday: { start: "09:00", end: "18:00", isOpen: true },
        friday: { start: "09:00", end: "18:00", isOpen: true },
        saturday: { start: "10:00", end: "17:00", isOpen: true },
        sunday: { start: "off", end: "off", isOpen: false }
      },
      monthlyAppointments: 65,
      monthlyRevenue: 9750,
      notes: "Çok deneyimli ve müşteriler tarafından seviliyor"
    },
    {
      id: "2",
      firstName: "Ahmet",
      lastName: "Demir", 
      email: "ahmet.demir@salon.com",
      phone: "+90 555 444 55 66",
      position: "Berber",
      specializations: ["Saç Kesimi", "Sakal Düzenleme", "Tıraş"],
      experience: 8,
      rating: 4.9,
      status: "active",
      hireDate: "2019-07-20",
      salary: 9500,
      workingHours: {
        monday: { start: "08:00", end: "17:00", isOpen: true },
        tuesday: { start: "08:00", end: "17:00", isOpen: true },
        wednesday: { start: "08:00", end: "17:00", isOpen: true },
        thursday: { start: "08:00", end: "17:00", isOpen: true },
        friday: { start: "08:00", end: "17:00", isOpen: true },
        saturday: { start: "09:00", end: "16:00", isOpen: true },
        sunday: { start: "off", end: "off", isOpen: false }
      },
      monthlyAppointments: 72,
      monthlyRevenue: 8640,
      notes: "Erkek müşteriler için uzman"
    },
    {
      id: "3",
      firstName: "Elif",
      lastName: "Can",
      email: "elif.can@salon.com",
      phone: "+90 555 777 88 99",
      position: "Estetisyen",
      specializations: ["Cilt Bakımı", "Makyaj", "Kaş Alma"],
      experience: 3,
      rating: 4.7,
      status: "active",
      hireDate: "2022-01-10",
      salary: 6500,
      workingHours: {
        monday: { start: "10:00", end: "19:00", isOpen: true },
        tuesday: { start: "10:00", end: "19:00", isOpen: true },
        wednesday: { start: "off", end: "off", isOpen: false },
        thursday: { start: "10:00", end: "19:00", isOpen: true },
        friday: { start: "10:00", end: "19:00", isOpen: true },
        saturday: { start: "10:00", end: "18:00", isOpen: true },
        sunday: { start: "11:00", end: "17:00", isOpen: true }
      },
      monthlyAppointments: 48,
      monthlyRevenue: 7200,
      notes: "Cilt bakımında uzman, gelişmeye açık"
    }
  ];
}

// Export functions to access global data
export const getStaffData = () => global.mockStaff || [];
export const setStaffData = (data: any[]) => { global.mockStaff = data; };

export const getCustomersData = () => global.mockCustomers || [];
export const setCustomersData = (data: any[]) => { global.mockCustomers = data; };

export const getServicesData = () => global.mockServices || [];
export const setServicesData = (data: any[]) => { global.mockServices = data; };

export const getAppointmentsData = () => global.mockAppointments || [];
export const setAppointmentsData = (data: any[]) => { global.mockAppointments = data; };

export const getTasksData = () => global.mockTasks || [];
export const setTasksData = (data: any[]) => { global.mockTasks = data; };

export const getNextId = (data: any[]) => {
  if (data.length === 0) return "1";
  const maxId = Math.max(...data.map(item => parseInt(item.id)));
  return (maxId + 1).toString();
};
