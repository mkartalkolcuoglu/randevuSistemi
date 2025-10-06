import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database connection
const dbPath = path.join(process.cwd(), 'prisma', 'admin.db');
export const db = new Database(dbPath);

// Disable foreign key constraints for easier testing
db.pragma('foreign_keys = OFF');

// Initialize tables if they don't exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      businessName TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      ownerEmail TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      businessType TEXT DEFAULT 'other',
      businessDescription TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME,
      workingHours TEXT,
      theme TEXT
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      position TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      avatar TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      birthDate DATETIME,
      notes TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      customerId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      customerEmail TEXT,
      serviceId TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      staffId TEXT NOT NULL,
      staffName TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      price REAL,
      duration INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id),
      FOREIGN KEY (customerId) REFERENCES customers (id),
      FOREIGN KEY (serviceId) REFERENCES services (id),
      FOREIGN KEY (staffId) REFERENCES staff (id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignedTo TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      dueDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL UNIQUE,
      businessName TEXT NOT NULL,
      businessAddress TEXT,
      businessPhone TEXT,
      businessEmail TEXT,
      workingHours TEXT,
      notificationSettings TEXT,
      paymentSettings TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    );
  `);
  // Add missing columns to existing appointments table
  try {
    db.exec('ALTER TABLE appointments ADD COLUMN customerPhone TEXT');
  } catch (error) {
    // Column might already exist, ignore error
  }
  
  try {
    db.exec('ALTER TABLE appointments ADD COLUMN customerEmail TEXT');
  } catch (error) {
    // Column might already exist, ignore error
  }

    try {
      db.exec('ALTER TABLE appointments ADD COLUMN paymentType TEXT DEFAULT \'cash\'');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add themeSettings column to settings table
    try {
      db.exec('ALTER TABLE settings ADD COLUMN themeSettings TEXT');
    } catch (error) {
      // Column might already exist, ignore error
    }

  console.log('✅ Admin SQLite database initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Admin SQLite database:', error);
}

export default db;
