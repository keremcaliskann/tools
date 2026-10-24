# 🛡️ Safe5 — Fabrika Çalışan Geri Bildirim & Analitik Paneli

> **Canlı Erişim:** 👉 **[https://keremcaliskann.github.io/tools/safe5/](https://keremcaliskann.github.io/tools/safe5/)**

**Safe5**, endüstriyel üretim tesisleri, fabrikalar ve atölyeler için geliştirilmiş; çalışanların birbirine 5S, İSG (İş Sağlığı ve Güvenliği), Kaizen ve Takım Ruhu odaklı yapıcı geri bildirimler ilettiği, yetkili yöneticilerin ise bu verileri gerçek zamanlı analiz edebildiği **%100 istemci taraflı (Zero-Backend), ferah ve yumuşak açık renkli (Light-only)** modern bir web uygulamasıdır.

---

## 🌟 Gelişmiş Özellikler & Mimari

### 1. ✍️ Geri Bildirim Ver (Ana Sayfa)
Uygulama doğrudan geri bildirim formuyla açılır:
- **Alıcı Seçimi:** Çalışma arkadaşlarını hızlı arama ve seçme.
- **3 Ana Bildirim Türü:**
  - 🌟 **Takdir & Teşekkür:** Örnek çalışma, vardiya desteği, özveri.
  - 💡 **Kaizen & Öneri:** Süreç iyileştirme, zaman tasarrufu, ergonomi.
  - 🦺 **İSG & Güvenlik:** KKD kullanımı takdiri ve ramak kala uyarısı.
- **5S Değerleri:** İSG, 5S Tertip & Düzen, Kaizen, Kalite ve Takım Ruhu.
- **Özel Takdir Rozetleri:** 🏆 Ayın Yıldızı, 🦺 İSG Öncüsü, 💡 Kaizen Ustası, 🤝 Takım Ruhu, ⚙️ Hızlı Çözüm, 🎯 Sıfır Hata.
- **İsteğe Bağlı Anonimlik:** İsmi gizleyerek yapıcı bildirim gönderme.
- **💾 Otomatik Taslak (Auto-Draft):** Form alanlarına yazılan açıklamalar yerel hafızaya kaydedilir; sayfa yenilense veya sekme değişse bile veri kaybı yaşanmaz.
- **🛡️ Çift Tıklama Koruması:** Gönder butonuna tıklandığında mükerrer kayıt oluşmasını engelleyen kilit mekanizması.

### 2. 📬 Geri Bildirimleri İncele (Ayrı Ekran)
- **Akış Filtreleri:** Tüm Fabrika Akışı, Bana Gelenler, Benim Gönderdiklerim.
- **Canlı Arama (Focus Loss Korumalı):** Arama kutusuna yazarken odak kaybı olmadan anında hedefe yönelik filtreleme.
- **👏 Takdir Alkışı (+1 Clap):** Çalışanların panodaki takdirleri ve Kaizen başarılarını alkışlayabileceği sosyal motivasyon butonu.
- **⚙️ Durum Yönetimi (Action Tracker):** Yetkili kullanıcılar ve Admin bildirim durumunu tek tıkla güncelleyebilir (`⏳ İnceleniyor`, `⚙️ Aksiyon Alındı`, `✅ Tamamlandı`).
- **🗑️ Bildirim Silme:** Hatalı veya uygunsuz girdileri Admin tarafından temizleme imkanı.

### 3. 📊 Veri Analizi Ekranı (Yetkilendirilmiş Erişim)
- Yalnızca **"Veri Analizi"** yetkisi verilmiş çalışanlar ve **Admin** tarafından görüntülenebilir.
- **KPI Sayaçları:** Toplam bildirim, takdir oranı, İSG ve Kaizen sayıları.
- **Grafikler (Chart.js + Çevrimdışı Native SVG):** Kategori dağılımı (Doughnut), departman performansı (Bar), vardiya dengesi (Polar Area), en çok takdir edilenler panosu.
- **📥 Excel / CSV İndir:** Tek tıkla Türkçe Excel uyumlu UTF-8 BOM raporu.
- **💾 JSON Yedekleme & Geri Yükleme:** Fabrika veritabanını dışa aktarma ve içe yükleme.

### 4. 👥 Kullanıcı & Yetki Yönetimi (Sadece Admin)
- **Kullanıcı Ekleme & Düzenleme:** Personel ekleme, var olan personelin departman, görev, vardiya ve yetkilerini güncelleme.
- **Kullanıcı Silme:** Ayrılan personeli sistemden çıkarma.
- **Yetki Yönetimi:**
  - `Geri Bildirim Yetkisi`: Tüm kullanıcılarda varsayılan olarak açıktır.
  - `Veri Analizi Yetkisi`: Admin tarafından tek tıkla atanıp kaldırılabilir.

---

## 🧭 Yan Navigasyon (Sidebar) & Mobil Üst Bar

- **Masaüstü & Mobil Senkron:** Üst bardaki profil rozetiyle hem masaüstünde hem mobilde aktif kullanıcı bilgisi ve tek tıkla profil geçişi.
- ✍️ **Geri Bildirim Ver** *(Ana Sayfa)*
- 📬 **Geri Bildirimler** *(Akış, arama ve durum güncelleme)*
- 📊 **Veri Analizi** *(Sadece analiz yetkilileri ve Admin)*
- 👥 **Kullanıcı Yönetimi** *(Sadece Admin)*

---

## 📄 Lisans
Bu proje Kerem Çalışkan tarafından açık kaynak felsefesiyle geliştirilmiştir. Tamamen ücretsiz, güvenli ve istemci taraflıdır.
