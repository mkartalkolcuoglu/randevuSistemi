"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2, ShieldCheck, Calendar, Clock, User, ArrowLeft } from "lucide-react";

export default function MusteriGirisPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otpId, setOtpId] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already logged in
    const session = localStorage.getItem("musteri_session");
    if (session) {
      router.push("/pwa/musteri/panel");
    }
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 10) {
      setPhone(formatted);
    }
  };

  const sendOtp = async () => {
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone.length !== 10) {
      setError("Geçerli bir telefon numarası girin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          purpose: "customer_login"
        })
      });

      const data = await res.json();

      if (data.success) {
        setOtpId(data.otpId);
        setStep("otp");
        setCountdown(120);
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "SMS gönderilemedi");
        if (data.retryAfter) {
          setCountdown(data.retryAfter);
        }
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(d => d) && newOtp.join("").length === 6) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    }
  };

  const verifyOtp = async (code: string) => {
    setLoading(true);
    setError("");

    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code,
          purpose: "customer_login"
        })
      });

      const data = await res.json();

      if (data.success) {
        // Save session
        localStorage.setItem("musteri_session", JSON.stringify({
          phone: cleanPhone,
          sessionToken: data.sessionToken,
          loginTime: new Date().toISOString()
        }));
        router.push("/pwa/musteri/panel");
      } else {
        setError(data.error || "Doğrulama başarısız");
        if (data.remainingAttempts !== undefined) {
          setError(`${data.error}. Kalan deneme: ${data.remainingAttempts}`);
        }
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    sendOtp();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-12 pb-16">
        {/* Geri Butonu */}
        <button
          onClick={() => router.push("/pwa")}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:scale-95 transition-transform mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Randevularım</h1>
          <p className="text-blue-100 text-sm">Randevularınızı görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="px-5 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md mx-auto">
          {step === "phone" ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Giriş Yap</h2>
                <p className="text-gray-500 text-sm mt-1">Telefon numaranızı girin</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      +90
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="5XX XXX XX XX"
                      className="w-full pl-14 pr-4 py-4 border border-gray-200 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={sendOtp}
                  disabled={loading || phone.replace(/\s/g, "").length !== 10 || countdown > 0}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : countdown > 0 ? (
                    `${countdown} saniye bekleyin`
                  ) : (
                    <>
                      Devam Et
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Doğrulama Kodu</h2>
                <p className="text-gray-500 text-sm mt-1">
                  <span className="font-medium text-gray-700">+90 {phone}</span> numarasına gönderilen 6 haneli kodu girin
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                {countdown > 0 && (
                  <p className="text-center text-gray-500 text-sm">
                    Kod <span className="font-semibold text-blue-600">{countdown}</span> saniye içinde geçerliliğini yitirecek
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium active:scale-[0.98] transition-all"
                  >
                    Geri
                  </button>
                  <button
                    onClick={resendOtp}
                    disabled={countdown > 0 || loading}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                  >
                    {countdown > 0 ? `${countdown}s` : "Tekrar Gönder"}
                  </button>
                </div>

                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="px-5 py-8 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600">Randevularınızı Görün</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Geçmiş İşlemler</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600">Profil Bilgileri</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-5">
        <p className="text-gray-400 text-xs">
          Giriş yaparak randevularınızı görüntüleyebilir ve yönetebilirsiniz
        </p>
      </div>
    </div>
  );
}
