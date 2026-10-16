# 🛠️ Workshop Araçlar Portalı (Tools Hub)

Bu depo, modern web standartlarıyla geliştirilmiş, **%100 istemci tarafında (tarayıcınızda)** çalışan ve hiçbir sunucu bağımlılığı olmayan web araçları koleksiyonunu barındırır.

---

## 🌐 Canlı Web Uygulamaları

- 🏠 **Ana Araçlar Portalı (Tools Hub):** 👉 **[https://keremcaliskann.github.io/tools/](https://keremcaliskann.github.io/tools/)**
- 🛡️ **DocShield — Belge Gizliliği & PDF Stüdyosu (9 Modül):** 👉 **[https://keremcaliskann.github.io/tools/docshield/](https://keremcaliskann.github.io/tools/docshield/)**
- 🖼️ **ImageStudio — Akıllı Görsel, Vesikalık & QR Stüdyosu (5 Modül):** 👉 **[https://keremcaliskann.github.io/tools/imagestudio/](https://keremcaliskann.github.io/tools/imagestudio/)**
- 🎓 **MEB BEP Dosyası Hazırlayıcı:** 👉 **[https://keremcaliskann.github.io/tools/bep/](https://keremcaliskann.github.io/tools/bep/)**

---

## 📂 Mimari ve Klasör Yapısı

```text
Workshop/                              # Git Repo Kökü (keremcaliskann/tools)
├── index.html                         # Katman 1: Tools Ana Sayfası (/tools/)
├── .nojekyll                          # GitHub Pages Jekyll bypass
├── AGENTS.md & GEMINI.md              # Mimari ve geliştirme kuralları
├── shared/                            # Ortak Tasarım & Navigasyon Sistemi
│   ├── portal-ui.css                  # Ortak Header, Breadcrumb, Footer ve Tema CSS
│   └── portal-ui.js                   # Evrensel Koyu/Açık Tema Senkronizasyonu
├── docshield/                         # Çok Özellikli Proje (/tools/docshield/)
│   ├── index.html                     # Katman 2: DocShield Proje Ana Sayfası
│   ├── kimlik-fotokopisi-filigran-ekleme.html
│   ├── pdf-hassas-bilgi-karartma.html
│   ├── pdf-exif-metadata-temizleme.html
│   ├── e-devlet-pdf-boyut-kucultme-1mb.html
│   ├── kira-sozlesmesi-belge-birlestirme.html
│   ├── fotograftan-resmi-pdf-yapma.html
│   ├── pdf-bolme-sayfa-cikarma.html
│   ├── pdf-sayfa-duzenleme-numaralandirma.html
│   └── pdf-gorsele-donusturme.html
└── bep/                               # Tek Özellikli Proje (/tools/bep/)
    ├── index.html                     # Katman 2: Doğrudan BEP Uygulaması
    ├── css/
    └── js/
```

---

## 🔒 Güvenlik & Gizlilik
Tüm araçlar sıfır sunucu (Zero-Backend) prensibiyle çalışır. Yüklediğiniz hiçbir dosya veya girdiğiniz hiçbir veri cihazınızdan dışarı çıkmaz.
