"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { LogOut, User, Home, Calendar, Users, Briefcase, Package, Settings, Wallet, Gift } from 'lucide-react';
import Link from 'next/link';
import type { AuthenticatedUser } from '../../lib/auth-utils';

interface AdminHeaderProps {
  user: AuthenticatedUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

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
