'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@repo/ui';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* System Logo */}
            <img 
              src="https://i.hizliresim.com/4a00l8g.png" 
              alt="Net Randevu Logo" 
              className="h-10 w-auto"
            />
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">
              Proje Yönetim Paneli
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Çıkış Yap</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

