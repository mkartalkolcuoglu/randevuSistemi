import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database connection - use the same admin.db as admin app
const dbPath = path.resolve(process.cwd(), '../admin/prisma/admin.db');
export const db = new Database(dbPath, { verbose: console.log });

// Initialize tables if they don't exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      businessName TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      domain TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      ownerEmail TEXT NOT NULL,
      phone TEXT,
      plan TEXT DEFAULT 'Standard',
      status TEXT DEFAULT 'active',
      address TEXT,
      businessType TEXT DEFAULT 'other',
      businessDescription TEXT,
      monthlyRevenue INTEGER DEFAULT 0,
      appointmentCount INTEGER DEFAULT 0,
      customerCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME,
      workingHours TEXT,
      theme TEXT
    );
  `);
  console.log('✅ SQLite database initialized successfully');
} catch (error) {
  console.error('❌ Error initializing SQLite database:', error);
}

export default db;
