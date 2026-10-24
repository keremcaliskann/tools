# 🛡️ Safe5 — Fabrika Çalışan Geri Bildirim & Analitik Sistemi

> **Canlı Erişim:** 👉 **[https://keremcaliskann.github.io/tools/safe5/](https://keremcaliskann.github.io/tools/safe5/)**

**Safe5**, endüstriyel üretim tesisleri, fabrikalar ve atölyeler için geliştirilmiş; çalışanların TC/Kullanıcı Adı ve şifre ile giriş yaptığı, birbirine 5S, İSG (İş Sağlığı ve Güvenliği) ve Kaizen odaklı yapıcı geri bildirimler ilettiği, fabrika yönetiminin ise dinamik roller (RBAC), departmanlar, vardiyalar ve analitik paneller üzerinden süreçleri yönettiği **canlı bulut veritabanı (Firebase Firestore) ve Local-First** destekli tam teşekküllü bir fabrika portalıdır.

---

## 🔑 Kullanıcı Girişi & Kimlik Doğrulama (Auth)

Sistemde serbest profil seçimi yerine gerçek kimlik doğrulama bulunur:
- **Giriş Bilgileri:** TC Kimlik No / Kullanıcı Adı ve Şifre.
- **👑 Varsayılan İlk Yönetici (Admin) Hesabı:**
  - **Kullanıcı Adı / TC:** `admin`
  - **Şifre:** `admin`
  - *(Tüm demo kullanıcılar sıfırlanmıştır. İlk girişte sadece admin mevcuttur)*
- **🔑 Şifre Değiştirme:**
  - Giriş yapan her çalışan sağ üstteki kullanıcı profil menüsünden şifresini istediği zaman güncelleyebilir.

---

## 🛡️ Dinamik Rol Tanımlama & Yetkilendirme (RBAC)

Kullanıcıların yetkileri kişilere tek tek değil, **dinamik rollere** bağlıdır:
1. **Sıfırdan Rol Tanımlama:**
   - Önceden belirlenmiş kalıp roller yerine Admin istediği rolü (örn. Operatör, Hat Lideri, İSG Uzmanı, Vardiya Amiri, Bakım Teknisyeni vb.) dinamik olarak oluşturabilir.
   - Her role özel etiket rengi ve detaylı izinler (Geri Bildirim Verme, Tüm Akışı Görme, Analitik İzleme, Durum Yönetimi, Kullanıcı Yönetimi, Rol Yönetimi, Departman Yönetimi, Vardiya Yönetimi) atanabilir.
2. **Anlık Senkron Yetki Güncellemesi:**
   - Bir rolün yetkileri güncellendiğinde, **bu roldeki tüm çalışanların sahip olduğu yetkiler anında güncellenir.**
3. **Rol Bazlı Menü ve Ekran İzolasyonu:**
   - Sol tarafta sabit (sticky) duran navigasyon menüsü, kullanıcının rolüne göre dinamik olarak filtrelenir; yetkisiz menüler ve sekmeler tamamen gizlenir.
4. **Tüm Akış İzni (`view_all_feed`):**
   - Fabrikadaki tüm geri bildirim akışını sadece yetkilendirilmiş roller görebilir. Yetkisi olmayan çalışanlar yalnızca kendilerine gelen veya kendilerinin gönderdiği bildirimleri takip edebilir.

---

## 🏢 Dinamik Departman & Vardiya Yönetimi

- **Gerçekleşen Departman / Bölüm:** Geri bildirim girilirken olayın/aksiyonun gerçekleştiği fabrika birimi seçilebilir.
- **Departman Yönetimi:** Yönetici yetkisine sahip roller fabrikanın departmanlarını (Montaj, Kaynak, Kalite, Lojistik, Bakım vb.) dinamik olarak ekleyip düzenleyebilir.
- **Vardiya Yönetimi:** Vardiya saatleri ve isimleri (08:00 - 16:00, 16:00 - 24:00, 24:00 - 08:00 vb.) dinamik olarak yönetici tarafından tanımlanabilir.

---

## ☁️ Canlı Bulut Veritabanı (Firebase Firestore)

Fabrikadaki farklı telefonlar, tabletler ve bilgisayarların aynı verileri eşzamanlı görmesi için canlı bulut veritabanı entegrasyonu sunulur:
- **Çok Cihazlı Gerçek Zamanlı Senkron:** Sahadaki bir operatörün telefonundan girdiği geri bildirim, hat liderinin veya amirin ekranında saniyeler içinde belirir.
- **Local-First Fallback:** Firebase henüz bağlanmamışsa veya fabrika ağında internet kesilirse sistem sıfır kesintiyle yerel bellekte (`localStorage`) çalışmaya devam eder.
- **Admin Bulut Ayarları:** Yönetici panelindeki "Bulut Veritabanı" sekmesinden Firebase Config JSON kodu yapıştırılarak 1 dakikada canlı buluta geçilebilir.

---

## 🧭 Ekranlar & Akış

1. 🔐 **Giriş Portalı:** TC/Kullanıcı Adı ve şifre ile güvenli oturum açma (`admin` / `admin`).
2. ✍️ **Geri Bildirim Ver (Ana Sayfa):**
   - Çalışma arkadaşı seçimi, gerçekleşen departman seçimi, bildirim türü (Takdir, Kaizen, İSG), 5S ilkesi, mesaj, vardiya ve anonimlik seçenekleri.
3. 📬 **Geri Bildirimler Panosu:**
   - Sabit yan menüyle akıcı gezinti, odak kaybı olmadan anlık arama, sekmeler (Tüm Akış [yetkili], Bana Gelenler, Gönderdiklerim), alkışlama (👏) ve Kaizen/İSG durum yönetimi.
4. 📊 **Veri Analizi (Yetkili Roller):**
   - Kategori dağılımı (Doughnut), departman yoğunluğu (Bar), vardiya dengesi (Polar Area), liderlik listesi ve CSV/JSON dışa aktarma.
5. 👥 **Kullanıcı & Rol Yönetimi (Admin / Yetkili):**
   - Çalışan ekleme, düzenleme, silme ve dinamik rol yetki matrisi oluşturma.
6. 🏢 **Departman & Vardiya Tanımları (Yönetici):**
   - Fabrika birimleri ve vardiya çalışma saatlerinin dinamik yönetimi.

---

## 📄 Lisans
Bu proje Kerem Çalışkan tarafından açık kaynak felsefesiyle geliştirilmiştir. Tamamen ücretsiz, güvenli ve modülerdir.
