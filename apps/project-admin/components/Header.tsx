'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Building2, Package, BarChart3, FileText } from 'lucide-react';
import { Button } from '@repo/ui';
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { href: '/project-admin/tenants', label: 'Aboneler', icon: Building2 },
    { href: '/project-admin/packages', label: 'Paketler', icon: Package },
    { href: '/project-admin/pages', label: 'Sayfalar', icon: FileText },
    { href: '/project-admin/reports', label: 'Raporlar', icon: BarChart3 },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* System Logo */}
            <Link href="/project-admin" className="flex items-center space-x-2">
              <img 
                src="https://i.hizliresim.com/4a00l8g.png" 
                alt="Net Randevu Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Net Randevu
              </span>
            </Link>
            
            <span className="text-gray-300">|</span>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

