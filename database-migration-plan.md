# Database Migration Plan: SQLite → PostgreSQL

## 1. PostgreSQL Setup (Neon)
- Neon hesabı oluştur: https://neon.tech
- Database oluştur: `randevu_sistemi`
- Connection string al

## 2. Prisma Schema Güncellemesi
```prisma
// apps/admin/prisma/schema.prisma
// apps/project-admin/prisma/schema.prisma  
// apps/web/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 3. Environment Variables
```env
# .env.local (her app için)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

## 4. Migration Commands
```bash
# Her app için
cd apps/admin && npx prisma migrate dev --name init
cd apps/project-admin && npx prisma migrate dev --name init  
cd apps/web && npx prisma migrate dev --name init
```

## 5. Data Migration (Opsiyonel)
- SQLite'dan mevcut verileri export et
- PostgreSQL'e import et

## 6. Vercel Environment Variables
- Vercel dashboard'da DATABASE_URL ekle
- Her proje için ayrı ayrı
