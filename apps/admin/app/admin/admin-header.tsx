"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import { LogOut, User, Home, Calendar, Users, Briefcase, Package, Settings, Wallet, Gift, Clock, BarChart3, Menu, X, Bell, XCircle, Star, Shield } from 'lucide-react';
import Link from 'next/link';
import type { ClientUser } from '../../lib/client-permissions';
import { canAccessPage } from '../../lib/client-permissions';
import type { StaffPermissions } from '../../lib/permissions';

// Sidebar nav items (permission key kept for canAccessPage gating)
const NAV_ITEMS: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; perm: string }[] = [
  { href: '/admin', icon: Home, label: 'Dashboard', perm: 'dashboard' },
  { href: '/admin/appointments', icon: Calendar, label: 'Randevular', perm: 'appointments' },
  { href: '/admin/customers', icon: Users, label: 'Müşteriler', perm: 'customers' },
  { href: '/admin/services', icon: Briefcase, label: 'Hizmetler', perm: 'services' },
  { href: '/admin/staff', icon: User, label: 'Personel', perm: 'staff' },
  { href: '/admin/stock', icon: Package, label: 'Stok', perm: 'stock' },
  { href: '/admin/packages', icon: Gift, label: 'Paketler', perm: 'packages' },
  { href: '/admin/kasa', icon: Wallet, label: 'Kasa', perm: 'kasa' },
  { href: '/admin/reports', icon: BarChart3, label: 'Raporlar', perm: 'reports' },
  { href: '/admin/performans', icon: Star, label: 'Performans', perm: 'reports' },
  { href: '/admin/audit-log', icon: Shield, label: 'İşlem Geçmişi', perm: 'settings' },
  { href: '/admin/settings', icon: Settings, label: 'Ayarlar', perm: 'settings' },
];

interface AdminHeaderProps {
  user: ClientUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  // Check for project-admin cookie
  useEffect(() => {
    const checkProjectAdmin = () => {
      const cookies = document.cookie.split(';');
      const projectAdminCookie = cookies.find(c => c.trim().startsWith('project-admin='));
      if (projectAdminCookie) {
        const value = projectAdminCookie.split('=')[1];
        setIsProjectAdmin(value === 'true');
      }
    };
    checkProjectAdmin();
  }, []);

  // Check for permission_denied error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'permission_denied') {
      setShowUnauthorizedAlert(true);
      // Remove error param from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Auto-hide after 10 seconds
      setTimeout(() => setShowUnauthorizedAlert(false), 10000);
    }
  }, []);

  // Fetch tenant subscription info
  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const response = await fetch('/api/tenant-info');

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.data) {
            const { subscriptionEnd, subscriptionPlan } = data.data;

            // Calculate remaining days
            if (subscriptionEnd) {
              const now = new Date();
              const endDate = new Date(subscriptionEnd);
              const diffTime = endDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setRemainingDays(diffDays);
            }

            setSubscriptionPlan(subscriptionPlan);
          }
        } else {
          console.error('❌ Tenant info API response not ok:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching tenant info:', error);
      }
    };

    fetchTenantInfo();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?tenantId=${user.tenantId}`);

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            setNotifications(data.data);
            const unread = data.data.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
          }
        } else {
          console.error('🔔 [NOTIFICATIONS] Failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('🔔 [NOTIFICATIONS] Error:', error);
      }
    };

    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user.tenantId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Dismiss notification (remove from list)
  const dismissNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation

    try {
      // Remove from local state immediately for better UX
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Delete from server
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      // Optionally: Re-fetch notifications if delete failed
    }
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside notification dropdown
      if (showNotifications && !target.closest('.notification-dropdown') && !target.closest('.notification-button')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Get badge color based on remaining days
  const getBadgeColor = () => {
    if (remainingDays === null) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (remainingDays <= 0) return 'bg-red-100 text-red-800 border-red-300';
    if (remainingDays <= 7) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (remainingDays <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  // Get plan name in Turkish
  const getPlanName = () => {
    if (!subscriptionPlan) return null;
    switch (subscriptionPlan) {
      case 'trial': return 'Deneme';
      case 'monthly': return 'Aylık';
      case 'yearly': return 'Yıllık';
      default: return subscriptionPlan;
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh(); // Force page refresh to clear any cached data
      } else {
        alert('Çıkış yapılırken hata oluştu');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Çıkış yapılırken hata oluştu');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = NAV_ITEMS.filter(item => canAccessPage(user, item.perm as any));

  return (
    <>
      {/* Unauthorized Access Alert (floats over the content area) */}
      {showUnauthorizedAlert && (
        <div className="fixed top-0 left-0 right-0 z-[60] lg:pl-64 bg-red-50 border-b-2 border-red-200">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Yetkisiz Erişim Denemesi
                </h3>
                <p className="text-sm text-red-700">
                  Bu sayfayı görüntüleme yetkiniz bulunmamaktadır. Yetkiniz olduğunu düşünüyorsanız lütfen yöneticiniz ile iletişime geçin.
                </p>
              </div>
              <button
                onClick={() => setShowUnauthorizedAlert(false)}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile top bar (only < lg): logo + hamburger */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14">
        <Link href="/admin" className="flex items-center gap-2 min-w-0" aria-label="Ana sayfa">
          <img src="https://i.hizliresim.com/4a00l8g.png" alt="Net Randevu Logo" className="h-8 w-auto flex-shrink-0" />
        </Link>
        <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(true)} aria-label="Menüyü aç">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: fixed on desktop, off-canvas drawer on mobile */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-100 flex-shrink-0">
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center" aria-label="Ana sayfa">
            <img src="https://i.hizliresim.com/4a00l8g.png" alt="Net Randevu Logo" className="h-9 w-auto" />
          </Link>
          <button
            className="ml-auto lg:hidden p-1 text-gray-400 hover:text-gray-600"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: subscription, user, notifications, logout */}
        <div className="relative border-t border-gray-100 px-3 py-3 space-y-2 flex-shrink-0">
          {/* Subscription badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getBadgeColor()} text-xs font-medium`}>
            <Clock className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {remainingDays === null
                  ? 'Paket Bilgisi Yok'
                  : remainingDays <= 0
                    ? 'Abonelik Süresi Doldu'
                    : `${remainingDays} Gün Kaldı`}
              </p>
              {getPlanName() && (
                <p className="text-[10px] opacity-75">{getPlanName()} Paket</p>
              )}
            </div>
          </div>

          {/* User + notifications */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0 px-1">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.ownerName}</span>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative notification-button p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Bildirimler"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown (opens upward, over content) */}
              {showNotifications && (
                <div className="notification-dropdown absolute bottom-full mb-2 left-3 right-3 lg:right-auto lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-600 mt-1">{unreadCount} okunmamış bildirim</p>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Henüz bildirim yok
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.link) {
                              router.push(notification.link);
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-2">
                            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0 pr-6">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString('tr-TR')}
                              </p>
                            </div>
                            {/* Dismiss button */}
                            <button
                              onClick={(e) => dismissNotification(notification.id, e)}
                              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Kaldır"
                            >
                              <XCircle className="w-4 h-4 text-gray-500 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış'}
          </Button>
        </div>
      </aside>
    </>
  );
}
