# 📺 TimeToShare — Canlı Ekran Paylaşımı, Ekran Üzeri Çizim & P2P Sohbet

> **Canlı Erişim:** 👉 **[https://keremcaliskann.github.io/tools/timetoshare/](https://keremcaliskann.github.io/tools/timetoshare/)**

**TimeToShare**, hiçbir harici sunucu, veritabanı veya medya sunucusuna ihtiyaç duymadan, %100 doğrudan tarayıcılar arasında (Peer-to-Peer) çalışan modern bir canlı ekran paylaşımı, ekran üzeri ortak canlı çizim (whiteboard / annotation) ve anlık sohbet aracıdır.

---

## 🌟 Öne Çıkan Özellikler

- **🔒 %100 Sunucusuz & Uçtan Uca Şifreli (P2P):** Ekran görüntüsü, ses, çizim hareketleri ve sohbet mesajları hiçbir merkezi sunucuya gitmez; doğrudan cihazdan cihaza şifreli olarak iletilir.
- **⚡ 1 Saniyenin Altında Gecikme:** WebRTC MediaStream teknolojisi sayesinde gerçek zamanlı (sub-second latency) görüntü ve ses aktarımı.
- **✏️ Ekran Üzeri Canlı Çizim (Annotation):**
  - **Kalem (Pen):** Farklı renkler ve kalınlıklarda serbest çizim.
  - **Fosforlu Vurgulayıcı (Highlighter):** Yarı saydam metin ve grafik vurgulama.
  - **🔴 Işıltılı Lazer İşaretçi:** Tıklandığında veya gezdirildiğinde ekranda beliren, 1.2 saniye içinde arkasından otomatik kaybolan dikkat çekme izi.
  - **Silgi & Geri Al (Undo):** Hatalı çizimleri silme veya tek tıkla geri alma.
  - **Ortak Çizim Tahtası:** Hem yayıncı hem izleyici aynı ekranda eşzamanlı çizim yapabilir; koordinatlar normalizasyon formülü ile farklı ekran boyutlarında tam aynı noktada görünür.
- **💬 Canlı P2P Sohbet:** Yan panelde açılıp kapanabilen, bildirim sesli ve okunmamış mesaj sayaçlı anlık sohbet.
- **🔗 Kolay Bağlantı:** Tek tıkla davet linki kopyalama (`?oda=tts-xxxx`).
- **📱 PWA & Masaüstü Desteği:** İster tarayıcıda sekme olarak, ister PWA olarak masaüstüne kurulup tam ekran kullanılabilir.
- **🌓 Koyu / Açık Tema:** Workshop tasarım sistemi ile tam senkronize.

---

## 🛠️ Nasıl Çalışır? (Teknik Mimari)

```mermaid
flowchart LR
    A["💻 Yayıncı (Host)\ngetDisplayMedia()"] -->|WebRTC MediaStream| B["👥 Katılımcı (Guest)\n<video autoplay>"]
    A <-->|WebRTC DataChannel\n(Koordinat & Chat)| B
```

1. **Ekran Yakalama:** `navigator.mediaDevices.getDisplayMedia` API'si ile tarayıcı yerel olarak ekranı, bir pencereyi veya sekmesini yakalar.
2. **Doğrudan Akış:** Yakalanan video ve ses akışı, WebRTC üzerinden doğrudan arkadaşınızın tarayıcısına aktarılır.
3. **Canvas Katmanı:** Videonun tam üstünde yer alan şeffaf `<canvas>` katmanı, kullanıcıların fare/dokunmatik hareketlerini normalize koordinatlara ($x/w$, $y/h$) dönüştürerek DataChannel üzerinden milisaniyeler içinde senkronize eder.
4. **Sıfır Sunucu Sinyalleşmesi:** İlk el sıkışma için PeerJS'in açık broker sunucusu kullanılır; bağlantı kurulduktan sonra sinyal sunucusu devreden çıkar.

---

## 🚀 Kullanım Adımları

1. [https://keremcaliskann.github.io/tools/timetoshare/](https://keremcaliskann.github.io/tools/timetoshare/) adresine gidin.
2. **"Ekranı Paylaş & Oda Başlat"** butonuna tıklayın ve paylaşmak istediğiniz ekranı seçin.
3. Üst barda beliren **"Davet Linkini Kopyala"** butonu ile linki arkadaşınıza gönderin.
4. Arkadaşınız linke tıkladığı anda doğrudan yayını izlemeye başlar.
5. Alt araç çubuğundan kalem, lazer veya fosforlu kalemi seçerek ekran üzerine çizim yapabilir, sağ alttaki sohbet butonundan mesajlaşabilirsiniz.

---

## 📄 Lisans
Bu proje Kerem Çalışkan tarafından açık kaynak felsefesiyle geliştirilmiştir. Tamamen ücretsiz ve istemci taraflıdır.
