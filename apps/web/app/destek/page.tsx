import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yardım & Destek | Net Randevu',
  description: 'Net Randevu yardım merkezi, sık sorulan sorular ve iletişim bilgileri',
};

const faqs = [
  {
    question: 'Nasıl randevu alabilirim?',
    answer: 'Net Randevu uygulamasını indirin, istediğiniz salonu arayın, uygun tarih ve saati seçin, hizmeti ve personeli belirleyerek randevunuzu oluşturun.',
  },
  {
    question: 'Randevumu nasıl iptal edebilirim?',
    answer: 'Uygulamada "Randevularım" bölümüne gidin, iptal etmek istediğiniz randevuyu seçin ve "İptal Et" butonuna tıklayın. İptal politikası işletmeye göre değişebilir.',
  },
  {
    question: 'Randevu hatırlatması alacak mıyım?',
    answer: 'Evet, randevunuzdan önce SMS ve/veya uygulama bildirimi ile hatırlatma alacaksınız.',
  },
  {
    question: 'Paket satın aldım, nasıl kullanabilirim?',
    answer: 'Paketleriniz "Randevularım" bölümünde görüntülenir. Yeni randevu alırken paketinizdeki seansları kullanabilirsiniz.',
  },
  {
    question: 'Hesabımı nasıl silebilirim?',
    answer: 'Hesap silme talebi için destek@netrandevu.com adresine e-posta gönderebilirsiniz. Talebiniz 7 iş günü içinde işleme alınacaktır.',
  },
  {
    question: 'Ödeme güvenli mi?',
    answer: 'Evet, tüm ödemeler SSL şifreleme ile korunmaktadır. Kredi kartı bilgileriniz güvenli ödeme altyapısı üzerinden işlenir ve sistemlerimizde saklanmaz.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
            Yardım & Destek
          </h1>
          <p className="text-purple-100 text-center mt-4">
            Size nasıl yardımcı olabiliriz?
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="mailto:destek@netrandevu.com"
            className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">E-posta Desteği</h3>
              <p className="text-purple-600">destek@netrandevu.com</p>
            </div>
          </a>

          <a
            href="tel:+908501234567"
            className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Telefon Desteği</h3>
              <p className="text-emerald-600">0850 123 45 67</p>
            </div>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Sık Sorulan Sorular
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="bg-white rounded-xl shadow-sm overflow-hidden group"
            >
              <summary className="p-6 cursor-pointer flex items-center justify-between font-medium text-gray-900 hover:bg-gray-50">
                <span>{faq.question}</span>
                <svg
                  className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Additional Help */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Sorunuz hala çözülmedi mi?
          </h3>
          <p className="text-purple-100 mb-6">
            Destek ekibimiz size yardımcı olmak için hazır.
          </p>
          <a
            href="mailto:destek@netrandevu.com?subject=Destek Talebi"
            className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Bize Yazın
          </a>
        </div>

        {/* Back to App */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}
