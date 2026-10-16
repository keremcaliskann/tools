# 🛡️ GüvenliBelge — Cihazdan Çıkmayan Resmî Belge Araç Kutusu

%100 istemci tarafında (tarayıcınızın RAM belleğinde) çalışan, sıfır-sunucu (Zero-Backend) mimarisine sahip, gizlilik odaklı kimlik fotokopisi filigranlama, kalıcı piksel karartma, EXIF meta veri temizleme ve hedef boyutlu PDF sıkıştırma stüdyosu.

---

## 🌐 Canlı Web Uygulaması Bağlantısı
- 👉 **[http://keremcaliskann.github.io/tools/guvenli-belge/](http://keremcaliskann.github.io/tools/guvenli-belge/)**
- 👉 **[https://keremcaliskann.github.io/tools/guvenli-belge/](https://keremcaliskann.github.io/tools/guvenli-belge/)**

---

## ✨ İçerdiği Modüller ve Özellikler

1. **📄 Akıllı Kimlik & Resmî Belge Filigranlama (`/kimlik-fotokopisi-filigran-ekleme.html`):**
   - Kimlik, ehliyet veya pasaport ön ve arka yüzünü A4 sayfasında otomatik hizalama.
   - Bradley-Roth & Floyd-Steinberg yüksek kontrastlı fotokopi/tarama filtresi.
   - Çapraz güvenlik filigranı ve kurum şablonları ("SADECE [KURUM] İÇİNDİR").
   - Doğrudan piksel düzeyinde düzleştirilmiş (flattened) tek sayfalık PDF veya JPG çıktısı.

2. **⬛ Geri Döndürülemez Kalıcı Karartma (`/pdf-hassas-bilgi-karartma.html`):**
   - PDF veya görsel üzerinde dikdörtgen alanlar (TCKN, IBAN vb.) seçerek kalıcı imha.
   - Alttaki metin ve font katmanını tamamen yok eden gerçek rasterize karartma (kopyalanamaz / seçilemez).

3. **🧹 EXIF & PDF Meta Veri Temizleyici (`/pdf-exif-metadata-temizleme.html`):**
   - Belgelerdeki GPS konumları, kamera modelleri ve yazar bilgilerini tarayıcıda sıfırlama.

4. **🗜️ Hedef Boyutlu PDF Sıkıştırıcı (`/e-devlet-pdf-boyut-kucultme-1mb.html`):**
   - Web Worker ikili arama (binary search) ve DCT JPEG kuantizasyonu ile e-Devlet (1 MB), UYAP (2 MB), Konsolosluk (500 KB) sınırlarına tam uyum.

5. **📑 Belge & Fotoğraf Birleştirici (`/kira-sozlesmesi-belge-birlestirme.html`):**
   - Çoklu PDF ve fotoğrafları sürükle-bırak yöntemiyle tek bir resmî PDF altında birleştirme.

6. **🛡️ Sıfır-Sunucu Canlı Gizlilik Kalkanı & PWA:**
   - `PerformanceObserver` ile 0 KB dış veri yüklemesi kanıtı.
   - Service Worker ile %100 çevrimdışı çalışma desteği.
