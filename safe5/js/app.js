/**
 * Safe5 — Fabrika Geri Bildirim & Analitik Paneli
 * %100 İstemci Taraflı (Zero-Backend) & Local-First Veri Mimarisi
 */

(function () {
  'use strict';

  // ==================== STORAGE KEYS ====================
  const STORAGE_KEYS = {
    EMPLOYEES: 'safe5_employees_v1',
    FEEDBACKS: 'safe5_feedbacks_v1',
    SESSION: 'safe5_current_session_v1'
  };

  // ==================== VARSAYILAN FABRİKA VERİLERİ (DEMO SEED) ====================
  const DEFAULT_EMPLOYEES = [
    { id: 'EMP-101', name: 'Mehmet Demir', role: 'worker', department: 'Montaj Hattı', title: 'Montaj Usta Başı', shift: '1. Vardiya (08:00 - 16:00)', initials: 'MD' },
    { id: 'EMP-102', name: 'Ayşe Yılmaz', role: 'worker', department: 'Kalite Güvence', title: 'Kalite Kontrol Teknisyeni', shift: '1. Vardiya (08:00 - 16:00)', initials: 'AY' },
    { id: 'EMP-103', name: 'Ali Çelik', role: 'worker', department: 'Talaşlı İmalat', title: 'CNC Torna Operatörü', shift: '2. Vardiya (16:00 - 24:00)', initials: 'AÇ' },
    { id: 'EMP-104', name: 'Fatma Kurt', role: 'worker', department: 'İSG & Çevre', title: 'İş Güvenliği Uzmanı', shift: 'Gündüz (08:30 - 17:30)', initials: 'FK' },
    { id: 'EMP-105', name: 'Emre Şahin', role: 'worker', department: 'Bakım & Onarım', title: 'Mekanik Bakım Teknisyeni', shift: '2. Vardiya (16:00 - 24:00)', initials: 'EŞ' },
    { id: 'EMP-106', name: 'Zeynep Kaya', role: 'worker', department: 'Depo & Lojistik', title: 'Lojistik Operatörü', shift: '1. Vardiya (08:00 - 16:00)', initials: 'ZK' },
    { id: 'EMP-107', name: 'Mustafa Öztürk', role: 'worker', department: 'Kaynak & Gövde', title: 'Robotik Kaynak Operatörü', shift: '3. Vardiya (24:00 - 08:00)', initials: 'MÖ' },
    { id: 'EMP-108', name: 'Selin Arslan', role: 'worker', department: 'Kaizen & Metot', title: 'Sürekli İyileştirme Müh.', shift: 'Gündüz (08:30 - 17:30)', initials: 'SA' }
  ];

  const DEFAULT_FEEDBACKS = [
    {
      id: 'FB-901',
      fromId: 'EMP-101',
      fromName: 'Mehmet Demir',
      toId: 'EMP-105',
      toName: 'Emre Şahin',
      type: 'kudos',
      category: '5s',
      badge: '⚙️ Hızlı Çözüm',
      message: '1. hatta hidrolik pres sızıntısını vardiya bitmeden 15 dakikada çözdü ve çalışma alanını 5S kurallarına göre pırıl pırıl temizledi. Harika bir iş birliğiydi!',
      shift: '1. Vardiya',
      isAnonymous: false,
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'FB-902',
      fromId: 'EMP-104',
      fromName: 'Fatma Kurt',
      toId: 'EMP-103',
      toName: 'Ali Çelik',
      type: 'isg',
      category: 'isg',
      badge: '🦺 İSG Öncüsü',
      message: 'CNC istasyonunda yüksek ses ve talaş sıçramasına karşı kulaklık ve gözlük korumasını eksiksiz kullandı, yeni başlayan stajyerlere doğru KKD kullanımını gösterdi.',
      shift: '2. Vardiya',
      isAnonymous: false,
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: 'FB-903',
      fromId: 'EMP-108',
      fromName: 'Selin Arslan',
      toId: 'EMP-102',
      toName: 'Ayşe Yılmaz',
      type: 'kaizen',
      category: 'kaizen',
      badge: '💡 Kaizen Ustası',
      message: 'Final kontrol masasında renk kodlu şablon önerisi getirdi. Parça kontrol süremizi %25 hızlandırdı ve hatalı montaj riskini sıfıra indirdi. Tebrikler!',
      shift: '1. Vardiya',
      isAnonymous: false,
      status: 'in_progress',
      createdAt: new Date(Date.now() - 3600000 * 32).toISOString()
    },
    {
      id: 'FB-904',
      fromId: null,
      fromName: 'Anonim Çalışan',
      toId: 'EMP-107',
      toName: 'Mustafa Öztürk',
      type: 'kudos',
      category: 'teamwork',
      badge: '🤝 Takım Ruhu',
      message: 'Gece vardiyasında parça yetiştirirken yorulan arkadaşının fikstür yüklemesine destek oldu ve vardiya devrini sıfır fire ile teslim etti.',
      shift: '3. Vardiya',
      isAnonymous: true,
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 50).toISOString()
    },
    {
      id: 'FB-905',
      fromId: 'EMP-106',
      fromName: 'Zeynep Kaya',
      toId: 'EMP-101',
      toName: 'Mehmet Demir',
      type: 'kudos',
      category: 'teamwork',
      badge: '🏆 Ayın Yıldızı',
      message: 'Sevkiyata hazır kasaların paletlenmesinde forklift güzergahını açık tutarak iş güvenliği ve malzeme akış hızını aynı anda korudu.',
      shift: '1. Vardiya',
      isAnonymous: false,
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
    },
    {
      id: 'FB-906',
      fromId: 'EMP-103',
      fromName: 'Ali Çelik',
      toId: 'EMP-105',
      toName: 'Emre Şahin',
      type: 'kaizen',
      category: '5s',
      badge: '🧹 5S Tertip',
      message: 'Takımhane dolaplarının görsel gölge panosuyla düzenlenmesi aradığımız freze uçlarını saniyeler içinde bulmamızı sağladı.',
      shift: '2. Vardiya',
      isAnonymous: false,
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
    },
    {
      id: 'FB-907',
      fromId: null,
      fromName: 'Anonim Çalışan',
      toId: 'EMP-104',
      toName: 'Fatma Kurt',
      type: 'isg',
      category: 'isg',
      badge: '⚠️ Ramak Kala',
      message: 'A-blok yangın çıkış kapısının önündeki boş palet yığınını anında fark edip kaldırtarak acil kaçış yolunu emniyete aldı.',
      shift: '1. Vardiya',
      isAnonymous: true,
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
    }
  ];

  // ==================== APPLICATION STATE ====================
  const state = {
    employees: [],
    feedbacks: [],
    currentUser: null, // { id, name, role: 'worker' | 'admin', department, ... }
    adminPin: '1234',
    selectedType: 'kudos',
    selectedCategory: 'isg',
    selectedBadge: '🏆 Ayın Yıldızı',
    isAnonymous: false,
    feedFilter: 'all', // 'all' | 'received' | 'sent'
    adminFilterCategory: 'all',
    adminFilterShift: 'all',
    adminFilterStatus: 'all',
    adminSearchQuery: '',
    chartInstances: {}
  };

  // ==================== DATA MANAGEMENT (LOCAL-FIRST) ====================
  function loadData() {
    try {
      const storedEmp = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const storedFb = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);

      state.employees = storedEmp ? JSON.parse(storedEmp) : JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
      state.feedbacks = storedFb ? JSON.parse(storedFb) : JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));

      if (storedSession) {
        state.currentUser = JSON.parse(storedSession);
      } else {
        // Varsayılan olarak ilk çalışanla başlat
        state.currentUser = state.employees[0];
      }

      // İlk defa açılıyorsa yerel hafızaya kaydet
      if (!storedEmp) saveEmployees();
      if (!storedFb) saveFeedbacks();
    } catch (err) {
      console.warn('[Safe5] LocalStorage okuma hatası, varsayılanlar yüklendi:', err);
      state.employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
      state.feedbacks = JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));
      state.currentUser = state.employees[0];
    }
  }

  function saveEmployees() {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(state.employees));
    } catch (e) {
      console.error('[Safe5] Çalışan kaydedilemedi:', e);
    }
  }

  function saveFeedbacks() {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(state.feedbacks));
    } catch (e) {
      console.error('[Safe5] Geri bildirim kaydedilemedi:', e);
    }
  }

  function saveSession() {
    try {
      if (state.currentUser) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(state.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (e) {}
  }

  // ==================== TOAST & NOTIFICATIONS ====================
  function showToast(message, type = 'success') {
    let toast = document.getElementById('safeToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'safeToast';
      toast.className = 'safe-toast';
      document.body.appendChild(toast);
    }

    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // ==================== AUTH & ROLE CONTROL ====================
  function setRole(role, employeeId = null) {
    if (role === 'admin') {
      state.currentUser = {
        id: 'ADMIN-01',
        name: 'Fabrika Yönetimi / İK & İSG Kurulu',
        role: 'admin',
        department: 'Yönetim & Süreç Kontrol',
        title: 'Fabrika Yöneticisi',
        initials: 'ADM'
      };
      showToast('Yönetici modu aktif edildi. Analitik ve denetim paneline hoş geldiniz.', 'success');
    } else {
      const emp = state.employees.find((e) => e.id === employeeId) || state.employees[0];
      state.currentUser = {
        ...emp,
        role: 'worker'
      };
      showToast(`${emp.name} olarak oturum açıldı.`, 'success');
    }

    saveSession();
    renderUI();
  }

  // ==================== FEEDBACK SUBMISSION ====================
  function submitFeedback(formData) {
    const { toId, type, category, badge, message, shift, isAnonymous } = formData;

    if (!toId) {
      showToast('Lütfen geri bildirim göndereceğiniz çalışma arkadaşınızı seçin.', 'warning');
      return false;
    }

    if (!message || message.trim().length < 5) {
      showToast('Lütfen en az 5 karakterlik anlamlı bir açıklama girin.', 'warning');
      return false;
    }

    const recipient = state.employees.find((e) => e.id === toId);
    if (!recipient) {
      showToast('Seçilen alıcı bulunamadı.', 'warning');
      return false;
    }

    const newFeedback = {
      id: 'FB-' + Date.now().toString(36).toUpperCase(),
      fromId: isAnonymous ? null : (state.currentUser ? state.currentUser.id : null),
      fromName: isAnonymous ? 'Anonim Çalışan' : (state.currentUser ? state.currentUser.name : 'Çalışan'),
      toId: recipient.id,
      toName: recipient.name,
      type: type || state.selectedType,
      category: category || state.selectedCategory,
      badge: badge || state.selectedBadge,
      message: message.trim(),
      shift: shift || '1. Vardiya',
      isAnonymous: Boolean(isAnonymous),
      status: type === 'kaizen' || type === 'isg' ? 'in_progress' : 'resolved',
      createdAt: new Date().toISOString()
    };

    state.feedbacks.unshift(newFeedback);
    saveFeedbacks();

    showToast(`Geri bildirim başarıyla iletildi! ${recipient.name} takdir edildi. 🎉`, 'success');
    renderUI();
    return true;
  }

  // ==================== ANALYTICS COMPUTATION ====================
  function computeAnalytics() {
    const total = state.feedbacks.length;
    const kudosCount = state.feedbacks.filter((f) => f.type === 'kudos').length;
    const isgCount = state.feedbacks.filter((f) => f.type === 'isg' || f.category === 'isg').length;
    const kaizenCount = state.feedbacks.filter((f) => f.type === 'kaizen' || f.category === 'kaizen').length;
    const resolvedKaizens = state.feedbacks.filter((f) => (f.type === 'kaizen' || f.type === 'isg') && f.status === 'resolved').length;

    const kudosPercent = total > 0 ? Math.round((kudosCount / total) * 100) : 0;

    // Kategori Dağılımı
    const categories = {
      isg: { label: 'İSG & Güvenlik', count: 0, color: '#f59e0b' },
      '5s': { label: '5S & Düzen', count: 0, color: '#8b5cf6' },
      kaizen: { label: 'Kaizen & Süreç', count: 0, color: '#06b6d4' },
      quality: { label: 'Kalite & Özen', count: 0, color: '#3b82f6' },
      teamwork: { label: 'Takım Ruhu', count: 0, color: '#10b981' }
    };

    state.feedbacks.forEach((f) => {
      const catKey = f.category || 'teamwork';
      if (categories[catKey]) {
        categories[catKey].count++;
      } else {
        categories.teamwork.count++;
      }
    });

    // Vardiya Dağılımı
    const shifts = {
      '1. Vardiya': 0,
      '2. Vardiya': 0,
      '3. Vardiya': 0
    };

    state.feedbacks.forEach((f) => {
      if (f.shift && f.shift.includes('2')) shifts['2. Vardiya']++;
      else if (f.shift && f.shift.includes('3')) shifts['3. Vardiya']++;
      else shifts['1. Vardiya']++;
    });

    // Bölüm Dağılımı
    const deptMap = {};
    state.feedbacks.forEach((f) => {
      const emp = state.employees.find((e) => e.id === f.toId);
      const dept = emp ? emp.department : 'Genel';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    // En Çok Takdir Alanlar (Top 5)
    const kudosLeaderboard = {};
    state.feedbacks.forEach((f) => {
      if (f.type === 'kudos' || f.type === 'kaizen') {
        kudosLeaderboard[f.toId] = (kudosLeaderboard[f.toId] || 0) + 1;
      }
    });

    const topLeaders = Object.keys(kudosLeaderboard)
      .map((empId) => {
        const emp = state.employees.find((e) => e.id === empId);
        return {
          id: empId,
          name: emp ? emp.name : 'Bilinmeyen Personel',
          department: emp ? emp.department : 'Üretim',
          score: kudosLeaderboard[empId]
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      total,
      kudosCount,
      kudosPercent,
      isgCount,
      kaizenCount,
      resolvedKaizens,
      categories,
      shifts,
      deptMap,
      topLeaders
    };
  }

  // ==================== EXPORT & IMPORT ====================
  function exportCSV() {
    if (state.feedbacks.length === 0) {
      showToast('Dışa aktarılacak geri bildirim bulunmuyor.', 'warning');
      return;
    }

    const headers = [
      'ID',
      'Tarih',
      'Gönderen',
      'Alıcı',
      'Alıcı Bölüm',
      'Tür',
      'Kategori',
      'Rozet',
      'Vardiya',
      'Anonimlik',
      'Durum',
      'Mesaj'
    ];

    const rows = state.feedbacks.map((f) => {
      const emp = state.employees.find((e) => e.id === f.toId);
      const dept = emp ? emp.department : 'Genel';
      const cleanMsg = (f.message || '').replace(/"/g, '""');
      return [
        f.id,
        new Date(f.createdAt).toLocaleString('tr-TR'),
        f.fromName || 'Anonim',
        f.toName,
        dept,
        f.type,
        f.category,
        f.badge || '',
        f.shift || '1. Vardiya',
        f.isAnonymous ? 'Anonim' : 'İsimli',
        f.status || 'resolved',
        `"${cleanMsg}"`
      ].join(';');
    });

    // UTF-8 BOM ekleyerek Türkçe karakterlerin Excel'de düzgün açılmasını sağlıyoruz
    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safe5_fabrika_geribildirim_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV raporu Excel uyumlu olarak indirildi.', 'success');
  }

  function exportJSON() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      employees: state.employees,
      feedbacks: state.feedbacks
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safe5_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Tüm fabrika veritabanı JSON olarak yedeklendi.', 'success');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.employees) && Array.isArray(data.feedbacks)) {
          state.employees = data.employees;
          state.feedbacks = data.feedbacks;
          saveEmployees();
          saveFeedbacks();
          showToast('Yedek başarıyla geri yüklendi!', 'success');
          renderUI();
        } else {
          showToast('Geçersiz yedek dosyası formatı.', 'warning');
        }
      } catch (err) {
        showToast('Dosya okunurken hata oluştu.', 'warning');
      }
    };
    reader.readAsText(file);
  }

  function resetDemoData() {
    if (confirm('Tüm veriler varsayılan fabrika demo verilerine sıfırlansın mı?')) {
      state.employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
      state.feedbacks = JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));
      state.currentUser = state.employees[0];
      saveEmployees();
      saveFeedbacks();
      saveSession();
      showToast('Fabrika verileri sıfırlandı ve demo içerik yüklendi.', 'success');
      renderUI();
    }
  }

  // ==================== CHART RENDERING (Chart.js or SVG Fallback) ====================
  function renderCharts(analytics) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    // 1. Kategori Dağılım Grafiği (Doughnut / Bar)
    const catCanvas = document.getElementById('chartCategory');
    if (catCanvas) {
      if (window.Chart) {
        if (state.chartInstances.category) state.chartInstances.category.destroy();
        const ctx = catCanvas.getContext('2d');
        const catLabels = Object.values(analytics.categories).map((c) => c.label);
        const catData = Object.values(analytics.categories).map((c) => c.count);
        const catColors = Object.values(analytics.categories).map((c) => c.color);

        state.chartInstances.category = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: catData,
              backgroundColor: catColors,
              borderColor: isDark ? '#1e293b' : '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: textColor, boxWidth: 12, padding: 14 }
              }
            }
          }
        });
      } else {
        // Safe SVG Fallback
        renderSvgDoughnut(catCanvas, analytics.categories);
      }
    }

    // 2. Bölüm / Departman Çubuk Grafiği
    const deptCanvas = document.getElementById('chartDepartment');
    if (deptCanvas) {
      if (window.Chart) {
        if (state.chartInstances.dept) state.chartInstances.dept.destroy();
        const ctx = deptCanvas.getContext('2d');
        const deptLabels = Object.keys(analytics.deptMap);
        const deptValues = Object.values(analytics.deptMap);

        state.chartInstances.dept = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: deptLabels,
            datasets: [{
              label: 'Bildirim Sayısı',
              data: deptValues,
              backgroundColor: '#10b981',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: textColor, stepSize: 1 },
                grid: { color: gridColor }
              },
              x: {
                ticks: { color: textColor, maxRotation: 25 },
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      } else {
        renderSvgBars(deptCanvas, analytics.deptMap);
      }
    }

    // 3. Vardiya Dağılım Grafiği
    const shiftCanvas = document.getElementById('chartShift');
    if (shiftCanvas) {
      if (window.Chart) {
        if (state.chartInstances.shift) state.chartInstances.shift.destroy();
        const ctx = shiftCanvas.getContext('2d');
        state.chartInstances.shift = new window.Chart(ctx, {
          type: 'polarArea',
          data: {
            labels: ['1. Vardiya (Gündüz)', '2. Vardiya (Akşam)', '3. Vardiya (Gece)'],
            datasets: [{
              data: [analytics.shifts['1. Vardiya'], analytics.shifts['2. Vardiya'], analytics.shifts['3. Vardiya']],
              backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(6, 182, 212, 0.7)', 'rgba(99, 102, 241, 0.7)']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: textColor, boxWidth: 12 }
              }
            },
            scales: {
              r: {
                ticks: { display: false },
                grid: { color: gridColor }
              }
            }
          }
        });
      }
    }
  }

  // Çevrimdışı SVG Grafikler (Chart.js CDN yüklenemezse devreye girer)
  function renderSvgBars(container, dataMap) {
    const keys = Object.keys(dataMap);
    const maxVal = Math.max(...Object.values(dataMap), 1);
    let html = `<div class="safe-bar-chart">`;
    keys.forEach((k) => {
      const val = dataMap[k];
      const pct = Math.round((val / maxVal) * 100);
      html += `
        <div class="safe-bar-col">
          <span class="safe-bar-value">${val}</span>
          <div class="safe-bar-fill" style="height: ${pct}%;"></div>
          <span class="safe-bar-label" title="${k}">${k}</span>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  }

  function renderSvgDoughnut(container, categories) {
    const total = Object.values(categories).reduce((acc, c) => acc + c.count, 0) || 1;
    let listHtml = `<div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">`;
    Object.values(categories).forEach((c) => {
      const pct = Math.round((c.count / total) * 100);
      listHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
          <span style="display:flex; align-items:center; gap:0.4rem;">
            <span style="width:10px; height:10px; border-radius:50%; background:${c.color};"></span>
            ${c.label}
          </span>
          <b>${c.count} (%${pct})</b>
        </div>
        <div style="width:100%; height:6px; background:var(--wp-border); border-radius:3px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${c.color};"></div>
        </div>
      `;
    });
    listHtml += `</div>`;
    container.innerHTML = listHtml;
  }

  // ==================== MAIN UI RENDER ====================
  function renderUI() {
    const appRoot = document.getElementById('safeAppRoot');
    if (!appRoot) return;

    const user = state.currentUser;
    const isAdmin = user && user.role === 'admin';

    // Üst kullanıcı çubuğu (Header User Bar)
    let userBarHtml = `
      <div class="safe-user-bar">
        <div class="safe-user-info">
          <div class="safe-avatar" style="${isAdmin ? 'background: linear-gradient(135deg, #6366f1, #8b5cf6);' : ''}">
            ${user ? (user.initials || user.name.slice(0, 2).toUpperCase()) : 'SF'}
          </div>
          <div class="safe-user-details">
            <h3>${user ? user.name : 'Giriş Yapılmadı'}</h3>
            <div class="safe-user-meta">
              <span class="safe-role-badge ${isAdmin ? 'admin' : 'worker'}">
                ${isAdmin ? '👑 Fabrika Yöneticisi / Admin' : '👷 Fabrika Çalışanı'}
              </span>
              <span>•</span>
              <span>${user ? user.department : 'Sanayi Üretim'}</span>
              ${user && user.shift ? `<span>•</span> <span>${user.shift}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="safe-user-actions">
          ${!isAdmin ? `
            <button type="button" class="safe-btn safe-btn-primary" id="btnOpenFeedbackModal">
              <span>✍️</span>
              <span>Geri Bildirim / Takdir Gönder</span>
            </button>
          ` : ''}

          <button type="button" class="safe-btn safe-btn-outline" id="btnSwitchProfile">
            <span>🔄</span>
            <span>Profil / Rol Değiştir</span>
          </button>

          ${isAdmin ? `
            <button type="button" class="safe-btn safe-btn-secondary" id="btnExportCSV">
              <span>📊</span>
              <span>CSV Raporu İndir</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // İçerik görünümü: Admin Paneli vs Çalışan Görünümü
    let mainContentHtml = '';

    if (isAdmin) {
      // ADMİN / YÖNETİCİ ANALİTİK GÖRÜNÜMÜ
      const analytics = computeAnalytics();

      mainContentHtml = `
        <div class="safe-admin-view">
          <!-- 1. KPI ÖZET KARTLARI -->
          <div class="safe-kpi-grid">
            <div class="safe-kpi-card kpi-kudos">
              <div class="safe-kpi-header">
                <span class="safe-kpi-label">Toplam Bildirim</span>
                <span class="safe-kpi-icon">📢</span>
              </div>
              <div class="safe-kpi-value">${analytics.total}</div>
              <div class="safe-kpi-subtext">Fabrika geneli çalışan etkileşimi</div>
            </div>

            <div class="safe-kpi-card kpi-people">
              <div class="safe-kpi-header">
                <span class="safe-kpi-label">Takdir / Moral Oranı</span>
                <span class="safe-kpi-icon">⭐</span>
              </div>
              <div class="safe-kpi-value">%${analytics.kudosPercent}</div>
              <div class="safe-kpi-subtext">${analytics.kudosCount} pozitif takdir bildirimi</div>
            </div>

            <div class="safe-kpi-card kpi-isg">
              <div class="safe-kpi-header">
                <span class="safe-kpi-label">İSG & Güvenlik Bildirimi</span>
                <span class="safe-kpi-icon">🦺</span>
              </div>
              <div class="safe-kpi-value">${analytics.isgCount}</div>
              <div class="safe-kpi-subtext">Kaza önleme & ramak kala uyarısı</div>
            </div>

            <div class="safe-kpi-card kpi-kaizen">
              <div class="safe-kpi-header">
                <span class="safe-kpi-label">Kaizen & 5S Aksiyonu</span>
                <span class="safe-kpi-icon">💡</span>
              </div>
              <div class="safe-kpi-value">${analytics.kaizenCount}</div>
              <div class="safe-kpi-subtext">${analytics.resolvedKaizens} tanesi hayata geçirildi</div>
            </div>
          </div>

          <!-- 2. ANALİTİK GRAFİKLER -->
          <div class="safe-charts-grid">
            <!-- Grafik 1: Kategori Dağılımı -->
            <div class="safe-chart-card">
              <div class="safe-card-header">
                <div>
                  <h3 class="safe-card-title"><span>🎯</span> Geri Bildirim Kategori Dağılımı</h3>
                  <p class="safe-card-subtitle">İSG, 5S, Kaizen ve Takım Çalışması odakları</p>
                </div>
              </div>
              <div class="safe-chart-container" id="chartCategoryContainer">
                <canvas id="chartCategory"></canvas>
              </div>
            </div>

            <!-- Grafik 2: Departman / Bölüm Performansı -->
            <div class="safe-chart-card">
              <div class="safe-card-header">
                <div>
                  <h3 class="safe-card-title"><span>🏢</span> Bölüm / Hat Bazlı Bildirim Yoğunluğu</h3>
                  <p class="safe-card-subtitle">Hangi bölümler birbirini daha çok destekliyor?</p>
                </div>
              </div>
              <div class="safe-chart-container" id="chartDeptContainer">
                <canvas id="chartDepartment"></canvas>
              </div>
            </div>

            <!-- Grafik 3: Vardiya Karşılaştırması -->
            <div class="safe-chart-card">
              <div class="safe-card-header">
                <div>
                  <h3 class="safe-card-title"><span>⏰</span> Vardiya Bazlı Dağılım</h3>
                  <p class="safe-card-subtitle">1., 2. ve 3. Vardiya katılım oranları</p>
                </div>
              </div>
              <div class="safe-chart-container" id="chartShiftContainer">
                <canvas id="chartShift"></canvas>
              </div>
            </div>

            <!-- Liderlik & En Çok Takdir Edilenler -->
            <div class="safe-chart-card">
              <div class="safe-card-header">
                <div>
                  <h3 class="safe-card-title"><span>🏆</span> En Çok Takdir Edilen Çalışanlar</h3>
                  <p class="safe-card-subtitle">Fabrika içi örnek davranış ve iş birliği liderleri</p>
                </div>
              </div>
              <div class="safe-leader-list">
                ${analytics.topLeaders.length > 0 ? analytics.topLeaders.map((lead, idx) => `
                  <div class="safe-leader-item">
                    <div class="safe-leader-left">
                      <div class="safe-rank-badge rank-${idx + 1}">${idx + 1}</div>
                      <div>
                        <div style="font-weight: 700; color: var(--wp-text);">${lead.name}</div>
                        <div style="font-size: 0.78rem; color: var(--wp-text-muted);">${lead.department}</div>
                      </div>
                    </div>
                    <div style="font-weight: 800; color: var(--safe5-primary); font-size: 0.95rem;">
                      ${lead.score} Takdir
                    </div>
                  </div>
                `).join('') : '<p style="color:var(--wp-text-muted); padding:1rem; text-align:center;">Henüz takdir verisi bulunmuyor.</p>'}
              </div>
            </div>
          </div>

          <!-- 3. TÜM BİLDİRİMLER DENETİM TABLOSU & YÖNETİM -->
          <div class="safe-card">
            <div class="safe-card-header">
              <div>
                <h3 class="safe-card-title"><span>📋</span> Fabrika Geri Bildirim Denetim Kayıtları</h3>
                <p class="safe-card-subtitle">Detaylı arama, durum güncelleme ve aksiyon takibi</p>
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="safe-btn safe-btn-sm safe-btn-secondary" id="btnExportJSON">
                  <span>💾</span>
                  <span>JSON Yedek</span>
                </button>
                <label class="safe-btn safe-btn-sm safe-btn-outline" style="cursor:pointer; margin:0;">
                  <span>📥</span>
                  <span>Yedek Yükle</span>
                  <input type="file" id="inputImportJSON" accept=".json" style="display:none;" />
                </label>
                <button type="button" class="safe-btn safe-btn-sm safe-btn-outline" id="btnResetDemo" style="color:var(--safe5-danger);">
                  <span>🔄</span>
                  <span>Demo Sıfırla</span>
                </button>
              </div>
            </div>

            <!-- Filtreler Çubuğu -->
            <div class="safe-filter-bar">
              <input type="text" class="safe-input" id="adminSearchInput" placeholder="Personel adı veya mesajda ara..." style="max-width: 260px;" value="${state.adminSearchQuery}" />
              
              <select class="safe-select" id="adminFilterCategorySelect" style="max-width: 170px;">
                <option value="all" ${state.adminFilterCategory === 'all' ? 'selected' : ''}>Tüm Kategoriler</option>
                <option value="isg" ${state.adminFilterCategory === 'isg' ? 'selected' : ''}>🦺 İSG & Güvenlik</option>
                <option value="5s" ${state.adminFilterCategory === '5s' ? 'selected' : ''}>🧹 5S Düzen</option>
                <option value="kaizen" ${state.adminFilterCategory === 'kaizen' ? 'selected' : ''}>💡 Kaizen & İyileştirme</option>
                <option value="teamwork" ${state.adminFilterCategory === 'teamwork' ? 'selected' : ''}>🤝 Takım Ruhu</option>
              </select>

              <select class="safe-select" id="adminFilterShiftSelect" style="max-width: 150px;">
                <option value="all" ${state.adminFilterShift === 'all' ? 'selected' : ''}>Tüm Vardiyalar</option>
                <option value="1" ${state.adminFilterShift === '1' ? 'selected' : ''}>1. Vardiya</option>
                <option value="2" ${state.adminFilterShift === '2' ? 'selected' : ''}>2. Vardiya</option>
                <option value="3" ${state.adminFilterShift === '3' ? 'selected' : ''}>3. Vardiya</option>
              </select>

              <select class="safe-select" id="adminFilterStatusSelect" style="max-width: 150px;">
                <option value="all" ${state.adminFilterStatus === 'all' ? 'selected' : ''}>Tüm Durumlar</option>
                <option value="resolved" ${state.adminFilterStatus === 'resolved' ? 'selected' : ''}>Tamamlandı</option>
                <option value="in_progress" ${state.adminFilterStatus === 'in_progress' ? 'selected' : ''}>Aksiyon Alınıyor</option>
                <option value="pending" ${state.adminFilterStatus === 'pending' ? 'selected' : ''}>İncelemede</option>
              </select>
            </div>

            <!-- Tablo -->
            <div class="safe-table-container">
              <table class="safe-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Gönderen</th>
                    <th>Alıcı</th>
                    <th>Tür / Kategori</th>
                    <th>Mesaj Özeti</th>
                    <th>Vardiya</th>
                    <th>Durum / İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderAdminTableRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else {
      // ÇALIŞAN (WORKER) GÖRÜNÜMÜ - SADE, DOKUNMATİK VE HIZLI FORM + AKIŞ
      mainContentHtml = `
        <div class="safe-worker-layout">
          <!-- SOL SÜTUN: HIZLI GERİ BİLDİRİM FORMU -->
          <div class="safe-card">
            <div class="safe-card-header">
              <div>
                <h3 class="safe-card-title"><span>✍️</span> Çalışma Arkadaşına Geri Bildirim Ver</h3>
                <p class="safe-card-subtitle">10 saniyede takdir et, 5S veya İSG önerini ilet</p>
              </div>
            </div>

            <form id="safeFeedbackForm">
              <!-- Alıcı Çalışan Seçimi -->
              <div class="safe-form-group">
                <label class="safe-label">Kime Geri Bildirim Veriyorsun? <span style="color:var(--safe5-primary);">*</span></label>
                <select class="safe-select" id="inputRecipient" required>
                  <option value="" disabled selected>-- Çalışma Arkadaşını Seçin --</option>
                  ${state.employees
                    .filter((e) => !user || e.id !== user.id)
                    .map((e) => `<option value="${e.id}">${e.name} — ${e.department} (${e.title})</option>`)
                    .join('')}
                </select>
              </div>

              <!-- Bildirim Türü (3 Ana Tip) -->
              <div class="safe-form-group">
                <label class="safe-label">Bildirim Türü</label>
                <div class="safe-type-switcher">
                  <button type="button" class="safe-type-btn kudos ${state.selectedType === 'kudos' ? 'active' : ''}" data-type="kudos">
                    <span>🌟</span> <span>Takdir &amp; Teşekkür</span>
                  </button>
                  <button type="button" class="safe-type-btn kaizen ${state.selectedType === 'kaizen' ? 'active' : ''}" data-type="kaizen">
                    <span>💡</span> <span>Kaizen &amp; Öneri</span>
                  </button>
                  <button type="button" class="safe-type-btn isg ${state.selectedType === 'isg' ? 'active' : ''}" data-type="isg">
                    <span>🦺</span> <span>İSG &amp; Güvenlik</span>
                  </button>
                </div>
              </div>

              <!-- 5S ve Fabrika Standartları Kategorileri -->
              <div class="safe-form-group">
                <label class="safe-label">Fabrika Değeri &amp; 5S İlkesi</label>
                <div class="safe-category-grid">
                  <div class="safe-cat-card ${state.selectedCategory === 'isg' ? 'active' : ''}" data-cat="isg">
                    <span class="safe-cat-icon">🦺</span>
                    <span class="safe-cat-label">İSG &amp; Emniyet</span>
                  </div>
                  <div class="safe-cat-card ${state.selectedCategory === '5s' ? 'active' : ''}" data-cat="5s">
                    <span class="safe-cat-icon">🧹</span>
                    <span class="safe-cat-label">5S Tertip &amp; Düzen</span>
                  </div>
                  <div class="safe-cat-card ${state.selectedCategory === 'kaizen' ? 'active' : ''}" data-cat="kaizen">
                    <span class="safe-cat-icon">⚙️</span>
                    <span class="safe-cat-label">Kaizen İyileştirme</span>
                  </div>
                  <div class="safe-cat-card ${state.selectedCategory === 'quality' ? 'active' : ''}" data-cat="quality">
                    <span class="safe-cat-icon">🎯</span>
                    <span class="safe-cat-label">Kalite &amp; Özen</span>
                  </div>
                  <div class="safe-cat-card ${state.selectedCategory === 'teamwork' ? 'active' : ''}" data-cat="teamwork">
                    <span class="safe-cat-icon">🤝</span>
                    <span class="safe-cat-label">Takım Ruhu</span>
                  </div>
                </div>
              </div>

              <!-- Rozet Seçimi -->
              <div class="safe-form-group">
                <label class="safe-label">Takdir Rozeti Ekle</label>
                <div class="safe-badge-selector">
                  ${['🏆 Ayın Yıldızı', '🦺 İSG Öncüsü', '💡 Kaizen Ustası', '🤝 Takım Ruhu', '⚙️ Hızlı Çözüm', '🎯 Sıfır Hata'].map((b) => `
                    <button type="button" class="safe-badge-pill ${state.selectedBadge === b ? 'selected' : ''}" data-badge="${b}">
                      ${b}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Mesaj Alanı -->
              <div class="safe-form-group">
                <label class="safe-label">Geri Bildirim / Açıklama Notun <span style="color:var(--safe5-primary);">*</span></label>
                <textarea class="safe-textarea" id="inputMessage" placeholder="Örnek: Pres hattında hidrolik sızıntıyı fark edip anında temizledi, hattın duruşunu önledi..." required></textarea>
              </div>

              <!-- Anonimlik ve Vardiya Seçenekleri -->
              <div class="safe-switch-row">
                <label class="safe-switch-label" style="cursor:pointer;">
                  <input type="checkbox" id="inputIsAnonymous" ${state.isAnonymous ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--safe5-primary); cursor:pointer;" />
                  <span>🕵️‍♂️ Anonim Gönder (İsmim Gizlensin)</span>
                </label>
                <span style="font-size: 0.75rem; color: var(--wp-text-muted);">Dürüst &amp; yapıcı kültür</span>
              </div>

              <div class="safe-form-group">
                <label class="safe-label">Gerçekleşen Vardiya</label>
                <select class="safe-select" id="inputShift">
                  <option value="1. Vardiya" selected>1. Vardiya (Gündüz: 08:00 - 16:00)</option>
                  <option value="2. Vardiya">2. Vardiya (Akşam: 16:00 - 24:00)</option>
                  <option value="3. Vardiya">3. Vardiya (Gece: 24:00 - 08:00)</option>
                  <option value="Genel Gündüz">Genel Mesai (08:30 - 17:30)</option>
                </select>
              </div>

              <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width: 100%;">
                <span>🚀</span>
                <span>Geri Bildirimi Yayınla</span>
              </button>
            </form>
          </div>

          <!-- SAĞ SÜTUN: FABRİKA TAKDİR DUVARI & KİŞİSEL AKIŞ -->
          <div class="safe-card">
            <div class="safe-card-header">
              <div>
                <h3 class="safe-card-title"><span>🌟</span> Fabrika Takdir &amp; İyileştirme Duvarı</h3>
                <p class="safe-card-subtitle">Canlı motivasyon, güvenlik ve teşekkür akışı</p>
              </div>
            </div>

            <!-- Sekmeler -->
            <div class="safe-feed-tabs">
              <button type="button" class="safe-feed-tab-btn ${state.feedFilter === 'all' ? 'active' : ''}" data-feed-filter="all">
                🌍 Fabrika Genel Akışı (${state.feedbacks.length})
              </button>
              <button type="button" class="safe-feed-tab-btn ${state.feedFilter === 'received' ? 'active' : ''}" data-feed-filter="received">
                📬 Bana Gelenler (${getFeedCount('received')})
              </button>
              <button type="button" class="safe-feed-tab-btn ${state.feedFilter === 'sent' ? 'active' : ''}" data-feed-filter="sent">
                📤 Gönderdiklerim (${getFeedCount('sent')})
              </button>
            </div>

            <!-- Akış Listesi -->
            <div class="safe-feed-list" id="safeFeedList">
              ${renderFeedList()}
            </div>
          </div>
        </div>
      `;
    }

    // Modal pencereler ve tam HTML birleştirme
    appRoot.innerHTML = `
      <div class="safe-container">
        ${userBarHtml}
        ${mainContentHtml}
      </div>

      <!-- PROFİL & ROL DEĞİŞTİRME MODALI -->
      <div class="safe-modal-backdrop" id="modalSwitchProfile">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>🔄</span> Profil veya Rol Seçimi</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <p style="font-size:0.88rem; color:var(--wp-text-secondary); margin-bottom:1.25rem;">
            Fabrika zeminindeki bir çalışan olarak geri bildirim gönderebilir veya yönetici moduna geçerek analiz grafiklerini inceleyebilirsiniz.
          </p>

          <div style="margin-bottom: 1.5rem;">
            <label class="safe-label">👑 Yönetici (Admin) Modu</label>
            <div style="background:var(--wp-bg-secondary); border:1px solid var(--wp-border); border-radius:10px; padding:1rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
              <div>
                <div style="font-weight:700; color:var(--wp-text);">Fabrika Yönetimi &amp; Analitik</div>
                <div style="font-size:0.78rem; color:var(--wp-text-muted);">Grafikler, departman metrikleri ve CSV raporlama</div>
              </div>
              <button type="button" class="safe-btn safe-btn-admin" id="btnSelectAdmin">
                <span>Yönetici Olarak Giriş</span>
              </button>
            </div>
          </div>

          <div>
            <label class="safe-label">👷 Çalışan Listesinden Seç</label>
            <div class="safe-worker-picker-grid" style="max-height: 280px;">
              ${state.employees.map((emp) => `
                <div class="safe-worker-card ${user && user.id === emp.id ? 'selected' : ''}" data-select-emp="${emp.id}">
                  <div class="safe-avatar" style="width:36px; height:36px; font-size:0.9rem;">${emp.initials}</div>
                  <div>
                    <div class="safe-worker-name">${emp.name}</div>
                    <div class="safe-worker-role-dept">${emp.department} • ${emp.title}</div>
                    <div class="safe-worker-shift">${emp.shift}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Event Dinleyicilerini bağla
    bindEvents();

    // Grafikleri çiz (Admin modundaysa)
    if (isAdmin) {
      setTimeout(() => {
        renderCharts(computeAnalytics());
      }, 50);
    }
  }

  // ==================== ADMIN TABLE ROWS ====================
  function renderAdminTableRows() {
    let list = [...state.feedbacks];

    if (state.adminFilterCategory !== 'all') {
      list = list.filter((f) => f.category === state.adminFilterCategory || f.type === state.adminFilterCategory);
    }

    if (state.adminFilterShift !== 'all') {
      list = list.filter((f) => f.shift && f.shift.includes(state.adminFilterShift));
    }

    if (state.adminFilterStatus !== 'all') {
      list = list.filter((f) => (f.status || 'resolved') === state.adminFilterStatus);
    }

    if (state.adminSearchQuery.trim()) {
      const q = state.adminSearchQuery.toLowerCase();
      list = list.filter((f) =>
        f.fromName.toLowerCase().includes(q) ||
        f.toName.toLowerCase().includes(q) ||
        (f.message && f.message.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      return `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--wp-text-muted);">Filtreye uygun bildirim bulunamadı.</td></tr>`;
    }

    return list.map((f) => {
      const timeStr = new Date(f.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const statusLabel = f.status === 'resolved' ? 'Tamamlandı' : f.status === 'in_progress' ? 'Aksiyon Alınıyor' : 'İnceleniyor';
      const statusClass = f.status === 'resolved' ? 'resolved' : f.status === 'in_progress' ? 'in_progress' : 'pending';

      return `
        <tr>
          <td style="font-size:0.8rem; color:var(--wp-text-muted); white-space:nowrap;">${timeStr}</td>
          <td>
            <b>${f.fromName}</b>
            ${f.isAnonymous ? '<span style="font-size:0.7rem; color:var(--safe5-secondary); display:block;">(Anonim)</span>' : ''}
          </td>
          <td><b>${f.toName}</b></td>
          <td>
            <span class="safe-badge ${f.type}">
              ${f.type === 'kudos' ? '🌟 Takdir' : f.type === 'isg' ? '🦺 İSG' : '💡 Kaizen'}
            </span>
            ${f.badge ? `<div style="font-size:0.75rem; margin-top:0.2rem; color:var(--safe5-warning);">${f.badge}</div>` : ''}
          </td>
          <td style="max-width: 320px; font-size: 0.85rem;">
            <div style="line-height:1.4;">${f.message}</div>
          </td>
          <td style="font-size:0.8rem; white-space:nowrap;">${f.shift || '1. Vardiya'}</td>
          <td>
            <select class="safe-select safe-status-select" data-fb-id="${f.id}" style="padding:0.35rem 0.6rem; font-size:0.78rem; width:auto;">
              <option value="resolved" ${f.status === 'resolved' ? 'selected' : ''}>✅ Tamamlandı</option>
              <option value="in_progress" ${f.status === 'in_progress' ? 'selected' : ''}>⚙️ Aksiyon Alındı</option>
              <option value="pending" ${f.status === 'pending' ? 'selected' : ''}>⏳ İnceleniyor</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==================== FEED LIST RENDERING ====================
  function getFeedCount(type) {
    if (!state.currentUser) return 0;
    if (type === 'received') {
      return state.feedbacks.filter((f) => f.toId === state.currentUser.id).length;
    }
    if (type === 'sent') {
      return state.feedbacks.filter((f) => f.fromId === state.currentUser.id).length;
    }
    return state.feedbacks.length;
  }

  function renderFeedList() {
    let list = [...state.feedbacks];
    const user = state.currentUser;

    if (state.feedFilter === 'received' && user) {
      list = list.filter((f) => f.toId === user.id);
    } else if (state.feedFilter === 'sent' && user) {
      list = list.filter((f) => f.fromId === user.id);
    }

    if (list.length === 0) {
      return `
        <div style="text-align:center; padding:3rem 1rem; color:var(--wp-text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">📭</div>
          <p style="font-weight:600;">Bu alanda henüz bir geri bildirim bulunmuyor.</p>
          <p style="font-size:0.82rem; margin-top:0.3rem;">İlk bildirimi sol taraftaki formu kullanarak sen gönder!</p>
        </div>
      `;
    }

    return list.map((f) => {
      const timeDiff = getTimeAgo(f.createdAt);
      const isRecipient = user && user.id === f.toId;

      return `
        <div class="safe-feed-item ${isRecipient ? 'highlight-me' : ''}">
          <div class="safe-feed-item-header">
            <div class="safe-feed-parties">
              <span>${f.fromName}</span>
              <span class="safe-feed-arrow">➔</span>
              <span style="color:var(--safe5-primary);">${f.toName}</span>
            </div>
            <div class="safe-feed-time">${timeDiff}</div>
          </div>

          <div class="safe-feed-badges">
            <span class="safe-badge ${f.type}">
              ${f.type === 'kudos' ? '🌟 Takdir & Teşekkür' : f.type === 'isg' ? '🦺 İSG Bildirimi' : '💡 Kaizen Önerisi'}
            </span>
            ${f.badge ? `<span class="safe-badge" style="background:rgba(245, 158, 11, 0.15); color:#fbbf24;">${f.badge}</span>` : ''}
            <span class="safe-badge category">${getCategoryName(f.category)}</span>
          </div>

          <div class="safe-feed-message">
            "${f.message}"
          </div>

          <div class="safe-feed-footer">
            <span>⏰ ${f.shift || '1. Vardiya'}</span>
            <span class="safe-action-tag ${f.status || 'resolved'}">
              ${f.status === 'resolved' ? '✓ Tamamlandı' : f.status === 'in_progress' ? '⚙️ Aksiyon Alındı' : '⏳ İnceleniyor'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  function getCategoryName(cat) {
    const map = {
      isg: '🦺 İSG & Emniyet',
      '5s': '🧹 5S Tertip & Düzen',
      kaizen: '⚙️ Kaizen',
      quality: '🎯 Kalite & Sıfır Hata',
      teamwork: '🤝 Takım Ruhu'
    };
    return map[cat] || 'Fabrika Kültürü';
  }

  function getTimeAgo(dateStr) {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Az önce';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`;
    return `${Math.floor(diffSec / 86400)} gün önce`;
  }

  // ==================== BIND EVENTS ====================
  function bindEvents() {
    // Form Gönderimi
    const form = document.getElementById('safeFeedbackForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const toId = document.getElementById('inputRecipient').value;
        const message = document.getElementById('inputMessage').value;
        const shift = document.getElementById('inputShift').value;
        const isAnonymous = document.getElementById('inputIsAnonymous').checked;

        const success = submitFeedback({
          toId,
          type: state.selectedType,
          category: state.selectedCategory,
          badge: state.selectedBadge,
          message,
          shift,
          isAnonymous
        });

        if (success) {
          form.reset();
        }
      });
    }

    // Tür Seçimi (Kudos / Kaizen / İSG)
    document.querySelectorAll('.safe-type-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedType = btn.getAttribute('data-type');
        document.querySelectorAll('.safe-type-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Kategori Seçimi (5S, İSG, vb.)
    document.querySelectorAll('.safe-cat-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.selectedCategory = card.getAttribute('data-cat');
        document.querySelectorAll('.safe-cat-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    // Rozet Seçimi
    document.querySelectorAll('.safe-badge-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        state.selectedBadge = pill.getAttribute('data-badge');
        document.querySelectorAll('.safe-badge-pill').forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
    });

    // Akış Sekmeleri (Genel / Gelen / Gönderilen)
    document.querySelectorAll('.safe-feed-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.feedFilter = btn.getAttribute('data-feed-filter');
        renderUI();
      });
    });

    // Modal Açma / Kapama
    const modalSwitch = document.getElementById('modalSwitchProfile');
    const btnSwitch = document.getElementById('btnSwitchProfile');
    if (btnSwitch && modalSwitch) {
      btnSwitch.addEventListener('click', () => modalSwitch.classList.add('active'));
    }

    const btnOpenModal = document.getElementById('btnOpenFeedbackModal');
    if (btnOpenModal) {
      btnOpenModal.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const rec = document.getElementById('inputRecipient');
        if (rec) rec.focus();
      });
    }

    document.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.safe-modal-backdrop').forEach((m) => m.classList.remove('active'));
      });
    });

    if (modalSwitch) {
      modalSwitch.addEventListener('click', (e) => {
        if (e.target === modalSwitch) modalSwitch.classList.remove('active');
      });
    }

    // Modal içinden çalışan seçme
    document.querySelectorAll('[data-select-emp]').forEach((card) => {
      card.addEventListener('click', () => {
        const empId = card.getAttribute('data-select-emp');
        setRole('worker', empId);
        if (modalSwitch) modalSwitch.classList.remove('active');
      });
    });

    // Modal içinden Admin seçme
    const btnSelectAdmin = document.getElementById('btnSelectAdmin');
    if (btnSelectAdmin) {
      btnSelectAdmin.addEventListener('click', () => {
        setRole('admin');
        if (modalSwitch) modalSwitch.classList.remove('active');
      });
    }

    // Admin Tablo Durum Değiştirme
    document.querySelectorAll('.safe-status-select').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const fbId = sel.getAttribute('data-fb-id');
        const newStatus = sel.value;
        const target = state.feedbacks.find((f) => f.id === fbId);
        if (target) {
          target.status = newStatus;
          saveFeedbacks();
          showToast(`Durum güncellendi: ${newStatus === 'resolved' ? 'Tamamlandı' : 'Aksiyon Alındı'}`, 'success');
        }
      });
    });

    // Admin Filtreleme Girişleri
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.adminSearchQuery = e.target.value;
        const tbody = document.querySelector('.safe-table tbody');
        if (tbody) tbody.innerHTML = renderAdminTableRows();
      });
    }

    const catSelect = document.getElementById('adminFilterCategorySelect');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        state.adminFilterCategory = e.target.value;
        const tbody = document.querySelector('.safe-table tbody');
        if (tbody) tbody.innerHTML = renderAdminTableRows();
      });
    }

    const shiftSelect = document.getElementById('adminFilterShiftSelect');
    if (shiftSelect) {
      shiftSelect.addEventListener('change', (e) => {
        state.adminFilterShift = e.target.value;
        const tbody = document.querySelector('.safe-table tbody');
        if (tbody) tbody.innerHTML = renderAdminTableRows();
      });
    }

    const statusSelect = document.getElementById('adminFilterStatusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.adminFilterStatus = e.target.value;
        const tbody = document.querySelector('.safe-table tbody');
        if (tbody) tbody.innerHTML = renderAdminTableRows();
      });
    }

    // CSV Rapor İndirme
    const btnCSV = document.getElementById('btnExportCSV');
    if (btnCSV) btnCSV.addEventListener('click', exportCSV);

    // JSON Yedek & Geri Yükleme
    const btnJSON = document.getElementById('btnExportJSON');
    if (btnJSON) btnJSON.addEventListener('click', exportJSON);

    const inputJSON = document.getElementById('inputImportJSON');
    if (inputJSON) {
      inputJSON.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          importJSON(e.target.files[0]);
        }
      });
    }

    // Demo Sıfırlama
    const btnReset = document.getElementById('btnResetDemo');
    if (btnReset) btnReset.addEventListener('click', resetDemoData);
  }

  // ==================== TEMA DEĞİŞİMİNİ DİNLEME ====================
  // Koyu/Açık tema değiştiğinde grafiklerin de dinamik renklerini güncellemesi için observer
  const observer = new MutationObserver(() => {
    if (state.currentUser && state.currentUser.role === 'admin') {
      renderCharts(computeAnalytics());
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  // ==================== INITIALIZATION ====================
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderUI();
  });
})();
