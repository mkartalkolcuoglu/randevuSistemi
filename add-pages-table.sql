-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_is_active ON pages("isActive");

-- Insert default pages
INSERT INTO pages (id, slug, title, content, "isActive", "createdAt", "updatedAt")
VALUES 
(
  'clpage_hakkimizda_001',
  'hakkimizda',
  'Hakkımızda',
  '<div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Net Randevu Hakkında</h2>
    
    <p class="text-gray-700 leading-relaxed">
      Net Randevu, modern işletmelerin randevu yönetimi ihtiyaçlarını karşılamak üzere tasarlanmış,
      kullanıcı dostu ve güçlü bir platformdur. Amacımız, işletmelerin operasyonel verimliliğini
      artırırken müşteri memnuniyetini maksimize etmektir.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">Misyonumuz</h3>
    <p class="text-gray-700 leading-relaxed">
      Küçük ve orta ölçekli işletmelere, kurumsal kalitede randevu yönetim çözümleri sunarak,
      dijital dönüşüm süreçlerinde onlara destek olmak ve iş süreçlerini kolaylaştırmak.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">Vizyonumuz</h3>
    <p class="text-gray-700 leading-relaxed">
      Türkiye''nin en çok tercih edilen randevu yönetim platformu olmak ve binlerce işletmeye
      hizmet ederek sektöre değer katmak.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">Neden Net Randevu?</h3>
    <ul class="list-disc list-inside space-y-2 text-gray-700">
      <li>7/24 online randevu alma imkanı</li>
      <li>Otomatik hatırlatma sistemi</li>
      <li>Detaylı raporlama ve analiz</li>
      <li>Müşteri yönetimi</li>
      <li>Kolay kullanım ve hızlı kurulum</li>
      <li>Kesintisiz destek hizmeti</li>
    </ul>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">İletişim</h3>
    <p class="text-gray-700 leading-relaxed">
      Sorularınız veya önerileriniz için bizimle iletişime geçmekten çekinmeyin:
      <br><br>
      <strong>E-posta:</strong> info@netrandevu.com
      <br>
      <strong>Destek:</strong> destek@netrandevu.com
    </p>
  </div>',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'clpage_gizlilik_001',
  'gizlilik',
  'Gizlilik Politikası',
  '<div class="space-y-6">
    <p class="text-sm text-gray-600">Son Güncelleme: 31 Ekim 2025</p>

    <h2 class="text-2xl font-bold text-gray-900 mb-4">Gizlilik Politikası</h2>
    
    <p class="text-gray-700 leading-relaxed">
      Net Randevu olarak, kullanıcılarımızın gizliliğini korumak en önemli önceliklerimizdendir.
      Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
      korunduğunu açıklamaktadır.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">1. Toplanan Bilgiler</h3>
    <p class="text-gray-700 leading-relaxed mb-3">
      Hizmetlerimizi kullanırken aşağıdaki bilgiler toplanabilir:
    </p>
    <ul class="list-disc list-inside space-y-2 text-gray-700">
      <li>Ad, soyad ve iletişim bilgileri</li>
      <li>E-posta adresi ve telefon numarası</li>
      <li>İşletme bilgileri</li>
      <li>Randevu geçmişi ve tercihleri</li>
      <li>Ödeme bilgileri (şifreli olarak)</li>
    </ul>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">2. Bilgilerin Kullanımı</h3>
    <p class="text-gray-700 leading-relaxed mb-3">
      Toplanan bilgiler şu amaçlarla kullanılır:
    </p>
    <ul class="list-disc list-inside space-y-2 text-gray-700">
      <li>Randevu yönetimi hizmetlerini sağlamak</li>
      <li>Müşteri desteği sunmak</li>
      <li>Hizmet kalitesini iyileştirmek</li>
      <li>Güvenlik ve dolandırıcılık önleme</li>
      <li>Yasal yükümlülükleri yerine getirmek</li>
    </ul>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">3. Bilgi Güvenliği</h3>
    <p class="text-gray-700 leading-relaxed">
      Kişisel verileriniz, endüstri standardı güvenlik önlemleri ile korunmaktadır:
    </p>
    <ul class="list-disc list-inside space-y-2 text-gray-700">
      <li>SSL/TLS şifreleme</li>
      <li>Güvenli veri merkezleri</li>
      <li>Düzenli güvenlik denetimleri</li>
      <li>Erişim kontrolü ve yetkilendirme</li>
    </ul>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">4. Üçüncü Taraflarla Paylaşım</h3>
    <p class="text-gray-700 leading-relaxed">
      Kişisel bilgileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.
      Sadece hizmet sağlayıcılarımız (ödeme işlemcileri, altyapı sağlayıcıları) ile
      gerekli olan minimum bilgiler paylaşılır.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">5. Çerezler (Cookies)</h3>
    <p class="text-gray-700 leading-relaxed">
      Web sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır.
      Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">6. Kullanıcı Hakları</h3>
    <p class="text-gray-700 leading-relaxed mb-3">
      KVKK kapsamında aşağıdaki haklara sahipsiniz:
    </p>
    <ul class="list-disc list-inside space-y-2 text-gray-700">
      <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
      <li>İşlenmişse bilgi talep etme</li>
      <li>Verilerin düzeltilmesini isteme</li>
      <li>Verilerin silinmesini veya yok edilmesini isteme</li>
      <li>İşleme faaliyetine itiraz etme</li>
    </ul>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">7. Veri Saklama Süresi</h3>
    <p class="text-gray-700 leading-relaxed">
      Kişisel verileriniz, hizmetin sunumu için gerekli olduğu süre boyunca ve yasal
      saklama yükümlülüklerini karşılamak üzere saklanır.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">8. Değişiklikler</h3>
    <p class="text-gray-700 leading-relaxed">
      Bu gizlilik politikası güncellenebilir. Önemli değişiklikler olduğunda
      kullanıcılarımız bilgilendirilecektir.
    </p>

    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">9. İletişim</h3>
    <p class="text-gray-700 leading-relaxed">
      Gizlilik politikamız hakkında sorularınız için:
      <br><br>
      <strong>E-posta:</strong> gizlilik@netrandevu.com
      <br>
      <strong>Adres:</strong> Net Randevu, İstanbul, Türkiye
    </p>
  </div>',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  "updatedAt" = CURRENT_TIMESTAMP;

