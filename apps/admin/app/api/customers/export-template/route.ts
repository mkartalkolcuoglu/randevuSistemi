import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Create template with headers and example row
    const templateData = [
      {
        'Ad': 'Ahmet',
        'Soyad': 'Yılmaz',
        'Telefon': "'5551234567",  // Add apostrophe to force text format in Excel
        'E-posta': 'ahmet@email.com',
        'Doğum Tarihi': '15.03.1985',
        'Cinsiyet': 'Erkek',
        'Adres': 'Örnek Mahalle, Örnek Sokak No:1, İstanbul',
        'Not': 'VIP müşteri',
        'Kara Liste': 'Hayır'
      },
      {
        'Ad': 'Ayşe',
        'Soyad': 'Demir',
        'Telefon': "'5559876543",  // Add apostrophe to force text format in Excel
        'E-posta': 'ayse@email.com',
        'Doğum Tarihi': '22.07.1990',
        'Cinsiyet': 'Kadın',
        'Adres': 'Merkez Mahalle, Atatürk Caddesi No:45, Ankara',
        'Not': '',
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

