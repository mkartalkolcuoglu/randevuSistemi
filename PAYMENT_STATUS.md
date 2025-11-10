# PayTR Payment Integration - Current Status

## ✅ What's Been Implemented

### 1. Database Schema
- Added `Payment` model to Prisma schema with all required fields
- Added `@map` directives to match database column naming (snake_case)
- Migration applied successfully

### 2. Payment Client Library
File: [apps/web/lib/paytr-client.ts](apps/web/lib/paytr-client.ts)
- PayTR iFrame API integration
- Hash generation and validation
- Basket encoding
- Payment initiation
- Callback validation

### 3. Payment APIs

#### Initiate Payment
**Endpoint**: `/api/payment/initiate`
- Creates payment record in database
- Generates PayTR token
- Returns iframe URL for payment

#### Payment Callback
**Endpoint**: `/api/payment/callback`
- Receives payment status from PayTR
- Validates hash for security
- Updates payment status
- Creates appointment after successful payment

### 4. Frontend Integration
File: [apps/web/app/[slug]/randevu/page.tsx](apps/web/app/[slug]/randevu/page.tsx)

**Three Payment Methods Implemented:**

1. **🎁 Package Payment** (WORKING)
   - Uses customer's prepaid package
   - No PayTR interaction needed
   - Sets `paymentStatus: 'package_used'`

2. **💳 Card Payment** (BLOCKED - See Issue Below)
   - Initiates PayTR payment
   - Opens secure payment iframe
   - Creates appointment after successful payment

3. **⏳ Pay Later** (WORKING)
   - Creates appointment without payment
   - Sets `paymentStatus: 'pending'`
   - No PayTR interaction needed

## ❌ Current Issue: PayTR Account Authorization

### The Problem
When trying to initiate a card payment, PayTR returns:
```
Mağazanızda Direkt API yetkisi tanımlıdır.
iFrame API entegrasyonu için yazılım destek ekibiyle iletişime geçin.
```

**Translation**: "Your store has Direct API authorization defined. Contact software support team for iFrame API integration."

### What This Means
- Your PayTR account (Merchant ID: 636960) currently has **Direct API** authorization
- The codebase uses **iFrame API** (recommended for security)
- These are mutually exclusive - you need to switch to iFrame API

### Why iFrame API is Better
| Feature | iFrame API | Direct API |
|---------|-----------|-----------|
| Security | ✅ Card data never touches your server | ❌ Card data passes through your server |
| PCI-DSS Compliance | ✅ Not required | ❌ Required |
| Liability | ✅ Low (PayTR handles) | ❌ High (you handle) |
| Implementation | ✅ Simple | ❌ Complex |
| PayTR Recommendation | ✅ Recommended | ⚠️ Not recommended |

## 🔧 What You Need To Do

### Step 1: Contact PayTR Support
Email: support@paytr.com

**Subject**: iFrame API Yetkilendirme Talebi - Merchant ID: 636960

**Message Template**:
```
Merhaba,

Merchant ID: 636960
Firma: [Your company name]

Hesabımızda iFrame API entegrasyonu kullanmak istiyoruz. Şu anda Direkt API yetkisi
tanımlı görünüyor. Lütfen hesabımızı iFrame API kullanabilmesi için güncelleyebilir misiniz?

Teşekkürler.
```

### Step 2: Verify Environment Variables
Make sure these are set in Vercel:

```bash
# PayTR Credentials
PAYTR_MERCHANT_ID=636960
PAYTR_MERCHANT_KEY=rL2TjcA26mJbEgLE
PAYTR_MERCHANT_SALT=dSDLbyHHk7Mm2xnt

# Mode: '1' for test, '0' for production
PAYTR_TEST_MODE=1

# Your website URL (for success/fail redirects)
NEXT_PUBLIC_WEB_URL=https://netrandevu.com
```

### Step 3: Test Working Features (While Waiting)

#### Test 1: Pay Later Flow
1. Go to booking page: `https://netrandevu.com/[tenant-slug]/randevu`
2. Complete phone verification
3. Select service, staff, date/time
4. Fill customer info
5. On confirmation page, select **"⏳ Ödeme Yapmadan İlerle"**
6. Accept agreements and confirm
7. ✅ Appointment should be created with `paymentStatus: 'pending'`

#### Test 2: Package Payment Flow (if customer has packages)
1. Enter phone number of customer with active package
2. System will show package details
3. Select service covered by package
4. Complete booking flow
5. System will offer to use package
6. Select **"🎁 Evet, Paketten Düş"**
7. ✅ Appointment should be created with `paymentStatus: 'package_used'`

#### Test 3: Card Payment (After PayTR Enables iFrame API)
1. Complete booking flow
2. Select **"💳 Kredi Kartı ile Öde"**
3. PayTR iframe should open
4. Complete test payment (use PayTR test cards)
5. ✅ Appointment should be created after successful payment

## 📋 Test Cards (For Test Mode)

When `PAYTR_TEST_MODE=1`, use these test cards:

```
Successful Payment:
Card: 9792 0300 0000 0006
CVV: Any 3 digits
Expiry: Any future date

Failed Payment:
Card: 9792 0300 0000 0014
CVV: Any 3 digits
Expiry: Any future date
```

## 🔍 How to Monitor Payments

### Check Database
```sql
-- View all payments
SELECT * FROM payments ORDER BY created_at DESC;

-- View pending payments
SELECT * FROM payments WHERE status = 'pending';

-- View successful payments
SELECT * FROM payments WHERE status = 'success';
```

### Check Application Logs
1. Go to Vercel dashboard
2. Select your project
3. Go to "Logs" tab
4. Filter for `[PAYMENT]` messages

## 📁 Key Files

```
apps/web/
├── lib/
│   ├── paytr-client.ts           # PayTR integration library
│   └── prisma.ts                  # Database client
├── app/
│   ├── [slug]/randevu/page.tsx   # Booking form with payment
│   └── api/
│       ├── appointments/route.ts  # Create appointments
│       └── payment/
│           ├── initiate/route.ts  # Start payment
│           └── callback/route.ts  # Payment webhook
└── prisma/
    └── schema.prisma              # Database schema
```

## 🚀 Next Steps After PayTR Authorization

Once PayTR enables iFrame API on your account:

1. **Test in Test Mode**
   - Set `PAYTR_TEST_MODE=1`
   - Test with test cards above
   - Verify appointments are created after payment

2. **Switch to Production**
   - Set `PAYTR_TEST_MODE=0`
   - Test with real card (small amount)
   - Verify everything works

3. **Monitor First Real Transactions**
   - Check payment logs
   - Verify appointments are created
   - Check email notifications work

## ⚠️ Important Security Notes

1. **Environment Variables**: Never commit credentials to git
2. **Callback Validation**: Always validate PayTR hash (already implemented)
3. **HTTPS Required**: Payment callback requires HTTPS (Vercel provides this)
4. **Test Mode**: Use test mode until everything is verified

## 💡 Additional Features to Consider

1. **Email Notifications**
   - Send payment confirmation email
   - Send appointment confirmation email
   - Already using Resend (see package.json)

2. **Payment Refunds**
   - Database already has refund fields
   - Need to implement refund API
   - PayTR supports refunds via API

3. **Payment Status Page**
   - Show user their payment history
   - Show appointment payment status

## 📞 Support

If you encounter issues:
1. Check Vercel logs for error messages
2. Check database for payment records
3. Contact PayTR support for payment gateway issues
4. Check this document for troubleshooting

---

**Status**: ✅ Code Complete | ⏳ Waiting for PayTR Authorization

**Last Updated**: 2025-11-10
