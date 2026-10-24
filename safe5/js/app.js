/**
 * Safe5 — Fabrika Geri Bildirim & Analitik Sistemi
 * TC & Şifre Tabanlı Giriş, Rol Tabanlı Dinamik Yetkilendirme (RBAC)
 * Firebase Canlı Bulut Veritabanı Entegrasyonu & Local-First Mimarisi
 */

(function () {
  'use strict';

  // ==================== TEMA ZORLAMASI ====================
  function enforceLightTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }
  enforceLightTheme();

  // ==================== STORAGE KEYS ====================
  const STORAGE_KEYS = {
    AUTH_USER: 'safe5_auth_session_v3',
    USERS: 'safe5_users_v3',
    ROLES: 'safe5_roles_v3',
    FEEDBACKS: 'safe5_feedbacks_v3',
    FIREBASE_CONFIG: 'safe5_firebase_config_v3'
  };

  // ==================== VARSAYILAN ROLLER (RBAC) ====================
  // Yetkiler: feedback, analytics, manage_status, manage_users, manage_roles, cloud_config
  const DEFAULT_ROLES = [
    {
      id: 'admin',
      name: 'Yönetici (Admin)',
      description: 'Fabrika genel yöneticisi; tüm yetkilere ve yönetim panellerine sahiptir.',
      permissions: ['feedback', 'analytics', 'manage_status', 'manage_users', 'manage_roles', 'cloud_config'],
      isSystem: true
    },
    {
      id: 'worker',
      name: 'Çalışan (Operatör)',
      description: 'Fabrika sahasında çalışan, geri bildirim gönderen ve akışı izleyen personel.',
      permissions: ['feedback'],
      isSystem: false
    },
    {
      id: 'supervisor',
      name: 'Hat Lideri / Formen',
      description: 'Vardiya ekiplerini yönetir, geri bildirim verir ve Kaizen/İSG durumlarını günceller.',
      permissions: ['feedback', 'manage_status'],
      isSystem: false
    },
    {
      id: 'safety_quality',
      name: 'İSG & Kalite Sorumlusu',
      description: 'İSG ve kalite süreçlerini denetler, veri analitiği grafiklerini izler ve aksiyonları yönetir.',
      permissions: ['feedback', 'analytics', 'manage_status'],
      isSystem: false
    }
  ];

  // ==================== BAŞLANGIÇTA SADECE TEK ADMIN KULLANICI ====================
  const DEFAULT_USERS = [
    {
      id: 'USR-ADMIN',
      tc: '11111111111',
      password: 'admin',
      name: 'Fabrika Yöneticisi',
      roleId: 'admin',
      department: 'Fabrika Yönetimi',
      title: 'Sistem Yöneticisi',
      shift: 'Genel Mesai (08:30 - 17:30)',
      initials: 'FY',
      createdAt: new Date().toISOString()
    }
  ];

  // ==================== BAŞLANGIÇ GERİ BİLDİRİMLERİ (İLK ÖRNEKLER) ====================
  const DEFAULT_FEEDBACKS = [
    {
      id: 'FB-101',
      fromTc: '11111111111',
      fromName: 'Fabrika Yöneticisi',
      toTc: '11111111111',
      toName: 'Montaj Hattı Ekibi',
      type: 'kudos',
      category: '5s',
      message: 'Safe5 fabrika geri bildirim ve takdir platformu devreye alındı. Tüm çalışanlarımız 5S, İSG ve Kaizen önerilerini bu sistem üzerinden iletebilir.',
      shift: '1. Vardiya',
      isAnonymous: false,
      status: 'resolved',
      likes: 1,
      likedBy: ['11111111111'],
      createdAt: new Date().toISOString()
    }
  ];

  // ==================== UYGULAMA DURUMU (STATE) ====================
  const state = {
    currentUser: null, // Giriş yapan kullanıcı nesnesi
    users: [],
    roles: [],
    feedbacks: [],
    firebaseConfig: null,
    firestoreDb: null,
    activeTab: 'give-feedback', // 'give-feedback', 'view-feedbacks', 'analytics', 'user-roles', 'cloud-settings'
    activeSubTab: 'users', // 'users' veya 'roles' (user-roles ekranında)
    selectedType: 'kudos',
    selectedCategory: 'isg',
    feedFilter: 'all',
    feedTypeFilter: 'all',
    searchQuery: '',
    chartInstances: {}
  };

  // ==================== VERİ YÜKLEME VE YEREL DEPOLAMA ====================
  function loadData() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
      const storedFeedbacks = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const storedFbConfig = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);

      state.users = storedUsers ? JSON.parse(storedUsers) : JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.roles = storedRoles ? JSON.parse(storedRoles) : JSON.parse(JSON.stringify(DEFAULT_ROLES));
      state.feedbacks = storedFeedbacks ? JSON.parse(storedFeedbacks) : JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));

      if (storedFbConfig) {
        state.firebaseConfig = JSON.parse(storedFbConfig);
      }

      // Oturum kontrolü
      if (storedAuth) {
        const authTc = JSON.parse(storedAuth).tc;
        const found = state.users.find((u) => u.tc === authTc);
        if (found) {
          state.currentUser = found;
        }
      }

      if (!storedUsers) saveUsers();
      if (!storedRoles) saveRoles();
      if (!storedFeedbacks) saveFeedbacks();
    } catch (e) {
      console.warn('[Safe5] Veri yüklenirken hata:', e);
      state.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
      state.feedbacks = JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS));
      state.currentUser = null;
    }

    // Firebase başlatmayı dene
    initFirebaseIfConfigured();
  }

  function saveUsers() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
      if (state.firestoreDb) syncToCloud('users', state.users);
    } catch (e) {}
  }

  function saveRoles() {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(state.roles));
      if (state.firestoreDb) syncToCloud('roles', state.roles);
    } catch (e) {}
  }

  function saveFeedbacks() {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(state.feedbacks));
      if (state.firestoreDb) syncToCloud('feedbacks', state.feedbacks);
    } catch (e) {}
  }

  function saveSession() {
    try {
      if (state.currentUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify({ tc: state.currentUser.tc }));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {}
  }

  // ==================== FIREBASE BULUT VERİTABANI MOTORU ====================
  function initFirebaseIfConfigured() {
    if (!state.firebaseConfig || !window.firebase) return;
    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(state.firebaseConfig);
      }
      state.firestoreDb = window.firebase.firestore();
      console.log('[Safe5] Firebase Firestore canlı bulut veritabanına bağlandı.');

      // Gerçek zamanlı dinleyiciler (Realtime Cloud Listeners)
      listenToCloud('feedbacks', (data) => {
        if (Array.isArray(data)) {
          state.feedbacks = data;
          localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(data));
          if (state.activeTab === 'view-feedbacks') updateFeedListOnly();
        }
      });

      listenToCloud('users', (data) => {
        if (Array.isArray(data)) {
          state.users = data;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
        }
      });

      listenToCloud('roles', (data) => {
        if (Array.isArray(data)) {
          state.roles = data;
          localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(data));
        }
      });
    } catch (err) {
      console.warn('[Safe5] Firebase başlatılamadı, Local-First modunda çalışılıyor:', err);
    }
  }

  function syncToCloud(collectionName, dataArray) {
    if (!state.firestoreDb) return;
    try {
      state.firestoreDb.collection('safe5_data').doc(collectionName).set({
        list: dataArray,
        updatedAt: new Date().toISOString()
      }).catch((e) => console.warn('Bulut senkronizasyon hatası:', e));
    } catch (e) {}
  }

  function listenToCloud(collectionName, onUpdate) {
    if (!state.firestoreDb) return;
    try {
      state.firestoreDb.collection('safe5_data').doc(collectionName).onSnapshot((doc) => {
        if (doc && doc.exists) {
          const data = doc.data();
          if (data && Array.isArray(data.list)) {
            onUpdate(data.list);
          }
        }
      });
    } catch (e) {}
  }

  // ==================== BİLDİRİM (TOAST) ====================
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

  // ==================== DİNAMİK ROL & YETKİ MOTORU (RBAC) ====================
  function getRole(roleId) {
    return state.roles.find((r) => r.id === roleId) || null;
  }

  function hasPermission(user, permissionKey) {
    if (!user) return false;
    const role = getRole(user.roleId);
    if (!role) return false;
    if (role.id === 'admin') return true;
    return Array.isArray(role.permissions) && role.permissions.includes(permissionKey);
  }

  function isAdminUser() {
    return state.currentUser && state.currentUser.roleId === 'admin';
  }

  // ==================== GİRİŞ & ÇIKIŞ (AUTH) ====================
  function login(tc, password) {
    const cleanTc = String(tc || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanTc || !cleanPass) {
      showToast('Lütfen TC / Sicil No ve şifrenizi girin.', 'warning');
      return false;
    }

    const found = state.users.find((u) => u.tc === cleanTc && u.password === cleanPass);
    if (!found) {
      showToast('Hatalı TC veya şifre girdiniz. Lütfen tekrar deneyin.', 'warning');
      return false;
    }

    state.currentUser = found;
    saveSession();
    state.activeTab = 'give-feedback'; // Başlangıç ekranı
    showToast(`Hoş geldiniz, ${found.name}!`, 'success');
    renderUI();
    return true;
  }

  function logout() {
    state.currentUser = null;
    saveSession();
    showToast('Oturum kapatıldı.', 'info');
    renderUI();
  }

  // ==================== GERİ BİLDİRİM GÖNDERME ====================
  function submitFeedback(data) {
    const { toTc, type, category, message, shift, isAnonymous } = data;

    if (!toTc) {
      showToast('Lütfen geri bildirim vereceğiniz çalışma arkadaşınızı seçin.', 'warning');
      return false;
    }

    if (!message || message.trim().length < 5) {
      showToast('Lütfen en az 5 karakterlik anlamlı bir açıklama girin.', 'warning');
      return false;
    }

    const recipient = state.users.find((u) => u.tc === toTc);
    const recipientName = recipient ? recipient.name : toTc;

    const newFeedback = {
      id: 'FB-' + Date.now().toString(36).toUpperCase(),
      fromTc: isAnonymous ? null : (state.currentUser ? state.currentUser.tc : null),
      fromName: isAnonymous ? 'Anonim Çalışan' : (state.currentUser ? state.currentUser.name : 'Çalışan'),
      toTc: toTc,
      toName: recipientName,
      type: type || state.selectedType,
      category: category || state.selectedCategory,
      message: message.trim(),
      shift: shift || '1. Vardiya',
      isAnonymous: Boolean(isAnonymous),
      status: type === 'kaizen' || type === 'isg' ? 'in_progress' : 'resolved',
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };

    state.feedbacks.unshift(newFeedback);
    saveFeedbacks();

    showToast(`Geri bildirim başarıyla iletildi! ${recipientName} takdir edildi. 🎉`, 'success');
    return true;
  }

  // ==================== DURUM & ALKIŞ YÖNETİMİ ====================
  function updateFeedbackStatus(fbId, newStatus) {
    if (!hasPermission(state.currentUser, 'manage_status')) {
      showToast('Durum güncelleme yetkiniz bulunmuyor.', 'warning');
      return;
    }
    const target = state.feedbacks.find((f) => f.id === fbId);
    if (!target) return;
    target.status = newStatus;
    saveFeedbacks();
    showToast(`Durum güncellendi: ${newStatus === 'resolved' ? 'Tamamlandı' : newStatus === 'in_progress' ? 'Aksiyon Alındı' : 'İnceleniyor'}`, 'success');
    updateFeedListOnly();
  }

  function deleteFeedback(fbId) {
    if (!isAdminUser()) {
      showToast('Yalnızca yöneticiler geri bildirim silebilir.', 'warning');
      return;
    }
    if (confirm('Bu geri bildirimi kalıcı olarak silmek istediğinize emin misiniz?')) {
      state.feedbacks = state.feedbacks.filter((f) => f.id !== fbId);
      saveFeedbacks();
      showToast('Geri bildirim silindi.', 'success');
      updateFeedListOnly();
    }
  }

  function toggleFeedbackLike(fbId) {
    const fb = state.feedbacks.find((f) => f.id === fbId);
    if (!fb || !state.currentUser) return;

    if (!Array.isArray(fb.likedBy)) fb.likedBy = [];
    const myTc = state.currentUser.tc;
    const index = fb.likedBy.indexOf(myTc);

    if (index > -1) {
      fb.likedBy.splice(index, 1);
      fb.likes = Math.max(0, (fb.likes || 1) - 1);
    } else {
      fb.likedBy.push(myTc);
      fb.likes = (fb.likes || 0) + 1;
      showToast('Alkış iletildi! 👏', 'success');
    }

    saveFeedbacks();
    updateFeedListOnly();
  }

  // ==================== KULLANICI & ROL YÖNETİM METOTLARI ====================
  function addUser(data) {
    if (!hasPermission(state.currentUser, 'manage_users')) {
      showToast('Kullanıcı ekleme yetkiniz bulunmuyor.', 'warning');
      return false;
    }

    const { tc, password, name, department, title, shift, roleId } = data;

    if (!tc || tc.trim().length < 3) {
      showToast('Lütfen geçerli bir TC / Sicil No girin.', 'warning');
      return false;
    }

    if (!password || password.trim().length < 3) {
      showToast('Şifre en az 3 karakter olmalıdır.', 'warning');
      return false;
    }

    if (!name || name.trim().length < 3) {
      showToast('Lütfen geçerli bir ad soyad girin.', 'warning');
      return false;
    }

    if (state.users.some((u) => u.tc === tc.trim())) {
      showToast('Bu TC / Sicil No ile kayıtlı bir kullanıcı zaten mevcut.', 'warning');
      return false;
    }

    const initials = name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    const newUser = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      tc: tc.trim(),
      password: password.trim(),
      name: name.trim(),
      roleId: roleId || 'worker',
      department: department || 'Montaj Hattı',
      title: title || 'Operatör',
      shift: shift || '1. Vardiya (08:00 - 16:00)',
      initials: initials || 'ÇL',
      createdAt: new Date().toISOString()
    };

    state.users.push(newUser);
    saveUsers();
    showToast(`${newUser.name} başarıyla sisteme eklendi!`, 'success');
    renderUI();
    return true;
  }

  function editUser(userId, data) {
    if (!hasPermission(state.currentUser, 'manage_users')) {
      showToast('Kullanıcı düzenleme yetkiniz bulunmuyor.', 'warning');
      return false;
    }

    const target = state.users.find((u) => u.id === userId);
    if (!target) return false;

    target.name = data.name.trim();
    if (data.password && data.password.trim()) {
      target.password = data.password.trim();
    }
    target.department = data.department;
    target.title = data.title.trim();
    target.shift = data.shift;
    target.roleId = data.roleId;
    target.initials = target.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    saveUsers();
    if (state.currentUser && state.currentUser.id === userId) {
      state.currentUser = target;
      saveSession();
    }
    showToast(`${target.name} bilgileri güncellendi.`, 'success');
    renderUI();
    return true;
  }

  function removeUser(userId) {
    if (!hasPermission(state.currentUser, 'manage_users')) {
      showToast('Kullanıcı silme yetkiniz bulunmuyor.', 'warning');
      return;
    }

    if (state.currentUser && state.currentUser.id === userId) {
      showToast('O an aktif olan kendi hesabınızı silemezsiniz.', 'warning');
      return;
    }

    const target = state.users.find((u) => u.id === userId);
    if (!target) return;

    if (confirm(`"${target.name}" personelini silmek istediğinize emin misiniz?`)) {
      state.users = state.users.filter((u) => u.id !== userId);
      saveUsers();
      showToast(`${target.name} sistemden silindi.`, 'success');
      renderUI();
    }
  }

  function updateRolePermissions(roleId, permissionKey, isGranted) {
    if (!hasPermission(state.currentUser, 'manage_roles')) {
      showToast('Rol yetkisi değiştirme izniniz yok.', 'warning');
      return;
    }

    const role = state.roles.find((r) => r.id === roleId);
    if (!role) return;

    if (role.id === 'admin') {
      showToast('Admin rolünün yetkileri kaldırılamaz.', 'warning');
      return;
    }

    if (!Array.isArray(role.permissions)) role.permissions = [];

    if (isGranted) {
      if (!role.permissions.includes(permissionKey)) role.permissions.push(permissionKey);
    } else {
      if (permissionKey === 'feedback') {
        showToast('Geri bildirim yetkisi temel haktır, kapatılamaz.', 'warning');
        return;
      }
      role.permissions = role.permissions.filter((p) => p !== permissionKey);
    }

    saveRoles();
    showToast(`"${role.name}" rolünün yetkileri güncellendi. Bu roldeki tüm kullanıcıların yetkileri anında yansıdı!`, 'success');
    renderUI();
  }

  // ==================== CSV VE JSON RAPORLAMA ====================
  function exportCSV() {
    if (state.feedbacks.length === 0) {
      showToast('Dışa aktarılacak geri bildirim bulunmuyor.', 'warning');
      return;
    }

    const headers = ['ID', 'Tarih', 'Gönderen', 'Alıcı', 'Tür', 'Kategori', 'Vardiya', 'Durum', 'Alkış', 'Mesaj'];
    const rows = state.feedbacks.map((f) => {
      const cleanMsg = (f.message || '').replace(/"/g, '""');
      return [
        f.id,
        new Date(f.createdAt).toLocaleString('tr-TR'),
        f.fromName,
        f.toName,
        f.type,
        f.category,
        f.shift || '1. Vardiya',
        f.status || 'resolved',
        f.likes || 0,
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

  function exportJSON() {
    const backup = {
      appName: 'Safe5',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      roles: state.roles,
      users: state.users,
      feedbacks: state.feedbacks
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safe5_fabrika_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Tüm fabrika veritabanı JSON olarak yedeklendi.', 'success');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.users) && Array.isArray(data.feedbacks)) {
          state.users = data.users;
          state.feedbacks = data.feedbacks;
          if (Array.isArray(data.roles)) state.roles = data.roles;
          saveUsers();
          saveRoles();
          saveFeedbacks();
          showToast('Fabrika verileri başarıyla geri yüklendi!', 'success');
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

  // ==================== ANALİTİK HESAPLAMALAR VE GRAFİKLER ====================
  function computeAnalytics() {
    const total = state.feedbacks.length;
    const kudosCount = state.feedbacks.filter((f) => f.type === 'kudos').length;
    const isgCount = state.feedbacks.filter((f) => f.type === 'isg' || f.category === 'isg').length;
    const kaizenCount = state.feedbacks.filter((f) => f.type === 'kaizen' || f.category === 'kaizen').length;
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

    const shifts = { '1. Vardiya': 0, '2. Vardiya': 0, '3. Vardiya': 0 };
    state.feedbacks.forEach((f) => {
      if (f.shift && f.shift.includes('2')) shifts['2. Vardiya']++;
      else if (f.shift && f.shift.includes('3')) shifts['3. Vardiya']++;
      else shifts['1. Vardiya']++;
    });

    const deptMap = {};
    state.feedbacks.forEach((f) => {
      const recipient = state.users.find((u) => u.tc === f.toTc);
      const dept = recipient ? recipient.department : 'Genel';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const kudosLeaderboard = {};
    state.feedbacks.forEach((f) => {
      if (f.type === 'kudos' || f.type === 'kaizen') {
        kudosLeaderboard[f.toName] = (kudosLeaderboard[f.toName] || 0) + 1;
      }
    });

    const topLeaders = Object.keys(kudosLeaderboard)
      .map((name) => ({ name, score: kudosLeaderboard[name] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { total, kudosCount, kudosPercent, isgCount, kaizenCount, categories, shifts, deptMap, topLeaders };
  }

  function renderCharts(analytics) {
    const textColor = '#1e293b';
    const gridColor = 'rgba(0, 0, 0, 0.05)';

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
          plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12 } } }
        }
      });
    }

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

  // ==================== HEDEFE YÖNELİK LİSTE GÜNCELLEMESİ (FOCUS LOSS KORUMASI) ====================
  function updateFeedListOnly() {
    const container = document.getElementById('safeFeedListContainer');
    if (container) {
      container.innerHTML = renderFeedCardsHtml();
      bindFeedCardEvents();
    }
  }

  // ==================== ANA ARAYÜZ (RENDER UI) ====================
  function renderUI() {
    enforceLightTheme();
    const appRoot = document.getElementById('safeAppRoot');
    const topBarUserArea = document.getElementById('safeTopBarUserArea');
    if (!appRoot) return;

    // 1. KULLANICI GİRİŞ YAPMAMIŞSA -> GİRİŞ EKRANI (LOGIN SCREEN)
    if (!state.currentUser) {
      if (topBarUserArea) topBarUserArea.innerHTML = '';
      appRoot.innerHTML = renderLoginScreen();
      bindLoginEvents();
      return;
    }

    const user = state.currentUser;
    const userRole = getRole(user.roleId);
    const roleName = userRole ? userRole.name : 'Çalışan';

    // Üst Bar Kullanıcı Bilgisi ve Çıkış Butonu
    if (topBarUserArea) {
      topBarUserArea.innerHTML = `
        <div class="safe-user-badge-btn">
          <div class="safe-user-avatar ${user.roleId === 'admin' ? 'admin' : ''}">${user.initials}</div>
          <div style="text-align:left;">
            <div style="font-weight:700; font-size:0.86rem; color:var(--safe-text);">${user.name}</div>
            <div style="font-size:0.72rem; color:var(--safe-text-muted);">${roleName} • ${user.department}</div>
          </div>
        </div>

        <button type="button" class="safe-btn safe-btn-sm safe-btn-outline" id="btnLogout" title="Oturumu Kapat">
          <span>🚪</span>
          <span>Çıkış Yap</span>
        </button>
      `;
    }

    // Yetki Kontrolleri
    const canFeedback = hasPermission(user, 'feedback');
    const canAnalytics = hasPermission(user, 'analytics');
    const canManageRolesUsers = hasPermission(user, 'manage_users') || hasPermission(user, 'manage_roles');
    const canCloudConfig = hasPermission(user, 'cloud_config');

    // Eğer aktif sekme kullanıcının yetkisinde değilse izinli ilk sekmeye al
    if (state.activeTab === 'analytics' && !canAnalytics) state.activeTab = 'give-feedback';
    if (state.activeTab === 'user-roles' && !canManageRolesUsers) state.activeTab = 'give-feedback';
    if (state.activeTab === 'cloud-settings' && !canCloudConfig) state.activeTab = 'give-feedback';

    // Yan Navbar (Sadece İzin Verilen Ekranlar Görünür!)
    const sidebarHtml = `
      <aside class="safe-sidebar">
        <nav class="safe-nav-menu">
          ${canFeedback ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'give-feedback' ? 'active' : ''}" data-nav-tab="give-feedback">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">✍️</span>
                <span class="safe-nav-text">Geri Bildirim Ver</span>
              </div>
              <span class="safe-nav-badge">Ana Sayfa</span>
            </button>

            <button type="button" class="safe-nav-item ${state.activeTab === 'view-feedbacks' ? 'active' : ''}" data-nav-tab="view-feedbacks">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">📬</span>
                <span class="safe-nav-text">Geri Bildirimler</span>
              </div>
              <span class="safe-nav-count">${state.feedbacks.length}</span>
            </button>
          ` : ''}

          ${canAnalytics ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'analytics' ? 'active' : ''}" data-nav-tab="analytics">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">📊</span>
                <span class="safe-nav-text">Veri Analizi</span>
              </div>
              <span class="safe-nav-pill">Yetkili</span>
            </button>
          ` : ''}

          ${canManageRolesUsers ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'user-roles' ? 'active' : ''}" data-nav-tab="user-roles">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">👥</span>
                <span class="safe-nav-text">Kullanıcı &amp; Rol Yönetimi</span>
              </div>
              <span class="safe-nav-pill admin">Yönetici</span>
            </button>
          ` : ''}

          ${canCloudConfig ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'cloud-settings' ? 'active' : ''}" data-nav-tab="cloud-settings">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">☁️</span>
                <span class="safe-nav-text">Bulut Veritabanı (Firebase)</span>
              </div>
              <span class="safe-nav-pill ${state.firestoreDb ? 'admin' : ''}">
                ${state.firestoreDb ? '● Canlı' : 'Bağla'}
              </span>
            </button>
          ` : ''}
        </nav>

        <!-- Sidebar Alt Bilgi -->
        <div class="safe-sidebar-user">
          <div class="safe-user-card">
            <div class="safe-user-top">
              <div class="safe-avatar ${user.roleId === 'admin' ? 'admin-avatar' : ''}">
                ${user.initials}
              </div>
              <div style="min-width: 0;">
                <div class="safe-user-name">${user.name}</div>
                <div class="safe-user-meta">${roleName}</div>
              </div>
            </div>
            <div style="font-size:0.75rem; color:var(--safe-text-muted);">
              TC: ${user.tc} • ${user.shift}
            </div>
          </div>
        </div>
      </aside>
    `;

    // Sağ İçerik Ekranı
    let screenHtml = '';
    if (state.activeTab === 'give-feedback') {
      screenHtml = renderGiveFeedbackScreen();
    } else if (state.activeTab === 'view-feedbacks') {
      screenHtml = renderViewFeedbacksScreen();
    } else if (state.activeTab === 'analytics') {
      screenHtml = renderAnalyticsScreen();
    } else if (state.activeTab === 'user-roles') {
      screenHtml = renderUserAndRoleManagementScreen();
    } else if (state.activeTab === 'cloud-settings') {
      screenHtml = renderCloudSettingsScreen();
    }

    appRoot.innerHTML = `
      <div class="safe-app-layout">
        ${sidebarHtml}
        <main class="safe-main-content">
          ${screenHtml}
        </main>
      </div>

      <!-- KULLANICI EKLEME MODALI -->
      <div class="safe-modal-backdrop" id="modalAddUser">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>➕</span> Yeni Çalışan / Kullanıcı Ekle</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formAddUser">
            <div class="safe-form-group">
              <label class="safe-label">TC Kimlik No / Sicil No <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newUserTc" placeholder="Örn: 23456789012" required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Giriş Şifresi <span style="color:var(--safe-primary);">*</span></label>
              <input type="password" class="safe-input" id="newUserPassword" placeholder="En az 3 karakter" required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Ad Soyad <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newUserName" placeholder="Örn: Ahmet Yılmaz" required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Rolü (Yetki Grubu) <span style="color:var(--safe-primary);">*</span></label>
              <select class="safe-select" id="newUserRoleId" required>
                ${state.roles.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}
              </select>
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Departman / Bölüm</label>
              <select class="safe-select" id="newUserDept">
                <option value="Montaj Hattı">Montaj Hattı</option>
                <option value="Talaşlı İmalat">Talaşlı İmalat</option>
                <option value="Kalite Güvence">Kalite Güvence</option>
                <option value="Bakım & Onarım">Bakım & Onarım</option>
                <option value="Depo & Lojistik">Depo & Lojistik</option>
                <option value="Kaynak & Gövde">Kaynak & Gövde</option>
                <option value="İSG & Çevre">İSG & Çevre</option>
                <option value="Kaizen & Metot">Kaizen & Metot</option>
                <option value="Fabrika Yönetimi">Fabrika Yönetimi</option>
              </select>
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Görevi / Ünvanı</label>
              <input type="text" class="safe-input" id="newUserTitle" placeholder="Örn: CNC Operatörü, Hat Lideri" required />
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

            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Kullanıcıyı Kaydet</span>
            </button>
          </form>
        </div>
      </div>

      <!-- KULLANICI DÜZENLEME MODALI -->
      <div class="safe-modal-backdrop" id="modalEditUser">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>✏️</span> Kullanıcı Bilgilerini Düzenle</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formEditUser">
            <input type="hidden" id="editUserId" />
            <div class="safe-form-group">
              <label class="safe-label">Ad Soyad</label>
              <input type="text" class="safe-input" id="editUserName" required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Yeni Şifre (Boş bırakılırsa değişmez)</label>
              <input type="password" class="safe-input" id="editUserPassword" placeholder="Değiştirmek istemiyorsanız boş bırakın" />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Rolü</label>
              <select class="safe-select" id="editUserRoleId" required>
                ${state.roles.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}
              </select>
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Departman</label>
              <select class="safe-select" id="editUserDept">
                <option value="Montaj Hattı">Montaj Hattı</option>
                <option value="Talaşlı İmalat">Talaşlı İmalat</option>
                <option value="Kalite Güvence">Kalite Güvence</option>
                <option value="Bakım & Onarım">Bakım & Onarım</option>
                <option value="Depo & Lojistik">Depo & Lojistik</option>
                <option value="Kaynak & Gövde">Kaynak & Gövde</option>
                <option value="İSG & Çevre">İSG & Çevre</option>
                <option value="Kaizen & Metot">Kaizen & Metot</option>
                <option value="Fabrika Yönetimi">Fabrika Yönetimi</option>
              </select>
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Ünvan</label>
              <input type="text" class="safe-input" id="editUserTitle" required />
            </div>

            <div class="safe-form-group">
              <label class="safe-label">Vardiya</label>
              <select class="safe-select" id="editUserShift">
                <option value="1. Vardiya (08:00 - 16:00)">1. Vardiya (08:00 - 16:00)</option>
                <option value="2. Vardiya (16:00 - 24:00)">2. Vardiya (16:00 - 24:00)</option>
                <option value="3. Vardiya (24:00 - 08:00)">3. Vardiya (24:00 - 08:00)</option>
                <option value="Genel Mesai (08:30 - 17:30)">Genel Mesai (08:30 - 17:30)</option>
              </select>
            </div>

            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Değişiklikleri Kaydet</span>
            </button>
          </form>
        </div>
      </div>
    `;

    bindEvents();

    if (state.activeTab === 'analytics' && canAnalytics) {
      setTimeout(() => renderCharts(computeAnalytics()), 50);
    }
  }

  // ==================== GİRİŞ EKRANI (LOGIN SCREEN HTML) ====================
  function renderLoginScreen() {
    return `
      <div class="safe-login-view">
        <div class="safe-login-card">
          <div class="safe-login-icon-wrap">🛡️</div>
          <h2 class="safe-login-title">Safe5 Fabrika Portalı</h2>
          <p class="safe-login-subtitle">
            Lütfen personel TC / Sicil numaranız ve şifrenizle giriş yapınız.
          </p>

          <form id="safeLoginForm">
            <div class="safe-form-group" style="text-align:left;">
              <label class="safe-label">TC Kimlik No / Sicil No</label>
              <input type="text" class="safe-input" id="loginTc" placeholder="Örn: 11111111111" required autofocus />
            </div>

            <div class="safe-form-group" style="text-align:left;">
              <label class="safe-label">Giriş Şifresi</label>
              <input type="password" class="safe-input" id="loginPassword" placeholder="••••••••" required />
            </div>

            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%; margin-top:0.5rem;" id="btnLoginSubmit">
              <span>Giriş Yap</span>
              <span>➔</span>
            </button>
          </form>

          <div class="safe-login-alert">
            <div style="font-weight:700; margin-bottom:0.25rem;">👑 Varsayılan Yönetici (Admin) Girişi:</div>
            <div>TC: <b>11111111111</b> &nbsp;•&nbsp; Şifre: <b>admin</b></div>
            <div style="font-size:0.75rem; color:var(--safe-text-muted); margin-top:0.35rem;">
              Admin olarak giriş yaptıktan sonra yeni çalışanlar ekleyebilir ve rollerine yetkiler atayabilirsiniz.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== EKRAN 1: GERİ BİLDİRİM VERME (ANASAYFA) ====================
  function renderGiveFeedbackScreen() {
    const user = state.currentUser;
    // Diğer kayıtlı kullanıcılar
    const otherUsers = state.users.filter((u) => u.tc !== user.tc);

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge primary">✨ Ana Sayfa</span>
        <h1 class="safe-page-title">Geri Bildirim &amp; Takdir Gönder</h1>
        <p class="safe-page-subtitle">Çalışma arkadaşınızın güvenli davranışını, 5S tertibini veya başarılı çalışmasını takdir edin.</p>
      </div>

      <div class="safe-card" style="max-width: 820px;">
        <form id="safeFeedbackForm">
          <!-- 1. Alıcı Seçimi -->
          <div class="safe-form-group">
            <label class="safe-label">Kime Geri Bildirim Veriyorsun? <span style="color:var(--safe-primary);">*</span></label>
            <select class="safe-select" id="inputRecipient" required>
              <option value="" disabled selected>-- Çalışma Arkadaşını Seçin --</option>
              ${otherUsers.length > 0
                ? otherUsers.map((u) => `<option value="${u.tc}">${u.name} — ${u.department} (${u.title})</option>`).join('')
                : '<option value="" disabled>Henüz başka kayıtlı kullanıcı yok. Admin panelinden kullanıcı ekleyebilirsiniz.</option>'
              }
            </select>
          </div>

          <!-- 2. Bildirim Türü -->
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

          <!-- 3. Fabrika Değeri & 5S İlkesi -->
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

          <!-- 4. Mesaj Kutusu -->
          <div class="safe-form-group">
            <label class="safe-label">Açıklama / Mesaj Notun <span style="color:var(--safe-primary);">*</span></label>
            <textarea class="safe-textarea" id="inputMessage" placeholder="Örn: 1. hatta hidrolik pres sızıntısını 15 dakikada çözdü ve 5S tertibini uyguladı..." required></textarea>
          </div>

          <!-- 5. Anonimlik ve Vardiya -->
          <div class="safe-inline-controls">
            <label class="safe-switch-label">
              <input type="checkbox" id="inputIsAnonymous" style="width:20px; height:20px; accent-color:var(--safe-primary); cursor:pointer;" />
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

          <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" id="btnSubmitFeedback" style="width: 100%;">
            <span>🚀</span>
            <span>Geri Bildirimi İlet</span>
          </button>
        </form>
      </div>
    `;
  }

  // ==================== EKRAN 2: GERİ BİLDİRİMLERİ İNCELEME ====================
  function renderViewFeedbacksScreen() {
    const user = state.currentUser;
    const receivedCount = user ? state.feedbacks.filter((f) => f.toTc === user.tc).length : 0;
    const sentCount = user ? state.feedbacks.filter((f) => f.fromTc === user.tc).length : 0;

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge indigo">📬 Geri Bildirimler</span>
        <h1 class="safe-page-title">Fabrika Geri Bildirim Panosu</h1>
        <p class="safe-page-subtitle">Çalışanların birbirine ilettiği takdir, 5S ve İSG bildirimlerini inceleyin.</p>
      </div>

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

      <div class="safe-feed-list" id="safeFeedListContainer">
        ${renderFeedCardsHtml()}
      </div>
    `;
  }

  function renderFeedCardsHtml() {
    const user = state.currentUser;
    const canManageStatus = hasPermission(user, 'manage_status') || isAdminUser();
    let list = [...state.feedbacks];

    if (state.feedFilter === 'received' && user) {
      list = list.filter((f) => f.toTc === user.tc);
    } else if (state.feedFilter === 'sent' && user) {
      list = list.filter((f) => f.fromTc === user.tc);
    }

    if (state.feedTypeFilter !== 'all') {
      list = list.filter((f) => f.type === state.feedTypeFilter);
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter((f) =>
        (f.fromName && f.fromName.toLowerCase().includes(q)) ||
        (f.toName && f.toName.toLowerCase().includes(q)) ||
        (f.message && f.message.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      return `
        <div class="safe-card" style="text-align:center; padding:3.5rem 1rem;">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">📭</div>
          <h3 style="color:var(--safe-text); margin-bottom:0.35rem;">Bu filtreye uygun bildirim bulunamadı.</h3>
          <p style="color:var(--safe-text-muted); font-size:0.88rem;">Yeni bir geri bildirim iletmek için 'Geri Bildirim Ver' sekmesini kullanabilirsiniz.</p>
        </div>
      `;
    }

    return list.map((f) => {
      const timeDiff = getTimeAgo(f.createdAt);
      const isRecipient = user && user.tc === f.toTc;
      const isLiked = Array.isArray(f.likedBy) && user && f.likedBy.includes(user.tc);
      const likesCount = f.likes || 0;

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
            <span class="safe-tag badge-custom">${getCategoryName(f.category)}</span>
          </div>

          <div class="safe-feed-body">
            "${f.message}"
          </div>

          <div class="safe-feed-footer">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <button type="button" class="safe-clap-btn ${isLiked ? 'active' : ''}" data-clap-id="${f.id}" title="Takdir et / alkışla">
                <span>👏</span>
                <span>Alkış (${likesCount})</span>
              </button>
              <span style="font-size:0.75rem; color:var(--safe-text-muted);">${new Date(f.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>

            <div class="safe-feed-footer-actions">
              ${canManageStatus ? `
                <select class="safe-card-status-select" data-status-fb-id="${f.id}" title="Bildirim durumunu güncelle">
                  <option value="resolved" ${f.status === 'resolved' ? 'selected' : ''}>✅ Tamamlandı</option>
                  <option value="in_progress" ${f.status === 'in_progress' ? 'selected' : ''}>⚙️ Aksiyon Alındı</option>
                  <option value="pending" ${f.status === 'pending' ? 'selected' : ''}>⏳ İnceleniyor</option>
                </select>
              ` : `
                <span class="safe-status-pill ${f.status || 'resolved'}">
                  ${f.status === 'resolved' ? '✓ Tamamlandı' : f.status === 'in_progress' ? '⚙️ Aksiyon Alındı' : '⏳ İnceleniyor'}
                </span>
              `}

              ${isAdminUser() ? `
                <button type="button" class="safe-btn safe-btn-sm safe-btn-danger" data-delete-fb-id="${f.id}" title="Bildirimi sil">
                  <span>🗑️</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==================== EKRAN 3: VERİ ANALİZİ EKRANI ====================
  function renderAnalyticsScreen() {
    const analytics = computeAnalytics();

    return `
      <div class="safe-page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="safe-page-badge primary">📊 Veri Analizi</span>
          <h1 class="safe-page-title">Fabrika Geri Bildirim Analitikleri</h1>
          <p class="safe-page-subtitle">Metrikler, kategori oranları, departman ve vardiya analizleri</p>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="safe-btn safe-btn-primary" id="btnExportCSV">
            <span>📊</span>
            <span>Excel / CSV İndir</span>
          </button>
          <button type="button" class="safe-btn safe-btn-secondary" id="btnExportJSON">
            <span>💾</span>
            <span>JSON Yedek</span>
          </button>
        </div>
      </div>

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

      <div class="safe-charts-grid">
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

        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>🏢</span> Departman Bazlı Bildirimler</h3>
              <p class="safe-card-desc">En çok geri bildirim alan birimler</p>
            </div>
          </div>
          <div class="safe-chart-container">
            <canvas id="chartDepartment"></canvas>
          </div>
        </div>

        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>⏰</span> Vardiya Katılım Dağılımı</h3>
              <p class="safe-card-desc">1., 2. ve 3. Vardiya oranları</p>
            </div>
          </div>
          <div class="safe-chart-container">
            <canvas id="chartShift"></canvas>
          </div>
        </div>

        <div class="safe-chart-card">
          <div class="safe-card-header" style="margin-bottom:0;">
            <div>
              <h3 class="safe-card-title"><span>🏆</span> En Çok Takdir Edilenler</h3>
              <p class="safe-card-desc">Örnek davranış liderleri</p>
            </div>
          </div>
          <div class="safe-leader-list">
            ${analytics.topLeaders.map((lead, idx) => `
              <div class="safe-leader-item">
                <div class="safe-leader-left">
                  <div class="safe-rank-circle r${idx + 1}">${idx + 1}</div>
                  <div style="font-weight:700; color:var(--safe-text);">${lead.name}</div>
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

  // ==================== EKRAN 4: KULLANICI & ROL YÖNETİMİ (RBAC) ====================
  function renderUserAndRoleManagementScreen() {
    return `
      <div class="safe-page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="safe-page-badge indigo">👥 Yönetim Paneli</span>
          <h1 class="safe-page-title">Kullanıcı &amp; Rol Yönetimi</h1>
          <p class="safe-page-subtitle">
            Kullanıcıları yönetin, rollere yetkiler atayın. Bir rolün yetkisi değiştiğinde o roldeki tüm kullanıcılar anında güncellenir.
          </p>
        </div>

        ${state.activeSubTab === 'users' ? `
          <button type="button" class="safe-btn safe-btn-primary" id="btnOpenAddUser">
            <span>➕</span>
            <span>Yeni Kullanıcı Ekle</span>
          </button>
        ` : ''}
      </div>

      <!-- Alt Sekmeler: Kullanıcılar vs Roller -->
      <div class="safe-tabs-bar">
        <button type="button" class="safe-tab-btn ${state.activeSubTab === 'users' ? 'active' : ''}" data-sub-tab="users">
          👥 Çalışanlar &amp; Kullanıcılar (${state.users.length})
        </button>
        <button type="button" class="safe-tab-btn ${state.activeSubTab === 'roles' ? 'active' : ''}" data-sub-tab="roles">
          🛡️ Roller &amp; Yetki Matrisi (${state.roles.length})
        </button>
      </div>

      ${state.activeSubTab === 'users' ? renderUsersTable() : renderRolesMatrixTable()}
    `;
  }

  function renderUsersTable() {
    return `
      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>TC / Sicil No</th>
              <th>Ad Soyad &amp; Ünvan</th>
              <th>Departman</th>
              <th>Vardiya</th>
              <th>Atanmış Rol</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${state.users.map((u) => {
              const role = getRole(u.roleId);
              const isSelf = state.currentUser && state.currentUser.tc === u.tc;

              return `
                <tr>
                  <td><code style="font-weight:700; color:var(--safe-indigo); font-size:0.9rem;">${u.tc}</code></td>
                  <td>
                    <div style="font-weight:700; color:var(--safe-text);">${u.name}</div>
                    <div style="font-size:0.75rem; color:var(--safe-text-muted);">${u.title}</div>
                  </td>
                  <td>${u.department}</td>
                  <td style="font-size:0.84rem; white-space:nowrap;">${u.shift}</td>
                  <td>
                    <span class="safe-tag ${u.roleId === 'admin' ? 'isg' : 'kudos'}" style="font-weight:700;">
                      ${role ? role.name : u.roleId}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                      <button type="button" class="safe-btn safe-btn-sm safe-btn-outline" data-edit-user-id="${u.id}" title="Düzenle">
                        <span>✏️ Düzenle</span>
                      </button>
                      ${!isSelf ? `
                        <button type="button" class="safe-btn safe-btn-sm safe-btn-danger" data-remove-user-id="${u.id}" title="Sil">
                          <span>🗑️</span>
                        </button>
                      ` : '<span style="font-size:0.75rem; color:var(--safe-text-muted);">(Aktif Oturum)</span>'}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRolesMatrixTable() {
    const permissionCols = [
      { key: 'feedback', label: '✍️ Geri Bildirim' },
      { key: 'analytics', label: '📊 Veri Analizi' },
      { key: 'manage_status', label: '⚙️ Durum Yönetimi' },
      { key: 'manage_users', label: '👥 Kullanıcı Yönetimi' },
      { key: 'manage_roles', label: '🛡️ Rol & Yetki Yönetimi' }
    ];

    return `
      <div class="safe-card" style="margin-bottom:1.5rem; background:var(--safe-indigo-light); border-color:var(--safe-indigo-border);">
        <div style="font-weight:700; color:var(--safe-indigo); font-size:0.9rem; margin-bottom:0.25rem;">
          💡 Rol Tabanlı Dinamik Yetkilendirme (RBAC):
        </div>
        <div style="font-size:0.84rem; color:var(--safe-text-secondary); line-height:1.4;">
          Aşağıdaki matristen bir rolün yetkisini değiştirdiğinizde, o role sahip olan <b>tüm kullanıcıların ekran ve işlem yetkileri anında güncellenir.</b>
        </div>
      </div>

      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>Rol Adı &amp; Açıklaması</th>
              <th>Bağlı Çalışan Sayısı</th>
              ${permissionCols.map((c) => `<th style="text-align:center;">${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${state.roles.map((r) => {
              const assignedUserCount = state.users.filter((u) => u.roleId === r.id).length;
              const isAdminRole = r.id === 'admin';

              return `
                <tr>
                  <td>
                    <div style="font-weight:700; color:var(--safe-text); font-size:0.92rem;">${r.name}</div>
                    <div style="font-size:0.75rem; color:var(--safe-text-muted);">${r.description || ''}</div>
                  </td>
                  <td>
                    <span style="font-weight:700; color:var(--safe-primary);">${assignedUserCount} personel</span>
                  </td>
                  ${permissionCols.map((col) => {
                    const hasPerm = isAdminRole || (Array.isArray(r.permissions) && r.permissions.includes(col.key));
                    const isFeedbackDefault = col.key === 'feedback';

                    return `
                      <td style="text-align:center;">
                        <input type="checkbox" class="safe-matrix-perm-chk" 
                               data-role-id="${r.id}" 
                               data-perm-key="${col.key}"
                               ${hasPerm ? 'checked' : ''}
                               ${isAdminRole || isFeedbackDefault ? 'disabled' : ''}
                               style="width:18px; height:18px; accent-color:var(--safe-primary); cursor:${isAdminRole ? 'not-allowed' : 'pointer'};" />
                      </td>
                    `;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==================== EKRAN 5: BULUT VERİTABANI (FIREBASE) AYARLARI ====================
  function renderCloudSettingsScreen() {
    const isConnected = Boolean(state.firestoreDb);

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge ${isConnected ? 'primary' : 'indigo'}">
          ${isConnected ? '● Canlı Bulut Bağlantısı Aktif' : '☁️ Bulut Ayarları'}
        </span>
        <h1 class="safe-page-title">Canlı Bulut Veritabanı (Firebase Firestore)</h1>
        <p class="safe-page-subtitle">
          Fabrikadaki tüm telefon, tablet ve bilgisayarların aynı verileri anlık olarak görmesi için Firebase Firestore bağlantısını yapılandırın.
        </p>
      </div>

      <div class="safe-card" style="max-width: 780px;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.25rem;">
          <div style="width:14px; height:14px; border-radius:50%; background:${isConnected ? '#10b981' : '#f59e0b'};"></div>
          <span style="font-weight:700; color:var(--safe-text);">
            Durum: ${isConnected ? 'Firebase Firestore Canlı Veritabanına Bağlı (Tüm cihazlar senkron)' : 'Yerel Modda Çalışıyor (LocalStorage)'}
          </span>
        </div>

        <form id="formCloudConfig">
          <div class="safe-form-group">
            <label class="safe-label">Firebase Yapılandırma JSON (firebaseConfig)</label>
            <textarea class="safe-textarea" id="inputFirebaseJson" style="font-family:monospace; font-size:0.85rem; min-height:160px;" placeholder='{
  "apiKey": "AIzaSy...",
  "authDomain": "fabrika-safe5.firebaseapp.com",
  "projectId": "fabrika-safe5",
  "storageBucket": "fabrika-safe5.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}'>${state.firebaseConfig ? JSON.stringify(state.firebaseConfig, null, 2) : ''}</textarea>
            <div style="font-size:0.78rem; color:var(--safe-text-muted); margin-top:0.4rem;">
              Firebase konsolundan (firebase.google.com) aldığınız ücretsiz Web App yapılandırma kodunu buraya yapıştırın.
            </div>
          </div>

          <div style="display:flex; gap:0.75rem;">
            <button type="submit" class="safe-btn safe-btn-primary">
              <span>Bağlan &amp; Canlıya Al</span>
            </button>
            ${state.firebaseConfig ? `
              <button type="button" class="safe-btn safe-btn-outline" id="btnDisconnectCloud" style="color:var(--safe-rose);">
                <span>Bağlantıyı Kes (Yerel Moda Dön)</span>
              </button>
            ` : ''}
          </div>
        </form>
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

  // ==================== KART ETKİLEŞİM DİNLEYİCİLERİ ====================
  function bindFeedCardEvents() {
    document.querySelectorAll('[data-clap-id]').forEach((btn) => {
      btn.onclick = () => toggleFeedbackLike(btn.getAttribute('data-clap-id'));
    });

    document.querySelectorAll('[data-status-fb-id]').forEach((sel) => {
      sel.onchange = (e) => updateFeedbackStatus(sel.getAttribute('data-status-fb-id'), e.target.value);
    });

    document.querySelectorAll('[data-delete-fb-id]').forEach((btn) => {
      btn.onclick = () => deleteFeedback(btn.getAttribute('data-delete-fb-id'));
    });
  }

  // ==================== GİRİŞ EKRANI OLAYLARI ====================
  function bindLoginEvents() {
    const form = document.getElementById('safeLoginForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const tc = document.getElementById('loginTc').value;
        const pass = document.getElementById('loginPassword').value;
        login(tc, pass);
      };
    }
  }

  // ==================== GENEL OLAY DİNLEYİCİLERİ ====================
  function bindEvents() {
    // 1. Çıkış Yap Butonu
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.onclick = logout;

    // 2. Sidebar Navigasyon
    document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
      btn.onclick = () => {
        state.activeTab = btn.getAttribute('data-nav-tab');
        renderUI();
      };
    });

    // 3. Alt Sekmeler (Kullanıcılar vs Roller)
    document.querySelectorAll('[data-sub-tab]').forEach((btn) => {
      btn.onclick = () => {
        state.activeSubTab = btn.getAttribute('data-sub-tab');
        renderUI();
      };
    });

    // 4. Geri Bildirim Formu
    const formFeedback = document.getElementById('safeFeedbackForm');
    if (formFeedback) {
      const btnSubmit = document.getElementById('btnSubmitFeedback');
      formFeedback.onsubmit = (e) => {
        e.preventDefault();
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span>⏳</span> <span>İletiliyor...</span>';
        }

        const toTc = document.getElementById('inputRecipient').value;
        const message = document.getElementById('inputMessage').value;
        const shift = document.getElementById('inputShift').value;
        const isAnonymous = document.getElementById('inputIsAnonymous').checked;

        const success = submitFeedback({
          toTc,
          type: state.selectedType,
          category: state.selectedCategory,
          message,
          shift,
          isAnonymous
        });

        if (success) {
          formFeedback.reset();
          setTimeout(() => {
            state.activeTab = 'view-feedbacks';
            renderUI();
          }, 600);
        } else if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>🚀</span> <span>Geri Bildirimi İlet</span>';
        }
      };
    }

    // 5. Tür ve Kategori Seçicileri
    document.querySelectorAll('.safe-type-btn').forEach((btn) => {
      btn.onclick = () => {
        state.selectedType = btn.getAttribute('data-type');
        document.querySelectorAll('.safe-type-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    document.querySelectorAll('.safe-cat-card').forEach((card) => {
      card.onclick = () => {
        state.selectedCategory = card.getAttribute('data-cat');
        document.querySelectorAll('.safe-cat-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
      };
    });

    // 6. Geri Bildirim İnceleme Ekranı Filtreleri (ODAK KAYBI OLMADAN)
    document.querySelectorAll('[data-feed-filter]').forEach((tab) => {
      tab.onclick = () => {
        state.feedFilter = tab.getAttribute('data-feed-filter');
        document.querySelectorAll('[data-feed-filter]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        updateFeedListOnly();
      };
    });

    const feedTypeSelect = document.getElementById('feedTypeSelect');
    if (feedTypeSelect) {
      feedTypeSelect.onchange = (e) => {
        state.feedTypeFilter = e.target.value;
        updateFeedListOnly();
      };
    }

    const feedSearchInput = document.getElementById('feedSearchInput');
    if (feedSearchInput) {
      feedSearchInput.oninput = (e) => {
        state.searchQuery = e.target.value;
        updateFeedListOnly();
      };
    }

    bindFeedCardEvents();

    // 7. CSV & JSON Raporlama
    const btnCSV = document.getElementById('btnExportCSV');
    if (btnCSV) btnCSV.onclick = exportCSV;

    const btnJSON = document.getElementById('btnExportJSON');
    if (btnJSON) btnJSON.onclick = exportJSON;

    // 8. Kullanıcı Ekleme Modalı
    const modalAdd = document.getElementById('modalAddUser');
    const btnOpenAdd = document.getElementById('btnOpenAddUser');
    if (btnOpenAdd && modalAdd) {
      btnOpenAdd.onclick = () => modalAdd.classList.add('active');
    }

    const formAdd = document.getElementById('formAddUser');
    if (formAdd) {
      formAdd.onsubmit = (e) => {
        e.preventDefault();
        const tc = document.getElementById('newUserTc').value;
        const pass = document.getElementById('newUserPassword').value;
        const name = document.getElementById('newUserName').value;
        const roleId = document.getElementById('newUserRoleId').value;
        const dept = document.getElementById('newUserDept').value;
        const title = document.getElementById('newUserTitle').value;
        const shift = document.getElementById('newUserShift').value;

        const ok = addUser({ tc, password: pass, name, roleId, department: dept, title, shift });
        if (ok && modalAdd) {
          modalAdd.classList.remove('active');
          formAdd.reset();
        }
      };
    }

    // 9. Kullanıcı Düzenleme Modalı
    const modalEdit = document.getElementById('modalEditUser');
    const formEdit = document.getElementById('formEditUser');

    document.querySelectorAll('[data-edit-user-id]').forEach((btn) => {
      btn.onclick = () => {
        const uid = btn.getAttribute('data-edit-user-id');
        const user = state.users.find((u) => u.id === uid);
        if (!user || !modalEdit) return;

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserPassword').value = '';
        document.getElementById('editUserRoleId').value = user.roleId;
        document.getElementById('editUserDept').value = user.department;
        document.getElementById('editUserTitle').value = user.title;
        document.getElementById('editUserShift').value = user.shift;

        modalEdit.classList.add('active');
      };
    });

    if (formEdit) {
      formEdit.onsubmit = (e) => {
        e.preventDefault();
        const uid = document.getElementById('editUserId').value;
        const name = document.getElementById('editUserName').value;
        const pass = document.getElementById('editUserPassword').value;
        const roleId = document.getElementById('editUserRoleId').value;
        const dept = document.getElementById('editUserDept').value;
        const title = document.getElementById('editUserTitle').value;
        const shift = document.getElementById('editUserShift').value;

        const ok = editUser(uid, { name, password: pass, roleId, department: dept, title, shift });
        if (ok && modalEdit) modalEdit.classList.remove('active');
      };
    }

    // 10. Kullanıcı Silme
    document.querySelectorAll('[data-remove-user-id]').forEach((btn) => {
      btn.onclick = () => removeUser(btn.getAttribute('data-remove-user-id'));
    });

    // 11. Rol Yetki Matrisi Checkbox'ları (DİNAMİK YETKİ GÜNCELLEME)
    document.querySelectorAll('.safe-matrix-perm-chk').forEach((chk) => {
      chk.onchange = (e) => {
        const roleId = chk.getAttribute('data-role-id');
        const permKey = chk.getAttribute('data-perm-key');
        updateRolePermissions(roleId, permKey, e.target.checked);
      };
    });

    // 12. Bulut Veritabanı Formu (Firebase Config)
    const formCloud = document.getElementById('formCloudConfig');
    if (formCloud) {
      formCloud.onsubmit = (e) => {
        e.preventDefault();
        const jsonStr = document.getElementById('inputFirebaseJson').value.trim();
        try {
          const parsed = JSON.parse(jsonStr);
          state.firebaseConfig = parsed;
          localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(parsed));
          initFirebaseIfConfigured();
          showToast('Firebase yapılandırması kaydedildi ve bulut bağlantısı başlatıldı!', 'success');
          renderUI();
        } catch (err) {
          showToast('Geçersiz JSON formatı. Lütfen kontrol edip tekrar deneyin.', 'warning');
        }
      };
    }

    const btnDisconnect = document.getElementById('btnDisconnectCloud');
    if (btnDisconnect) {
      btnDisconnect.onclick = () => {
        if (confirm('Bulut bağlantısını kesip yerel moda dönmek istediğinize emin misiniz?')) {
          state.firebaseConfig = null;
          state.firestoreDb = null;
          localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
          showToast('Bulut bağlantısı kesildi, yerel moda dönüldü.', 'info');
          renderUI();
        }
      };
    }

    // 13. Modalları Kapatma
    document.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.onclick = () => {
        document.querySelectorAll('.safe-modal-backdrop').forEach((m) => m.classList.remove('active'));
      };
    });

    document.querySelectorAll('.safe-modal-backdrop').forEach((backdrop) => {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      };
    });
  }

  // Escape Tuşu ile Modalları Kapatma
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.safe-modal-backdrop').forEach((m) => m.classList.remove('active'));
    }
  });

  // ==================== BAŞLATICI ====================
  document.addEventListener('DOMContentLoaded', () => {
    enforceLightTheme();
    loadData();
    renderUI();
  });
})();
