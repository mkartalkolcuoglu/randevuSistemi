"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { CreditCard, CheckCircle, AlertCircle, Calendar, User, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CancelledCardPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  price: number | null;
  paymentType: string;
  refundCompleted: boolean | null;
  refundCompletedAt: Date | null;
  refundNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentFlowClientProps {
  payments: CancelledCardPayment[];
}

export default function PaymentFlowClient({ payments }: PaymentFlowClientProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [localPayments, setLocalPayments] = useState(payments);

  const handleMarkRefunded = async (appointmentId: string) => {
    if (!confirm('İade işlemini tamamladınız mı? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setProcessingId(appointmentId);
      const response = await fetch('/api/project-admin/payment-flow/mark-refunded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setLocalPayments(prev =>
          prev.map(p =>
            p.id === appointmentId
              ? { ...p, refundCompleted: true, refundCompletedAt: new Date() }
              : p
          )
        );
        alert('İade işlemi başarıyla kaydedildi');
      } else {
        alert(data.error || 'İade kaydedilemedi');
      }
    } catch (err) {
      alert('Bir hata oluştu');
      console.error('Error marking refund:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (refundCompleted: boolean | null) => {
    if (refundCompleted) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          İade Yapıldı
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        İade Bekliyor
      </span>
    );
  };

  const pendingRefunds = localPayments.filter(p => !p.refundCompleted);
  const completedRefunds = localPayments.filter(p => p.refundCompleted);
  const totalAmount = localPayments.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ödeme Akışı</h1>
        <p className="mt-2 text-gray-600">
          İptal edilen kredi kartı ödemelerini takip edin ve iade işlemlerini yönetin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">İade Bekliyor</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRefunds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">İade Yapıldı</p>
                <p className="text-2xl font-bold text-gray-900">{completedRefunds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₺{totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            İptal Edilen Kartlı Ödemeler ({localPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Henüz iptal edilmiş kartlı ödeme bulunmuyor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşletme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hizmet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Randevu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.tenantName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{payment.customerName}</div>
                        <div className="text-sm text-gray-500">{payment.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{payment.serviceName}</div>
                        <div className="text-sm text-gray-500">{payment.staffName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.date}</div>
                        <div className="text-sm text-gray-500">{payment.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₺{payment.price?.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.refundCompleted)}
                        {payment.refundCompletedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(payment.refundCompletedAt), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!payment.refundCompleted ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkRefunded(payment.id)}
                            disabled={processingId === payment.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === payment.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                İşleniyor...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                İade Yapıldı
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-green-600 font-medium">✓ Tamamlandı</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
