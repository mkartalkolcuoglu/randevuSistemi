# 🚀 Vercel Deployment Rehberi

## 📋 Ön Hazırlık

### 1. PostgreSQL Database Kurulumu (Neon)
1. [Neon.tech](https://neon.tech) hesabı oluşturun
2. Yeni database oluşturun: `randevu_sistemi`
3. Connection string'i kopyalayın:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/randevu_sistemi?sslmode=require
   ```

### 2. GitHub Repository Hazırlığı
Proje zaten GitHub'da: https://github.com/mkartalkolcuoglu/randevuSistemi.git

## 🚀 Vercel Deployment Adımları

### Seçenek A: 3 Ayrı Vercel Projesi (Önerilen)

#### 1. Web App Deployment
1. [Vercel Dashboard](https://vercel.com/dashboard) → "New Project"
2. GitHub repository'sini seç: `mkartalkolcuoglu/randevuSistemi`
3. **Root Directory**: `apps/web`
4. **Framework Preset**: Next.js
5. Environment Variables:
   ```
   DATABASE_URL = postgresql://username:password@host/database?sslmode=require
   NODE_ENV = production
   ```
6. Deploy → `https://randevu-web.vercel.app`

#### 2. Admin Panel Deployment  
1. Vercel Dashboard → "New Project"
2. Aynı GitHub repository'sini seç
3. **Root Directory**: `apps/admin`
4. **Framework Preset**: Next.js
5. Environment Variables:
   ```
   DATABASE_URL = postgresql://username:password@host/database?sslmode=require
   NEXTAUTH_SECRET = your-random-secret-key
   NEXTAUTH_URL = https://randevu-admin.vercel.app
   NODE_ENV = production
   ```
6. Deploy → `https://randevu-admin.vercel.app`

#### 3. Project Admin Deployment
1. Vercel Dashboard → "New Project"
2. Aynı GitHub repository'sini seç  
3. **Root Directory**: `apps/project-admin`
4. **Framework Preset**: Next.js
5. Environment Variables:
   ```
   DATABASE_URL = postgresql://username:password@host/database?sslmode=require
   NODE_ENV = production
   ```
6. Deploy → `https://randevu-project-admin.vercel.app`

## 🗄️ Database Migration

### 1. Prisma Migration
Her app için migration çalıştırın:

```bash
# Local'de test
cd apps/admin
npx prisma migrate dev --name init
npx prisma generate

cd ../project-admin  
npx prisma migrate dev --name init
npx prisma generate

cd ../web
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Production Migration
Vercel deployment'tan sonra:
```bash
# Her app için Vercel CLI ile
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

## 🔧 Domain Ayarları (Opsiyonel)

### Custom Domain Ekleme
1. Vercel Dashboard → Project Settings → Domains
2. Custom domain ekle:
   - `randevu.yourdomain.com` → Web App
   - `admin.yourdomain.com` → Admin Panel  
   - `panel.yourdomain.com` → Project Admin

## ✅ Test Checklist

- [ ] Web app açılıyor ve tenant sayfaları çalışıyor
- [ ] Admin panel login çalışıyor
- [ ] Project admin tenant oluşturma çalışıyor
- [ ] Database bağlantıları çalışıyor
- [ ] API endpoints çalışıyor

## 🚨 Sorun Giderme

### Common Issues:
1. **Database Connection Error**: Environment variables kontrol edin
2. **Build Error**: Dependencies eksik olabilir
3. **API Timeout**: Vercel function timeout artırın (30s)

### Debug Commands:
```bash
# Vercel logs
vercel logs

# Local test
vercel dev
```

## 📊 Monitoring

- Vercel Analytics otomatik aktif
- Database monitoring için Neon dashboard kullanın
- Error tracking için Sentry ekleyebilirsiniz

## 💰 Maliyet

**Ücretsiz Tier Limitleri:**
- Vercel: 100GB bandwidth/month
- Neon: 500MB storage, 1 database
- Toplam: $0/month (hobby projeler için yeterli)

**Upgrade Gerekirse:**
- Vercel Pro: $20/month
- Neon Pro: $19/month
