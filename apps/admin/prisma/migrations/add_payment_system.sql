-- PayTR Payment System Migration
-- Bu dosyayı Neon SQL Editor'de çalıştırın

-- 1. Appointment tablosuna payment alanları ekle
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- 2. Appointment için indexler
CREATE INDEX IF NOT EXISTS idx_appointment_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointment_payment_id ON appointments(payment_id);

-- 3. Payments tablosu oluştur
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  appointment_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,

  -- PayTR Bilgileri
  merchant_oid TEXT UNIQUE NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  payment_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'TL' NOT NULL,

  -- Ödeme Durumu
  status TEXT DEFAULT 'pending' NOT NULL,
  payment_type TEXT,

  -- PayTR Callback Bilgileri
  paytr_token TEXT,
  paytr_hash TEXT,
  failed_reason TEXT,

  -- Refund (İade) Bilgileri
  refund_status TEXT,
  refund_amount DOUBLE PRECISION,
  refunded_at TIMESTAMP,
  refund_reason TEXT,

  -- Meta Bilgiler
  user_ip TEXT,
  user_basket TEXT,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMP
);

-- 4. Payments için indexler
CREATE INDEX IF NOT EXISTS idx_payment_merchant_oid ON payments(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_payment_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_tenant_id ON payments(tenant_id);

-- 5. Mevcut randevular için payment_status'ü güncelle
-- NOT: Eğer bu kısımda hata alıyorsanız, bu satırları atlayın (opsiyonel)
-- Paket kullanılan randevular için
UPDATE appointments
SET payment_status = 'package_used'
WHERE "packageInfo" IS NOT NULL AND "packageInfo" != '';

-- Fiyatı olmayan randevular için
UPDATE appointments
SET payment_status = 'paid'
WHERE ("packageInfo" IS NULL OR "packageInfo" = '')
  AND (price IS NULL OR price = 0);

-- Diğer tüm randevular için (completed olanlar)
UPDATE appointments
SET payment_status = 'paid'
WHERE ("packageInfo" IS NULL OR "packageInfo" = '')
  AND price > 0
  AND status IN ('completed', 'confirmed');

COMMENT ON TABLE payments IS 'PayTR ödeme kayıtları - Her ödeme işlemi için detaylı log';
COMMENT ON COLUMN appointments.payment_status IS 'pending: Bekliyor, paid: Ödendi, package_used: Paket kullanıldı, failed: Başarısız';
COMMENT ON COLUMN payments.merchant_oid IS 'PayTR sipariş numarası - Unique order identifier';
COMMENT ON COLUMN payments.amount IS 'Gerçek tutar (TL) - Örnek: 34.56';
COMMENT ON COLUMN payments.payment_amount IS 'PayTR format tutar (kuruş) - Örnek: 3456 = 34.56 * 100';
