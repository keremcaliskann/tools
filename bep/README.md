# 🎓 MEB Uyumlu BEP Dosyası Hazırlayıcı

Millî Eğitim Bakanlığı (MEB) Özel Eğitim Hizmetleri Yönetmeliği standartlarına %100 uyumlu, öğretmenlerin saniyeler içinde **Bireyselleştirilmiş Eğitim Programı (BEP)**, **BEP Toplantı Tutanağı** ve **BEP İzleme-Değerlendirme Formu** hazırlamasını, arşivlemesini ve resmi antetli **Word (.docx)** veya **A4 PDF** olarak çıktı almasını sağlayan web uygulaması.

---

## 🌐 Canlı Web Uygulaması Adresi
- 👉 **[http://keremcaliskann.github.io/tools/bep](http://keremcaliskann.github.io/tools/bep)**
- 👉 **[https://keremcaliskann.github.io/tools/bep/](https://keremcaliskann.github.io/tools/bep/)**

---

## ✨ Neler Üretilebilir? (Tam MEB BEP Dosyası Seti)

1. **📄 BEP Planı (Bireyselleştirilmiş Öğretim Planı - BÖP):**
   - Okul, öğrenci ve aile bilgileri (T.C., Sınıf, No, Anne/Baba, İletişim, Sağlık/Cihaz)
   - Öğrencinin şimdiki eğitsel performans düzeyi
   - Amaç ve Kazanım tablosu (ÜDA, KDA, Süre, Yöntem-Teknik, Araç-Gereç, Değerlendirme & Başarı Ölçütü)
   - Destek Eğitim Odası haftalık ders saatleri & Resmî sınav uyarlamaları (Ek süre, okuyucu vb.)
   - BEP birim kararları ve 6 üyeli resmî imza sirküsü

2. **📋 BEP Geliştirme Birimi Toplantı Tutanağı:**
   - 1. Sene Başı / 2. Ara Dönem / 3. Yıl Sonu toplantı gündem maddeleri
   - Alınan kararlar ve katılımcı imza tablosu

3. **📊 BEP İzleme ve Değerlendirme Formu:**
   - 1. ve 2. Dönem sonu kazanım gerçekleşme düzeyleri (Gerçekleşti / Kısmen / Gerçekleşmedi)
   - Dönem sonu idareye teslim edilecek resmi form

4. **📂 Tam BEP Dosyası İndir:**
   - Yukarıdaki tüm belgeleri tek bir Microsoft Word (`.docx`) belgesi altında birleştiren hepsi bir arada dosya çıktısı!

---

## 🚀 Öne Çıkan Özellikler

- **📚 Hazır Amaç & Kazanım Havuzu (10 Branş):** Türkçe, Matematik, Hayat Bilgisi, Fen Bilimleri, Sosyal Bilgiler, İngilizce, Din Kültürü, Bilişsel Beceriler (ÖÖG/Disleksi), İletişim ve Dil Becerileri (Otizm/OSB), Öz Bakım Becerileri.
- **⚡ Tıkla & Ekle Sınav Tedbirleri:** 15 dk ek süre, ayrı salon, okuyucu, kodlayıcı, büyük punto tek tıkla eklenir.
- **📋 Satır Kontrolleri:** Amaç satırlarını yukarı/aşağı taşıma (▲/▼), tek tıkla çoğaltma (📋) ve silme.
- **⌨️ Hızlı Kısayol:** `Ctrl + S` / `Cmd + S` ile anında yerel kayıt.
- **📱 PWA & Masaüstü Uygulama Desteği:** `manifest.json` ve SVG ikon ile telefona, tablete veya bilgisayara doğrudan yüklenebilir.
- **👁️ Canlı A4 Baskı & PDF:** Tarayıcıdan önizleme yapabilir, her belgeyi ayrı ayrı yazdırabilir veya PDF olarak kaydedebilirsiniz.
- **🔒 %100 KVKK & Gizlilik:** Uygulama tamamen sunucusuzdur (Client-Side). Öğrenci T.C. kimlik veya tanı bilgileri **asla harici bir sunucuya gitmez**, yalnızca kendi tarayıcınızın hafızasında (`localStorage`) saklanır.
- **💾 Çoklu Öğrenci Yönetimi:** Tüm sınıftaki kaynaştırma/özel eğitim öğrencilerinizin planlarını kaydedebilir, düzenleyebilir, tekli veya toplu (`.json`) halinde dışa aktarıp yedekleyebilirsiniz.

---

## 🛠️ Klasör Mimarisi

```text
bep/
├── index.html               # Ana kullanıcı arayüzü ve sekmeli kontrol paneli
├── README.md                # Proje dokümantasyonu ve kullanım rehberi
├── manifest.json            # PWA web uygulaması bildirim dosyası
├── icon.svg                 # Vektörel uygulama ikonu & favicon
├── .nojekyll                # GitHub Pages statik dosya uyumluluk bayrağı
├── css/
│   └── styles.css           # A4 yatay/dikey baskı kuralları ve estetik arayüz stilleri
└── js/
    ├── app.js               # UI etkileşimleri, modal, canlı önizleme ve form denetleyicisi
    ├── storage.js           # LocalStorage öğrenci arşivleme ve JSON yedekleme
    ├── docx-generator.js    # Resmî MEB Word (.docx) çoklu belge üretim motoru
    └── data/
        └── kazanimlar.js    # MEB hazır UDA / KDA amaç kütüphanesi (10 branş)
```
