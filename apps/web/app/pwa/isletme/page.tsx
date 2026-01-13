"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Building2, User, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Phone, AlertCircle } from "lucide-react";

export default function PWAIsletmeGiris() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);

    // Zaten giriş yapılmış mı kontrol et
    const authToken = localStorage.getItem("pwa-auth-token");
    const savedUser = localStorage.getItem("pwa-user");
    if (authToken && savedUser) {
      router.replace("/pwa/isletme/panel");
    }
  }, [router]);

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
      const response = await fetch("https://admin.netrandevu.com/api/mobile/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Token ve kullanıcı bilgilerini kaydet
        localStorage.setItem("pwa-auth-token", data.token);
        localStorage.setItem("pwa-user", JSON.stringify(data.user));

        // Panel sayfasına yönlendir
        router.push("/pwa/isletme/panel");
      } else {
        setError(data.error || data.message || "Geçersiz kullanıcı adı veya şifre");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const isFormValid = username.trim() && password.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col relative overflow-hidden">
      {/* Dekoratif Arka Plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className={`relative z-10 pt-12 px-5 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button
          onClick={() => {
            localStorage.removeItem("pwa-user-role");
            router.push("/pwa");
          }}
          className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Logo ve Başlık */}
      <div className={`relative z-10 flex flex-col items-center pt-8 pb-6 px-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-20 h-20 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-black/20 border border-white/10">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">İşletme Girişi</h1>
        <p className="text-white/60 text-sm text-center">Hesabınıza giriş yaparak devam edin</p>
      </div>

      {/* Form */}
      <div className={`relative z-10 flex-1 px-5 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">

          {/* Hata Mesajı */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Kullanıcı Adı */}
          <div className="mb-4">
            <label className="block text-white/60 text-sm font-medium mb-2 ml-1">
              Kullanıcı Adı
            </label>
            <div className={`flex items-center bg-white/5 rounded-xl border-2 px-4 transition-all duration-200 ${
              focusedInput === 'username' ? 'border-blue-500/50 bg-white/10' : 'border-white/10'
            }`}>
              <User className="w-5 h-5 text-white/40 mr-3" />
              <input
                type="text"
                placeholder="Kullanıcı adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={handleKeyDown}
                className="flex-1 py-3.5 bg-transparent outline-none text-white placeholder-white/30"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Şifre */}
          <div className="mb-5">
            <label className="block text-white/60 text-sm font-medium mb-2 ml-1">
              Şifre
            </label>
            <div className={`flex items-center bg-white/5 rounded-xl border-2 px-4 transition-all duration-200 ${
              focusedInput === 'password' ? 'border-blue-500/50 bg-white/10' : 'border-white/10'
            }`}>
              <Lock className="w-5 h-5 text-white/40 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={handleKeyDown}
                className="flex-1 py-3.5 bg-transparent outline-none text-white placeholder-white/30"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 -mr-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-white/40" />
                ) : (
                  <Eye className="w-5 h-5 text-white/40" />
                )}
              </button>
            </div>
          </div>

          {/* Giriş Yap Butonu */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] ${
              isFormValid && !isLoading
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-white/40'
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
        </div>

        {/* Yardım Bilgisi */}
        <div className={`mt-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Yardıma mı ihtiyacınız var?</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Giriş bilgilerinizi işletme yöneticinizden alabilirsiniz. Destek için{" "}
                  <a href="tel:08503036723" className="text-blue-400">0850 303 67 23</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Boşluk */}
      <div className="h-8"></div>
    </div>
  );
}
