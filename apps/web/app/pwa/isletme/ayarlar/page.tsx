"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Palette,
  Building2,
  User,
  Key,
  Clock,
  MapPin,
  FileText,
  Loader2,
  Upload,
  X,
  CreditCard,
  ChevronRight,
  Check
} from "lucide-react";

interface Settings {
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    headerImage: string;
  };
  businessName: string;
  businessType: string;
  businessDescription: string;
  businessAddress: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  username: string;
  password: string;
  workingHours: {
    [key: string]: { start: string; end: string; closed: boolean };
  };
  appointmentTimeInterval: number;
  blacklistThreshold: number;
  reminderMinutes: number;
  cardPaymentEnabled: boolean;
  location: {
    latitude: string;
    longitude: string;
    address: string;
  };
  documents: {
    identityDocument: string;
    taxDocument: string;
    iban: string;
    signatureDocument: string;
  };
}

type TabType = "theme" | "business" | "owner" | "login" | "location" | "hours" | "documents";

export default function PWASettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("theme");
  const [logoPreview, setLogoPreview] = useState("");
  const [headerPreview, setHeaderPreview] = useState("");
  const [settings, setSettings] = useState<Settings>({
    themeSettings: {
      primaryColor: "#163974",
      secondaryColor: "#0F2A52",
      logo: "",
      headerImage: ""
    },
    businessName: "",
    businessType: "salon",
    businessDescription: "",
    businessAddress: "",
    ownerName: "",
    ownerEmail: "",
    phone: "",
    username: "",
    password: "",
    workingHours: {
      monday: { start: "09:00", end: "18:00", closed: false },
      tuesday: { start: "09:00", end: "18:00", closed: false },
      wednesday: { start: "09:00", end: "18:00", closed: false },
      thursday: { start: "09:00", end: "18:00", closed: false },
      friday: { start: "09:00", end: "18:00", closed: false },
      saturday: { start: "09:00", end: "17:00", closed: false },
      sunday: { start: "10:00", end: "16:00", closed: true }
    },
    appointmentTimeInterval: 30,
    blacklistThreshold: 3,
    reminderMinutes: 120,
    cardPaymentEnabled: true,
    location: { latitude: "", longitude: "", address: "" },
    documents: { identityDocument: "", taxDocument: "", iban: "", signatureDocument: "" }
  });

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("pwa-auth-token");
    if (!token) {
      router.push("/pwa/isletme");
      return;
    }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pwa-auth-token");
      const userStr = localStorage.getItem("pwa-user");
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await fetch(`/api/pwa/settings?tenantId=${user?.tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": user?.tenantId || ""
        }
      });

      const data = await res.json();
      if (data.success && (data.settings || data.data)) {
        const s = data.data || data.settings;

        // Parse workingHours if string
        let workingHours = s.workingHours;
        if (typeof workingHours === "string") {
          try { workingHours = JSON.parse(workingHours); } catch { workingHours = settings.workingHours; }
        }

        // Parse theme if string
        let theme = s.themeSettings || s.theme || {};
        if (typeof theme === "string") {
          try { theme = JSON.parse(theme); } catch { theme = {}; }
        }

        setSettings(prev => ({
          ...prev,
          businessName: s.businessName || "",
          businessType: s.businessType || "salon",
          businessDescription: s.businessDescription || "",
          businessAddress: s.address || s.businessAddress || "",
          ownerName: s.ownerName || "",
          ownerEmail: s.ownerEmail || "",
          phone: s.phone || "",
          username: s.username || "",
          password: "",
          workingHours: workingHours || prev.workingHours,
          appointmentTimeInterval: s.appointmentTimeInterval || 30,
          blacklistThreshold: s.blacklistThreshold || 3,
          reminderMinutes: s.reminderMinutes || 120,
          cardPaymentEnabled: s.cardPaymentEnabled !== false,
          themeSettings: {
            primaryColor: theme.primaryColor || "#163974",
            secondaryColor: theme.secondaryColor || "#0F2A52",
            logo: theme.logo || "",
            headerImage: theme.headerImage || ""
          },
          location: theme.location || s.location || { latitude: "", longitude: "", address: "" },
          documents: theme.documents || s.documents || { identityDocument: "", taxDocument: "", iban: "", signatureDocument: "" }
        }));

        if (theme.logo) setLogoPreview(theme.logo);
        if (theme.headerImage) setHeaderPreview(theme.headerImage);
      }
    } catch (error) {
      console.error("Load settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("pwa-auth-token");
      const userStr = localStorage.getItem("pwa-user");
      const user = userStr ? JSON.parse(userStr) : null;

      // Format data according to API expectations
      const payload = {
        businessName: settings.businessName,
        businessType: settings.businessType,
        businessDescription: settings.businessDescription,
        address: settings.businessAddress,
        ownerName: settings.ownerName,
        ownerEmail: settings.ownerEmail,
        phone: settings.phone,
        password: settings.password || undefined,
        theme: settings.themeSettings,
        location: settings.location,
        documents: settings.documents,
        workingHours: settings.workingHours,
        appointmentTimeInterval: settings.appointmentTimeInterval,
        blacklistThreshold: settings.blacklistThreshold,
        reminderMinutes: settings.reminderMinutes,
        cardPaymentEnabled: settings.cardPaymentEnabled
      };

      const res = await fetch("/api/pwa/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": user?.tenantId || ""
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert("Ayarlar kaydedildi!");
      } else {
        alert("Hata: " + (data.error || data.message || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Kaydetme hatası!");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "headerImage") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Dosya 3MB'dan küçük olmalı");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSettings(prev => ({
        ...prev,
        themeSettings: { ...prev.themeSettings, [type]: base64 }
      }));
      if (type === "logo") setLogoPreview(base64);
      else setHeaderPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)} ${nums.slice(3)}`;
    if (nums.length <= 8) return `${nums.slice(0, 3)} ${nums.slice(3, 6)} ${nums.slice(6)}`;
    return `${nums.slice(0, 3)} ${nums.slice(3, 6)} ${nums.slice(6, 8)} ${nums.slice(8, 10)}`;
  };

  const tabs: { id: TabType; icon: typeof Palette; label: string }[] = [
    { id: "theme", icon: Palette, label: "Tema" },
    { id: "business", icon: Building2, label: "İşletme" },
    { id: "owner", icon: User, label: "Yönetici" },
    { id: "login", icon: Key, label: "Giriş" },
    { id: "location", icon: MapPin, label: "Konum" },
    { id: "hours", icon: Clock, label: "Çalışma" },
    { id: "documents", icon: FileText, label: "Belgeler" }
  ];

  const businessTypes = [
    { value: "salon", label: "Güzellik Salonu" },
    { value: "barbershop", label: "Berber" },
    { value: "spa", label: "SPA & Wellness" },
    { value: "clinic", label: "Sağlık Kliniği" },
    { value: "dental", label: "Diş Kliniği" },
    { value: "other", label: "Diğer" }
  ];

  const days = [
    { key: "monday", label: "Pazartesi" },
    { key: "tuesday", label: "Salı" },
    { key: "wednesday", label: "Çarşamba" },
    { key: "thursday", label: "Perşembe" },
    { key: "friday", label: "Cuma" },
    { key: "saturday", label: "Cumartesi" },
    { key: "sunday", label: "Pazar" }
  ];

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-12 pb-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-semibold text-lg">İşletme Ayarları</h1>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            {saving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Save className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-10">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-24">
        {/* Tema */}
        {activeTab === "theme" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Renk Ayarları</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Ana Renk</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.themeSettings.primaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, primaryColor: e.target.value }
                      }))}
                      className="w-12 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.themeSettings.primaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, primaryColor: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">İkincil Renk</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.themeSettings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, secondaryColor: e.target.value }
                      }))}
                      className="w-12 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.themeSettings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, secondaryColor: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Logo</h3>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "logo")}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium"
              />
              {logoPreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain rounded-xl border" />
                  <button
                    onClick={() => {
                      setLogoPreview("");
                      setSettings(prev => ({ ...prev, themeSettings: { ...prev.themeSettings, logo: "" } }));
                    }}
                    className="text-red-500 text-sm"
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Header Görseli</h3>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "headerImage")}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium"
              />
              {headerPreview && (
                <div className="mt-3">
                  <img src={headerPreview} alt="Header" className="w-full h-24 object-cover rounded-xl border" />
                  <button
                    onClick={() => {
                      setHeaderPreview("");
                      setSettings(prev => ({ ...prev, themeSettings: { ...prev.themeSettings, headerImage: "" } }));
                    }}
                    className="text-red-500 text-sm mt-2"
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* İşletme */}
        {activeTab === "business" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">İşletme Adı *</label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">İşletme Türü</label>
                <select
                  value={settings.businessType}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  {businessTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">İşletme Açıklaması</label>
                <textarea
                  rows={3}
                  value={settings.businessDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessDescription: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  placeholder="İşletmeniz hakkında kısa bir açıklama..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">İşletme Adresi</label>
                <textarea
                  rows={2}
                  value={settings.businessAddress}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  placeholder="Tam adres bilgisi..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Yönetici */}
        {activeTab === "owner" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Adı Soyadı *</label>
                <input
                  type="text"
                  value={settings.ownerName}
                  onChange={(e) => setSettings(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">E-posta *</label>
                <input
                  type="email"
                  value={settings.ownerEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formatPhone(settings.phone)}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="5XX XXX XX XX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Giriş */}
        {activeTab === "login" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={settings.username}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Kullanıcı adı değiştirilemez</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Yeni Şifre</label>
                <input
                  type="password"
                  value={settings.password}
                  onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Konum */}
        {activeTab === "location" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Enlem</label>
                  <input
                    type="text"
                    value={settings.location.latitude}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      location: { ...prev.location, latitude: e.target.value }
                    }))}
                    placeholder="41.0082"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Boylam</label>
                  <input
                    type="text"
                    value={settings.location.longitude}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      location: { ...prev.location, longitude: e.target.value }
                    }))}
                    placeholder="28.9784"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Harita Adresi</label>
                <input
                  type="text"
                  value={settings.location.address}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  placeholder="Haritada gösterilecek adres"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setSettings(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            latitude: pos.coords.latitude.toString(),
                            longitude: pos.coords.longitude.toString()
                          }
                        }));
                      },
                      (err) => alert("Konum alınamadı: " + err.message)
                    );
                  }
                }}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Mevcut Konumumu Al
              </button>
            </div>
          </div>
        )}

        {/* Çalışma Saatleri */}
        {activeTab === "hours" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Çalışma Saatleri</h3>
              <div className="space-y-3">
                {days.map((day) => (
                  <div key={day.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <label className="flex items-center gap-2 w-28">
                      <input
                        type="checkbox"
                        checked={!settings.workingHours[day.key]?.closed}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: {
                            ...prev.workingHours,
                            [day.key]: { ...prev.workingHours[day.key], closed: !e.target.checked }
                          }
                        }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                    {!settings.workingHours[day.key]?.closed ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="time"
                          value={settings.workingHours[day.key]?.start || "09:00"}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              [day.key]: { ...prev.workingHours[day.key], start: e.target.value }
                            }
                          }))}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="time"
                          value={settings.workingHours[day.key]?.end || "18:00"}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              [day.key]: { ...prev.workingHours[day.key], end: e.target.value }
                            }
                          }))}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Kapalı</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900">Randevu Ayarları</h3>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Takvim Zaman Aralığı</label>
                <select
                  value={settings.appointmentTimeInterval}
                  onChange={(e) => setSettings(prev => ({ ...prev, appointmentTimeInterval: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value={5}>5 dakika</option>
                  <option value={10}>10 dakika</option>
                  <option value={15}>15 dakika</option>
                  <option value={20}>20 dakika</option>
                  <option value={30}>30 dakika</option>
                  <option value={45}>45 dakika</option>
                  <option value={60}>60 dakika</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Kara Liste Eşiği</label>
                <select
                  value={settings.blacklistThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, blacklistThreshold: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} defa</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Müşteri kaç defa gelmezse kara listeye alınsın?</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Hatırlatma Süresi</label>
                <select
                  value={settings.reminderMinutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value={10}>10 dakika önce</option>
                  <option value={30}>30 dakika önce</option>
                  <option value={60}>1 saat önce</option>
                  <option value={120}>2 saat önce</option>
                  <option value={180}>3 saat önce</option>
                  <option value={240}>4 saat önce</option>
                  <option value={720}>12 saat önce</option>
                  <option value={1440}>1 gün önce</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Kredi Kartı ile Ödeme</p>
                  <p className="text-xs text-gray-500">Müşteriler kart ile ödeme yapabilsin mi?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.cardPaymentEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, cardPaymentEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Belgeler */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <p className="text-sm text-gray-500">Ödeme işlemleri için gerekli belgeleri yükleyin.</p>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Kimlik Belgesi</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSettings(prev => ({
                          ...prev,
                          documents: { ...prev.documents, identityDocument: reader.result as string }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-600"
                />
                {settings.documents.identityDocument && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Yüklendi
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Vergi Levhası</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSettings(prev => ({
                          ...prev,
                          documents: { ...prev.documents, taxDocument: reader.result as string }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-600"
                />
                {settings.documents.taxDocument && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Yüklendi
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">IBAN</label>
                <input
                  type="text"
                  value={settings.documents.iban}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    if (!val.startsWith("TR") && val.length > 0 && !val.startsWith("T")) {
                      val = "TR" + val;
                    }
                    val = val.slice(0, 26);
                    setSettings(prev => ({
                      ...prev,
                      documents: { ...prev.documents, iban: val }
                    }));
                  }}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">İmza Sirküleri</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSettings(prev => ({
                          ...prev,
                          documents: { ...prev.documents, signatureDocument: reader.result as string }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-600"
                />
                {settings.documents.signatureDocument && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Yüklendi
                  </p>
                )}
              </div>

              <div className="p-3 bg-yellow-50 rounded-xl">
                <p className="text-xs text-yellow-800">
                  <strong>Not:</strong> Belgeleriniz güvenli sunucularda şifreli olarak saklanmaktadır.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </div>
  );
}
