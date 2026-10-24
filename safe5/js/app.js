/**
 * Safe5 — Fabrika Geri Bildirim & Analitik Paneli
 * %100 İstemci Taraflı (Zero-Backend) & Local-First Veri Mimarisi
 * Açık Renk (Light Only), Yumuşak Tasarım ve Yetki Yönetim Mimarisi
 */

(function () {
  'use strict';

  // ==================== TEMA ZORLAMASI (SADECE AÇIK RENK) ====================
  function enforceLightTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }
  enforceLightTheme();

  // ==================== STORAGE KEYS ====================
  const STORAGE_KEYS = {
    EMPLOYEES: 'safe5_employees_v2',
    FEEDBACKS: 'safe5_feedbacks_v2',
    SESSION: 'safe5_session_v2'
  };

  // ==================== VARSAYILAN KULLANICILAR & ROLLER ====================
  // Tüm yetkiler: 'feedback' (default), 'analytics' (yetkilendirmeyle)
  const DEFAULT_EMPLOYEES = [
    {
      id: 'ADMIN-01',
      name: 'Kemal Yönetici',
      role: 'admin',
      department: 'Fabrika Yönetimi',
      title: 'Fabrika Müdürü',
      shift: 'Genel Mesai (08:30 - 17:30)',
      initials: 'KY',
      permissions: ['feedback', 'analytics']
    },
    {
      id: 'EMP-101',
      name: 'Mehmet Demir',
      role: 'worker',
      department: 'Montaj Hattı',
      title: 'Montaj Usta Başı',
      shift: '1. Vardiya (08:00 - 16:00)',
      initials: 'MD',
      permissions: ['feedback']
    },
    {
      id: 'EMP-102',
      name: 'Ayşe Yılmaz',
      role: 'worker',
      department: 'Kalite Güvence',
      title: 'Kalite Kontrol Teknisyeni',
      shift: '1. Vardiya (08:00 - 16:00)',
      initials: 'AY',
      permissions: ['feedback', 'analytics'] // Analiz yetkisi verilmiş çalışan
    },
    {
      id: 'EMP-103',
      name: 'Ali Çelik',
      role: 'worker',
      department: 'Talaşlı İmalat',
      title: 'CNC Torna Operatörü',
      shift: '2. Vardiya (16:00 - 24:00)',
      initials: 'AÇ',
      permissions: ['feedback']
    },
    {
      id: 'EMP-104',
      name: 'Fatma Kurt',
      role: 'worker',
      department: 'İSG & Çevre',
      title: 'İş Güvenliği Uzmanı',
      shift: 'Genel Mesai (08:30 - 17:30)',
      initials: 'FK',
      permissions: ['feedback', 'analytics'] // Analiz yetkisi verilmiş çalışan
    },
    {
      id: 'EMP-105',
      name: 'Emre Şahin',
      role: 'worker',
      department: 'Bakım & Onarım',
      title: 'Mekanik Bakım Teknisyeni',
      shift: '2. Vardiya (16:00 - 24:00)',
      initials: 'EŞ',
      permissions: ['feedback']
    },
    {
      id: 'EMP-106',
      name: 'Zeynep Kaya',
      role: 'worker',
      department: 'Depo & Lojistik',
      title: 'Lojistik Operatörü',
      shift: '1. Vardiya (08:00 - 16:00)',
      initials: 'ZK',
      permissions: ['feedback']
    },
    {
      id: 'EMP-107',
      name: 'Mustafa Öztürk',
      role: 'worker',
      department: 'Kaynak & Gövde',
      title: 'Robotik Kaynak Operatörü',
      shift: '3. Vardiya (24:00 - 08:00)',
      initials: 'MÖ',
      permissions: ['feedback']
    },
    {
      id: 'EMP-108',
      name: 'Selin Arslan',
      role: 'worker',
      department: 'Kaizen & Metot',
      title: 'Sürekli İyileştirme Müh.',
      shift: 'Genel Mesai (08:30 - 17:30)',
      initials: 'SA',
      permissions: ['feedback', 'analytics']
    }
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

  // ==================== UYGULAMA DURUMU (STATE) ====================
  const state = {
    employees: [],
    feedbacks: [],
    currentUser: null,
    activeTab: 'give-feedback', // 'give-feedback' (Varsayılan Anasayfa!), 'view-feedbacks', 'analytics', 'user-management'
    selectedType: 'kudos',
    selectedCategory: 'isg',
    selectedBadge: '🏆 Ayın Yıldızı',
    isAnonymous: false,
    feedFilter: 'all', // 'all', 'received', 'sent'
    feedTypeFilter: 'all', // 'all', 'kudos', 'kaizen', 'isg'
    searchQuery: '',
    chartInstances: {}
  };

  // ==================== VERİ YÖNETİMİ (LOCAL STORAGE) ====================
  function loadData() {
    try {
      const storedEmp = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const storedFb = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);

      state.employees = storedEmp ? JSON.parse(storedEmp) : JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
      state.feedbacks = storedFb ? JSON.parse(storedFb) : JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));

      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        // Kullanıcı hala employees listesinde var mı?
        const found = state.employees.find((e) => e.id === parsed.id);
        state.currentUser = found || state.employees[0];
      } else {
        // Varsayılan olarak Admin veya ilk çalışan
        state.currentUser = state.employees[0]; // Kemal Yönetici (Admin)
      }

      if (!storedEmp) saveEmployees();
      if (!storedFb) saveFeedbacks();
    } catch (e) {
      console.warn('[Safe5] Veri yüklenirken hata:', e);
      state.employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
      state.feedbacks = JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));
      state.currentUser = state.employees[0];
    }
  }

  function saveEmployees() {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(state.employees));
    } catch (e) {}
  }

  function saveFeedbacks() {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(state.feedbacks));
    } catch (e) {}
  }

  function saveSession() {
    try {
      if (state.currentUser) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(state.currentUser));
      }
    } catch (e) {}
  }

  // ==================== TOAST BİLDİRİMİ ====================
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
    }, 3000);
  }

  // ==================== YETKİ KONTROL YARDIMCILARI ====================
  function canGiveFeedback() {
    // Tüm kullanıcılarda default olarak var
    return true;
  }

  function canViewAnalytics() {
    if (!state.currentUser) return false;
    if (state.currentUser.role === 'admin') return true;
    return Array.isArray(state.currentUser.permissions) && state.currentUser.permissions.includes('analytics');
  }

  function isAdmin() {
    return state.currentUser && state.currentUser.role === 'admin';
  }

  // ==================== KULLANICI DEĞİŞTİRME ====================
  function switchUser(userId) {
    const user = state.employees.find((e) => e.id === userId);
    if (user) {
      state.currentUser = user;
      saveSession();
      // Eğer kullanıcı veri analizi veya admin yetkisine sahip değilse ve o sekmedeyse, ana sayfaya al
      if (state.activeTab === 'user-management' && !isAdmin()) {
        state.activeTab = 'give-feedback';
      }
      if (state.activeTab === 'analytics' && !canViewAnalytics()) {
        state.activeTab = 'give-feedback';
      }
      showToast(`${user.name} kullanıcısına geçildi.`, 'success');
      renderUI();
    }
  }

  // ==================== KULLANICI EKLEME & SİLME & YETKİLENDİRME (ADMIN) ====================
  function addUser(data) {
    if (!isAdmin()) {
      showToast('Yalnızca yöneticiler yeni kullanıcı ekleyebilir.', 'warning');
      return false;
    }

    const { name, department, title, shift, canAnalytics, role } = data;
    if (!name || name.trim().length < 3) {
      showToast('Lütfen geçerli bir isim girin.', 'warning');
      return false;
    }

    const initials = name
      .trim()
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const permissions = ['feedback'];
    if (canAnalytics) {
      permissions.push('analytics');
    }

    const newUser = {
      id: 'EMP-' + Math.floor(100 + Math.random() * 900),
      name: name.trim(),
      role: role || 'worker',
      department: department || 'Montaj Hattı',
      title: title || 'Operatör',
      shift: shift || '1. Vardiya (08:00 - 16:00)',
      initials: initials || 'ÇL',
      permissions
    };

    state.employees.push(newUser);
    saveEmployees();
    showToast(`${newUser.name} başarıyla sisteme eklendi!`, 'success');
    renderUI();
    return true;
  }

  function removeUser(userId) {
    if (!isAdmin()) {
      showToast('Yalnızca yöneticiler kullanıcı silebilir.', 'warning');
      return;
    }

    if (state.currentUser && state.currentUser.id === userId) {
      showToast('O an aktif olan yönetici hesabını silemezsiniz.', 'warning');
      return;
    }

    const target = state.employees.find((e) => e.id === userId);
    if (!target) return;

    if (confirm(`"${target.name}" personelini silmek istediğinize emin misiniz?`)) {
      state.employees = state.employees.filter((e) => e.id !== userId);
      saveEmployees();
      showToast(`${target.name} sistemden silindi.`, 'success');
      renderUI();
    }
  }

  function toggleUserPermission(userId, permission) {
    if (!isAdmin()) {
      showToast('Yetkileri yalnızca yönetici düzenleyebilir.', 'warning');
      return;
    }

    const user = state.employees.find((e) => e.id === userId);
    if (!user) return;

    if (!Array.isArray(user.permissions)) {
      user.permissions = ['feedback'];
    }

    if (permission === 'feedback') {
      showToast('Geri bildirim yetkisi temel haktır, kaldırılamaz.', 'warning');
      return;
    }

    if (user.permissions.includes(permission)) {
      user.permissions = user.permissions.filter((p) => p !== permission);
      showToast(`${user.name} kullanıcısından '${permission === 'analytics' ? 'Veri Analizi' : permission}' yetkisi alındı.`, 'info');
    } else {
      user.permissions.push(permission);
      showToast(`${user.name} kullanıcısına '${permission === 'analytics' ? 'Veri Analizi' : permission}' yetkisi verildi!`, 'success');
    }

    saveEmployees();
    renderUI();
  }

  // ==================== GERİ BİLDİRİM GÖNDERME ====================
  function submitFeedback(data) {
    const { toId, type, category, badge, message, shift, isAnonymous } = data;

    if (!toId) {
      showToast('Lütfen geri bildirim vereceğiniz çalışma arkadaşınızı seçin.', 'warning');
      return false;
    }

    if (!message || message.trim().length < 5) {
      showToast('Lütfen en az 5 karakterlik açıklama girin.', 'warning');
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

    showToast(`Geri bildirim iletildi! ${recipient.name} takdir edildi. 🎉`, 'success');
    return true;
  }

  // ==================== ANALİTİK HESAPLAMA ====================
  function computeAnalytics() {
    const total = state.feedbacks.length;
    const kudosCount = state.feedbacks.filter((f) => f.type === 'kudos').length;
    const isgCount = state.feedbacks.filter((f) => f.type === 'isg' || f.category === 'isg').length;
    const kaizenCount = state.feedbacks.filter((f) => f.type === 'kaizen' || f.category === 'kaizen').length;
    const resolvedCount = state.feedbacks.filter((f) => f.status === 'resolved').length;
    const kudosPercent = total > 0 ? Math.round((kudosCount / total) * 100) : 0;

    const categories = {
      isg: { label: 'İSG & Emniyet', count: 0, color: '#d97706' },
      '5s': { label: '5S Düzen', count: 0, color: '#7c3aed' },
      kaizen: { label: 'Kaizen', count: 0, color: '#0284c7' },
      quality: { label: 'Kalite', count: 0, color: '#4f46e5' },
      teamwork: { label: 'Takım Ruhu', count: 0, color: '#059669' }
    };

    state.feedbacks.forEach((f) => {
      const catKey = f.category || 'teamwork';
      if (categories[catKey]) categories[catKey].count++;
      else categories.teamwork.count++;
    });

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

    const deptMap = {};
    state.feedbacks.forEach((f) => {
      const emp = state.employees.find((e) => e.id === f.toId);
      const dept = emp ? emp.department : 'Genel';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    // En çok takdir alanlar (Top 5)
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
      resolvedCount,
      categories,
      shifts,
      deptMap,
      topLeaders
    };
  }

  // ==================== CSV / EXPORT ====================
  function exportCSV() {
    if (state.feedbacks.length === 0) {
      showToast('Dışa aktarılacak geri bildirim bulunmuyor.', 'warning');
      return;
    }

    const headers = ['ID', 'Tarih', 'Gönderen', 'Alıcı', 'Tür', 'Kategori', 'Rozet', 'Vardiya', 'Durum', 'Mesaj'];
    const rows = state.feedbacks.map((f) => {
      const cleanMsg = (f.message || '').replace(/"/g, '""');
      return [
        f.id,
        new Date(f.createdAt).toLocaleString('tr-TR'),
        f.fromName,
        f.toName,
        f.type,
        f.category,
        f.badge || '',
        f.shift || '1. Vardiya',
        f.status || 'resolved',
        `"${cleanMsg}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safe5_geribildirim_raporu_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV raporu Excel uyumlu olarak indirildi.', 'success');
  }

  // ==================== GRAFİK ÇİZİMİ ====================
  function renderCharts(analytics) {
    const textColor = '#1e293b';
    const gridColor = 'rgba(0, 0, 0, 0.05)';

    // 1. Kategori Dağılımı
    const catCanvas = document.getElementById('chartCategory');
    if (catCanvas && window.Chart) {
      if (state.chartInstances.cat) state.chartInstances.cat.destroy();
      const ctx = catCanvas.getContext('2d');
      state.chartInstances.cat = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.values(analytics.categories).map((c) => c.label),
          datasets: [{
            data: Object.values(analytics.categories).map((c) => c.count),
            backgroundColor: Object.values(analytics.categories).map((c) => c.color),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12 } }
          }
        }
      });
    }

    // 2. Departman Dağılımı
    const deptCanvas = document.getElementById('chartDepartment');
    if (deptCanvas && window.Chart) {
      if (state.chartInstances.dept) state.chartInstances.dept.destroy();
      const ctx = deptCanvas.getContext('2d');
      state.chartInstances.dept = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(analytics.deptMap),
          datasets: [{
            label: 'Bildirim Sayısı',
            data: Object.values(analytics.deptMap),
            backgroundColor: '#059669',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
            x: { ticks: { color: textColor, maxRotation: 20 }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 3. Vardiya Dağılımı
    const shiftCanvas = document.getElementById('chartShift');
    if (shiftCanvas && window.Chart) {
      if (state.chartInstances.shift) state.chartInstances.shift.destroy();
      const ctx = shiftCanvas.getContext('2d');
      state.chartInstances.shift = new window.Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: ['1. Vardiya', '2. Vardiya', '3. Vardiya'],
          datasets: [{
            data: [analytics.shifts['1. Vardiya'], analytics.shifts['2. Vardiya'], analytics.shifts['3. Vardiya']],
            backgroundColor: ['rgba(5, 150, 105, 0.75)', 'rgba(2, 132, 199, 0.75)', 'rgba(79, 70, 229, 0.75)']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12 } } }
        }
      });
    }
  }

  // ==================== ANA ARAYÜZ (RENDER UI) ====================
  function renderUI() {
    enforceLightTheme();
    const appRoot = document.getElementById('safeAppRoot');
    if (!appRoot) return;

    const user = state.currentUser;
    const userIsAdmin = isAdmin();
    const userCanAnalytics = canViewAnalytics();

    // ==================== 1. SIDEBAR NAVBAR ====================
    const sidebarHtml = `
      <aside class="safe-sidebar">
        <!-- Logo & Başlık -->
        <div class="safe-sidebar-brand">
          <img src="icon.svg" alt="Safe5" class="safe-sidebar-logo" />
          <div>
            <h2 class="safe-brand-title">Safe5</h2>
            <span class="safe-brand-subtitle">Fabrika İletişim Paneli</span>
          </div>
        </div>

        <!-- Yan Sekmeler (Navbar) -->
        <nav class="safe-nav-menu">
          <!-- 1. Geri Bildirim Ver (ANASAYFA) -->
          <button type="button" class="safe-nav-item ${state.activeTab === 'give-feedback' ? 'active' : ''}" data-nav-tab="give-feedback">
            <div class="safe-nav-left">
              <span class="safe-nav-icon">✍️</span>
              <span class="safe-nav-text">Geri Bildirim Ver</span>
            </div>
            <span class="safe-nav-badge">Ana Sayfa</span>
          </button>

          <!-- 2. Geri Bildirimleri İncele (GÖRME EKRANI) -->
          <button type="button" class="safe-nav-item ${state.activeTab === 'view-feedbacks' ? 'active' : ''}" data-nav-tab="view-feedbacks">
            <div class="safe-nav-left">
              <span class="safe-nav-icon">📬</span>
              <span class="safe-nav-text">Geri Bildirimler</span>
            </div>
            <span class="safe-nav-count">${state.feedbacks.length}</span>
          </button>

          <!-- 3. Veri Analizi (SADECE ANALİZ YETKİSİ OLANLAR VEYA ADMIN) -->
          ${userCanAnalytics ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'analytics' ? 'active' : ''}" data-nav-tab="analytics">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">📊</span>
                <span class="safe-nav-text">Veri Analizi</span>
              </div>
              <span class="safe-nav-pill">Yetkili</span>
            </button>
          ` : ''}

          <!-- 4. Kullanıcı Yönetimi (SADECE ADMIN) -->
          ${userIsAdmin ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'user-management' ? 'active' : ''}" data-nav-tab="user-management">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">👥</span>
                <span class="safe-nav-text">Kullanıcı Yönetimi</span>
              </div>
              <span class="safe-nav-pill admin">Admin</span>
            </button>
          ` : ''}
        </nav>

        <!-- Yan Menü Altı: Aktif Kullanıcı Kartı & Profil Değiştirici -->
        <div class="safe-sidebar-user">
          <div class="safe-user-card">
            <div class="safe-user-top">
              <div class="safe-avatar ${userIsAdmin ? 'admin-avatar' : ''}">
                ${user ? user.initials : 'SF'}
              </div>
              <div style="min-width: 0;">
                <div class="safe-user-name" title="${user ? user.name : ''}">
                  ${user ? user.name : 'Misafir'}
                </div>
                <div class="safe-user-meta">
                  ${user ? `${user.department} • ${user.title}` : ''}
                </div>
              </div>
            </div>

            <!-- Yetki Rozetleri -->
            <div class="safe-user-perms">
              <span class="safe-perm-tag feedback">✓ Geri Bildirim</span>
              ${userCanAnalytics ? '<span class="safe-perm-tag analytics">✓ Veri Analizi</span>' : ''}
              ${userIsAdmin ? '<span class="safe-perm-tag admin">👑 Admin</span>' : ''}
            </div>

            <button type="button" class="safe-btn safe-btn-outline safe-btn-sm" style="width: 100%;" id="btnSwitchProfile">
              <span>🔄</span>
              <span>Kullanıcı / Rol Değiştir</span>
            </button>
          </div>
        </div>
      </aside>
    `;

    // ==================== 2. SAĞ İÇERİK EKRANLARI ====================
    let screenHtml = '';

    if (state.activeTab === 'give-feedback') {
      // EKRAN 1: GERİ BİLDİRİM VERME (ANASAYFA)
      screenHtml = renderGiveFeedbackScreen();
    } else if (state.activeTab === 'view-feedbacks') {
      // EKRAN 2: GERİ BİLDİRİMLERİ GÖRME (AYRI EKRAN)
      screenHtml = renderViewFeedbacksScreen();
    } else if (state.activeTab === 'analytics') {
      // EKRAN 3: VERİ ANALİZİ EKRANI (YETKİYE GÖRE)
      screenHtml = renderAnalyticsScreen();
    } else if (state.activeTab === 'user-management') {
      // EKRAN 4: KULLANICI & YETKİ YÖNETİMİ (SADECE ADMİN)
      screenHtml = renderUserManagementScreen();
    }

    // Birleşik Düzen
    appRoot.innerHTML = `
      <div class="safe-app-layout">
        ${sidebarHtml}
        <main class="safe-main-content">
          ${screenHtml}
        </main>
      </div>

      <!-- KULLANICI / PROFİL DEĞİŞTİRME MODALI -->
      <div class="safe-modal-backdrop" id="modalSwitchProfile">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>🔄</span> Kullanıcı / Rol Değiştir</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <p style="font-size:0.88rem; color:var(--safe-text-secondary); margin-bottom:1.25rem;">
            Farklı yetkilere sahip çalışanlar ve Admin rolü arasında geçiş yaparak ekranları test edebilirsiniz:
          </p>

          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            ${state.employees.map((emp) => {
              const isCurrent = user && user.id === emp.id;
              const hasAnalyt = Array.isArray(emp.permissions) && emp.permissions.includes('analytics');
              return `
                <div class="safe-user-card" style="cursor:pointer; ${isCurrent ? 'border-color:var(--safe-primary); background:var(--safe-primary-light);' : ''}" data-pick-user="${emp.id}">
                  <div class="safe-user-top" style="margin-bottom:0.4rem;">
                    <div class="safe-avatar ${emp.role === 'admin' ? 'admin-avatar' : ''}">
                      ${emp.initials}
                    </div>
                    <div style="flex:1;">
                      <div style="display:flex; align-items:center; justify-content:space-between;">
                        <span style="font-weight:700; color:var(--safe-text); font-size:0.92rem;">${emp.name}</span>
                        ${isCurrent ? '<span style="font-size:0.75rem; color:var(--safe-primary); font-weight:700;">(Aktif Hesap)</span>' : ''}
                      </div>
                      <div style="font-size:0.78rem; color:var(--safe-text-muted);">${emp.department} • ${emp.title} (${emp.shift})</div>
                    </div>
                  </div>
                  <div class="safe-user-perms" style="margin-bottom:0;">
                    <span class="safe-perm-tag feedback">Geri Bildirim</span>
                    ${hasAnalyt ? '<span class="safe-perm-tag analytics">Veri Analizi Yetkili</span>' : '<span style="font-size:0.68rem; color:var(--safe-text-muted); padding:0.15rem 0.45rem;">(Analiz Yetkisi Yok)</span>'}
                    ${emp.role === 'admin' ? '<span class="safe-perm-tag admin">👑 Admin</span>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- YENİ KULLANICI EKLEME MODALI (ADMIN) -->
      <div class="safe-modal-backdrop" id="modalAddUser">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>👤</span> Yeni Kullanıcı / Personel Ekle</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formAddUser">
            <div class="safe-form-group">
              <label class="safe-label">Ad Soyad <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newUserName" placeholder="Örn: Caner Korkmaz" required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Bölüm / Departman</label>
              <select class="safe-select" id="newUserDept">
                <option value="Montaj Hattı">Montaj Hattı</option>
                <option value="Talaşlı İmalat">Talaşlı İmalat</option>
                <option value="Kalite Güvence">Kalite Güvence</option>
                <option value="Bakım & Onarım">Bakım & Onarım</option>
                <option value="Depo & Lojistik">Depo & Lojistik</option>
                <option value="Kaynak & Gövde">Kaynak & Gövde</option>
                <option value="İSG & Çevre">İSG & Çevre</option>
                <option value="Kaizen & Metot">Kaizen & Metot</option>
              </select>
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Görevi / Ünvanı</label>
              <input type="text" class="safe-input" id="newUserTitle" placeholder="Örn: Montaj Operatörü, Hat Lideri..." required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Vardiya</label>
              <select class="safe-select" id="newUserShift">
                <option value="1. Vardiya (08:00 - 16:00)">1. Vardiya (08:00 - 16:00)</option>
                <option value="2. Vardiya (16:00 - 24:00)">2. Vardiya (16:00 - 24:00)</option>
                <option value="3. Vardiya (24:00 - 08:00)">3. Vardiya (24:00 - 08:00)</option>
                <option value="Genel Mesai (08:30 - 17:30)">Genel Mesai (08:30 - 17:30)</option>
              </select>
            </div>

            <!-- Yetkilendirme Bölümü -->
            <div class="safe-form-group" style="background:var(--safe-bg-subtle); padding:1rem; border-radius:10px; border:1px solid var(--safe-border);">
              <label class="safe-label" style="margin-bottom:0.6rem;">Kullanıcı Yetkileri</label>
              
              <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.6rem;">
                <input type="checkbox" checked disabled style="width:18px; height:18px; accent-color:var(--safe-primary);" />
                <span style="font-size:0.88rem; font-weight:600; color:var(--safe-text);">
                  ✍️ Geri Bildirim Yetkisi <span style="font-size:0.75rem; color:var(--safe-primary);">(Varsayılan)</span>
                </span>
              </div>

              <div style="display:flex; align-items:center; gap:0.6rem;">
                <input type="checkbox" id="newUserCanAnalytics" style="width:18px; height:18px; accent-color:var(--safe-primary); cursor:pointer;" />
                <label for="newUserCanAnalytics" style="font-size:0.88rem; font-weight:600; color:var(--safe-text); cursor:pointer;">
                  📊 Veri Analizi Ekranı Görme Yetkisi
                </label>
              </div>
            </div>

            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Kullanıcıyı Kaydet</span>
            </button>
          </form>
        </div>
      </div>
    `;

    bindEvents();

    // Veri Analizi sekmesindeyse grafikleri çiz
    if (state.activeTab === 'analytics' && userCanAnalytics) {
      setTimeout(() => {
        renderCharts(computeAnalytics());
      }, 50);
    }
  }

  // ==================== EKRAN 1: GERİ BİLDİRİM VERME (ANASAYFA) ====================
  function renderGiveFeedbackScreen() {
    const user = state.currentUser;

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge primary">✨ Ana Sayfa</span>
        <h1 class="safe-page-title">Geri Bildirim &amp; Takdir Gönder</h1>
        <p class="safe-page-subtitle">
          Çalışma arkadaşınızın güvenli davranışını, 5S tertibini veya başarılı çalışmasını takdir edin.
        </p>
      </div>

      <div class="safe-card" style="max-width: 820px;">
        <form id="safeFeedbackForm">
          <!-- 1. Alıcı Seçimi -->
          <div class="safe-form-group">
            <label class="safe-label">Kime Geri Bildirim Veriyorsun? <span style="color:var(--safe-primary);">*</span></label>
            <select class="safe-select" id="inputRecipient" required>
              <option value="" disabled selected>-- Çalışma Arkadaşını Seçin --</option>
              ${state.employees
                .filter((e) => !user || e.id !== user.id)
                .map((e) => `<option value="${e.id}">${e.name} — ${e.department} (${e.title})</option>`)
                .join('')}
            </select>
          </div>

          <!-- 2. Bildirim Türü (3 Ana Tip) -->
          <div class="safe-form-group">
            <label class="safe-label">Bildirim Türü</label>
            <div class="safe-type-switcher">
              <button type="button" class="safe-type-btn kudos ${state.selectedType === 'kudos' ? 'active' : ''}" data-type="kudos">
                <span class="safe-type-btn-title"><span>🌟</span> Takdir &amp; Teşekkür</span>
                <span class="safe-type-btn-desc">Örnek çalışma ve vardiya desteği</span>
              </button>

              <button type="button" class="safe-type-btn kaizen ${state.selectedType === 'kaizen' ? 'active' : ''}" data-type="kaizen">
                <span class="safe-type-btn-title"><span>💡</span> Kaizen &amp; Öneri</span>
                <span class="safe-type-btn-desc">Süreç ve verimlilik iyileştirmesi</span>
              </button>

              <button type="button" class="safe-type-btn isg ${state.selectedType === 'isg' ? 'active' : ''}" data-type="isg">
                <span class="safe-type-btn-title"><span>🦺</span> İSG &amp; Güvenlik</span>
                <span class="safe-type-btn-desc">KKD kullanımı &amp; ramak kala bildirimi</span>
              </button>
            </div>
          </div>

          <!-- 3. 5S ve Fabrika Standartları Değerleri -->
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
                <span class="safe-cat-label">Kaizen</span>
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

          <!-- 4. Takdir Rozetleri -->
          <div class="safe-form-group">
            <label class="safe-label">Özel Takdir Rozeti</label>
            <div class="safe-badge-pill-list">
              ${['🏆 Ayın Yıldızı', '🦺 İSG Öncüsü', '💡 Kaizen Ustası', '🤝 Takım Ruhu', '⚙️ Hızlı Çözüm', '🎯 Sıfır Hata'].map((b) => `
                <button type="button" class="safe-badge-pill ${state.selectedBadge === b ? 'selected' : ''}" data-badge="${b}">
                  ${b}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 5. Mesaj Kutusu -->
          <div class="safe-form-group">
            <label class="safe-label">Açıklama / Mesaj Notun <span style="color:var(--safe-primary);">*</span></label>
            <textarea class="safe-textarea" id="inputMessage" placeholder="Örn: 1. hatta hidrolik pres sızıntısını 15 dakikada çözdü ve 5S tertibini uyguladı..." required></textarea>
          </div>

          <!-- 6. Anonimlik ve Vardiya -->
          <div class="safe-inline-controls">
            <label class="safe-switch-label">
              <input type="checkbox" id="inputIsAnonymous" ${state.isAnonymous ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--safe-primary); cursor:pointer;" />
              <div>
                <div>🕵️‍♂️ Anonim Gönder</div>
                <div style="font-size:0.75rem; color:var(--safe-text-muted); font-weight:normal;">İsmim gizlensin, sadece mesajım görünsün</div>
              </div>
            </label>

            <div>
              <label class="safe-label" style="font-size:0.8rem; margin-bottom:0.25rem;">Vardiya Bilgisi</label>
              <select class="safe-select" id="inputShift">
                <option value="1. Vardiya" selected>1. Vardiya (08:00 - 16:00)</option>
                <option value="2. Vardiya">2. Vardiya (16:00 - 24:00)</option>
                <option value="3. Vardiya">3. Vardiya (24:00 - 08:00)</option>
                <option value="Genel Mesai">Genel Mesai (08:30 - 17:30)</option>
              </select>
            </div>
          </div>

          <!-- Gönder Butonu -->
          <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width: 100%;">
            <span>🚀</span>
            <span>Geri Bildirimi İlet</span>
          </button>
        </form>
      </div>
    `;
  }

  // ==================== EKRAN 2: GERİ BİLDİRİMLERİ İNCELEME (AYRI EKRAN) ====================
  function renderViewFeedbacksScreen() {
    const user = state.currentUser;
    let list = [...state.feedbacks];

    // Sekme Filtresi (Tümü / Gelenler / Gönderilenler)
    if (state.feedFilter === 'received' && user) {
      list = list.filter((f) => f.toId === user.id);
    } else if (state.feedFilter === 'sent' && user) {
      list = list.filter((f) => f.fromId === user.id);
    }

    // Tür Filtresi
    if (state.feedTypeFilter !== 'all') {
      list = list.filter((f) => f.type === state.feedTypeFilter);
    }

    // Arama Filtresi
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter((f) =>
        f.fromName.toLowerCase().includes(q) ||
        f.toName.toLowerCase().includes(q) ||
        (f.message && f.message.toLowerCase().includes(q))
      );
    }

    const receivedCount = user ? state.feedbacks.filter((f) => f.toId === user.id).length : 0;
    const sentCount = user ? state.feedbacks.filter((f) => f.fromId === user.id).length : 0;

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge indigo">📬 Geri Bildirimler</span>
        <h1 class="safe-page-title">Fabrika Geri Bildirim Panosu</h1>
        <p class="safe-page-subtitle">Çalışanların birbirine ilettiği takdir, 5S ve İSG bildirimlerini inceleyin.</p>
      </div>

      <!-- Filtreler Çubuğu -->
      <div class="safe-feed-filter-bar">
        <div class="safe-feed-tabs">
          <button type="button" class="safe-feed-tab ${state.feedFilter === 'all' ? 'active' : ''}" data-feed-filter="all">
            🌍 Tüm Akış (${state.feedbacks.length})
          </button>
          <button type="button" class="safe-feed-tab ${state.feedFilter === 'received' ? 'active' : ''}" data-feed-filter="received">
            📬 Bana Gelenler (${receivedCount})
          </button>
          <button type="button" class="safe-feed-tab ${state.feedFilter === 'sent' ? 'active' : ''}" data-feed-filter="sent">
            📤 Gönderdiklerim (${sentCount})
          </button>
        </div>

        <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
          <select class="safe-select" id="feedTypeSelect" style="max-width:160px; padding:0.5rem 0.8rem; font-size:0.86rem;">
            <option value="all" ${state.feedTypeFilter === 'all' ? 'selected' : ''}>Tüm Türler</option>
            <option value="kudos" ${state.feedTypeFilter === 'kudos' ? 'selected' : ''}>🌟 Takdir &amp; Teşekkür</option>
            <option value="kaizen" ${state.feedTypeFilter === 'kaizen' ? 'selected' : ''}>💡 Kaizen &amp; Öneri</option>
            <option value="isg" ${state.feedTypeFilter === 'isg' ? 'selected' : ''}>🦺 İSG &amp; Güvenlik</option>
          </select>

          <input type="text" class="safe-input" id="feedSearchInput" placeholder="Personel veya mesajda ara..." style="max-width:220px; padding:0.5rem 0.8rem; font-size:0.86rem;" value="${state.searchQuery}" />
        </div>
      </div>

      <!-- Kart Listesi -->
      <div class="safe-feed-list">
        ${list.length > 0 ? list.map((f) => {
          const timeDiff = getTimeAgo(f.createdAt);
          const isRecipient = user && user.id === f.toId;

          return `
            <div class="safe-feed-card" style="${isRecipient ? 'border-left: 4px solid var(--safe-primary);' : ''}">
              <div class="safe-feed-card-header">
                <div class="safe-feed-actors">
                  <span>${f.fromName}</span>
                  <span class="safe-feed-arrow">➔</span>
                  <span style="color:var(--safe-primary);">${f.toName}</span>
                </div>
                <div class="safe-feed-date">${timeDiff} • ${f.shift || '1. Vardiya'}</div>
              </div>

              <div class="safe-feed-tags">
                <span class="safe-tag ${f.type}">
                  ${f.type === 'kudos' ? '🌟 Takdir &amp; Teşekkür' : f.type === 'isg' ? '🦺 İSG Bildirimi' : '💡 Kaizen Önerisi'}
                </span>
                ${f.badge ? `<span class="safe-tag badge-custom">${f.badge}</span>` : ''}
                <span class="safe-tag badge-custom">${getCategoryName(f.category)}</span>
              </div>

              <div class="safe-feed-body">
                "${f.message}"
              </div>

              <div class="safe-feed-footer">
                <span>Tarih: ${new Date(f.createdAt).toLocaleDateString('tr-TR')}</span>
                <span class="safe-status-pill ${f.status || 'resolved'}">
                  ${f.status === 'resolved' ? '✓ Tamamlandı' : f.status === 'in_progress' ? '⚙️ Aksiyon Alındı' : '⏳ İnceleniyor'}
                </span>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="safe-card" style="text-align:center; padding:3.5rem 1rem;">
            <div style="font-size:2.5rem; margin-bottom:0.75rem;">📭</div>
            <h3 style="color:var(--safe-text); margin-bottom:0.35rem;">Bu filtreye uygun bildirim bulunamadı.</h3>
            <p style="color:var(--safe-text-muted); font-size:0.88rem;">Sol menüden 'Geri Bildirim Ver' sekmesine giderek yeni bir takdir iletebilirsiniz.</p>
          </div>
        `}
      </div>
    `;
  }

  // ==================== EKRAN 3: VERİ ANALİZİ EKRANI ====================
  function renderAnalyticsScreen() {
    if (!canViewAnalytics()) {
      return `
        <div class="safe-lock-box">
          <div class="safe-lock-icon">🔒</div>
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--safe-text); margin-bottom:0.5rem;">Yetki Gerekli</h2>
          <p style="color:var(--safe-text-secondary); font-size:0.92rem; line-height:1.5; margin-bottom:1.5rem;">
            Bu veri analizi ve grafik ekranını görüntülemek için <b>'Veri Analizi'</b> yetkisine sahip olmanız gerekmektedir.
          </p>
          <button type="button" class="safe-btn safe-btn-outline" id="btnSwitchProfile">
            <span>🔄</span> <span>Yetkili Bir Kullanıcıya Geç</span>
          </button>
        </div>
      `;
    }

    const analytics = computeAnalytics();

    return `
      <div class="safe-page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="safe-page-badge primary">📊 Veri Analizi</span>
          <h1 class="safe-page-title">Fabrika Geri Bildirim Analitikleri</h1>
          <p class="safe-page-subtitle">Metrikler, kategori oranları, departman ve vardiya analizleri</p>
        </div>

        <button type="button" class="safe-btn safe-btn-primary" id="btnExportCSV">
          <span>📥</span>
          <span>Excel / CSV Raporu İndir</span>
        </button>
      </div>

      <!-- KPI KARTLARI -->
      <div class="safe-kpi-grid">
        <div class="safe-kpi-card">
          <div class="safe-kpi-top">
            <span class="safe-kpi-title">Toplam Bildirim</span>
            <span class="safe-kpi-icon">📢</span>
          </div>
          <div class="safe-kpi-num">${analytics.total}</div>
          <div class="safe-kpi-note">Fabrika çalışanları arası etkileşim</div>
        </div>

        <div class="safe-kpi-card kpi-team">
          <div class="safe-kpi-top">
            <span class="safe-kpi-title">Takdir / Moral Oranı</span>
            <span class="safe-kpi-icon">⭐</span>
          </div>
          <div class="safe-kpi-num">%${analytics.kudosPercent}</div>
          <div class="safe-kpi-note">${analytics.kudosCount} adet pozitif takdir</div>
        </div>

        <div class="safe-kpi-card kpi-isg">
          <div class="safe-kpi-top">
            <span class="safe-kpi-title">İSG Bildirimleri</span>
            <span class="safe-kpi-icon">🦺</span>
          </div>
          <div class="safe-kpi-num">${analytics.isgCount}</div>
          <div class="safe-kpi-note">Kaza önleme &amp; güvenli çalışma</div>
        </div>

        <div class="safe-kpi-card kpi-kaizen">
          <div class="safe-kpi-top">
            <span class="safe-kpi-title">Kaizen Aksiyonları</span>
            <span class="safe-kpi-icon">💡</span>
          </div>
          <div class="safe-kpi-num">${analytics.kaizenCount}</div>
          <div class="safe-kpi-note">Süreç ve verimlilik önerisi</div>
        </div>
      </div>

      <!-- GRAFİKLER -->
      <div class="safe-charts-grid">
        <!-- Grafik 1: Kategori Dağılımı -->
        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>🎯</span> Kategori Dağılımı</h3>
              <p class="safe-card-desc">İSG, 5S, Kaizen ve Takım Ruhu odakları</p>
            </div>
          </div>
          <div class="safe-chart-container">
            <canvas id="chartCategory"></canvas>
          </div>
        </div>

        <!-- Grafik 2: Departman Yoğunluğu -->
        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>🏢</span> Departman Bazlı Bildirimler</h3>
              <p class="safe-card-desc">En çok geri bildirim alan hatlar ve birimler</p>
            </div>
          </div>
          <div class="safe-chart-container">
            <canvas id="chartDepartment"></canvas>
          </div>
        </div>

        <!-- Grafik 3: Vardiya Katılımı -->
        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>⏰</span> Vardiya Bazlı Dağılım</h3>
              <p class="safe-card-desc">1., 2. ve 3. Vardiya katılım oranları</p>
            </div>
          </div>
          <div class="safe-chart-container">
            <canvas id="chartShift"></canvas>
          </div>
        </div>

        <!-- Liderlik Panosu -->
        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>🏆</span> En Çok Takdir Edilenler</h3>
              <p class="safe-card-desc">Örnek davranış ve iş birliği liderleri</p>
            </div>
          </div>
          <div class="safe-leader-list">
            ${analytics.topLeaders.map((lead, idx) => `
              <div class="safe-leader-item">
                <div class="safe-leader-left">
                  <div class="safe-rank-circle r${idx + 1}">${idx + 1}</div>
                  <div>
                    <div style="font-weight:700; color:var(--safe-text);">${lead.name}</div>
                    <div style="font-size:0.78rem; color:var(--safe-text-muted);">${lead.department}</div>
                  </div>
                </div>
                <div style="font-weight:800; color:var(--safe-primary); font-size:0.95rem;">
                  ${lead.score} Takdir
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==================== EKRAN 4: KULLANICI & YETKİ YÖNETİMİ (SADECE ADMIN) ====================
  function renderUserManagementScreen() {
    if (!isAdmin()) {
      return `
        <div class="safe-lock-box">
          <div class="safe-lock-icon">👑</div>
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--safe-text); margin-bottom:0.5rem;">Yönetici Yetkisi Gerekli</h2>
          <p style="color:var(--safe-text-secondary); font-size:0.92rem; line-height:1.5; margin-bottom:1.5rem;">
            Kullanıcı ekleme, çıkarma ve yetkilendirme işlemleri yalnızca Fabrika Yöneticisi (Admin) tarafından yapılabilir.
          </p>
          <button type="button" class="safe-btn safe-btn-outline" id="btnSwitchProfile">
            <span>🔄</span> <span>Yönetici Hesabına Geç</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="safe-page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="safe-page-badge indigo">👑 Yönetici Paneli</span>
          <h1 class="safe-page-title">Kullanıcı &amp; Yetki Yönetimi</h1>
          <p class="safe-page-subtitle">Fabrika çalışanlarını yönetin, yeni personel ekleyin ve 'Veri Analizi' yetkilerini düzenleyin.</p>
        </div>

        <button type="button" class="safe-btn safe-btn-primary" id="btnOpenAddUser">
          <span>➕</span>
          <span>Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Departman &amp; Görev</th>
              <th>Vardiya</th>
              <th>Rol</th>
              <th>Yetkiler (Yetkilendirme)</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${state.employees.map((emp) => {
              const hasAnalytics = Array.isArray(emp.permissions) && emp.permissions.includes('analytics');
              const isSelf = state.currentUser && state.currentUser.id === emp.id;

              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.65rem;">
                      <div class="safe-avatar ${emp.role === 'admin' ? 'admin-avatar' : ''}" style="width:34px; height:34px; font-size:0.82rem;">
                        ${emp.initials}
                      </div>
                      <div>
                        <div style="font-weight:700; color:var(--safe-text);">${emp.name}</div>
                        <div style="font-size:0.75rem; color:var(--safe-text-muted);">${emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${emp.department}</div>
                    <div style="font-size:0.78rem; color:var(--safe-text-muted);">${emp.title}</div>
                  </td>
                  <td style="font-size:0.84rem; white-space:nowrap;">${emp.shift}</td>
                  <td>
                    <span class="safe-tag ${emp.role === 'admin' ? 'isg' : 'badge-custom'}" style="font-size:0.75rem;">
                      ${emp.role === 'admin' ? '👑 Admin' : '👷 Çalışan'}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:0.4rem;">
                      <!-- Geri Bildirim Yetkisi (Default & Sabit) -->
                      <span class="safe-perm-tag feedback" title="Tüm çalışanlarda varsayılan olarak aktiftir">
                        ✓ Geri Bildirim (Default)
                      </span>

                      <!-- Veri Analizi Yetkisi (Açılıp Kapanabilir) -->
                      <label style="display:flex; align-items:center; gap:0.45rem; cursor:pointer; font-size:0.8rem; user-select:none;">
                        <input type="checkbox" class="safe-perm-toggle" data-user-id="${emp.id}" data-perm="analytics" ${hasAnalytics ? 'checked' : ''} style="accent-color:var(--safe-primary); width:16px; height:16px; cursor:pointer;" />
                        <span style="font-weight:${hasAnalytics ? '700' : 'normal'}; color:${hasAnalytics ? 'var(--safe-sky)' : 'var(--safe-text-muted)'};">
                          📊 Veri Analizi Yetkisi
                        </span>
                      </label>
                    </div>
                  </td>
                  <td>
                    ${!isSelf ? `
                      <button type="button" class="safe-btn safe-btn-sm safe-btn-danger" data-remove-user="${emp.id}">
                        <span>🗑️ Sil</span>
                      </button>
                    ` : '<span style="font-size:0.75rem; color:var(--safe-text-muted);">(Aktif Yönetici)</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==================== YARDIMCI METOTLAR ====================
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

  // ==================== OLAY DİNLEYİCİLERİ (EVENTS) ====================
  function bindEvents() {
    // 1. Sidebar Navigasyon Butonları
    document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-nav-tab');
        renderUI();
      });
    });

    // 2. Geri Bildirim Formu Gönderimi
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
          // Gönderdikten sonra geri bildirimleri görme ekranına geçebilir
          setTimeout(() => {
            state.activeTab = 'view-feedbacks';
            renderUI();
          }, 800);
        }
      });
    }

    // 3. Tür ve Kategori Seçicileri
    document.querySelectorAll('.safe-type-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedType = btn.getAttribute('data-type');
        document.querySelectorAll('.safe-type-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.querySelectorAll('.safe-cat-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.selectedCategory = card.getAttribute('data-cat');
        document.querySelectorAll('.safe-cat-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    document.querySelectorAll('.safe-badge-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        state.selectedBadge = pill.getAttribute('data-badge');
        document.querySelectorAll('.safe-badge-pill').forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
    });

    // 4. Geri Bildirim İnceleme Ekranı Filtreleri
    document.querySelectorAll('[data-feed-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        state.feedFilter = tab.getAttribute('data-feed-filter');
        renderUI();
      });
    });

    const feedTypeSelect = document.getElementById('feedTypeSelect');
    if (feedTypeSelect) {
      feedTypeSelect.addEventListener('change', (e) => {
        state.feedTypeFilter = e.target.value;
        renderUI();
      });
    }

    const feedSearchInput = document.getElementById('feedSearchInput');
    if (feedSearchInput) {
      feedSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderUI();
      });
    }

    // 5. CSV Rapor İndirme
    const btnCSV = document.getElementById('btnExportCSV');
    if (btnCSV) btnCSV.addEventListener('click', exportCSV);

    // 6. Profil / Kullanıcı Değiştirme Modalı
    const modalSwitch = document.getElementById('modalSwitchProfile');
    const btnSwitch = document.getElementById('btnSwitchProfile');
    if (btnSwitch && modalSwitch) {
      btnSwitch.addEventListener('click', () => modalSwitch.classList.add('active'));
    }

    document.querySelectorAll('[data-pick-user]').forEach((card) => {
      card.addEventListener('click', () => {
        const uid = card.getAttribute('data-pick-user');
        switchUser(uid);
      });
    });

    // 7. Yeni Kullanıcı Ekleme Modalı (Admin)
    const modalAdd = document.getElementById('modalAddUser');
    const btnOpenAdd = document.getElementById('btnOpenAddUser');
    if (btnOpenAdd && modalAdd) {
      btnOpenAdd.addEventListener('click', () => modalAdd.classList.add('active'));
    }

    const formAdd = document.getElementById('formAddUser');
    if (formAdd) {
      formAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newUserName').value;
        const dept = document.getElementById('newUserDept').value;
        const title = document.getElementById('newUserTitle').value;
        const shift = document.getElementById('newUserShift').value;
        const canAnalytics = document.getElementById('newUserCanAnalytics').checked;

        const ok = addUser({
          name,
          department: dept,
          title,
          shift,
          canAnalytics,
          role: 'worker'
        });

        if (ok && modalAdd) {
          modalAdd.classList.remove('active');
        }
      });
    }

    // 8. Kullanıcı Silme
    document.querySelectorAll('[data-remove-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-remove-user');
        removeUser(uid);
      });
    });

    // 9. Yetki Değiştirme (Analytics Toggle)
    document.querySelectorAll('.safe-perm-toggle').forEach((chk) => {
      chk.addEventListener('change', () => {
        const uid = chk.getAttribute('data-user-id');
        const perm = chk.getAttribute('data-perm');
        toggleUserPermission(uid, perm);
      });
    });

    // 10. Modalları Kapatma
    document.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.safe-modal-backdrop').forEach((m) => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.safe-modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      });
    });
  }

  // ==================== BAŞLATICI ====================
  document.addEventListener('DOMContentLoaded', () => {
    enforceLightTheme();
    loadData();
    renderUI();
  });
})();
