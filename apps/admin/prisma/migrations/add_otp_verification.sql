-- OTP Verification Table
-- Bu migration'ı Neon SQL Editor'de çalıştırın

CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  tenant_id TEXT,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMP,
  attempts INTEGER DEFAULT 0 NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_verifications(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);

-- Comment
COMMENT ON TABLE otp_verifications IS 'SMS OTP doğrulama kodları - randevu sorgulama, yeni abonelik vb. için kullanılır';
