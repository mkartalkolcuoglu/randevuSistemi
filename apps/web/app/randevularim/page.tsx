"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '../../components/ui';
import { ArrowLeft, Phone, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

export default function RandevuSorgulama() {
  const router = useRouter();

  // Step 1: Phone input
  // Step 2: OTP input
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP timer
  const [timeLeft, setTimeLeft] = useState(120); // 120 saniye
  const [canResend, setCanResend] = useState(false);

  // Timer effect
  useEffect(() => {
    if (step === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [step, timeLeft]);

  const formatPhoneDisplay = (value: string) => {
    // Display format: 0XXX XXX XX XX
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setPhone(value);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length !== 11) {
      setError('Lütfen geçerli bir telefon numarası girin');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          purpose: 'appointment_query'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Doğrulama kodu telefonunuza gönderildi');
        setStep('otp');
        setTimeLeft(120);
        setCanResend(false);
      } else {
        setError(data.error || 'SMS gönderilemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Sadece rakam

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Son karakteri al
    setOtp(newOtp);

    // Otomatik sonraki input'a geç
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      setError('Lütfen 6 haneli kodu girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          code,
          purpose: 'appointment_query'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Doğrulama başarılı! Yönlendiriliyorsunuz...');

        // Randevular sayfasına yönlendir
        setTimeout(() => {
          router.push(`/randevularim/list?phone=${encodeURIComponent(phone)}`);
        }, 1000);
      } else {
        setError(data.error || 'Hatalı doğrulama kodu');

        // Hatalı kod girildiyse kalan deneme hakkını göster
        if (data.remainingAttempts !== undefined) {
          setError(`${data.error}. Kalan deneme: ${data.remainingAttempts}`);
        }

        // Maksimum denemeye ulaşıldıysa başa dön
        if (data.code === 'MAX_ATTEMPTS_REACHED') {
          setTimeout(() => {
            setStep('phone');
            setOtp(['', '', '', '', '', '']);
          }, 2000);
        }
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    handleSendOtp();
  };

  const handleChangePhone = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setTimeLeft(120);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <img
                  src="https://i.hizliresim.com/4a00l8g.png"
                  alt="Net Randevu Logo"
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {step === 'phone' ? (
                  <Phone className="w-8 h-8 text-blue-600" />
                ) : (
                  <KeyRound className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {step === 'phone' ? 'Randevularımı Görüntüle' : 'Doğrulama Kodu'}
              </h1>
              <p className="text-gray-600">
                {step === 'phone'
                  ? 'Telefon numaranızı girerek randevularınızı görüntüleyebilirsiniz'
                  : `${formatPhoneDisplay(phone)} numarasına gönderilen 6 haneli kodu girin`}
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Phone Input Step */}
            {step === 'phone' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(phone)}
                    onChange={handlePhoneChange}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-lg"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Telefon numaranız başında 0 ile başlamalıdır
                  </p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length !== 11}
                  className="w-full bg-[#163974] hover:bg-[#0F2A52] text-white py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5 mr-2" />
                      Doğrulama Kodu Gönder
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* OTP Input Step */}
            {step === 'otp' && (
              <div className="space-y-6">
                {/* OTP Inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                    Doğrulama Kodu
                  </label>
                  <div className="flex justify-center space-x-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                <div className="text-center">
                  {timeLeft > 0 ? (
                    <p className="text-sm text-gray-600">
                      Kod {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} içinde geçersiz olacak
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">
                      Kodun süresi doldu
                    </p>
                  )}
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
                  className="w-full bg-[#163974] hover:bg-[#0F2A52] text-white py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Doğrula
                    </>
                  )}
                </Button>

                {/* Resend & Change Phone */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className="w-full"
                  >
                    Kodu Tekrar Gönder
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleChangePhone}
                    disabled={loading}
                    className="w-full text-sm"
                  >
                    Telefon Numarasını Değiştir
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            SMS almadınız mı?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Spam klasörünü kontrol edin
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
