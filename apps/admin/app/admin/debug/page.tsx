'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function DebugPage() {
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);

  const handleCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const response = await fetch('/api/debug/check-card-payments');
      const data = await response.json();
      setCheckResult(data);
    } catch (error) {
      console.error('Error checking:', error);
      setCheckResult({ success: false, error: 'Failed to check' });
    } finally {
      setChecking(false);
    }
  };

  const handleFix = async () => {
    if (!confirm('Tüm eksik transaction kayıtlarını oluşturmak istediğinize emin misiniz?')) {
      return;
    }

    setFixing(true);
    setFixResult(null);
    try {
      const response = await fetch('/api/debug/fix-card-payments', {
        method: 'POST'
      });
      const data = await response.json();
      setFixResult(data);

      // Refresh check results
      if (data.success) {
        handleCheck();
      }
    } catch (error) {
      console.error('Error fixing:', error);
      setFixResult({ success: false, error: 'Failed to fix' });
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Debug: Kredi Kartı Ödemeleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Check Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Durumu Kontrol Et</h3>
              <p className="text-sm text-gray-600">
                Kredi kartı ile yapılmış randevuları ve eksik transaction kayıtlarını kontrol eder.
              </p>
              <Button onClick={handleCheck} disabled={checking}>
                {checking ? 'Kontrol Ediliyor...' : 'Kontrol Et'}
              </Button>

              {checkResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Sonuç:</h4>
                  {checkResult.success ? (
                    <>
                      <div className="space-y-2 mb-4">
                        <p>✅ Toplam kredi kartı randevusu: <strong>{checkResult.summary.total}</strong></p>
                        <p>✅ Transaction var: <strong>{checkResult.summary.withTransaction}</strong></p>
                        <p className="text-red-600">
                          ❌ Transaction eksik: <strong>{checkResult.summary.missingTransaction}</strong>
                        </p>
                      </div>

                      {checkResult.results && checkResult.results.length > 0 && (
                        <div className="max-h-96 overflow-y-auto">
                          <h5 className="font-semibold mb-2">Detaylar:</h5>
                          {checkResult.results.map((result: any, idx: number) => (
                            <div key={idx} className={`p-3 mb-2 rounded ${result.needsFix ? 'bg-red-50' : 'bg-green-50'}`}>
                              <p className="font-medium">{result.appointment.customerName} - {result.appointment.serviceName}</p>
                              <p className="text-sm">
                                {result.appointment.date} | {result.appointment.price} TL | {result.appointment.status}
                              </p>
                              <p className="text-sm">
                                {result.hasTransaction ? (
                                  <span className="text-green-600">✅ Transaction var</span>
                                ) : (
                                  <span className="text-red-600">❌ Transaction yok</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-600">❌ Hata: {checkResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Fix Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">2. Eksik Kayıtları Düzelt</h3>
              <p className="text-sm text-gray-600">
                Eksik transaction kayıtlarını oluşturur. Bu işlem geçmiş tüm kredi kartı ödemelerini kasaya ekler.
              </p>
              <Button
                onClick={handleFix}
                disabled={fixing || !checkResult || checkResult.summary?.missingTransaction === 0}
                variant="destructive"
              >
                {fixing ? 'Düzeltiliyor...' : 'Düzelt'}
              </Button>

              {fixResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Düzeltme Sonucu:</h4>
                  {fixResult.success ? (
                    <>
                      <p>✅ İşlem tamamlandı!</p>
                      <p>📝 Düzeltilen: <strong>{fixResult.summary.fixed}</strong></p>
                      <p>⏭️  Zaten var: <strong>{fixResult.summary.alreadyExists}</strong></p>
                      <p>❌ Hata: <strong>{fixResult.summary.errors}</strong></p>
                    </>
                  ) : (
                    <p className="text-red-600">❌ Hata: {fixResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
