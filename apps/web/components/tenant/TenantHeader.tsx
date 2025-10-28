'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui';
import { 
  MapPin, 
  Phone, 
  Calendar,
  ArrowLeft
} from 'lucide-react';

interface TenantHeaderProps {
  tenant: {
    id: string;
    slug: string;
    name: string;
    description?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    settings: {
      allowOnlineBooking: boolean;
      workingHours: {
        [key: string]: {
          isOpen: boolean;
          start: string;
          end: string;
        };
      };
    };
    contact: {
      phone?: string;
      email?: string;
      address?: string;
    };
  };
}

export default function TenantHeader({ tenant }: TenantHeaderProps) {
  const pathname = usePathname();
  const primaryColor = tenant.primaryColor || '#163974';
  const isRandevuPage = pathname?.includes('/randevu');


  return (
    <header className="bg-white shadow-sm border-b">
      {/* Top Info Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-2 text-sm text-gray-600">
            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
              {tenant.contact.address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{tenant.contact.address}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {tenant.contact.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{tenant.contact.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={`/${tenant.slug}`} className="flex items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
                {tenant.description && (
                  <p className="text-sm text-gray-600">{tenant.description}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Geri Dön Button (sadece randevu sayfasında) ve Randevu Al Button */}
          <div className="flex items-center space-x-3">
            {isRandevuPage && (
              <Button 
                variant="outline"
                className="text-gray-700 border-gray-300"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
            )}
            {tenant.settings.allowOnlineBooking && !isRandevuPage && (
              <Link href={`/${tenant.slug}/randevu`}>
                <Button 
                  className="text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Randevu Al
                </Button>
              </Link>
            )}
          </div>

        </div>
      </div>


    </header>
  );
}
