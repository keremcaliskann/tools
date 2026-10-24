# 🛡️ Safe5 — Fabrika Çalışan Geri Bildirim & Analitik Sistemi

> **Canlı Erişim:** 👉 **[https://keremcaliskann.github.io/tools/safe5/](https://keremcaliskann.github.io/tools/safe5/)**

**Safe5**, endüstriyel üretim tesisleri, fabrikalar ve atölyeler için geliştirilmiş; çalışanların TC ve şifre ile giriş yaptığı, birbirine 5S, İSG (İş Sağlığı ve Güvenliği) ve Kaizen odaklı yapıcı geri bildirimler ilettiği, fabrika yönetiminin ise dinamik roller (RBAC) ve analitik paneller üzerinden süreçleri yönettiği **canlı bulut veritabanı (Firebase Firestore) ve Local-First** destekli tam teşekküllü bir fabrika portalıdır.

---

## 🔑 Kullanıcı Girişi & Kimlik Doğrulama (Auth)

Sistemde serbest profil seçimi yerine gerçek kimlik doğrulama bulunur:
- **Giriş Bilgileri:** TC Kimlik No / Sicil No ve Şifre.
- **👑 Varsayılan İlk Yönetici (Admin) Hesabı:**
  - **TC / Sicil No:** `11111111111`
  - **Şifre:** `admin`
  - *(Giriş yaptıktan sonra şifre düzenlenebilir veya yeni yöneticiler/kullanıcılar eklenebilir)*

---

## 🛡️ Dinamik Rol Tabanlı Yetkilendirme (RBAC)

Kullanıcıların yetkileri kişilere tek tek değil, **rollerine** bağlıdır:
1. **Roller & Yetki Matrisi:**
   - 👑 **Yönetici (Admin):** Tüm yetkilere sahiptir.
   - 👷 **Çalışan (Operatör):** Geri bildirim verir ve panoyu izler.
   - 📋 **Hat Lideri / Formen:** Geri bildirim verir ve Kaizen/İSG aksiyon durumlarını yönetir.
   - 🦺 **İSG & Kalite Sorumlusu:** Veri analizi grafiklerini izler ve aksiyonları yönetir.
2. **Anlık Senkron Yetki Güncellemesi:**
   - Yönetici bir rolün yetkilerini güncellediğinde (örneğin "Çalışan" rolüne "Veri Analizi" yetkisi verdiğinde), **bu roldeki tüm çalışanların yetkileri anında güncellenir.**
3. **Rol Bazlı Ekran İzolasyonu:**
   - Kullanıcı giriş yaptığında sadece sahip olduğu rolün izin verdiği ekranları görür. Yetkisiz menüler ve sekmeler tamamen gizlenir.

---

## ☁️ Canlı Bulut Veritabanı (Firebase Firestore)

Fabrikadaki farklı telefonlar, tabletler ve bilgisayarların aynı verileri eşzamanlı görmesi için canlı bulut veritabanı entegrasyonu sunulur:
- **Çok Cihazlı Gerçek Zamanlı Senkron:** Sahadaki bir operatörün telefonundan girdiği geri bildirim, hat liderinin veya amirin ekranında saniyeler içinde belirir.
- **Local-First Fallback:** Firebase henüz bağlanmamışsa veya fabrika ağında internet kesilirse sistem sıfır kesintiyle yerel bellekte (`localStorage`) çalışmaya devam eder.
- **Admin Bulut Ayarları:** Yönetici panelindeki "Bulut Veritabanı" sekmesinden Firebase Config JSON kodu yapıştırılarak 1 dakikada canlı buluta geçilebilir.

---

## 🧭 Ekranlar & Akış

1. 🔐 **Giriş Portalı:** TC ve şifre ile güvenli oturum açma.
2. ✍️ **Geri Bildirim Ver (Ana Sayfa):**
   - Çalışma arkadaşı seçimi, bildirim türü (Takdir, Kaizen, İSG), 5S ilkesi, mesaj, vardiya ve anonimlik seçenekleri.
3. 📬 **Geri Bildirimler Panosu:**
   - Odak kaybı olmadan anlık arama, filtreleme, alkışlama (👏) ve Kaizen/İSG durum yönetimi (`İnceleniyor` ➔ `Aksiyon Alındı` ➔ `Tamamlandı`).
4. 📊 **Veri Analizi (Yetkili Roller):**
   - Kategori dağılımı (Doughnut), departman yoğunluğu (Bar), vardiya dengesi (Polar Area), liderlik listesi ve CSV/JSON dışa aktarma.
5. 👥 **Kullanıcı & Rol Yönetimi (Admin):**
   - Çalışan ekleme, düzenleme, silme ve dinamik rol yetki matrisi.

---

## 📄 Lisans
Bu proje Kerem Çalışkan tarafından açık kaynak felsefesiyle geliştirilmiştir. Tamamen ücretsiz, güvenli ve modülerdir.
