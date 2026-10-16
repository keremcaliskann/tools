# 🛠️ Workshop Araçlar Portalı (Tools Hub)

Bu depo, modern web standartlarıyla geliştirilmiş, **%100 istemci tarafında (tarayıcınızda)** çalışan ve hiçbir sunucu bağımlılığı olmayan web araçları koleksiyonunu barındırır.

---

## 🌐 Canlı Web Uygulamaları

- 🏠 **Ana Araçlar Portalı:** 👉 **[http://keremcaliskann.github.io/tools/](http://keremcaliskann.github.io/tools/)**
- 🛡️ **GüvenliBelge Stüdyosu:** 👉 **[http://keremcaliskann.github.io/tools/guvenli-belge/](http://keremcaliskann.github.io/tools/guvenli-belge/)**
- 📄 **PDF Araçları:** 👉 **[http://keremcaliskann.github.io/tools/pdf/](http://keremcaliskann.github.io/tools/pdf/)**
- 🎓 **MEB BEP Dosyası Hazırlayıcı:** 👉 **[http://keremcaliskann.github.io/tools/bep/](http://keremcaliskann.github.io/tools/bep/)**

---

## 📂 Proje Yapısı

```
tools/
├── index.html               # Araçlar Portalı ana sayfası
├── .nojekyll                # GitHub Pages Jekyll bypass
├── .github/workflows/       # GitHub Pages otomatik dağıtım
│   └── deploy.yml
├── guvenli-belge/           # GüvenliBelge resmi belge & PDF stüdyosu
│   ├── index.html
│   ├── _astro/
│   ├── workers/
│   ├── icon.svg
│   └── manifest.json
├── pdf/                     # PDF Araçları uygulaması
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── icon.svg
│   └── manifest.json
└── bep/                     # MEB BEP Dosyası Hazırlayıcı uygulaması
    ├── index.html
    ├── css/
    ├── js/
    ├── icon.svg
    └── manifest.json
```

---

## 🔒 Güvenlik & Gizlilik
Tüm araçlar sıfır sunucu (Zero-Backend) prensibiyle çalışır. Yüklediğiniz hiçbir dosya veya girdiğiniz hiçbir veri cihazınızdan dışarı çıkmaz.
