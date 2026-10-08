# 🛠️ PDF Araçları (Hepsi Bir Arada Tarayıcı İçi PDF Çözümleri)

Modern, hızlı, tamamen ücretsiz ve **%100 istemci tarafında (tarayıcınızda)** çalışan kapsamlı PDF araç kutusu. Hiçbir dosyanız harici bir sunucuya yüklenmez; tüm dönüştürme ve işleme adımları cihazınızın belleğinde güvenle gerçekleştirilir.

---

## 🌐 Canlı Web Uygulaması Adresi
- 👉 **[http://keremcaliskann.github.io/tools/pdf](http://keremcaliskann.github.io/tools/pdf)**
- 👉 **[https://keremcaliskann.github.io/tools/pdf/](https://keremcaliskann.github.io/tools/pdf/)**

---

## ✨ İçerdiği Araçlar ve Özellikler

### 1. 📸 Fotoğrafları PDF'e Dönüştür (Images to PDF)
- **Desteklenen Formatlar:** JPG, JPEG, PNG, WebP, GIF.
- **Toplu Yükleme & Sıralama:** Çoklu fotoğraf seçin, sürükle-bırak veya ok butonlarıyla sayfa sırasını belirleyin.
- **Görsel Döndürme:** Tek tıkla görselleri 90° döndürün.
- **Sayfa Ayarları:**
  - Sayfa Boyutu: A4, Orijinal (resim boyutu), US Letter
  - Yönlendirme: Otomatik, Dikey (Portrait), Yatay (Landscape)
  - Kenar Boşluğu: Boşluksuz (0mm), Dar (5mm), Standart (10mm)
  - Resim Uyumu: Orantılı Sığdır (Fit) veya Doldur (Cover)

### 2. 📑 PDF Dosyalarını Birleştir (Merge PDF)
- Birden fazla PDF belgesini tek bir dosyada birleştirin.
- Dosyaları yukarı/aşağı taşıyarak birleşme sırasını özgürce düzenleyin.
- Dosya boyutu ve sayfa sayısı bilgisiyle anlık önizleme.

### 3. ✂️ PDF Sayfalarını Böl & Çıkar (Split & Extract)
- **Görsel Sayfa Seçimi:** Belgedeki tüm sayfaların küçük resim önizlemelerini görerek tıklayarak seçin.
- **Aralık Belirtme:** `1-3, 5, 8-10` gibi esnek sayfa aralıkları girin.
- **İki Farklı Mod:**
  - Seçili sayfaları tek bir yeni PDF olarak çıkarıp indirin.
  - Veya belgenin tüm sayfalarını tek tek bağımsız PDF'lere bölüp tek tıkla **ZIP arşivi** olarak indirin.

### 4. 🖼️ PDF Sayfalarını Görsele Dönüştür (PDF to Images)
- PDF sayfalarını yüksek çözünürlüklü **PNG** veya **JPG** formatına çevirin.
- 150 DPI, 200 DPI veya 300 DPI (Ultra Net) çözünürlük seçenekleri.
- Sayfaları tek tek görüntüleyip indirin ya da "Tüm Sayfaları ZIP Olarak İndir" seçeneğiyle arşivleyin.

### 5. 🔄 PDF Sayfalarını Düzenle & Döndür (Organize & Rotate)
- PDF içindeki sayfaları kartlar halinde görselleştirin.
- Ters duran sayfaları 90° sağa döndürün.
- İstemediğiniz sayfaları kolayca silin (✕).
- Sayfaların sırasını ileri-geri taşıyın.

### 6. 💧 Filigran ve Sayfa Numarası Ekle (Watermark & Page Numbers)
- Belgenin tüm sayfalarına çapraz (45°) şeffaf metin filigranı ("GİZLİ", "KOPYA", "TASLAK" veya özel metin) ekleyin.
- Ayarlanabilir şeffaflık düzeyi (%15, %30, %55).
- Sayfa altına veya üstüne otomatik sayfa numarası ekleme (Örn: `Sayfa 1 / 10`).

---

## 🔒 Gizlilik ve Sıfır-Sunucu Güvenliği (%100 Zero-Backend)
- Geliştirilen bu uygulama **tamamen istemci tarafında (tarayıcınızda)** çalışır.
- Yüklediğiniz belgeler, fotoğraflar ve oluşturulan PDF dosyaları hiçbir şekilde bir sunucuya gönderilmez veya kaydedilmez.
- İnternet bağlantınızı kesseniz dahi (çevrimdışı / offline) çalışmaya devam eder.
- `index.html` dosyasına çift tıklayarak yerel olarak da doğrudan kullanılabilir.

---

## 💻 Kullanılan Teknolojiler
- **Saf Web Standartları:** HTML5, CSS3 (Modern Değişkenler & Responsive Grid), Vanilla JavaScript (ES6+).
- **[pdf-lib](https://pdf-lib.js.org/):** PDF oluşturma, birleştirme, bölme, sayfaları döndürme ve filigran ekleme motoru.
- **[pdf.js](https://mozilla.github.io/pdf.js/):** PDF sayfalarını tarayıcıda yüksek netlikte canvas üzerine render etme ve görselleştirme.
- **[JSZip](https://stuk.github.io/jszip/):** Çoklu sayfa indirmeleri için anlık istemci taraflı ZIP arşivleme.
- **PWA (Progressive Web App):** Masaüstü ve mobil cihazlara web uygulaması olarak kurulabilirlik (`manifest.json`, `icon.svg`).
