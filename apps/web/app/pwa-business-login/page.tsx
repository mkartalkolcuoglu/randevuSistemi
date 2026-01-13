"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Building2, User, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, HelpCircle, Phone } from "lucide-react";

export default function PWABusinessLogin() {
  const router = useRouter();
  const [isPWA, setIsPWA] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    // PWA modunda mı kontrol et
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    if (!checkPWA) {
      // PWA değilse admin panele yönlendir
      window.location.href = "https://admin.netrandevu.com";
    } else {
      setIsPWA(true);
    }
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!username.trim()) {
      setError("Lütfen kullanıcı adınızı girin");
      return;
    }

    if (!password.trim()) {
      setError("Lütfen şifrenizi girin");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Gerçek API çağrısı yapılacak
      // Başarılı giriş - dashboard'a yönlendir
      router.push("/pwa-staff");
    } catch (err) {
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim() && password.trim();

  // Yükleniyor durumu
  if (isPWA === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // PWA Mobil Tasarım
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative">
      {/* Gradient Header */}
      <div className="relative h-[35vh] bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-b-[32px] overflow-hidden">
        {/* Dekoratif Daireler */}
        <div className="absolute w-[60vw] h-[60vw] rounded-full bg-white/10 -top-[20vw] -right-[15vw]" />
        <div className="absolute w-[40vw] h-[40vw] rounded-full bg-white/10 top-[15vh] -left-[20vw]" />

        {/* Geri Butonu */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-6 w-11 h-11 bg-white/20 rounded-[14px] flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        {/* Logo ve Başlık */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center">
          <div className="w-[72px] h-[72px] bg-white/20 rounded-[20px] flex items-center justify-center mb-4">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-white mb-1">İşletme Girişi</h1>
          <p className="text-white/80 text-base">Hesabınıza giriş yaparak devam edin</p>
        </div>
      </div>

      {/* Form Kartı */}
      <div className="flex-1 px-6 -mt-4">
        <div className="bg-white rounded-[24px] p-6 shadow-xl">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Kullanıcı Adı */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
            <div className={`flex items-center bg-[#f3f4f6] rounded-[14px] border-2 px-4 transition-all ${
              focusedInput === 'username' ? 'border-[#667eea] bg-white' : 'border-transparent'
            }`}>
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Kullanıcı adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                className="flex-1 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {username && (
                <button onClick={() => setUsername("")} className="p-1">
                  <span className="text-gray-400 text-xl">&times;</span>
                </button>
              )}
            </div>
          </div>

          {/* Şifre */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
            <div className={`flex items-center bg-[#f3f4f6] rounded-[14px] border-2 px-4 transition-all ${
              focusedInput === 'password' ? 'border-[#667eea] bg-white' : 'border-transparent'
            }`}>
              <Lock className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="flex-1 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="p-1">
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Şifremi Unuttum */}
          <div className="flex justify-end mb-6">
            <button className="text-[#667eea] text-sm font-semibold">
              Şifremi Unuttum
            </button>
          </div>

          {/* Giriş Yap Butonu */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 rounded-[14px] flex items-center justify-center gap-2 font-semibold text-white transition-all ${
              isFormValid && !isLoading
                ? 'bg-[#667eea] shadow-lg shadow-[#667eea]/30'
                : 'bg-gray-300'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Giriş Yap
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">veya</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Yardım Bölümü */}
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-[#667eea]/10 rounded-[10px] flex items-center justify-center mr-3">
                <HelpCircle className="w-5 h-5 text-[#667eea]" />
              </div>
              <p className="flex-1 text-sm text-gray-500 leading-relaxed">
                Giriş bilgilerinizi işletme yöneticinizden alabilirsiniz
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-9 h-9 bg-[#667eea]/10 rounded-[10px] flex items-center justify-center mr-3">
                <Phone className="w-5 h-5 text-[#667eea]" />
              </div>
              <p className="flex-1 text-sm text-gray-500 leading-relaxed">
                Destek için: 0850 XXX XX XX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
