import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAuthenticatedUser } from '../../../../lib/auth-utils';
import { prisma } from '../../../../lib/prisma';
import { parse } from 'date-fns';

interface ImportRow {
  'Ad': string;
  'Soyad': string;
  'Telefon': string;
  'E-posta'?: string;
  'Doğum Tarihi'?: string;
  'Cinsiyet'?: string;
  'Adres'?: string;
  'Not'?: string;
  'Kara Liste'?: string;
}

interface ValidationError {
  row: number;
  errors: string[];
  data: ImportRow;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Excel dosyası boş' },
        { status: 400 }
      );
    }

    // Validation errors
    const validationErrors: ValidationError[] = [];
    const validRows: ImportRow[] = [];

    // Get existing phone numbers for this tenant
    const existingCustomers = await prisma.customer.findMany({
      where: { tenantId: user.tenantId },
      select: { phone: true, firstName: true, lastName: true },
    });
    const existingPhones = new Map(
      existingCustomers.map(c => [c.phone, `${c.firstName} ${c.lastName}`])
    );

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel starts at 1 and has header row
      const errors: string[] = [];

      // Required fields
      if (!row['Ad']?.trim()) {
        errors.push('Ad zorunludur');
      }
      if (!row['Soyad']?.trim()) {
        errors.push('Soyad zorunludur');
      }
      if (!row['Telefon']?.trim()) {
        errors.push('Telefon zorunludur');
      } else {
        // Clean and validate phone
        const cleanPhone = row['Telefon'].toString().replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          errors.push('Telefon 10 haneli olmalıdır');
        } else {
          // Check for duplicates in Excel
          const duplicateInExcel = data.slice(0, index).find(
            r => r['Telefon']?.toString().replace(/\D/g, '') === cleanPhone
          );
          if (duplicateInExcel) {
            errors.push(`Bu telefon numarası Excel'de birden fazla kez kullanılmış (Satır ${index + 1} ve önceki satırlar)`);
          }

          // Check for existing customer
          if (existingPhones.has(cleanPhone)) {
            errors.push(`Bu telefon numarası sistemde zaten kayıtlı: ${existingPhones.get(cleanPhone)}`);
          }
        }
      }

      // Optional field validations
      if (row['E-posta'] && row['E-posta'].trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row['E-posta'].trim())) {
          errors.push('Geçersiz e-posta formatı');
        }
      }

      if (row['Doğum Tarihi'] && row['Doğum Tarihi'].trim()) {
        try {
          const dateStr = row['Doğum Tarihi'].trim();
          // Try to parse DD.MM.YYYY format
          const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
          if (isNaN(parsed.getTime())) {
            errors.push('Geçersiz doğum tarihi formatı (GG.AA.YYYY olmalı)');
          }
        } catch {
          errors.push('Geçersiz doğum tarihi formatı (GG.AA.YYYY olmalı)');
        }
      }

      if (row['Cinsiyet'] && row['Cinsiyet'].trim()) {
        const gender = row['Cinsiyet'].trim().toLowerCase();
        if (!['erkek', 'kadın', 'diğer'].includes(gender)) {
          errors.push('Cinsiyet Erkek, Kadın veya Diğer olmalıdır');
        }
      }

      if (row['Kara Liste'] && row['Kara Liste'].trim()) {
        const blacklist = row['Kara Liste'].trim().toLowerCase();
        if (!['evet', 'hayır'].includes(blacklist)) {
          errors.push('Kara Liste Evet veya Hayır olmalıdır');
        }
      }

      if (errors.length > 0) {
        validationErrors.push({ row: rowNumber, errors, data: row });
      } else {
        validRows.push(row);
      }
    });

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Doğrulama hataları bulundu',
        validationErrors,
        totalRows: data.length,
        validRows: validRows.length,
        errorRows: validationErrors.length,
      }, { status: 400 });
    }

    // Import valid rows
    const importedCustomers = await Promise.all(
      validRows.map(async (row) => {
        const cleanPhone = row['Telefon'].toString().replace(/\D/g, '');
        
        // Parse birth date if provided
        let birthDate: Date | null = null;
        if (row['Doğum Tarihi'] && row['Doğum Tarihi'].trim()) {
          try {
            birthDate = parse(row['Doğum Tarihi'].trim(), 'dd.MM.yyyy', new Date());
          } catch {
            birthDate = null;
          }
        }

        // Parse gender
        let gender: 'male' | 'female' | 'other' | null = null;
        if (row['Cinsiyet'] && row['Cinsiyet'].trim()) {
          const genderStr = row['Cinsiyet'].trim().toLowerCase();
          if (genderStr === 'erkek') gender = 'male';
          else if (genderStr === 'kadın') gender = 'female';
          else if (genderStr === 'diğer') gender = 'other';
        }

        // Parse blacklist status
        const isBlacklisted = row['Kara Liste']?.trim().toLowerCase() === 'evet';

        return prisma.customer.create({
          data: {
            tenantId: user.tenantId,
            firstName: row['Ad'].trim(),
            lastName: row['Soyad'].trim(),
            phone: cleanPhone,
            email: row['E-posta']?.trim() || null,
            birthDate: birthDate,
            gender: gender,
            address: row['Adres']?.trim() || null,
            notes: row['Not']?.trim() || null,
            isBlacklisted: isBlacklisted,
            blacklistedAt: isBlacklisted ? new Date() : null,
            noShowCount: 0,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `${importedCustomers.length} müşteri başarıyla içe aktarıldı`,
      importedCount: importedCustomers.length,
      totalRows: data.length,
    });

  } catch (error) {
    console.error('❌ Customer import error:', error);
    return NextResponse.json(
      { success: false, error: 'Müşteriler içe aktarılırken hata oluştu' },
      { status: 500 }
    );
  }
}

