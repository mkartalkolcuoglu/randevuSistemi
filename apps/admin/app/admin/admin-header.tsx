"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { LogOut, User, Home, Calendar, Users, Briefcase, Package, Settings, Wallet, Gift, Clock, BarChart3 } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* System Logo */}
            <img 
              src="https://i.hizliresim.com/ic4kc72.png" 
              alt="Randevu Sistemi Logo" 
              className="h-10 w-auto"
            />
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">{user.businessName}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Subscription Badge - Always show */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getBadgeColor()} text-xs font-medium`}>
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

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user.ownerName}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış'}</span>
            </Button>
          </div>
        </div>
        
        {/* Navigation Menu - With Permission Filtering */}
        <nav className="mt-4">
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
      </div>
    </header>
    </>
  );
}
