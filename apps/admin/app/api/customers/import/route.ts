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

      // Required fields - convert to string first (Excel may store as number)
      const firstName = row['Ad'] ? String(row['Ad']).trim() : '';
      const lastName = row['Soyad'] ? String(row['Soyad']).trim() : '';
      // Remove leading apostrophe if present (used to force text format in Excel)
      const phoneRaw = row['Telefon'] ? String(row['Telefon']).trim().replace(/^'/, '') : '';

      if (!firstName) {
        errors.push('Ad zorunludur');
      }
      if (!lastName) {
        errors.push('Soyad zorunludur');
      }
      if (!phoneRaw) {
        errors.push('Telefon zorunludur');
      } else {
        // Clean and validate phone
        const cleanPhone = phoneRaw.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          errors.push('Telefon 10 haneli olmalıdır');
        } else {
          // Check for duplicates in Excel
          const duplicateInExcel = data.slice(0, index).find(
            r => r['Telefon'] && String(r['Telefon']).replace(/\D/g, '') === cleanPhone
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

      // Optional field validations - convert to string first
      const email = row['E-posta'] ? String(row['E-posta']).trim() : '';
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push('Geçersiz e-posta formatı');
        }
      }

      const birthDateStr = row['Doğum Tarihi'] ? String(row['Doğum Tarihi']).trim() : '';
      if (birthDateStr) {
        try {
          // Excel may convert dates to serial numbers or different formats
          // Try multiple date formats
          let parsed: Date | null = null;
          
          // Try DD.MM.YYYY format (e.g., 10.10.1991)
          parsed = parse(birthDateStr, 'dd.MM.yyyy', new Date());
          
          // If invalid, try other common formats
          if (isNaN(parsed.getTime())) {
            // Try YYYY-MM-DD format
            parsed = parse(birthDateStr, 'yyyy-MM-dd', new Date());
          }
          
          if (isNaN(parsed.getTime())) {
            errors.push('Geçersiz doğum tarihi formatı (GG.AA.YYYY veya YYYY-MM-DD olmalı)');
          }
        } catch {
          errors.push('Geçersiz doğum tarihi formatı (GG.AA.YYYY veya YYYY-MM-DD olmalı)');
        }
      }

      const genderStr = row['Cinsiyet'] ? String(row['Cinsiyet']).trim().toLowerCase() : '';
      if (genderStr) {
        if (!['erkek', 'kadın', 'diğer', 'male', 'female', 'other'].includes(genderStr)) {
          errors.push('Cinsiyet Erkek, Kadın veya Diğer olmalıdır');
        }
      }

      const blacklistStr = row['Kara Liste'] ? String(row['Kara Liste']).trim().toLowerCase() : '';
      if (blacklistStr) {
        if (!['evet', 'hayır', 'yes', 'no'].includes(blacklistStr)) {
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
        // Convert all fields to string first (Excel may store as number)
        const firstName = String(row['Ad']).trim();
        const lastName = String(row['Soyad']).trim();
        // Remove leading apostrophe if present (used to force text format in Excel)
        const phoneRaw = String(row['Telefon']).trim().replace(/^'/, '');
        const cleanPhone = phoneRaw.replace(/\D/g, '');
        
        // Parse birth date if provided
        let birthDate: Date | null = null;
        const birthDateStr = row['Doğum Tarihi'] ? String(row['Doğum Tarihi']).trim() : '';
        if (birthDateStr) {
          try {
            // Try DD.MM.YYYY format first
            birthDate = parse(birthDateStr, 'dd.MM.yyyy', new Date());
            
            // If invalid, try YYYY-MM-DD format
            if (isNaN(birthDate.getTime())) {
              birthDate = parse(birthDateStr, 'yyyy-MM-dd', new Date());
            }
            
            // If still invalid, set to null
            if (isNaN(birthDate.getTime())) {
              birthDate = null;
            }
          } catch {
            birthDate = null;
          }
        }

        // Parse gender - store in Turkish to match form behavior
        let gender: string | null = null;
        const genderStr = row['Cinsiyet'] ? String(row['Cinsiyet']).trim().toLowerCase() : '';
        if (genderStr) {
          if (genderStr === 'erkek' || genderStr === 'male') {
            gender = 'Erkek';
          } else if (genderStr === 'kadın' || genderStr === 'female') {
            gender = 'Kadın';
          } else if (genderStr === 'diğer' || genderStr === 'other') {
            gender = 'Diğer';
          }
        }

        // Parse blacklist status
        const blacklistStr = row['Kara Liste'] ? String(row['Kara Liste']).trim().toLowerCase() : '';
        const isBlacklisted = blacklistStr === 'evet' || blacklistStr === 'yes';

        // Generate unique email if not provided (to satisfy unique constraint)
        const emailRaw = row['E-posta'] ? String(row['E-posta']).trim() : '';
        const email = emailRaw || `${cleanPhone}@temp.local`;
        
        // Get optional fields
        const address = row['Adres'] ? String(row['Adres']).trim() : null;
        const notes = row['Not'] ? String(row['Not']).trim() : null;
        
        return prisma.customer.create({
          data: {
            tenantId: user.tenantId,
            firstName: firstName,
            lastName: lastName,
            phone: cleanPhone,
            email: email,
            birthDate: birthDate,
            gender: gender,
            address: address,
            notes: notes,
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
    
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Müşteriler içe aktarılırken hata oluştu',
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

