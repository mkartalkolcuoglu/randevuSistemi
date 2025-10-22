// Permission types for staff members

export type PagePermission = {
  read: boolean;    // Görüntüleme
  create: boolean;  // Ekleme
  update: boolean;  // Düzenleme
  delete: boolean;  // Silme
};

export type StaffPermissions = {
  dashboard: PagePermission;
  appointments: PagePermission;
  customers: PagePermission;
  services: PagePermission;
  staff: PagePermission;
  packages: PagePermission;
  kasa: PagePermission;
  stock: PagePermission;
  reports: PagePermission;
  settings: PagePermission;
};

// Default permissions for new staff
export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  dashboard: { read: true, create: false, update: false, delete: false },
  appointments: { read: true, create: true, update: true, delete: false },
  customers: { read: true, create: true, update: true, delete: false },
  services: { read: true, create: false, update: false, delete: false },
  staff: { read: false, create: false, update: false, delete: false },
  packages: { read: false, create: false, update: false, delete: false },
  kasa: { read: false, create: false, update: false, delete: false },
  stock: { read: true, create: false, update: false, delete: false },
  reports: { read: false, create: false, update: false, delete: false },
  settings: { read: false, create: false, update: false, delete: false },
};

// Full permissions for owner
export const OWNER_PERMISSIONS: StaffPermissions = {
  dashboard: { read: true, create: true, update: true, delete: true },
  appointments: { read: true, create: true, update: true, delete: true },
  customers: { read: true, create: true, update: true, delete: true },
  services: { read: true, create: true, update: true, delete: true },
  staff: { read: true, create: true, update: true, delete: true },
  packages: { read: true, create: true, update: true, delete: true },
  kasa: { read: true, create: true, update: true, delete: true },
  stock: { read: true, create: true, update: true, delete: true },
  reports: { read: true, create: true, update: true, delete: true },
  settings: { read: true, create: true, update: true, delete: true },
};

// Page display names in Turkish
export const PAGE_NAMES: Record<keyof StaffPermissions, string> = {
  dashboard: 'Ana Sayfa',
  appointments: 'Randevular',
  customers: 'Müşteriler',
  services: 'Hizmetler',
  staff: 'Personel',
  packages: 'Paketler',
  kasa: 'Kasa',
  stock: 'Stok',
  reports: 'Raporlama',
  settings: 'Ayarlar',
};

// Check if user has permission for a specific action on a page
export function hasPermission(
  permissions: StaffPermissions | null,
  page: keyof StaffPermissions,
  action: keyof PagePermission
): boolean {
  if (!permissions) return false;
  return permissions[page]?.[action] ?? false;
}

// Check if user can access a page (at least read permission)
export function canAccessPage(
  permissions: StaffPermissions | null,
  page: keyof StaffPermissions
): boolean {
  return hasPermission(permissions, page, 'read');
}

// Get accessible pages for sidebar
export function getAccessiblePages(permissions: StaffPermissions | null): (keyof StaffPermissions)[] {
  if (!permissions) return [];
  
  return (Object.keys(permissions) as (keyof StaffPermissions)[]).filter(page =>
    canAccessPage(permissions, page)
  );
}

