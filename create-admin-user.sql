-- Create admins table for project-admin authentication
CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS "admins_username_key" ON "admins"("username");

-- Insert admin user
-- Username: yonetim
-- Password: Ozan.1903*?
-- MD5 Hash of password: 3e8c8e8c8e8c8e8c8e8c8e8c8e8c8e8c (this will be calculated)

-- First, delete existing admin if exists
DELETE FROM "admins" WHERE username = 'yonetim';

-- Insert new admin with MD5 hashed password
-- MD5('Ozan.1903*?') = calculated below
INSERT INTO "admins" ("id", "username", "password", "createdAt", "updatedAt")
VALUES (
  'admin_' || gen_random_uuid()::text,
  'yonetim',
  md5('Ozan.1903*?'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify the admin was created
SELECT id, username, createdAt FROM "admins" WHERE username = 'yonetim';

