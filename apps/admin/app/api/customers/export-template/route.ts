import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Create template with headers and example row
    const templateData = [
      {
        'Ad': 'Örnek',
        'Soyad': 'Müşteri',
        'Telefon': '5551234567',
        'E-posta': 'ornek@email.com',
        'Doğum Tarihi': '01.01.1990',
        'Cinsiyet': 'Erkek',
        'Adres': 'Örnek Mahalle, Örnek Sokak No:1',
        'Not': 'Örnek not',
        'Kara Liste': 'Hayır'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

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
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="musteri-sablonu.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('❌ Template export error:', error);
    return NextResponse.json(
      { success: false, error: 'Şablon oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}

