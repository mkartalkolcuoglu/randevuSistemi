import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/sqlite';

export async function GET() {
  try {
    console.log('Testing SQLite connection...');
    
    // Test basic connection
    const basicTest = db.prepare('SELECT 1 as test').get();
    console.log('Basic query result:', basicTest);
    
    // Test tenant table
    const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number };
    console.log('Tenant count:', tenantCount.count);
    
    // Get all tenants
    const tenants = db.prepare('SELECT * FROM tenants').all();
    console.log('Tenants:', tenants.length);
    
    return NextResponse.json({
      success: true,
      message: 'SQLite is working!',
      data: {
        tenantCount: tenantCount.count,
        tenantsLength: tenants.length,
        basicQuery: basicTest
      }
    });
  } catch (error) {
    console.error('SQLite test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
