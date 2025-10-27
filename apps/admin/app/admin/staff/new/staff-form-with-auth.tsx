"use client";

import { useState, useEffect } from 'react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Lock, User, Shield, Eye, EyeOff } from 'lucide-react';
import { DEFAULT_STAFF_PERMISSIONS, PAGE_NAMES, type StaffPermissions } from '../../../../lib/permissions';

interface StaffAuthFormProps {
  onAuthDataChange: (data: { username: string; password: string; canLogin: boolean; permissions: StaffPermissions }) => void;
  initialAuthData?: {
    username: string;
    password: string;
    canLogin: boolean;
    permissions: StaffPermissions;
  };
}

export default function StaffAuthForm({ onAuthDataChange, initialAuthData }: StaffAuthFormProps) {
  const [canLogin, setCanLogin] = useState(initialAuthData?.canLogin || false);
  const [username, setUsername] = useState(initialAuthData?.username || '');
  const [password, setPassword] = useState(''); // Never pre-fill password for security
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<StaffPermissions>(
    initialAuthData?.permissions || DEFAULT_STAFF_PERMISSIONS
  );

  // Update state when initialAuthData changes (for edit mode)
  useEffect(() => {
    if (initialAuthData && initialAuthData.username) {
      console.log('📝 Loading auth data:', initialAuthData);
      setCanLogin(initialAuthData.canLogin || false);
      setUsername(initialAuthData.username || '');
      // Don't set password - keep it empty for security
      setPermissions(initialAuthData.permissions || DEFAULT_STAFF_PERMISSIONS);
    }
  }, [initialAuthData?.username, initialAuthData?.canLogin, JSON.stringify(initialAuthData?.permissions)]);

  const handleCanLoginChange = (checked: boolean) => {
    setCanLogin(checked);
    onAuthDataChange({ username, password, canLogin: checked, permissions });
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    onAuthDataChange({ username: value, password, canLogin, permissions });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    onAuthDataChange({ username, password: value, canLogin, permissions });
  };

  const handlePermissionChange = (page: keyof StaffPermissions, action: 'read' | 'create' | 'update' | 'delete', value: boolean) => {
    const newPermissions = {
      ...permissions,
      [page]: {
        ...permissions[page],
        [action]: value
      }
    };
    setPermissions(newPermissions);
    onAuthDataChange({ username, password, canLogin, permissions: newPermissions });
  };

  const handleSelectAll = (page: keyof StaffPermissions) => {
    const newPermissions = {
      ...permissions,
      [page]: {
        read: true,
        create: true,
        update: true,
        delete: true
      }
    };
    setPermissions(newPermissions);
    onAuthDataChange({ username, password, canLogin, permissions: newPermissions });
  };

  const handleDeselectAll = (page: keyof StaffPermissions) => {
    const newPermissions = {
      ...permissions,
      [page]: {
        read: false,
        create: false,
        update: false,
        delete: false
      }
    };
    setPermissions(newPermissions);
    onAuthDataChange({ username, password, canLogin, permissions: newPermissions });
  };

  return (
    <div className="space-y-6">
      {/* Can Login Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Giriş Yetkisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={canLogin}
                onChange={(e) => handleCanLoginChange(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mt-1 flex-shrink-0"
              />
              <div>
                <div className="text-base font-semibold">Bu personel sisteme giriş yapabilsin mi?</div>
                <p className="text-sm text-gray-600 mt-1">
                  Giriş yetkisi verilirse, personel kullanıcı adı ve şifre ile admin paneline erişebilir.
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Login Credentials */}
      {canLogin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Giriş Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Kullanıcı Adı *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="ornek.kullanici"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Personelin giriş yapacağı benzersiz kullanıcı adı</p>
            </div>

            <div>
              <Label htmlFor="password">Şifre *</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Personelin giriş şifresi (güvenli bir şifre belirleyin)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Permissions */}
      {canLogin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Sayfa Yetkileri
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Personelin erişebileceği sayfaları ve yapabileceği işlemleri seçin
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Object.keys(permissions) as (keyof StaffPermissions)[]).map((page) => (
                <div key={page} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">{PAGE_NAMES[page]}</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(page)}
                        className="text-xs"
                      >
                        Tümünü Seç
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeselectAll(page)}
                        className="text-xs"
                      >
                        Temizle
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[page]?.read || false}
                        onChange={(e) => handlePermissionChange(page, 'read', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm">Görüntüleme</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[page]?.create || false}
                        onChange={(e) => handlePermissionChange(page, 'create', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                      />
                      <span className="text-sm">Ekleme</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[page]?.update || false}
                        onChange={(e) => handlePermissionChange(page, 'update', e.target.checked)}
                        className="w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                      />
                      <span className="text-sm">Düzenleme</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[page]?.delete || false}
                        onChange={(e) => handlePermissionChange(page, 'delete', e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="text-sm">Silme</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 İpucu:</strong> Personel sadece "Görüntüleme" yetkisi olan sayfaları görebilir. 
                Diğer yetkiler (Ekleme, Düzenleme, Silme) sayfa içindeki butonları kontrol eder.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

