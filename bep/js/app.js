// Ana Uygulama Mantığı (UI Etkileşimleri, Çoklu Belge Çıktısı, Canlı Önizleme & Arşiv)

let aktifPlanId = null;
let aktifBaskiBelgesi = "plan"; // "plan" | "tutanak" | "izleme"

// Sayfa yüklendiğinde çalışacak başlangıç işlemleri
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelectorAll("#tabloGovde tr").length === 0) {
    satirEkle();
  }

  ogrencileriListele();
  kazanimKategorileriniDoldur();
  taslakKontrolEt();

  // Form değişikliklerini dinle ve taslak kaydet
  document.getElementById("bepForm").addEventListener("input", debounce(() => {
    const data = formuTopla();
    BepStorage.saveDraft(data);
    aktifBannerGuncelle();
  }, 1000));

  // Klavye Kısayolu (Ctrl+S / Cmd+S ile Kaydet)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      planiKaydet();
    }
  });
});

// Aktif Düzenlenen Öğrenci Bildirimini Güncelle
function aktifBannerGuncelle() {
  const banner = document.getElementById("aktifDuzenlemeBanner");
  const etiket = document.getElementById("aktifOgrenciEtiketi");
  if (!banner || !etiket) return;
  const isim = (document.getElementById("ogrenciAdi")?.value || "").trim();
  if (aktifPlanId && isim) {
    banner.classList.remove("hidden");
    etiket.textContent = isim;
  } else {
    banner.classList.add("hidden");
  }
}

// Dinamik Tablo Satırı Ekleme
function satirEkle(uda = "", kda = "", tarih = "", yontem = "Doğrudan Öğretim, Model Olma, Basamaklandırılmış Yöntem", arac = "Ders Kitabı, Çalışma Yaprağı, Somut Materyaller", deg = "%80 Başarı Ölçütü / Gözlem Formu") {
  const tbody = document.getElementById("tabloGovde");
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50 transition border-b border-slate-200 group";
  tr.innerHTML = `
    <td class="p-2"><textarea rows="2" class="uda w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Uzun Dönemli Amaç">${uda}</textarea></td>
    <td class="p-2"><textarea rows="2" class="kda w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Kısa Dönemli Amaç">${kda}</textarea></td>
    <td class="p-2"><input type="text" class="tarih w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" value="${tarih}" placeholder="Örn: Ekim - Kasım" /></td>
    <td class="p-2">
      <textarea rows="2" class="yontem w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500">${yontem}</textarea>
    </td>
    <td class="p-2">
      <textarea rows="2" class="arac w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500">${arac}</textarea>
    </td>
    <td class="p-2">
      <textarea rows="2" class="degerlendirme w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500">${deg}</textarea>
    </td>
    <td class="p-2 text-center whitespace-nowrap">
      <div class="flex items-center justify-center gap-1">
        <button type="button" onclick="satirTasi(this, 'yukari')" class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition" title="Yukarı Taşı">▲</button>
        <button type="button" onclick="satirTasi(this, 'asagi')" class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition" title="Aşağı Taşı">▼</button>
        <button type="button" onclick="satirKopyala(this)" class="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition" title="Satırı Çoğalt">📋</button>
        <button type="button" onclick="satirSil(this)" class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition" title="Satırı Sil">🗑️</button>
      </div>
    </td>
  `;
  tbody.appendChild(tr);
}

// Satır Sil
function satirSil(btn) {
  const row = btn.closest("tr");
  const tbody = document.getElementById("tabloGovde");
  if (tbody.querySelectorAll("tr").length <= 1) {
    if (confirm("Tablodaki son satırı temizlemek istiyor musunuz?")) {
      row.querySelectorAll("textarea, input").forEach(el => el.value = "");
    }
    return;
  }
  row.remove();
}

// Satır Taşı
function satirTasi(btn, yon) {
  const row = btn.closest("tr");
  if (yon === "yukari") {
    const prev = row.previousElementSibling;
    if (prev) row.parentNode.insertBefore(row, prev);
  } else if (yon === "asagi") {
    const next = row.nextElementSibling;
    if (next) row.parentNode.insertBefore(next, row);
  }
}

// Satır Kopyala
function satirKopyala(btn) {
  const tr = btn.closest("tr");
  satirEkle(
    tr.querySelector(".uda").value,
    tr.querySelector(".kda").value,
    tr.querySelector(".tarih").value,
    tr.querySelector(".yontem").value,
    tr.querySelector(".arac").value,
    tr.querySelector(".degerlendirme").value
  );
  bildirimGoster("Satır kopyalandı ve eklendi.", "info");
}

// Hızlı Rozet Ekleme Fonksiyonları
function hizliTedbirEkle(metin) {
  const textarea = document.getElementById("sinavTedbirleri");
  const current = textarea.value.trim();
  const madde = `- ${metin}`;
  if (current.includes(metin)) {
    bildirimGoster("Bu sınav tedbiri zaten ekli.", "warning");
    return;
  }
  textarea.value = current ? `${current}\n${madde}` : madde;
  bildirimGoster(`"${metin}" sınav tedbirlerine eklendi.`, "success");
}

function hizliDestekEkle(metin) {
  const textarea = document.getElementById("destekEgitim");
  const current = textarea.value.trim();
  textarea.value = current ? `${current}\n- ${metin}` : `- ${metin}`;
  bildirimGoster(`Destek eğitim bilgisi eklendi.`, "success");
}

// Sekmeler Arası Geçiş
function sekmeDegistir(sekmeAdi) {
  const formView = document.getElementById("formView");
  const baskiView = document.getElementById("baskiView");
  const ogrencilerView = document.getElementById("ogrencilerView");

  const tabBtnForm = document.getElementById("tabBtnForm");
  const tabBtnBaski = document.getElementById("tabBtnBaski");
  const tabBtnOgrenciler = document.getElementById("tabBtnOgrenciler");

  [tabBtnForm, tabBtnBaski, tabBtnOgrenciler].forEach(btn => {
    btn.className = "px-4 py-2 text-sm font-semibold text-blue-200 hover:text-white border-b-2 border-transparent transition flex items-center gap-2";
  });

  formView.classList.add("hidden");
  baskiView.classList.add("hidden");
  ogrencilerView.classList.add("hidden");

  if (sekmeAdi === "form") {
    formView.classList.remove("hidden");
    tabBtnForm.className = "px-4 py-2 text-sm font-bold text-white border-b-2 border-white transition flex items-center gap-2";
  } else if (sekmeAdi === "baski") {
    baskiOnizlemeGuncelle();
    baskiView.classList.remove("hidden");
    tabBtnBaski.className = "px-4 py-2 text-sm font-bold text-white border-b-2 border-white transition flex items-center gap-2";
  } else if (sekmeAdi === "ogrenciler") {
    ogrencileriListele();
    ogrencilerView.classList.remove("hidden");
    tabBtnOgrenciler.className = "px-4 py-2 text-sm font-bold text-white border-b-2 border-white transition flex items-center gap-2";
  }
}

// Baskı Önizlemesinde Belge Türü Değiştir
function baskiBelgeTuruDegistir(tur) {
  aktifBaskiBelgesi = tur;
  const btnPlan = document.getElementById("btnBaskiPlan");
  const btnTutanak = document.getElementById("btnBaskiTutanak");
  const btnIzleme = document.getElementById("btnBaskiIzleme");

  [btnPlan, btnTutanak, btnIzleme].forEach(b => {
    if (b) b.className = "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition";
  });

  if (tur === "plan" && btnPlan) btnPlan.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm transition";
  if (tur === "tutanak" && btnTutanak) btnTutanak.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm transition";
  if (tur === "izleme" && btnIzleme) btnIzleme.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm transition";

  baskiOnizlemeGuncelle();
}

// Form Verilerini Topla
function formuTopla() {
  const kazanimlar = [];
  document.querySelectorAll("#tabloGovde tr").forEach(tr => {
    const uda = tr.querySelector(".uda")?.value || "";
    const kda = tr.querySelector(".kda")?.value || "";
    if (uda.trim() || kda.trim()) {
      kazanimlar.push({
        uda,
        kda,
        tarih: tr.querySelector(".tarih")?.value || "",
        yontem: tr.querySelector(".yontem")?.value || "",
        arac: tr.querySelector(".arac")?.value || "",
        deg: tr.querySelector(".degerlendirme")?.value || ""
      });
    }
  });

  return {
    id: aktifPlanId,
    okulAdi: document.getElementById("okulAdi").value,
    egitimYili: document.getElementById("egitimYili").value,
    donem: document.getElementById("donem").value,
    dersAdi: document.getElementById("dersAdi").value,
    ogrenciAdi: document.getElementById("ogrenciAdi").value,
    tcNo: document.getElementById("tcNo").value,
    sinifSube: document.getElementById("sinifSube").value,
    dogumTarihi: document.getElementById("dogumTarihi").value,
    taniTuru: document.getElementById("taniTuru").value,
    ramRapor: document.getElementById("ramRapor").value,
    bepBaslangic: document.getElementById("bepBaslangic").value,
    bepBitis: document.getElementById("bepBitis").value,
    anneAdi: document.getElementById("anneAdi")?.value || "",
    babaAdi: document.getElementById("babaAdi")?.value || "",
    veliTel: document.getElementById("veliTel")?.value || "",
    saglikCihaz: document.getElementById("saglikCihaz")?.value || "",
    toplantiNo: document.getElementById("toplantiNo")?.value || "1. Toplantı (Sene Başı BEP Hazırlama)",
    toplantiTarihi: document.getElementById("toplantiTarihi")?.value || "",
    toplantiYeri: document.getElementById("toplantiYeri")?.value || "Rehberlik Servisi / BEP Odası",
    egitselPerformans: document.getElementById("egitselPerformans").value,
    destekEgitim: document.getElementById("destekEgitim").value,
    sinavTedbirleri: document.getElementById("sinavTedbirleri").value,
    birimKararlari: document.getElementById("birimKararlari").value,
    imzaDersOgr: document.getElementById("imzaDersOgr").value,
    imzaSinifOgr: document.getElementById("imzaSinifOgr").value,
    imzaRehberlik: document.getElementById("imzaRehberlik").value,
    imzaOzelEgitim: document.getElementById("imzaOzelEgitim").value,
    imzaVeli: document.getElementById("imzaVeli").value,
    imzaMudur: document.getElementById("imzaMudur").value,
    kazanimlar
  };
}

// Formu Doldur
function formuDoldur(data) {
  aktifPlanId = data.id || null;
  document.getElementById("okulAdi").value = data.okulAdi || "";
  document.getElementById("egitimYili").value = data.egitimYili || "2026-2027";
  document.getElementById("donem").value = data.donem || "1. ve 2. Dönem (Yıllık)";
  document.getElementById("dersAdi").value = data.dersAdi || "";
  document.getElementById("ogrenciAdi").value = data.ogrenciAdi || "";
  document.getElementById("tcNo").value = data.tcNo || "";
  document.getElementById("sinifSube").value = data.sinifSube || "";
  document.getElementById("dogumTarihi").value = data.dogumTarihi || "";
  document.getElementById("taniTuru").value = data.taniTuru || "";
  document.getElementById("ramRapor").value = data.ramRapor || "";
  document.getElementById("bepBaslangic").value = data.bepBaslangic || "";
  document.getElementById("bepBitis").value = data.bepBitis || "";
  
  if (document.getElementById("anneAdi")) document.getElementById("anneAdi").value = data.anneAdi || "";
  if (document.getElementById("babaAdi")) document.getElementById("babaAdi").value = data.babaAdi || "";
  if (document.getElementById("veliTel")) document.getElementById("veliTel").value = data.veliTel || "";
  if (document.getElementById("saglikCihaz")) document.getElementById("saglikCihaz").value = data.saglikCihaz || "";
  if (document.getElementById("toplantiNo")) document.getElementById("toplantiNo").value = data.toplantiNo || "1. Toplantı (Sene Başı BEP Hazırlama)";
  if (document.getElementById("toplantiTarihi")) document.getElementById("toplantiTarihi").value = data.toplantiTarihi || "";
  if (document.getElementById("toplantiYeri")) document.getElementById("toplantiYeri").value = data.toplantiYeri || "Rehberlik Servisi / BEP Odası";

  document.getElementById("egitselPerformans").value = data.egitselPerformans || "";
  document.getElementById("destekEgitim").value = data.destekEgitim || "";
  document.getElementById("sinavTedbirleri").value = data.sinavTedbirleri || "";
  document.getElementById("birimKararlari").value = data.birimKararlari || "";
  document.getElementById("imzaDersOgr").value = data.imzaDersOgr || "";
  document.getElementById("imzaSinifOgr").value = data.imzaSinifOgr || "";
  document.getElementById("imzaRehberlik").value = data.imzaRehberlik || "";
  document.getElementById("imzaOzelEgitim").value = data.imzaOzelEgitim || "";
  document.getElementById("imzaVeli").value = data.imzaVeli || "";
  document.getElementById("imzaMudur").value = data.imzaMudur || "";

  const tbody = document.getElementById("tabloGovde");
  tbody.innerHTML = "";

  if (data.kazanimlar && data.kazanimlar.length > 0) {
    data.kazanimlar.forEach(k => {
      satirEkle(k.uda, k.kda, k.tarih, k.yontem, k.arac, k.deg);
    });
  } else {
    satirEkle();
  }
}

// Yeni Boş Plan
function yeniPlanBaslat() {
  if (confirm("Yeni bir BEP planı başlatmak istediğinize emin misiniz? Kaydedilmemiş değişiklikler kaybolabilir.")) {
    aktifPlanId = null;
    document.getElementById("bepForm").reset();
    document.getElementById("tabloGovde").innerHTML = "";
    satirEkle();
    BepStorage.clearDraft();
    aktifBannerGuncelle();
    bildirimGoster("Yeni boş plan hazırlandı.", "info");
    sekmeDegistir("form");
  }
}

// Örnek Bilgilerle Doldur
function hizliDoldur() {
  formuDoldur({
    okulAdi: "Mustafa Kemal Atatürk Ortaokulu",
    egitimYili: "2026-2027",
    donem: "1. ve 2. Dönem (Yıllık)",
    dersAdi: "Matematik",
    ogrenciAdi: "Kerem Arda Şen",
    tcNo: "12345678901",
    sinifSube: "5/C - No: 412",
    dogumTarihi: "15.04.2014",
    taniTuru: "Özel Öğrenme Güçlüğü (Diskalkuli & Disleksi)",
    ramRapor: "2026/894 - 12.09.2026",
    bepBaslangic: "01.10.2026",
    bepBitis: "15.06.2027",
    anneAdi: "Emel Şen",
    babaAdi: "Murat Şen",
    veliTel: "0555 123 45 67",
    saglikCihaz: "Dinlendirici Gözlük",
    toplantiNo: "1. Toplantı (Sene Başı BEP Hazırlama)",
    toplantiTarihi: "05.10.2026",
    toplantiYeri: "Rehberlik ve Psikolojik Danışma Servisi",
    egitselPerformans: "Öğrenci 1'den 20'ye kadar birer ritmik sayabilmektedir. Sayıların sembolik yazımını modelden bakarak yazabilir. Ancak 20'den büyük sayılarda ritmik saymada zorlanmakta, iki basamaklı sayıları karşılaştırmakta ve eldeli/eldesiz toplama-çıkarma işlemlerinde basamak kavramını karıştırmaktadır. Somut materyal desteği sağlandığında yönergeleri kolay kavramaktadır.",
    destekEgitim: "Haftada 4 (Dört) ders saati Destek Eğitim Odasında Matematik eğitimi alacaktır.",
    sinavTedbirleri: "- Yazılı sınavlarda 15 dakika ek süre verilmesi.\n- Soru sayısının azaltılması ve soruların somut/kısa adımlı hazırlanması.\n- Sınav esnasında okuyucu ve gerektiğinde kodlayıcı desteği sağlanması.\n- Ayrı salonda sınava alınması.\n- Büyük punto (16 punto) soru kağıdı hazırlanması.",
    birimKararlari: "Öğrencinin eğitsel değerlendirme raporu ve ders içi performans gözlemleri doğrultusunda hazırlanan BEP planı oy birliği ile kabul edilmiştir. Gelişimi her dönem sonunda BEP birimince yeniden değerlendirilecektir.",
    imzaDersOgr: "Zeynep Kaya (Matematik Öğr.)",
    imzaSinifOgr: "Murat Demir (5/C Rehber Öğr.)",
    imzaRehberlik: "Ayşe Çelik (Rehber Öğr. / Psk. Dan.)",
    imzaOzelEgitim: "Fatma Yıldız (Özel Eğitim Öğr.)",
    imzaVeli: "Emel Şen (Veli)",
    imzaMudur: "Hasan Yılmaz (Okul Müdürü)",
    kazanimlar: [
      {
        uda: "Doğal sayılarla işlem yapabilme becerisi kazanır.",
        kda: "1'den 20'ye kadar olan doğal sayıları somut materyallerle eşleştirir ve ikişer ritmik sayar.",
        tarih: "Ekim - Kasım",
        yontem: "Doğrudan Öğretim, Model Olma",
        arac: "Sayı Çubukları, Abaküs, Sayı Kartları",
        deg: "%80 Başarı Ölçütü / Gözlem Formu"
      },
      {
        uda: "Doğal sayılarla temel toplama ve çıkarma işlemlerini yapar.",
        kda: "Toplamları 20'yi geçmeyen iki basamaklı/tek basamaklı sayıları nesneler yardımıyla toplar.",
        tarih: "Aralık - Ocak",
        yontem: "Basamaklandırılmış Öğretim, Pekiştirme",
        arac: "Sayma Blokları, Çalışma Föyleri",
        deg: "%80 Başarı Ölçütü / Performans Görevi"
      },
      {
        uda: "Paralarımızı ve temel geometrik şekilleri tanır.",
        kda: "Kullandığımız kâğıt ve madeni paraları tanır ve değerini söyler.",
        tarih: "Şubat - Mart",
        yontem: "Gerçek Yaşam Materyalleri, Drama",
        arac: "Oyuncak Paralar, Fiyat Etiketleri",
        deg: "%85 Başarı Ölçütü / Kontrol Listesi"
      }
    ]
  });
  aktifBannerGuncelle();
  bildirimGoster("Örnek MEB BEP dosyası yüklendi.", "success");
}

// Planı Kaydet
function planiKaydet() {
  const data = formuTopla();
  if (!data.ogrenciAdi) {
    alert("Lütfen en azından Öğrenci Adı Soyadı alanını doldurun.");
    return;
  }

  const res = BepStorage.save(data);
  if (res.success) {
    aktifPlanId = res.plan.id;
    aktifBannerGuncelle();
    bildirimGoster(`"${data.ogrenciAdi}" için BEP dosyası başarıyla kaydedildi!`, "success");
    ogrencileriListele();
  } else {
    alert("Kaydedilirken bir hata oluştu: " + res.error);
  }
}

// Kayıtlı Öğrencileri Listele
function ogrencileriListele(filtreMetni = "") {
  let list = BepStorage.getAll();
  const container = document.getElementById("ogrenciListesiContainer");
  const sayiBadge = document.getElementById("kayitliOgrenciSayisi");
  if (sayiBadge) sayiBadge.textContent = list.length;

  if (filtreMetni.trim() !== "") {
    const q = filtreMetni.toLowerCase();
    list = list.filter(item => 
      (item.ogrenciAdi && item.ogrenciAdi.toLowerCase().includes(q)) ||
      (item.dersAdi && item.dersAdi.toLowerCase().includes(q)) ||
      (item.sinifSube && item.sinifSube.toLowerCase().includes(q)) ||
      (item.taniTuru && item.taniTuru.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        <p class="text-sm font-medium">Kayıtlı öğrenci planı bulunamadı.</p>
        <p class="text-xs text-slate-400 mt-1">${filtreMetni ? 'Arama kriterinize uygun sonuç yok.' : 'Formu doldurduktan sonra "Öğrenciyi Kaydet" butonuna basarak arşivleyebilirsiniz.'}</p>
      </div>
    `;
    return;
  }

  let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;
  list.forEach(item => {
    const tarih = item.guncellenmeTarihi ? new Date(item.guncellenmeTarihi).toLocaleDateString("tr-TR") : "-";
    html += `
      <div class="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">${item.dersAdi || "Genel"}</span>
            <span class="text-[11px] text-slate-400">${tarih}</span>
          </div>
          <h3 class="font-bold text-slate-800 text-base mb-1">${item.ogrenciAdi || "İsimsiz Öğrenci"}</h3>
          <p class="text-xs text-slate-500 mb-1">${item.sinifSube || "-"} • ${item.okulAdi || "Okul belirtilmedi"}</p>
          <p class="text-xs text-slate-600 line-clamp-1"><strong>Tanı:</strong> ${item.taniTuru || "-"}</p>
          <p class="text-xs text-slate-400 mt-2">Kazanım: ${item.kazanimlar?.length || 0} adet</p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <button type="button" onclick="ogrenciYukle('${item.id}')" class="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition text-center">
              Düzenle / Aç
            </button>
            <button type="button" onclick="ogrenciTamDosyaIndir('${item.id}')" class="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1" title="Tam BEP Dosyası İndir (.docx)">
              📂 Tam Dosya
            </button>
            <button type="button" onclick="BepStorage.exportSinglePlanToJson('${item.id}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition" title="Bu Öğrencinin Planını JSON Olarak İndir">
              📥
            </button>
            <button type="button" onclick="ogrenciSil('${item.id}')" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition" title="Sil">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// Öğrenci Yükle
function ogrenciYukle(id) {
  const item = BepStorage.getById(id);
  if (item) {
    formuDoldur(item);
    aktifBannerGuncelle();
    sekmeDegistir("form");
    bildirimGoster(`"${item.ogrenciAdi}" planı yüklendi.`, "info");
  }
}

// Tam Dosya İndir (Öğrenci Kartından)
function ogrenciTamDosyaIndir(id) {
  const item = BepStorage.getById(id);
  if (item) {
    BepDocxGenerator.generateFullFolder(item);
  }
}

// Öğrenci Sil
function ogrenciSil(id) {
  const item = BepStorage.getById(id);
  if (confirm(`"${item?.ogrenciAdi || 'Bu öğrenci'}" planını silmek istediğinize emin misiniz?`)) {
    BepStorage.delete(id);
    ogrencileriListele();
    bildirimGoster("Öğrenci kaydı silindi.", "warning");
  }
}

// Word (.docx) İndir Tetikleyicileri
function docxIndir() {
  const data = formuTopla();
  BepDocxGenerator.generatePlan(data);
}

function docxTutanakIndir() {
  const data = formuTopla();
  BepDocxGenerator.generateTutanak(data);
}

function docxIzlemeIndir() {
  const data = formuTopla();
  BepDocxGenerator.generateIzleme(data);
}

function docxTamDosyaIndir() {
  const data = formuTopla();
  BepDocxGenerator.generateFullFolder(data);
}

// Canlı A4 Baskı Önizlemesini Güncelle
function baskiOnizlemeGuncelle() {
  const d = formuTopla();
  const c = document.getElementById("baskiIcerik");

  if (aktifBaskiBelgesi === "tutanak") {
    c.className = "a4-preview-page portrait-page print-portrait border border-slate-300"; // Dikey A4
    c.innerHTML = buildTutanakHtml(d);
  } else if (aktifBaskiBelgesi === "izleme") {
    c.className = "a4-preview-page print-landscape border border-slate-300"; // Yatay A4
    c.innerHTML = buildIzlemeHtml(d);
  } else {
    c.className = "a4-preview-page print-landscape border border-slate-300"; // Yatay A4
    c.innerHTML = buildPlanHtml(d);
  }
}

// 1. BEP Planı HTML Şablonu
function buildPlanHtml(d) {
  let kazanimHtml = "";
  if (d.kazanimlar && d.kazanimlar.length > 0) {
    d.kazanimlar.forEach(k => {
      kazanimHtml += `
        <tr class="border-b border-black">
          <td class="p-2 border-r border-black align-top">${k.uda ? k.uda.replace(/\n/g, "<br>") : "-"}</td>
          <td class="p-2 border-r border-black align-top">${k.kda ? k.kda.replace(/\n/g, "<br>") : "-"}</td>
          <td class="p-2 border-r border-black text-center align-top whitespace-nowrap">${k.tarih || "-"}</td>
          <td class="p-2 border-r border-black align-top">${k.yontem ? k.yontem.replace(/\n/g, "<br>") : "-"}</td>
          <td class="p-2 border-r border-black align-top">${k.arac ? k.arac.replace(/\n/g, "<br>") : "-"}</td>
          <td class="p-2 align-top">${k.deg ? k.deg.replace(/\n/g, "<br>") : "-"}</td>
        </tr>
      `;
    });
  } else {
    kazanimHtml = `<tr><td colspan="6" class="p-4 text-center">Amaç veya kazanım girilmedi.</td></tr>`;
  }

  const veliStr = (d.anneAdi ? `Anne: ${d.anneAdi} ` : "") + (d.babaAdi ? `Baba: ${d.babaAdi} ` : "") + (d.veliTel ? `Tel: ${d.veliTel}` : "");

  return `
    <div class="text-center font-bold text-slate-900 mb-3">
      <div class="text-sm">T.C.</div>
      <div class="text-base uppercase tracking-wider">MİLLÎ EĞİTİM BAKANLIĞI</div>
      <div class="text-lg uppercase text-blue-900 font-extrabold">${(d.okulAdi || "OKUL ADI BELİRTİLMEDİ").toUpperCase()}</div>
      <div class="text-sm mt-1 text-slate-800 font-bold">${d.egitimYili} EĞİTİM ÖĞRETİM YILI BİREYSELLEŞTİRİLMİŞ EĞİTİM PROGRAMI (BEP) PLANI</div>
    </div>

    <!-- 1. Öğrenci Bilgileri -->
    <div class="font-bold text-xs uppercase text-slate-800 mb-1">1. ÖĞRENCİ VE OKUL BİLGİLERİ</div>
    <table class="w-full text-xs border border-black border-collapse mb-3">
      <tr class="border-b border-black">
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black w-1/4">Öğrencinin Adı Soyadı:</td>
        <td class="p-1.5 border-r border-black w-1/4 font-semibold">${d.ogrenciAdi || "-"}</td>
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black w-1/4">T.C. Kimlik No:</td>
        <td class="p-1.5 w-1/4">${d.tcNo || "-"}</td>
      </tr>
      <tr class="border-b border-black">
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">Sınıfı / Şubesi & No:</td>
        <td class="p-1.5 border-r border-black">${d.sinifSube || "-"}</td>
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">Doğum Tarihi:</td>
        <td class="p-1.5">${d.dogumTarihi || "-"}</td>
      </tr>
      <tr class="border-b border-black">
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">Eğitsel Tanı / Yetersizlik:</td>
        <td class="p-1.5 border-r border-black">${d.taniTuru || "-"}</td>
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">RAM Rapor No & Tarih:</td>
        <td class="p-1.5">${d.ramRapor || "-"}</td>
      </tr>
      <tr class="border-b border-black">
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">Veli & İletişim:</td>
        <td class="p-1.5 border-r border-black">${veliStr || "-"}</td>
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">Cihaz / Sağlık:</td>
        <td class="p-1.5">${d.saglikCihaz || "Bulunmuyor"}</td>
      </tr>
      <tr>
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">Ders / Gelişim Alanı:</td>
        <td class="p-1.5 border-r border-black font-semibold">${d.dersAdi || "-"}</td>
        <td class="p-1.5 font-bold bg-slate-100 border-r border-black">BEP Süresi & Dönem:</td>
        <td class="p-1.5">${(d.bepBaslangic || "-")} / ${(d.bepBitis || "-")} (${d.donem})</td>
      </tr>
    </table>

    <!-- 2. Eğitsel Performans -->
    <div class="font-bold text-xs uppercase text-slate-800 mb-1">2. ÖĞRENCİNİN ŞİMDİKİ EĞİTSEL PERFORMANS DÜZEYİ</div>
    <div class="p-2 border border-black text-xs leading-relaxed mb-3 bg-white">
      ${d.egitselPerformans ? d.egitselPerformans.replace(/\n/g, "<br>") : "Belirtilmedi."}
    </div>

    <!-- 3. BEP Amaç ve Kazanım Tablosu -->
    <div class="font-bold text-xs uppercase text-slate-800 mb-1">3. ${(d.dersAdi || "DERS").toUpperCase()} DERSİ BİREYSELLEŞTİRİLMİŞ ÖĞRETİM PLANI (KAZANIM TABLOSU)</div>
    <table class="w-full text-xs border border-black border-collapse mb-3">
      <thead>
        <tr class="bg-slate-100 border-b border-black text-center font-bold">
          <th class="p-1.5 border-r border-black w-[22%]">Uzun Dönemli Amaç (ÜDA)</th>
          <th class="p-1.5 border-r border-black w-[28%]">Kısa Dönemli Amaçlar (KDA)</th>
          <th class="p-1.5 border-r border-black w-[12%]">Süre / Tarih</th>
          <th class="p-1.5 border-r border-black w-[14%]">Yöntem ve Teknikler</th>
          <th class="p-1.5 border-r border-black w-[12%]">Araç ve Gereçler</th>
          <th class="p-1.5 w-[12%]">Değerlendirme</th>
        </tr>
      </thead>
      <tbody>
        ${kazanimHtml}
      </tbody>
    </table>

    <!-- 4. Destek Eğitim & Sınav Uyarlamaları -->
    <div class="font-bold text-xs uppercase text-slate-800 mb-1">4. DESTEK EĞİTİM HİZMETLERİ VE SINAV UYARLAMALARI</div>
    <table class="w-full text-xs border border-black border-collapse mb-3">
      <tr class="bg-slate-100 border-b border-black font-bold">
        <td class="p-1.5 border-r border-black w-1/2">Destek Eğitim Odası Hizmetleri</td>
        <td class="p-1.5 w-1/2">Sınav Hizmetleri ve Ölçme-Değerlendirme Tedbirleri</td>
      </tr>
      <tr>
        <td class="p-2 border-r border-black align-top leading-relaxed">${d.destekEgitim ? d.destekEgitim.replace(/\n/g, "<br>") : "-"}</td>
        <td class="p-2 align-top leading-relaxed">${d.sinavTedbirleri ? d.sinavTedbirleri.replace(/\n/g, "<br>") : "-"}</td>
      </tr>
    </table>

    <!-- 5. BEP Birim Kararları -->
    <div class="font-bold text-xs uppercase text-slate-800 mb-1">5. BEP GELİŞTİRME BİRİMİ KARARLARI</div>
    <div class="p-2 border border-black text-xs leading-relaxed mb-3 bg-white">
      ${d.birimKararlari ? d.birimKararlari.replace(/\n/g, "<br>") : "-"}
    </div>

    <!-- 6. İmza Sirküsü -->
    <div class="font-bold text-xs uppercase text-slate-800 mb-1">6. BEP GELİŞTİRME BİRİMİ ONAYI VE İMZA SİRKÜSÜ</div>
    ${buildImzaHtml(d)}
  `;
}

// 2. BEP Toplantı Tutanağı HTML Şablonu (Dikey A4 Görünüm)
function buildTutanakHtml(d) {
  const gundem = [
    "1. Açılış, yoklama ve BEP Geliştirme Birimi üyelerinin hazır bulunurluğunun tespiti.",
    "2. Öğrencinin RAM Eğitsel Değerlendirme Raporu ve gelişim dosyasının incelenmesi.",
    "3. Öğrencinin şimdiki eğitsel performans düzeyinin ders bazında değerlendirilmesi.",
    "4. Öğrenci için Uzun Dönemli Amaçlar (ÜDA) ve Kısa Dönemli Amaçların (KDA) tespiti.",
    "5. Destek Eğitim Odasından yararlanma süresi ve haftalık ders saatlerinin belirlenmesi.",
    "6. Sınav tedbirleri (ek süre, ayrı salon, okuyucu-kodlayıcı vb.) ve ölçme-değerlendirme uyarlamalarının görüşülmesi.",
    "7. Aile ile yapılacak iş birliği, veli bilgilendirme takvimi ve ev ortamı desteklerinin planlanması.",
    "8. Dilek, temenniler ve BEP planının imzalanarak onaylanması."
  ];

  return `
    <div class="text-center font-bold text-slate-900 mb-4">
      <div class="text-xs">T.C.</div>
      <div class="text-sm uppercase tracking-wider">MİLLÎ EĞİTİM BAKANLIĞI</div>
      <div class="text-base uppercase text-blue-900 font-extrabold">${(d.okulAdi || "OKUL ADI BELİRTİLMEDİ").toUpperCase()}</div>
      <div class="text-xs mt-1 text-slate-800 font-bold">${d.egitimYili} EĞİTİM ÖĞRETİM YILI BEP GELİŞTİRME BİRİMİ TOPLANTI TUTANAĞI</div>
    </div>

    <table class="w-full text-xs border border-black border-collapse mb-4">
      <tr class="border-b border-black">
        <td class="p-2 font-bold bg-slate-100 border-r border-black w-1/3">Toplantı Türü / No:</td>
        <td class="p-2">${d.toplantiNo || "1. Toplantı (Sene Başı BEP Hazırlama)"}</td>
      </tr>
      <tr class="border-b border-black">
        <td class="p-2 font-bold bg-slate-100 border-r border-black">Toplantı Tarihi ve Yeri:</td>
        <td class="p-2">${d.toplantiTarihi || new Date().toLocaleDateString("tr-TR")} - ${d.toplantiYeri || "Rehberlik Servisi"}</td>
      </tr>
      <tr class="border-b border-black">
        <td class="p-2 font-bold bg-slate-100 border-r border-black">Öğrencinin Adı Soyadı & Sınıfı:</td>
        <td class="p-2 font-semibold">${d.ogrenciAdi || "-"} (${d.sinifSube || "-"})</td>
      </tr>
      <tr>
        <td class="p-2 font-bold bg-slate-100 border-r border-black">Ders ve Eğitsel Tanı:</td>
        <td class="p-2">${d.dersAdi || "-"} / ${d.taniTuru || "-"}</td>
      </tr>
    </table>

    <div class="font-bold text-xs uppercase text-slate-800 mb-2">TOPLANTI GÜNDEM MADDELERİ</div>
    <div class="text-xs space-y-1 mb-4 pl-2 border-l-2 border-slate-300">
      ${gundem.map(g => `<div>${g}</div>`).join("")}
    </div>

    <div class="font-bold text-xs uppercase text-slate-800 mb-2">TOPLANTIDA ALINAN KARARLAR</div>
    <div class="text-xs space-y-2 mb-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div>1. <strong>${d.ogrenciAdi || "Öğrenci"}</strong> isimli öğrencinin RAM raporu ve sınıf içi gözlem sonuçları incelenmiş, eğitsel performansına uygun BEP hazırlanması kararlaştırılmıştır.</div>
      <div>2. <strong>${d.dersAdi || "Ders"}</strong> dersi kapsamında öğrencinin seviyesine uygun olarak hazırlanan Uzun Dönemli ve Kısa Dönemli Amaçlar kabul edilmiştir.</div>
      <div>3. Öğrencinin destek eğitim ihtiyacı doğrultusunda Destek Eğitim Odasından yararlandırılmasına karar verilmiştir (${d.destekEgitim ? d.destekEgitim.replace(/\n/g, ", ") : "Haftalık programa göre"}).</div>
      <div>4. Yazılı sınavlarda öğrencinin tanı özellikleri dikkate alınarak sınav tedbirlerinin uygulanmasına oy birliğiyle karar verilmiştir (${d.sinavTedbirleri ? d.sinavTedbirleri.replace(/\n/g, ", ") : "Ek süre ve uyarlama"}).</div>
      <div>5. Öğrencinin gelişim durumu dönem sonlarında BEP Geliştirme Birimi tarafından tekrar izlenecektir.</div>
    </div>

    <div class="font-bold text-xs uppercase text-slate-800 mb-2">BEP GELİŞTİRME BİRİMİ KATILIMCILARI VE İMZA SİRKÜSÜ</div>
    ${buildImzaHtml(d)}
  `;
}

// 3. BEP İzleme ve Değerlendirme HTML Şablonu
function buildIzlemeHtml(d) {
  let kazanimHtml = "";
  if (d.kazanimlar && d.kazanimlar.length > 0) {
    d.kazanimlar.forEach(k => {
      kazanimHtml += `
        <tr class="border-b border-black">
          <td class="p-2 border-r border-black align-top">${k.uda ? k.uda.replace(/\n/g, "<br>") : "-"}</td>
          <td class="p-2 border-r border-black align-top">${k.kda ? k.kda.replace(/\n/g, "<br>") : "-"}</td>
          <td class="p-2 border-r border-black text-center align-middle whitespace-nowrap text-[11px] leading-tight">
            ☐ Gerçekleşti<br>☐ Kısmen<br>☐ Gerçekleşmedi
          </td>
          <td class="p-2 border-r border-black text-center align-middle whitespace-nowrap text-[11px] leading-tight">
            ☐ Gerçekleşti<br>☐ Kısmen<br>☐ Gerçekleşmedi
          </td>
          <td class="p-2 align-middle text-center text-[11px] text-slate-500">Devam / Tamamlandı</td>
        </tr>
      `;
    });
  } else {
    kazanimHtml = `<tr><td colspan="5" class="p-4 text-center">Amaç veya kazanım girilmedi.</td></tr>`;
  }

  return `
    <div class="text-center font-bold text-slate-900 mb-3">
      <div class="text-sm">T.C.</div>
      <div class="text-base uppercase tracking-wider">MİLLÎ EĞİTİM BAKANLIĞI</div>
      <div class="text-lg uppercase text-blue-900 font-extrabold">${(d.okulAdi || "OKUL ADI BELİRTİLMEDİ").toUpperCase()}</div>
      <div class="text-sm mt-1 text-slate-800 font-bold">${d.egitimYili} EĞİTİM ÖĞRETİM YILI ${(d.dersAdi || "DERS").toUpperCase()} DERSİ BEP İZLEME VE DEĞERLENDİRME FORMU</div>
    </div>

    <div class="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
      <span>Öğrenci: ${d.ogrenciAdi || "-"} (${d.sinifSube || "-"})</span>
      <span>Tanı: ${d.taniTuru || "-"}</span>
      <span>Ders: ${d.dersAdi || "-"}</span>
    </div>

    <table class="w-full text-xs border border-black border-collapse mb-4">
      <thead>
        <tr class="bg-slate-100 border-b border-black text-center font-bold">
          <th class="p-2 border-r border-black w-[25%]">Uzun Dönemli Amaç (ÜDA)</th>
          <th class="p-2 border-r border-black w-[35%]">Kısa Dönemli Amaçlar (KDA)</th>
          <th class="p-2 border-r border-black w-[15%]">1. Dönem Sonu Değerlendirmesi</th>
          <th class="p-2 border-r border-black w-[15%]">2. Dönem Sonu Değerlendirmesi</th>
          <th class="p-2 w-[10%]">Açıklama / Karar</th>
        </tr>
      </thead>
      <tbody>
        ${kazanimHtml}
      </tbody>
    </table>

    <div class="font-bold text-xs uppercase text-slate-800 mb-2">BEP GELİŞTİRME BİRİMİ DEĞERLENDİRME ONAYI</div>
    ${buildImzaHtml(d)}
  `;
}

// Ortak İmza Tablosu HTML
function buildImzaHtml(d) {
  return `
    <table class="w-full text-[11px] border border-black border-collapse text-center">
      <tr class="h-20">
        <td class="p-1 border-r border-black align-bottom w-1/6">
          <div class="font-bold">${d.imzaDersOgr || "Ders Öğretmeni"}</div>
          <div class="text-[10px] text-slate-600">${d.dersAdi || "Ders"} Öğretmeni</div>
          <div class="text-[10px] italic mt-1">(İmza)</div>
        </td>
        <td class="p-1 border-r border-black align-bottom w-1/6">
          <div class="font-bold">${d.imzaSinifOgr || "Sınıf Rehber Öğr."}</div>
          <div class="text-[10px] text-slate-600">Sınıf Rehber Öğr.</div>
          <div class="text-[10px] italic mt-1">(İmza)</div>
        </td>
        <td class="p-1 border-r border-black align-bottom w-1/6">
          <div class="font-bold">${d.imzaOzelEgitim || "Özel Eğitim Öğr."}</div>
          <div class="text-[10px] text-slate-600">Özel Eğitim Öğr.</div>
          <div class="text-[10px] italic mt-1">(İmza)</div>
        </td>
        <td class="p-1 border-r border-black align-bottom w-1/6">
          <div class="font-bold">${d.imzaRehberlik || "Rehber Öğretmen"}</div>
          <div class="text-[10px] text-slate-600">Rehberlik / Psk. Dan.</div>
          <div class="text-[10px] italic mt-1">(İmza)</div>
        </td>
        <td class="p-1 border-r border-black align-bottom w-1/6">
          <div class="font-bold">${d.imzaVeli || "Öğrenci Velisi"}</div>
          <div class="text-[10px] text-slate-600">Öğrenci Velisi</div>
          <div class="text-[10px] italic mt-1">(İmza)</div>
        </td>
        <td class="p-1 align-bottom w-1/6">
          <div class="font-bold">${d.imzaMudur || "Birim Başkanı / Müdür"}</div>
          <div class="text-[10px] text-slate-600">Okul Müdürü</div>
          <div class="text-[10px] italic mt-1">(Mühür - İmza)</div>
        </td>
      </tr>
    </table>
  `;
}

// Doğrudan Tarayıcıdan Yazdır
function yazdir() {
  baskiOnizlemeGuncelle();
  window.print();
}

// HAZIR KAZANIM SEÇİCİ MODAL İŞLEMLERİ
function kazanimModaliniAc() {
  document.getElementById("modalKazanim").classList.remove("hidden");
  const mevcutDers = document.getElementById("dersAdi").value.trim();
  const select = document.getElementById("modalDersFiltre");
  if (mevcutDers) {
    for (let opt of select.options) {
      if (opt.value.toLowerCase().includes(mevcutDers.toLowerCase()) || mevcutDers.toLowerCase().includes(opt.value.toLowerCase())) {
        select.value = opt.value;
        break;
      }
    }
  }
  kazanimlariListele();
}

function kazanimModaliniKapat() {
  document.getElementById("modalKazanim").classList.add("hidden");
}

function kazanimKategorileriniDoldur() {
  const dersSelect = document.getElementById("modalDersFiltre");
  if (!window.BEP_KAZANIM_HAVUZU) return;

  const dersler = [...new Set(window.BEP_KAZANIM_HAVUZU.map(k => k.ders))];
  dersSelect.innerHTML = `<option value="hepsi">Tüm Dersler ve Alanlar (${window.BEP_KAZANIM_HAVUZU.length} Hazır Kategori)</option>`;
  dersler.forEach(ders => {
    dersSelect.innerHTML += `<option value="${ders}">${ders}</option>`;
  });
}

function kazanimlariListele() {
  const secilenDers = document.getElementById("modalDersFiltre").value;
  const aramaMetni = (document.getElementById("modalArama").value || "").toLowerCase();
  const listeContainer = document.getElementById("modalKazanimListesi");

  if (!window.BEP_KAZANIM_HAVUZU) return;

  let filtrelenmis = window.BEP_KAZANIM_HAVUZU;
  if (secilenDers !== "hepsi") {
    filtrelenmis = filtrelenmis.filter(k => k.ders === secilenDers);
  }

  if (aramaMetni) {
    filtrelenmis = filtrelenmis.filter(k => 
      k.uda.toLowerCase().includes(aramaMetni) ||
      k.kategori.toLowerCase().includes(aramaMetni) ||
      k.ders.toLowerCase().includes(aramaMetni) ||
      k.kdaListesi.some(kda => kda.toLowerCase().includes(aramaMetni))
    );
  }

  if (filtrelenmis.length === 0) {
    listeContainer.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Kriterlere uygun hazır amaç bulunamadı. Farklı bir arama terimi deneyin.</div>`;
    return;
  }

  let html = "";
  filtrelenmis.forEach((item) => {
    const havuzIndex = window.BEP_KAZANIM_HAVUZU.indexOf(item);
    html += `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-blue-300 transition">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">${item.ders}</span>
          <span class="text-xs text-slate-500 font-medium">${item.kategori}</span>
        </div>
        <div class="text-xs font-bold text-slate-800">
          <strong>UDA:</strong> ${item.uda}
        </div>
        <div class="text-xs text-slate-600 pl-2 border-l-2 border-blue-400 space-y-1">
          <span class="font-semibold block text-slate-700">Kısa Dönemli Amaçlar (KDA):</span>
          ${item.kdaListesi.map((kda, i) => `<div>• ${kda}</div>`).join("")}
        </div>
        <div class="pt-2 flex items-center justify-between border-t border-slate-200/60">
          <span class="text-[11px] text-slate-400">Yöntem: ${item.yontem.substring(0, 35)}...</span>
          <button type="button" onclick="kazanimiPlanaEkle(${havuzIndex})" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-sm">
            + Bu Amacı Plana Ekle
          </button>
        </div>
      </div>
    `;
  });

  listeContainer.innerHTML = html;
}

function kazanimiPlanaEkle(havuzIndex) {
  const item = window.BEP_KAZANIM_HAVUZU[havuzIndex];
  if (!item) return;

  const kdaBirlestirilmis = item.kdaListesi.map((k, i) => `${i + 1}. ${k}`).join("\n");
  satirEkle(item.uda, kdaBirlestirilmis, "Güz / Bahar", item.yontem, item.arac, item.degerlendirme);
  kazanimModaliniKapat();
  sekmeDegistir("form");
  bildirimGoster(`"${item.kategori}" amaç ve kazanımları plana eklendi.`, "success");
}

// Bildirim Toast Mesajı
function bildirimGoster(mesaj, tip = "info") {
  const toast = document.createElement("div");
  const bg = tip === "success" ? "bg-emerald-600" : tip === "warning" ? "bg-amber-600" : "bg-blue-600";
  toast.className = `fixed bottom-5 right-5 ${bg} text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold z-50 transition transform translate-y-2 opacity-0 flex items-center gap-2`;
  toast.innerHTML = `<span>${mesaj}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Taslak Kontrolü
function taslakKontrolEt() {
  const draft = BepStorage.getDraft();
  if (draft && draft.data && draft.data.ogrenciAdi && !aktifPlanId) {
    const onay = confirm(`Önceden üzerinde çalıştığınız "${draft.data.ogrenciAdi}" isimli öğrencinin kaydedilmemiş taslağı bulundu. Taslak geri yüklensin mi?`);
    if (onay) {
      formuDoldur(draft.data);
      bildirimGoster("Kaydedilmemiş taslak geri yüklendi.", "info");
    }
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
