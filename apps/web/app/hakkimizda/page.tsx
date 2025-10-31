"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PROJECT_ADMIN_URL || 'http://localhost:3002'}/api/pages/hakkimizda`
      );
      const data = await response.json();
      
      if (data.success && data.data.isActive) {
        setPage(data.data);
      }
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sayfa yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h1>
          <p className="text-gray-600 mb-6">Aradığınız sayfa şu anda mevcut değil.</p>
          <Link href="/">
            <Button className="bg-[#163974] hover:bg-[#0F2A52] text-white">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <img 
                src="https://i.hizliresim.com/4a00l8g.png" 
                alt="Net Randevu Logo" 
                className="h-10 w-auto"
              />
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>© 2025 Net Randevu. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

