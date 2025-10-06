// Shared mock database for all API routes
// In production, this would be replaced with actual database calls

// Staff data
export let mockStaff = [
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

// Customers data
export let mockCustomers = [
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

// Services data
export let mockServices = [
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
    image: "/services/hair-cut.jpg"
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
    image: "/services/hair-style.jpg"
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
    image: "/services/manicure.jpg"
  },
  {
    id: "4",
    name: "Pedikür",
    description: "Ayak ve tırnak bakımı",
    duration: 75,
    price: 100,
    category: "Tırnak Bakımı",
    isActive: false,
    popularity: 70,
    monthlyBookings: 30,
    totalRevenue: 3000,
    staff: ["Zeynep Demir"],
    image: "/services/pedicure.jpg"
  },
  {
    id: "5",
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
    image: "/services/facial.jpg"
  }
];

// Appointments data
export let mockAppointments = [
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

// Helper functions
export const getNextId = (data: any[]) => {
  const maxId = Math.max(...data.map(item => parseInt(item.id)));
  return (maxId + 1).toString();
};
