# Database Migration Guide

## Staff Authentication Fields Migration

### Problem
The `staff` table in production database is missing authentication fields:
- `username`
- `password`
- `role`
- `permissions`
- `can_login` (camelCase in Prisma = `can_login` in PostgreSQL)
- `last_login`

### Solution: Run SQL Migration

#### Option 1: Via Vercel Postgres Dashboard (Recommended)

1. Go to Vercel Dashboard → Storage → Your Postgres Database
2. Click on "Data" tab → "Query"
3. Copy the entire content of `apps/admin/prisma/migrations/20241022_add_staff_auth_fields.sql`
4. Paste into the query editor
5. Click "Run Query"
6. Verify success message: ✅ Staff authentication fields added successfully!

#### Option 2: Via psql Command Line

```bash
# Connect to your production database
psql "YOUR_POSTGRES_URL_HERE"

# Run the migration file
\i apps/admin/prisma/migrations/20241022_add_staff_auth_fields.sql

# Verify columns exist
\d staff
```

#### Option 3: Via Prisma Migrate (Not Recommended for Production)

```bash
cd apps/admin
npx prisma migrate dev --name add_staff_auth_fields
npx prisma migrate deploy
```

### Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'staff'
AND column_name IN ('username', 'password', 'role', 'permissions', 'can_login', 'last_login')
ORDER BY column_name;
```

Expected output:
```
   column_name   |       data_type        | is_nullable | column_default 
-----------------+------------------------+-------------+----------------
 can_login       | boolean                | YES         | false
 last_login      | timestamp              | YES         | NULL
 password        | text                   | YES         | NULL
 permissions     | text                   | YES         | NULL
 role            | text                   | YES         | 'staff'
 username        | text                   | YES         | NULL
```

### Post-Migration Steps

1. Refresh your Vercel deployment (or wait for auto-redeploy)
2. Test the staff list page: `/admin/staff`
3. Test creating a new staff member with login credentials
4. Test staff login functionality

### Rollback (If Needed)

```sql
-- Remove added columns
ALTER TABLE staff DROP COLUMN IF EXISTS username;
ALTER TABLE staff DROP COLUMN IF EXISTS password;
ALTER TABLE staff DROP COLUMN IF EXISTS role;
ALTER TABLE staff DROP COLUMN IF EXISTS permissions;
ALTER TABLE staff DROP COLUMN IF EXISTS can_login;
ALTER TABLE staff DROP COLUMN IF EXISTS last_login;

-- Remove indexes
DROP INDEX IF EXISTS idx_staff_username;
DROP INDEX IF EXISTS idx_staff_tenant_canlogin;
```

## Troubleshooting

### Error: "column already exists"
- Safe to ignore. The SQL uses `IF NOT EXISTS` to prevent errors.

### Error: "constraint already exists"
- Safe to ignore. The SQL checks for existing constraints.

### Staff list still not working
1. Check Vercel logs for errors
2. Verify migration ran successfully
3. Run Prisma generate: `npx prisma generate`
4. Trigger a new deployment

### Permission denied
- Make sure you're using a database user with ALTER TABLE privileges
- Contact your database administrator

