import { db } from '../lib/sqlite';

try {
  console.log('Testing appointment creation...');
  
  // Test direct insert
  const appointmentId = Math.random().toString(36).substring(2, 15);
  
  const insert = db.prepare(`
    INSERT INTO appointments (
      id, tenantId, customerId, customerName, serviceId, serviceName,
      staffId, staffName, date, time, status, notes, price, duration, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    appointmentId,
    'lobaaaa',
    appointmentId + '-customer',
    'Test Müşteri',
    appointmentId + '-service',
    'Saç Kesimi',
    'web-staff-1',
    'Web Randevu',
    '2025-09-26',
    '14:00',
    'pending',
    'Test randevu',
    150,
    45,
    new Date().toISOString(),
    new Date().toISOString()
  );

  console.log('✅ Appointment created successfully!');
  
  // Check if it exists
  const appointments = db.prepare('SELECT * FROM appointments WHERE tenantId = ?').all('lobaaaa');
  console.log('Found appointments:', appointments.length);
  
} catch (error) {
  console.error('❌ Error:', error);
}
