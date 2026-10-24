# 🛡️ Safe5 — Fabrika Çalışan Geri Bildirim & Analitik Paneli

> **Canlı Erişim:** 👉 **[https://keremcaliskann.github.io/tools/safe5/](https://keremcaliskann.github.io/tools/safe5/)**

**Safe5**, endüstriyel üretim tesisleri, fabrikalar ve atölyeler için geliştirilmiş; çalışanların birbirine 5S, İSG (İş Sağlığı ve Güvenliği), Kaizen ve Takım Ruhu odaklı yapıcı geri bildirimler ilettiği, yetkili yöneticilerin ise bu verileri gerçek zamanlı analiz edebildiği **%100 istemci taraflı (Zero-Backend), ferah ve yumuşak açık renkli (Light-only)** modern bir web uygulamasıdır.

---

## 🌟 Güncel Mimari ve Ekran Yapısı

### 1. ✍️ Geri Bildirim Ver (Ana Sayfa)
Uygulama açıldığında (hem çalışan hem admin için) doğrudan geri bildirim verme formuyla başlar:
- **Alıcı Seçimi:** Çalışma arkadaşlarını arama ve seçme.
- **3 Ana Bildirim Türü:**
  - 🌟 **Takdir & Teşekkür:** Örnek çalışma, vardiya desteği, özveri.
  - 💡 **Kaizen & Öneri:** Süreç iyileştirme, zaman tasarrufu, ergonomi.
  - 🦺 **İSG & Güvenlik:** KKD kullanımı takdiri ve ramak kala uyarısı.
- **5S Değerleri:** İSG, 5S Tertip & Düzen, Kaizen, Kalite ve Takım Ruhu.
- **Özel Takdir Rozetleri:** 🏆 Ayın Yıldızı, 🦺 İSG Öncüsü, 💡 Kaizen Ustası, 🤝 Takım Ruhu, ⚙️ Hızlı Çözüm, 🎯 Sıfır Hata.
- **İsteğe Bağlı Anonimlik:** İsmi gizleyerek yapıcı bildirim gönderme.

### 2. 📬 Geri Bildirimleri İncele (Ayrı Ekran)
- **Filtre Sekmeleri:** Tüm Fabrika Akışı, Bana Gelenler, Benim Gönderdiklerim.
- **Tür ve Arama Filtreleri:** Takdir, Kaizen ve İSG filtreleri, anahtar kelime araması.
- **Yumuşak Kart Tasarımı:** Zaman bilgisi, durum etiketleri ve rozetler.

### 3. 📊 Veri Analizi Ekranı (Yetkilendirilmiş Erişim)
- Yalnızca **"Veri Analizi"** yetkisi verilmiş çalışanlar ve **Admin** tarafından görüntülenebilir.
- **KPI Sayaçları:** Toplam bildirim, takdir oranı, İSG ve Kaizen sayıları.
- **Grafikler:** Kategori dağılımı (Doughnut), departman performansı (Bar), vardiya dengesi (Polar Area), en çok takdir edilenler panosu.
- **Excel / CSV İndir:** Tek tıkla Türkçe Excel uyumlu UTF-8 BOM raporu.

### 4. 👥 Kullanıcı & Yetki Yönetimi (Sadece Admin)
- **Kullanıcı Ekleme:** İsim, departman, görev, vardiya ve yetkiler seçilerek anında yeni personel ekleme.
- **Kullanıcı Silme:** Sistemden personel çıkarma imkanı.
- **Yetki Yönetimi:**
  - `Geri Bildirim Yetkisi`: Tüm kullanıcılarda varsayılan olarak aktiftir.
  - `Veri Analizi Yetkisi`: Admin tarafından tek tıkla checkbox üzerinden atanıp kaldırılabilir.

---

## 🧭 Yan Navigasyon (Sidebar)

Tüm ekranlar arasında geçiş sol taraftaki yumuşak yan menü üzerinden sağlanır:
- ✍️ **Geri Bildirim Ver** *(Ana Sayfa)*
- 📬 **Geri Bildirimler** *(Tüm akış ve kişisel gelen kutusu)*
- 📊 **Veri Analizi** *(Sadece analiz yetkilileri ve Admin)*
- 👥 **Kullanıcı Yönetimi** *(Sadece Admin)*
- 🔄 **Kullanıcı / Rol Değiştirici** *(Sidebar altında tek tıkla profil geçişi)*

---

## 🎨 Tasarım Standartları

- **Açık Renk & Yumuşak Estetik (Light-Only & Soft UI):** Göz yormayan açık zemin (`#f8fafc`), yumuşak gölgeler, ferah kartlar ve pastel rozetler.
- **%100 Sunucusuz (Zero-Backend):** Tüm veriler tarayıcının yerel hafızasında (`localStorage`) güvenle saklanır.

---

## 📄 Lisans
Bu proje Kerem Çalışkan tarafından açık kaynak felsefesiyle geliştirilmiştir. Tamamen ücretsiz, güvenli ve istemci taraflıdır.
