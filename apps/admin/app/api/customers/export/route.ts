import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAuthenticatedUser } from '../../../../lib/auth-utils';
import { prisma } from '../../../../lib/prisma';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Fetch all customers for this tenant
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format data for Excel
    const excelData = customers.map(customer => {
      // Handle both Turkish and English gender values
      let genderDisplay = '';
      if (customer.gender) {
        const genderLower = customer.gender.toLowerCase();
        if (genderLower === 'male' || genderLower === 'erkek') {
          genderDisplay = 'Erkek';
        } else if (genderLower === 'female' || genderLower === 'kadın') {
          genderDisplay = 'Kadın';
        } else if (genderLower === 'other' || genderLower === 'diğer') {
          genderDisplay = 'Diğer';
        } else {
          genderDisplay = customer.gender; // Keep original if unknown
        }
      }
      
      return {
        'Ad': customer.firstName || '',
        'Soyad': customer.lastName || '',
        'Telefon': customer.phone || '',
        'E-posta': customer.email || '',
        'Doğum Tarihi': customer.birthDate 
          ? format(new Date(customer.birthDate), 'dd.MM.yyyy')
          : '',
        'Cinsiyet': genderDisplay,
        'Adres': customer.address || '',
        'Not': customer.notes || '',
        'Kara Liste': customer.isBlacklisted ? 'Evet' : 'Hayır',
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 },  // Ad
      { wch: 15 },  // Soyad
      { wch: 15 },  // Telefon
      { wch: 25 },  // E-posta
      { wch: 15 },  // Doğum Tarihi
      { wch: 10 },  // Cinsiyet
      { wch: 35 },  // Adres
      { wch: 30 },  // Not
      { wch: 12 },  // Kara Liste
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    const fileName = `musteriler-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
    
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('❌ Customer export error:', error);
    return NextResponse.json(
      { success: false, error: 'Müşteriler dışa aktarılırken hata oluştu' },
      { status: 500 }
    );
  }
}

