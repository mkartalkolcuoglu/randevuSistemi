import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | Net Randevu',
  description: 'Net Randevu gizlilik politikası ve KVKK aydınlatma metni',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
            Gizlilik Politikası
          </h1>
          <p className="text-emerald-100 text-center mt-4">
            Son güncelleme: Ocak 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Giriş</h2>
            <p className="text-gray-600 leading-relaxed">
              Net Randevu olarak, kişisel verilerinizin güvenliği bizim için son derece önemlidir.
              Bu gizlilik politikası, hizmetlerimizi kullanırken toplanan, işlenen ve saklanan
              kişisel verileriniz hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Toplanan Veriler</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hizmetlerimizi kullanırken aşağıdaki kişisel verileriniz toplanabilir:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Ad ve soyad</li>
              <li>Telefon numarası</li>
              <li>E-posta adresi</li>
              <li>Randevu geçmişi ve tercihleri</li>
              <li>Cihaz bilgileri ve IP adresi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Verilerin Kullanım Amacı</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Randevu hizmetlerinin sağlanması</li>
              <li>Kullanıcı hesabının yönetimi</li>
              <li>Randevu hatırlatmaları ve bildirimler</li>
              <li>Müşteri desteği sağlanması</li>
              <li>Hizmet kalitesinin iyileştirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Veri Güvenliği</h2>
            <p className="text-gray-600 leading-relaxed">
              Kişisel verileriniz, endüstri standardı güvenlik önlemleri ile korunmaktadır.
              Verileriniz şifrelenerek saklanmakta ve yetkisiz erişime karşı koruma altına
              alınmaktadır. SSL/TLS şifreleme protokolleri kullanılmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Üçüncü Taraf Paylaşımı</h2>
            <p className="text-gray-600 leading-relaxed">
              Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.
              Randevu aldığınız işletmeler, yalnızca randevu hizmeti için gerekli bilgilere
              erişebilir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. KVKK Kapsamındaki Haklarınız</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Çerezler (Cookies)</h2>
            <p className="text-gray-600 leading-relaxed">
              Web sitemiz ve mobil uygulamamız, kullanıcı deneyimini iyileştirmek için çerezler
              kullanabilir. Çerezler, oturum yönetimi ve tercihlerinizin hatırlanması için
              kullanılmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. İletişim</h2>
            <p className="text-gray-600 leading-relaxed">
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>E-posta:</strong> destek@netrandevu.com
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Politika Değişiklikleri</h2>
            <p className="text-gray-600 leading-relaxed">
              Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler olması
              durumunda kullanıcılarımız bilgilendirilecektir. Politikanın en güncel halini
              bu sayfadan takip edebilirsiniz.
            </p>
          </section>

        </div>

        {/* Back to App */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}
