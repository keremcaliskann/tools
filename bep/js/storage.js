// LocalStorage ve Veri Yönetim Modülü (Öğrenci Kayıtları, Yedekleme & Geri Yükleme)

const STORAGE_KEY = "meb_bep_ogrenci_kayitlari_v1";
const DRAFT_KEY = "meb_bep_taslak_v1";

const BepStorage = {
  // Tüm kayıtlı planları getir
  getAll: function () {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Kayıtlar okunurken hata oluştu:", e);
      return [];
    }
  },

  // Tekil plan getir
  getById: function (id) {
    const list = this.getAll();
    return list.find(item => item.id === id) || null;
  },

  // Plan kaydet veya güncelle
  save: function (plan) {
    const list = this.getAll();
    const existingIndex = list.findIndex(item => item.id === plan.id);

    plan.guncellenmeTarihi = new Date().toISOString();

    if (existingIndex > -1) {
      list[existingIndex] = plan;
    } else {
      if (!plan.id) {
        plan.id = "bep_" + Date.now();
      }
      plan.olusturmaTarihi = new Date().toISOString();
      list.unshift(plan);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return { success: true, plan };
    } catch (e) {
      console.error("Kaydetme hatası:", e);
      return { success: false, error: e.message };
    }
  },

  // Plan sil
  delete: function (id) {
    let list = this.getAll();
    list = list.filter(item => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error("Silme hatası:", e);
      return false;
    }
  },

  // Otomatik taslak kaydetme
  saveDraft: function (data) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      // sessizce geç
    }
  },

  // Taslağı getir
  getDraft: function () {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (e) {
      return null;
    }
  },

  // Taslağı temizle
  clearDraft: function () {
    localStorage.removeItem(DRAFT_KEY);
  },

  // Tek bir öğrenci planını JSON olarak dışa aktar
  exportSinglePlanToJson: function (id) {
    const item = this.getById(id);
    if (!item) {
      alert("Öğrenci kaydı bulunamadı.");
      return;
    }
    const jsonString = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (item.ogrenciAdi || "Ogrenci").replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
    a.href = url;
    a.download = `BEP_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // JSON formatında tüm verileri toplu yedek olarak dışa aktar
  exportToJsonFile: function () {
    const list = this.getAll();
    if (list.length === 0) {
      alert("Dışa aktarılacak kayıtlı öğrenci planı bulunmuyor.");
      return;
    }

    const jsonString = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `MEB_BEP_Tum_Yedek_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // JSON dosyasından verileri içe aktar (Hem liste hem de tekil öğrenci destekler)
  importFromJsonFile: function (file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedRaw = JSON.parse(e.target.result);
        const importedList = Array.isArray(importedRaw) ? importedRaw : [importedRaw];
        
        const currentList = this.getAll();
        const mergedMap = new Map();
        
        currentList.forEach(item => mergedMap.set(item.id, item));
        let addedCount = 0;

        importedList.forEach(item => {
          if (item && (item.ogrenciAdi || item.dersAdi)) {
            if (!item.id) item.id = "bep_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
            mergedMap.set(item.id, item);
            addedCount++;
          }
        });

        if (addedCount === 0) {
          throw new Error("Dosya geçerli bir BEP öğrenci kaydı içermiyor.");
        }

        const finalList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalList));
        if (callback) callback(null, addedCount);
      } catch (err) {
        if (callback) callback(err);
      }
    };
    reader.readAsText(file);
  }
};

window.BepStorage = BepStorage;
