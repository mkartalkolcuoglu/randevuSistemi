"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { LogOut, User, Home, Calendar, Users, Briefcase, Package, Settings, Wallet, Gift, Clock } from 'lucide-react';
import Link from 'next/link';
import type { AuthenticatedUser } from '../../lib/auth-utils';

interface AdminHeaderProps {
  user: AuthenticatedUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const router = useRouter();

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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <span className="text-gray-500">|</span>
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
        
        {/* Navigation Menu */}
        <nav className="mt-4">
          <div className="flex space-x-1">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/appointments">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Calendar className="w-4 h-4 mr-2" />
                Randevular
              </Button>
            </Link>
            <Link href="/admin/customers">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Users className="w-4 h-4 mr-2" />
                Müşteriler
              </Button>
            </Link>
            <Link href="/admin/services">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Briefcase className="w-4 h-4 mr-2" />
                Hizmetler
              </Button>
            </Link>
            <Link href="/admin/staff">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <User className="w-4 h-4 mr-2" />
                Personel
              </Button>
            </Link>
            <Link href="/admin/stock">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Package className="w-4 h-4 mr-2" />
                Stok
              </Button>
            </Link>
            <Link href="/admin/packages">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Gift className="w-4 h-4 mr-2" />
                Paketler
              </Button>
            </Link>
            <Link href="/admin/kasa">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Wallet className="w-4 h-4 mr-2" />
                Kasa
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
