"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { LogOut, User, Home, Calendar, Users, Briefcase, Package, Settings, Wallet, Gift, Clock, BarChart3, Menu, X, Bell } from 'lucide-react';
import Link from 'next/link';
import type { ClientUser } from '../../lib/client-permissions';
import { canAccessPage } from '../../lib/client-permissions';
import type { StaffPermissions } from '../../lib/permissions';

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
  const router = useRouter();

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
        console.log('🔍 Fetching tenant subscription info...');
        const response = await fetch('/api/tenant-info');
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Tenant data:', data);
          
          if (data.success && data.data) {
            const { subscriptionEnd, subscriptionPlan } = data.data;
            console.log('🎁 Subscription:', { subscriptionEnd, subscriptionPlan });
            
            // Calculate remaining days
            if (subscriptionEnd) {
              const now = new Date();
              const endDate = new Date(subscriptionEnd);
              const diffTime = endDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              console.log('⏰ Remaining days:', diffDays);
              setRemainingDays(diffDays);
            } else {
              console.log('⚠️ No subscriptionEnd found');
            }
            
            setSubscriptionPlan(subscriptionPlan);
          }
        } else {
          console.error('❌ API response not ok:', response.status);
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
        console.log('🔔 [NOTIFICATIONS] Fetching for tenantId:', user.tenantId);
        const response = await fetch(`/api/notifications?tenantId=${user.tenantId}`);
        console.log('🔔 [NOTIFICATIONS] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔔 [NOTIFICATIONS] Data received:', data);
          
          if (data.success) {
            setNotifications(data.data);
            const unread = data.data.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
            console.log('🔔 [NOTIFICATIONS] Total:', data.data.length, 'Unread:', unread);
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

  // Get badge color based on remaining days
  const getBadgeColor = () => {
    if (remainingDays === null) return 'bg-gray-100 text-gray-800';
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

  return (
    <>
      {/* Unauthorized Access Alert */}
      {showUnauthorizedAlert && (
        <div className="bg-red-50 border-b-2 border-red-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
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

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title (Mobile Optimized) */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <img 
                src="https://i.hizliresim.com/4a00l8g.png" 
                alt="Net Randevu Logo" 
                className="h-8 sm:h-10 w-auto flex-shrink-0"
              />
              <span className="hidden sm:inline text-gray-300">|</span>
              <h1 className="text-sm sm:text-xl font-bold text-gray-900 hidden sm:block">Admin Panel</h1>
              <span className="hidden lg:inline text-gray-300">|</span>
              <span className="text-xs sm:text-sm text-gray-600 truncate hidden lg:block max-w-[200px]">{user.businessName}</span>
            </div>
          
            {/* Right: Actions (Mobile Optimized) */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Subscription Badge - Desktop only */}
              <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getBadgeColor()} text-xs font-medium`}>
                <Clock className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {remainingDays === null 
                      ? 'Paket Bilgisi Yok' 
                      : remainingDays <= 0 
                        ? 'Abonelik Süresi Doldu' 
                        : `${remainingDays} Gün Kaldı`
                    }
                  </span>
                  {getPlanName() && (
                    <span className="text-[10px] opacity-75">
                      {getPlanName()} Paket
                    </span>
                  )}
                </div>
              </div>

              {/* User Name - Desktop only */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.ownerName}</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
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
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
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
                              <div className="flex-1 min-w-0">
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
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Logout Button - Desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden sm:flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">{isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış'}</span>
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        
        {/* Desktop Navigation Menu */}
        <nav className="mt-4 hidden sm:block">
          <div className="flex space-x-1 flex-wrap gap-y-2">
            {canAccessPage(user, 'dashboard') && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'appointments') && (
              <Link href="/admin/appointments">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Calendar className="w-4 h-4 mr-2" />
                  Randevular
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'customers') && (
              <Link href="/admin/customers">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Users className="w-4 h-4 mr-2" />
                  Müşteriler
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'services') && (
              <Link href="/admin/services">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Hizmetler
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'staff') && (
              <Link href="/admin/staff">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <User className="w-4 h-4 mr-2" />
                  Personel
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'stock') && (
              <Link href="/admin/stock">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Package className="w-4 h-4 mr-2" />
                  Stok
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'packages') && (
              <Link href="/admin/packages">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Gift className="w-4 h-4 mr-2" />
                  Paketler
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'kasa') && (
              <Link href="/admin/kasa">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Wallet className="w-4 h-4 mr-2" />
                  Kasa
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'reports') && (
              <Link href="/admin/reports">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Raporlar
                </Button>
              </Link>
            )}
            {canAccessPage(user, 'settings') && (
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Settings className="w-4 h-4 mr-2" />
                  Ayarlar
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="sm:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            {/* User Info - Mobile only */}
            <div className="mb-4 px-2">
              <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-200">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.ownerName}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.businessName}</p>
                </div>
              </div>

              {/* Subscription Info - Mobile */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getBadgeColor()} text-xs`}>
                <Clock className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {remainingDays === null 
                      ? 'Paket Bilgisi Yok' 
                      : remainingDays <= 0 
                        ? 'Abonelik Süresi Doldu' 
                        : `${remainingDays} Gün Kaldı`
                    }
                  </p>
                  {getPlanName() && (
                    <p className="text-[10px] opacity-75">
                      {getPlanName()} Paket
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              {canAccessPage(user, 'dashboard') && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Home className="w-5 h-5 mr-3" />
                    Dashboard
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'appointments') && (
                <Link href="/admin/appointments" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Calendar className="w-5 h-5 mr-3" />
                    Randevular
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'customers') && (
                <Link href="/admin/customers" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Users className="w-5 h-5 mr-3" />
                    Müşteriler
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'services') && (
                <Link href="/admin/services" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Briefcase className="w-5 h-5 mr-3" />
                    Hizmetler
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'staff') && (
                <Link href="/admin/staff" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <User className="w-5 h-5 mr-3" />
                    Personel
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'stock') && (
                <Link href="/admin/stock" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Package className="w-5 h-5 mr-3" />
                    Stok
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'packages') && (
                <Link href="/admin/packages" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Gift className="w-5 h-5 mr-3" />
                    Paketler
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'kasa') && (
                <Link href="/admin/kasa" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Wallet className="w-5 h-5 mr-3" />
                    Kasa
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'reports') && (
                <Link href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <BarChart3 className="w-5 h-5 mr-3" />
                    Raporlar
                  </Button>
                </Link>
              )}
              {canAccessPage(user, 'settings') && (
                <Link href="/admin/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Settings className="w-5 h-5 mr-3" />
                    Ayarlar
                  </Button>
                </Link>
              )}

              {/* Logout - Mobile */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                </Button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
    </>
  );
}
