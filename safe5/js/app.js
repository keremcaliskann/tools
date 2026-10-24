/**
 * Safe5 — Fabrika Geri Bildirim & Analitik Sistemi
 * Kullanıcı Girişi (admin / admin), Kullanıcı Şifre Değiştirme,
 * Dinamik Rol Tanımlama (RBAC), Dinamik Departman & Vardiya Yönetimi
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
    AUTH_USER: 'safe5_auth_session_v4',
    USERS: 'safe5_users_v4',
    ROLES: 'safe5_roles_v4',
    DEPARTMENTS: 'safe5_departments_v4',
    SHIFTS: 'safe5_shifts_v4',
    FEEDBACKS: 'safe5_feedbacks_v4',
    FIREBASE_CONFIG: 'safe5_firebase_config_v4'
  };

  // ==================== TÜM YETKİLER LİSTESİ ====================
  const ALL_PERMISSIONS = [
    { key: 'feedback', label: '✍️ Geri Bildirim Ver / Kendi Bildirimlerini Gör' },
    { key: 'view_all_feed', label: '🌍 Tüm Fabrika Akışını Gör' },
    { key: 'analytics', label: '📊 Veri Analizi ve Grafikler' },
    { key: 'manage_status', label: '⚙️ Kaizen / İSG Durum Yönetimi' },
    { key: 'manage_users', label: '👥 Kullanıcı Yönetimi' },
    { key: 'manage_roles', label: '🛡️ Rol Tanımlama & Yetki Yönetimi' },
    { key: 'manage_departments', label: '🏢 Departman Tanımlama' },
    { key: 'manage_shifts', label: '⏰ Vardiya Tanımlama' }
  ];

  // ==================== BAŞLANGIÇTA SADECE YÖNETİCİ ROLÜ ====================
  const DEFAULT_ROLES = [
    {
      id: 'admin',
      name: 'Yönetici (Admin)',
      description: 'Tüm yetkilere sahiptir. Rol, kullanıcı, departman ve vardiya yönetimini yapabilir.',
      permissions: ['feedback', 'view_all_feed', 'analytics', 'manage_status', 'manage_users', 'manage_roles', 'manage_departments', 'manage_shifts', 'cloud_config'],
      isSystem: true
    }
  ];

  // ==================== BAŞLANGIÇTA SADECE ADMIN KULLANICI (admin / admin) ====================
  const DEFAULT_USERS = [
    {
      id: 'USR-ADMIN',
      tc: 'admin',
      password: 'admin',
      name: 'Sistem Yöneticisi',
      roleId: 'admin',
      department: 'Fabrika Yönetimi',
      title: 'Genel Yönetici',
      shift: 'Genel Mesai (08:30 - 17:30)',
      initials: 'SY',
      createdAt: new Date().toISOString()
    }
  ];

  // ==================== VARSAYILAN DEPARTMANLAR ====================
  const DEFAULT_DEPARTMENTS = [
    { id: 'DEP-1', name: 'Montaj Hattı', code: 'MNT' },
    { id: 'DEP-2', name: 'Talaşlı İmalat', code: 'CNC' },
    { id: 'DEP-3', name: 'Kalite Güvence', code: 'KAL' },
    { id: 'DEP-4', name: 'Bakım & Onarım', code: 'BAK' },
    { id: 'DEP-5', name: 'Depo & Lojistik', code: 'LOJ' },
    { id: 'DEP-6', name: 'Kaynak & Gövde', code: 'KAY' },
    { id: 'DEP-7', name: 'İSG & Çevre', code: 'İSG' },
    { id: 'DEP-8', name: 'Kaizen & Metot', code: 'KAI' },
    { id: 'DEP-9', name: 'Fabrika Yönetimi', code: 'YÖN' }
  ];

  // ==================== VARSAYILAN VARDİYA SAATLERİ ====================
  const DEFAULT_SHIFTS = [
    { id: 'SH-1', name: '1. Vardiya (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
    { id: 'SH-2', name: '2. Vardiya (16:00 - 24:00)', startTime: '16:00', endTime: '24:00' },
    { id: 'SH-3', name: '3. Vardiya (24:00 - 08:00)', startTime: '24:00', endTime: '08:00' },
    { id: 'SH-4', name: 'Genel Mesai (08:30 - 17:30)', startTime: '08:30', endTime: '17:30' }
  ];

  // ==================== UYGULAMA DURUMU (STATE) ====================
  const state = {
    currentUser: null,
    users: [],
    roles: [],
    departments: [],
    shifts: [],
    feedbacks: [],
    firebaseConfig: null,
    firestoreDb: null,
    activeTab: 'give-feedback', // 'give-feedback', 'view-feedbacks', 'analytics', 'management', 'cloud-settings'
    activeMgmtTab: 'users', // 'users', 'roles', 'departments', 'shifts'
    selectedType: 'kudos',
    selectedCategory: 'isg',
    feedFilter: 'all',
    feedTypeFilter: 'all',
    searchQuery: '',
    chartInstances: {}
  };

  // ==================== VERİ YÜKLEME VE SAKLAMA ====================
  function loadData() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
      const storedDepts = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      const storedShifts = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      const storedFeedbacks = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const storedFbConfig = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);

      state.users = storedUsers ? JSON.parse(storedUsers) : JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.roles = storedRoles ? JSON.parse(storedRoles) : JSON.parse(JSON.stringify(DEFAULT_ROLES));
      state.departments = storedDepts ? JSON.parse(storedDepts) : JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
      state.shifts = storedShifts ? JSON.parse(storedShifts) : JSON.parse(JSON.stringify(DEFAULT_SHIFTS));
      state.feedbacks = storedFeedbacks ? JSON.parse(storedFeedbacks) : [];

      if (storedFbConfig) {
        state.firebaseConfig = JSON.parse(storedFbConfig);
      }

      if (storedAuth) {
        const authTc = JSON.parse(storedAuth).tc;
        const found = state.users.find((u) => u.tc === authTc);
        if (found) state.currentUser = found;
      }

      if (!storedUsers) saveUsers();
      if (!storedRoles) saveRoles();
      if (!storedDepts) saveDepartments();
      if (!storedShifts) saveShifts();
      if (!storedFeedbacks) saveFeedbacks();
    } catch (e) {
      console.warn('[Safe5] Veri yükleme hatası:', e);
      state.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
      state.departments = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
      state.shifts = JSON.parse(JSON.stringify(DEFAULT_SHIFTS));
      state.feedbacks = [];
    }

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

  function saveDepartments() {
    try {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(state.departments));
      if (state.firestoreDb) syncToCloud('departments', state.departments);
    } catch (e) {}
  }

  function saveShifts() {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(state.shifts));
      if (state.firestoreDb) syncToCloud('shifts', state.shifts);
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

  // ==================== FIREBASE BULUT SENKRONİZASYONU ====================
  function initFirebaseIfConfigured() {
    if (!state.firebaseConfig || !window.firebase) return;
    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(state.firebaseConfig);
      }
      state.firestoreDb = window.firebase.firestore();
      console.log('[Safe5] Firebase Firestore canlı bulut veritabanına bağlandı.');

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
      listenToCloud('departments', (data) => {
        if (Array.isArray(data)) {
          state.departments = data;
          localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(data));
        }
      });
      listenToCloud('shifts', (data) => {
        if (Array.isArray(data)) {
          state.shifts = data;
          localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(data));
        }
      });
    } catch (err) {
      console.warn('[Safe5] Firebase bağlantı hatası:', err);
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
          if (data && Array.isArray(data.list)) onUpdate(data.list);
        }
      });
    } catch (e) {}
  }

  // ==================== BİLDİRİM TOAST ====================
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

  // ==================== DİNAMİK YETKİ KONTROLÜ (RBAC) ====================
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

  // ==================== GİRİŞ, ÇIKIŞ VE ŞİFRE DEĞİŞTİRME ====================
  function login(tc, password) {
    const cleanTc = String(tc || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanTc || !cleanPass) {
      showToast('Lütfen kullanıcı adı / TC ve şifrenizi girin.', 'warning');
      return false;
    }

    const found = state.users.find((u) => u.tc === cleanTc && u.password === cleanPass);
    if (!found) {
      showToast('Hatalı kullanıcı adı veya şifre girdiniz.', 'warning');
      return false;
    }

    state.currentUser = found;
    saveSession();
    state.activeTab = 'give-feedback';
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

  function changePassword(oldPass, newPass, confirmPass) {
    if (!state.currentUser) return false;

    if (state.currentUser.password !== oldPass) {
      showToast('Mevcut şifrenizi hatalı girdiniz.', 'warning');
      return false;
    }

    if (!newPass || newPass.trim().length < 3) {
      showToast('Yeni şifre en az 3 karakter olmalıdır.', 'warning');
      return false;
    }

    if (newPass !== confirmPass) {
      showToast('Yeni şifreler birbiriyle eşleşmiyor.', 'warning');
      return false;
    }

    state.currentUser.password = newPass.trim();
    const targetInList = state.users.find((u) => u.id === state.currentUser.id);
    if (targetInList) targetInList.password = newPass.trim();

    saveUsers();
    saveSession();
    showToast('Şifreniz başarıyla güncellendi!', 'success');
    return true;
  }

  // ==================== GERİ BİLDİRİM İŞLEMLERİ ====================
  function submitFeedback(data) {
    const { toTc, departmentName, type, category, message, shift, isAnonymous } = data;

    if (!toTc) {
      showToast('Lütfen geri bildirim vereceğiniz çalışma arkadaşınızı seçin.', 'warning');
      return false;
    }

    if (!message || message.trim().length < 5) {
      showToast('Lütfen en az 5 karakterlik açıklama girin.', 'warning');
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
      departmentName: departmentName || (state.departments[0] ? state.departments[0].name : 'Üretim'),
      type: type || state.selectedType,
      category: category || state.selectedCategory,
      message: message.trim(),
      shift: shift || (state.shifts[0] ? state.shifts[0].name : '1. Vardiya'),
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

  // ==================== KULLANICI YÖNETİMİ ====================
  function addUser(data) {
    if (!hasPermission(state.currentUser, 'manage_users')) {
      showToast('Kullanıcı ekleme yetkiniz yok.', 'warning');
      return false;
    }

    const { tc, password, name, department, title, shift, roleId } = data;

    if (!tc || !tc.trim()) {
      showToast('Lütfen kullanıcı adı / TC girin.', 'warning');
      return false;
    }
    if (!password || password.trim().length < 3) {
      showToast('Şifre en az 3 karakter olmalıdır.', 'warning');
      return false;
    }
    if (!name || !name.trim()) {
      showToast('Lütfen geçerli bir ad soyad girin.', 'warning');
      return false;
    }
    if (state.users.some((u) => u.tc === tc.trim())) {
      showToast('Bu kullanıcı adı / TC ile kayıtlı personel zaten var.', 'warning');
      return false;
    }

    const initials = name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    const newUser = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      tc: tc.trim(),
      password: password.trim(),
      name: name.trim(),
      roleId: roleId || (state.roles[0] ? state.roles[0].id : 'admin'),
      department: department || (state.departments[0] ? state.departments[0].name : 'Üretim'),
      title: title || 'Operatör',
      shift: shift || (state.shifts[0] ? state.shifts[0].name : '1. Vardiya'),
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
      showToast('Kullanıcı düzenleme yetkiniz yok.', 'warning');
      return false;
    }

    const target = state.users.find((u) => u.id === userId);
    if (!target) return false;

    target.name = data.name.trim();
    if (data.password && data.password.trim()) target.password = data.password.trim();
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
      showToast('Kullanıcı silme yetkiniz yok.', 'warning');
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

  // ==================== DİNAMİK ROL TANIMLAMA & YETKİLENDİRME ====================
  function addRole(name, description, permissions) {
    if (!hasPermission(state.currentUser, 'manage_roles')) {
      showToast('Rol tanımlama yetkiniz yok.', 'warning');
      return false;
    }
    if (!name || name.trim().length < 2) {
      showToast('Lütfen geçerli bir rol adı girin.', 'warning');
      return false;
    }

    const id = 'role_' + Date.now().toString(36);
    const newRole = {
      id,
      name: name.trim(),
      description: description ? description.trim() : '',
      permissions: Array.isArray(permissions) ? permissions : ['feedback'],
      isSystem: false
    };

    state.roles.push(newRole);
    saveRoles();
    showToast(`"${newRole.name}" rolü başarıyla oluşturuldu!`, 'success');
    renderUI();
    return true;
  }

  function removeRole(roleId) {
    if (!hasPermission(state.currentUser, 'manage_roles')) {
      showToast('Rol silme yetkiniz yok.', 'warning');
      return;
    }
    const target = state.roles.find((r) => r.id === roleId);
    if (!target) return;
    if (target.isSystem || target.id === 'admin') {
      showToast('Sistem yönetici rolü silinemez.', 'warning');
      return;
    }

    const assignedCount = state.users.filter((u) => u.roleId === roleId).length;
    if (assignedCount > 0) {
      showToast(`Bu role atanmış ${assignedCount} kullanıcı var. Önce kullanıcıların rolünü değiştirin.`, 'warning');
      return;
    }

    if (confirm(`"${target.name}" rolünü silmek istediğinize emin misiniz?`)) {
      state.roles = state.roles.filter((r) => r.id !== roleId);
      saveRoles();
      showToast(`"${target.name}" rolü silindi.`, 'success');
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
      showToast('Yönetici (Admin) rolünün yetkileri kısıtlanamaz.', 'warning');
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
    showToast(`"${role.name}" rolünün yetkileri güncellendi. Bu roldeki tüm kullanıcılar anında etkilendi!`, 'success');
    renderUI();
  }

  // ==================== DEPARTMAN YÖNETİMİ ====================
  function addDepartment(name, code) {
    if (!hasPermission(state.currentUser, 'manage_departments')) {
      showToast('Departman tanımlama yetkiniz yok.', 'warning');
      return false;
    }
    if (!name || !name.trim()) {
      showToast('Lütfen geçerli bir departman adı girin.', 'warning');
      return false;
    }
    const newDept = {
      id: 'DEP-' + Date.now().toString(36).toUpperCase(),
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : ''
    };
    state.departments.push(newDept);
    saveDepartments();
    showToast(`"${newDept.name}" departmanı eklendi!`, 'success');
    renderUI();
    return true;
  }

  function removeDepartment(deptId) {
    if (!hasPermission(state.currentUser, 'manage_departments')) {
      showToast('Departman silme yetkiniz yok.', 'warning');
      return;
    }
    const target = state.departments.find((d) => d.id === deptId);
    if (!target) return;

    if (confirm(`"${target.name}" departmanını silmek istediğinize emin misiniz?`)) {
      state.departments = state.departments.filter((d) => d.id !== deptId);
      saveDepartments();
      showToast(`"${target.name}" silindi.`, 'success');
      renderUI();
    }
  }

  // ==================== VARDİYA YÖNETİMİ ====================
  function addShift(name, startTime, endTime) {
    if (!hasPermission(state.currentUser, 'manage_shifts')) {
      showToast('Vardiya tanımlama yetkiniz yok.', 'warning');
      return false;
    }
    if (!name || !name.trim()) {
      showToast('Lütfen geçerli bir vardiya adı girin.', 'warning');
      return false;
    }
    const newShift = {
      id: 'SH-' + Date.now().toString(36).toUpperCase(),
      name: name.trim(),
      startTime: startTime || '08:00',
      endTime: endTime || '16:00'
    };
    state.shifts.push(newShift);
    saveShifts();
    showToast(`"${newShift.name}" vardiyası eklendi!`, 'success');
    renderUI();
    return true;
  }

  function removeShift(shiftId) {
    if (!hasPermission(state.currentUser, 'manage_shifts')) {
      showToast('Vardiya silme yetkiniz yok.', 'warning');
      return;
    }
    const target = state.shifts.find((s) => s.id === shiftId);
    if (!target) return;

    if (confirm(`"${target.name}" vardiyasını silmek istediğinize emin misiniz?`)) {
      state.shifts = state.shifts.filter((s) => s.id !== shiftId);
      saveShifts();
      showToast(`"${target.name}" silindi.`, 'success');
      renderUI();
    }
  }

  // ==================== CSV VE JSON ====================
  function exportCSV() {
    if (state.feedbacks.length === 0) {
      showToast('Dışa aktarılacak geri bildirim bulunmuyor.', 'warning');
      return;
    }
    const headers = ['ID', 'Tarih', 'Gönderen', 'Alıcı', 'Gerçekleşen Departman', 'Tür', 'Kategori', 'Vardiya', 'Durum', 'Alkış', 'Mesaj'];
    const rows = state.feedbacks.map((f) => {
      const cleanMsg = (f.message || '').replace(/"/g, '""');
      return [
        f.id,
        new Date(f.createdAt).toLocaleString('tr-TR'),
        f.fromName,
        f.toName,
        f.departmentName || '',
        f.type,
        f.category,
        f.shift || '',
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
      version: '4.0',
      exportedAt: new Date().toISOString(),
      roles: state.roles,
      users: state.users,
      departments: state.departments,
      shifts: state.shifts,
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

  // ==================== ANALİTİK HESAPLAMA ====================
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

    const deptMap = {};
    state.feedbacks.forEach((f) => {
      const dept = f.departmentName || 'Genel';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const shiftMap = {};
    state.feedbacks.forEach((f) => {
      const sh = f.shift || '1. Vardiya';
      shiftMap[sh] = (shiftMap[sh] || 0) + 1;
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

    return { total, kudosCount, kudosPercent, isgCount, kaizenCount, categories, deptMap, shiftMap, topLeaders };
  }

  function renderCharts(analytics) {
    const textColor = '#1e293b';
    const gridColor = 'rgba(0, 0, 0, 0.05)';

    const catCanvas = document.getElementById('chartCategory');
    if (catCanvas && window.Chart) {
      if (state.chartInstances.cat) state.chartInstances.cat.destroy();
      state.chartInstances.cat = new window.Chart(catCanvas.getContext('2d'), {
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
      state.chartInstances.dept = new window.Chart(deptCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: Object.keys(analytics.deptMap),
          datasets: [{
            label: 'Gerçekleşen Bildirim Sayısı',
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
      state.chartInstances.shift = new window.Chart(shiftCanvas.getContext('2d'), {
        type: 'polarArea',
        data: {
          labels: Object.keys(analytics.shiftMap),
          datasets: [{
            data: Object.values(analytics.shiftMap),
            backgroundColor: ['rgba(5, 150, 105, 0.75)', 'rgba(2, 132, 199, 0.75)', 'rgba(79, 70, 229, 0.75)', 'rgba(217, 119, 6, 0.75)']
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

  // ==================== LİSTE GÜNCELLEMESİ (ODAK KORUMALI) ====================
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

    // 1. GİRİŞ YAPILMAMIŞSA -> GİRİŞ PORTALI
    if (!state.currentUser) {
      if (topBarUserArea) topBarUserArea.innerHTML = '';
      appRoot.innerHTML = renderLoginScreen();
      bindLoginEvents();
      return;
    }

    const user = state.currentUser;
    const userRole = getRole(user.roleId);
    const roleName = userRole ? userRole.name : 'Çalışan';

    // Üst Bar Sağ Tarafı: Profil, Şifre Değiştirme ve Çıkış
    if (topBarUserArea) {
      topBarUserArea.innerHTML = `
        <div class="safe-user-badge-btn">
          <div class="safe-user-avatar ${user.roleId === 'admin' ? 'admin' : ''}">${user.initials}</div>
          <div style="text-align:left;">
            <div style="font-weight:700; font-size:0.86rem; color:var(--safe-text);">${user.name}</div>
            <div style="font-size:0.72rem; color:var(--safe-text-muted);">${roleName} • ${user.department}</div>
          </div>
        </div>

        <button type="button" class="safe-btn safe-btn-sm safe-btn-outline" id="btnOpenChangePassword" title="Şifremi Değiştir">
          <span>🔑</span>
          <span>Şifre Değiştir</span>
        </button>

        <button type="button" class="safe-btn safe-btn-sm safe-btn-secondary" id="btnLogout" title="Oturumu Kapat">
          <span>🚪</span>
          <span>Çıkış Yap</span>
        </button>
      `;
    }

    // Yetkiler
    const canFeedback = hasPermission(user, 'feedback');
    const canAnalytics = hasPermission(user, 'analytics');
    const canManageAny = hasPermission(user, 'manage_users') || hasPermission(user, 'manage_roles') || hasPermission(user, 'manage_departments') || hasPermission(user, 'manage_shifts');

    if (state.activeTab === 'analytics' && !canAnalytics) state.activeTab = 'give-feedback';
    if (state.activeTab === 'management' && !canManageAny) state.activeTab = 'give-feedback';

    // Sabit Sol Sidebar
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

          ${canManageAny ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'management' ? 'active' : ''}" data-nav-tab="management">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">⚙️</span>
                <span class="safe-nav-text">Yönetim Paneli</span>
              </div>
              <span class="safe-nav-pill admin">Yönetici</span>
            </button>
          ` : ''}

          ${isAdminUser() ? `
            <button type="button" class="safe-nav-item ${state.activeTab === 'cloud-settings' ? 'active' : ''}" data-nav-tab="cloud-settings">
              <div class="safe-nav-left">
                <span class="safe-nav-icon">☁️</span>
                <span class="safe-nav-text">Bulut (Firebase)</span>
              </div>
              <span class="safe-nav-pill ${state.firestoreDb ? 'admin' : ''}">
                ${state.firestoreDb ? '● Canlı' : 'Bağla'}
              </span>
            </button>
          ` : ''}
        </nav>

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
              Kullanıcı: ${user.tc} • ${user.shift}
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
    } else if (state.activeTab === 'management') {
      screenHtml = renderManagementScreen();
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

      <!-- ŞİFRE DEĞİŞTİRME MODALI -->
      <div class="safe-modal-backdrop" id="modalChangePassword">
        <div class="safe-modal-box" style="max-width: 440px;">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>🔑</span> Şifremi Değiştir</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formChangePassword">
            <div class="safe-form-group">
              <label class="safe-label">Mevcut Şifre</label>
              <input type="password" class="safe-input" id="inputOldPassword" required />
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Yeni Şifre</label>
              <input type="password" class="safe-input" id="inputNewPassword" placeholder="En az 3 karakter" required />
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Yeni Şifre (Tekrar)</label>
              <input type="password" class="safe-input" id="inputConfirmPassword" required />
            </div>
            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Şifreyi Güncelle</span>
            </button>
          </form>
        </div>
      </div>

      <!-- YENİ KULLANICI EKLEME MODALI -->
      <div class="safe-modal-backdrop" id="modalAddUser">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>➕</span> Yeni Çalışan Ekle</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formAddUser">
            <div class="safe-form-group">
              <label class="safe-label">Kullanıcı Adı / TC Kimlik No <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newUserTc" placeholder="Örn: ahmet123 veya TC No" required />
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
              <label class="safe-label">Atanacak Rol <span style="color:var(--safe-primary);">*</span></label>
              <select class="safe-select" id="newUserRoleId" required>
                ${state.roles.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}
              </select>
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Departman</label>
              <select class="safe-select" id="newUserDept">
                ${state.departments.map((d) => `<option value="${d.name}">${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Görevi / Ünvanı</label>
              <input type="text" class="safe-input" id="newUserTitle" placeholder="Örn: CNC Operatörü" required />
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Vardiya</label>
              <select class="safe-select" id="newUserShift">
                ${state.shifts.map((s) => `<option value="${s.name}">${s.name}</option>`).join('')}
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
            <h3 class="safe-modal-title"><span>✏️</span> Kullanıcı Düzenle</h3>
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
                ${state.departments.map((d) => `<option value="${d.name}">${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Ünvan</label>
              <input type="text" class="safe-input" id="editUserTitle" required />
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Vardiya</label>
              <select class="safe-select" id="editUserShift">
                ${state.shifts.map((s) => `<option value="${s.name}">${s.name}</option>`).join('')}
              </select>
            </div>
            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Kaydet</span>
            </button>
          </form>
        </div>
      </div>

      <!-- YENİ ROL TANIMLAMA MODALI -->
      <div class="safe-modal-backdrop" id="modalAddRole">
        <div class="safe-modal-box">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>🛡️</span> Yeni Rol Tanımla</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formAddRole">
            <div class="safe-form-group">
              <label class="safe-label">Rol Adı <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newRoleName" placeholder="Örn: Hat Lideri / Formen" required />
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Rol Açıklaması</label>
              <input type="text" class="safe-input" id="newRoleDesc" placeholder="Örn: Vardiya sorumlusu..." />
            </div>
            <div class="safe-form-group" style="background:var(--safe-bg-subtle); padding:1rem; border-radius:10px; border:1px solid var(--safe-border);">
              <label class="safe-label" style="margin-bottom:0.75rem;">Bu Role Verilecek Yetkiler</label>
              <div style="display:flex; flex-direction:column; gap:0.55rem;">
                ${ALL_PERMISSIONS.map((perm) => `
                  <label style="display:flex; align-items:center; gap:0.55rem; font-size:0.86rem; color:var(--safe-text); cursor:pointer;">
                    <input type="checkbox" class="new-role-perm-chk" value="${perm.key}" ${perm.key === 'feedback' ? 'checked disabled' : ''} style="width:17px; height:17px; accent-color:var(--safe-primary);" />
                    <span>${perm.label} ${perm.key === 'feedback' ? '<span style="color:var(--safe-primary); font-size:0.72rem;">(Zorunlu)</span>' : ''}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Rolü Oluştur</span>
            </button>
          </form>
        </div>
      </div>

      <!-- DEPARTMAN EKLEME MODALI -->
      <div class="safe-modal-backdrop" id="modalAddDept">
        <div class="safe-modal-box" style="max-width:440px;">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>🏢</span> Yeni Departman Ekle</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formAddDept">
            <div class="safe-form-group">
              <label class="safe-label">Departman / Hat Adı <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newDeptName" placeholder="Örn: Robotik Kaynak Hattı" required />
            </div>
            <div class="safe-form-group">
              <label class="safe-label">Kısa Kod (İsteğe bağlı)</label>
              <input type="text" class="safe-input" id="newDeptCode" placeholder="Örn: ROB" />
            </div>
            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Departmanı Ekle</span>
            </button>
          </form>
        </div>
      </div>

      <!-- VARDİYA EKLEME MODALI -->
      <div class="safe-modal-backdrop" id="modalAddShift">
        <div class="safe-modal-box" style="max-width:440px;">
          <div class="safe-modal-header">
            <h3 class="safe-modal-title"><span>⏰</span> Yeni Vardiya Ekle</h3>
            <button type="button" class="safe-modal-close" data-modal-close>&times;</button>
          </div>
          <form id="formAddShift">
            <div class="safe-form-group">
              <label class="safe-label">Vardiya Adı <span style="color:var(--safe-primary);">*</span></label>
              <input type="text" class="safe-input" id="newShiftName" placeholder="Örn: 1. Vardiya (08:00 - 16:00)" required />
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="safe-form-group">
                <label class="safe-label">Başlangıç Saati</label>
                <input type="time" class="safe-input" id="newShiftStart" value="08:00" required />
              </div>
              <div class="safe-form-group">
                <label class="safe-label">Bitiş Saati</label>
                <input type="time" class="safe-input" id="newShiftEnd" value="16:00" required />
              </div>
            </div>
            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%;">
              <span>Vardiyayı Kaydet</span>
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

  // ==================== GİRİŞ EKRANI ====================
  function renderLoginScreen() {
    return `
      <div class="safe-login-view">
        <div class="safe-login-card">
          <div class="safe-login-icon-wrap">🛡️</div>
          <h2 class="safe-login-title">Safe5 Fabrika Portalı</h2>
          <p class="safe-login-subtitle">
            Lütfen kullanıcı adı / TC kimlik numaranız ve şifrenizle giriş yapınız.
          </p>

          <form id="safeLoginForm">
            <div class="safe-form-group" style="text-align:left;">
              <label class="safe-label">Kullanıcı Adı / TC Kimlik No</label>
              <input type="text" class="safe-input" id="loginTc" placeholder="admin" required autofocus />
            </div>

            <div class="safe-form-group" style="text-align:left;">
              <label class="safe-label">Giriş Şifresi</label>
              <input type="password" class="safe-input" id="loginPassword" placeholder="admin" required />
            </div>

            <button type="submit" class="safe-btn safe-btn-primary safe-btn-lg" style="width:100%; margin-top:0.5rem;" id="btnLoginSubmit">
              <span>Giriş Yap</span>
              <span>➔</span>
            </button>
          </form>

          <div class="safe-login-alert">
            <div style="font-weight:700; margin-bottom:0.25rem;">👑 İlk Yönetici Girişi:</div>
            <div>Kullanıcı Adı: <b>admin</b> &nbsp;•&nbsp; Şifre: <b>admin</b></div>
            <div style="font-size:0.75rem; color:var(--safe-text-muted); margin-top:0.35rem;">
              Admin olarak giriş yapıp rol, departman, vardiya ve personelleri tanımlayabilirsiniz.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== EKRAN 1: GERİ BİLDİRİM VERME ====================
  function renderGiveFeedbackScreen() {
    const user = state.currentUser;
    const otherUsers = state.users.filter((u) => u.tc !== user.tc);

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge primary">✨ Ana Sayfa</span>
        <h1 class="safe-page-title">Geri Bildirim &amp; Takdir Gönder</h1>
        <p class="safe-page-subtitle">Çalışma arkadaşınızın güvenli davranışını, 5S tertibini veya başarılı çalışmasını takdir edin.</p>
      </div>

      <div class="safe-card" style="max-width: 820px;">
        <form id="safeFeedbackForm">
          <!-- Alıcı Seçimi -->
          <div class="safe-form-group">
            <label class="safe-label">Kime Geri Bildirim Veriyorsun? <span style="color:var(--safe-primary);">*</span></label>
            <select class="safe-select" id="inputRecipient" required>
              <option value="" disabled selected>-- Çalışma Arkadaşını Seçin --</option>
              ${otherUsers.length > 0
                ? otherUsers.map((u) => `<option value="${u.tc}">${u.name} — ${u.department} (${u.title})</option>`).join('')
                : '<option value="" disabled>Henüz başka kayıtlı kullanıcı yok. Yönetim panelinden kullanıcı ekleyebilirsiniz.</option>'
              }
            </select>
          </div>

          <!-- Gerçekleşen Departman (Kullanıcı İsteği) -->
          <div class="safe-form-group">
            <label class="safe-label">Gerçekleşen Departman / Bölüm <span style="color:var(--safe-primary);">*</span></label>
            <select class="safe-select" id="inputDepartment" required>
              ${state.departments.map((d) => `<option value="${d.name}">${d.name}</option>`).join('')}
            </select>
          </div>

          <!-- Bildirim Türü -->
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

          <!-- 5S İlkesi -->
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

          <!-- Mesaj -->
          <div class="safe-form-group">
            <label class="safe-label">Açıklama / Mesaj Notun <span style="color:var(--safe-primary);">*</span></label>
            <textarea class="safe-textarea" id="inputMessage" placeholder="Örn: Pres hattında hidrolik sızıntıyı anında temizleyip hat duruşunu önledi..." required></textarea>
          </div>

          <!-- Anonimlik ve Vardiya -->
          <div class="safe-inline-controls">
            <label class="safe-switch-label">
              <input type="checkbox" id="inputIsAnonymous" style="width:20px; height:20px; accent-color:var(--safe-primary); cursor:pointer;" />
              <div>
                <div>🕵️‍♂️ Anonim Gönder</div>
                <div style="font-size:0.75rem; color:var(--safe-text-muted); font-weight:normal;">İsmim gizlensin, sadece mesajım görünsün</div>
              </div>
            </label>

            <div>
              <label class="safe-label" style="font-size:0.8rem; margin-bottom:0.25rem;">Vardiya</label>
              <select class="safe-select" id="inputShift">
                ${state.shifts.map((s) => `<option value="${s.name}">${s.name}</option>`).join('')}
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
    const canViewAll = hasPermission(user, 'view_all_feed') || isAdminUser();

    // Yetkisi yoksa ve 'all' seçiliyse otomatik 'received' sekmesine al
    if (!canViewAll && state.feedFilter === 'all') {
      state.feedFilter = 'received';
    }

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
          ${canViewAll ? `
            <button type="button" class="safe-feed-tab ${state.feedFilter === 'all' ? 'active' : ''}" data-feed-filter="all">
              🌍 Tüm Akış (${state.feedbacks.length})
            </button>
          ` : ''}
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
    const canViewAll = hasPermission(user, 'view_all_feed') || isAdminUser();
    const canManageStatus = hasPermission(user, 'manage_status') || isAdminUser();
    let list = [...state.feedbacks];

    if (!canViewAll && state.feedFilter === 'all') {
      state.feedFilter = 'received';
    }

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
        (f.departmentName && f.departmentName.toLowerCase().includes(q)) ||
        (f.message && f.message.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      return `
        <div class="safe-card" style="text-align:center; padding:3.5rem 1rem;">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">📭</div>
          <h3 style="color:var(--safe-text); margin-bottom:0.35rem;">Bu alanda henüz bir geri bildirim bulunmuyor.</h3>
          <p style="color:var(--safe-text-muted); font-size:0.88rem;">Yeni bildirim iletmek için 'Geri Bildirim Ver' sekmesini kullanabilirsiniz.</p>
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
            ${f.departmentName ? `<span class="safe-tag badge-custom">🏢 ${f.departmentName}</span>` : ''}
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

  // ==================== EKRAN 3: VERİ ANALİZİ ====================
  function renderAnalyticsScreen() {
    const analytics = computeAnalytics();

    return `
      <div class="safe-page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="safe-page-badge primary">📊 Veri Analizi</span>
          <h1 class="safe-page-title">Fabrika Geri Bildirim Analitikleri</h1>
          <p class="safe-page-subtitle">Kategori, departman ve vardiya bazlı performans metrikleri</p>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="safe-btn safe-btn-primary" id="btnExportCSV">
            <span>📊</span> <span>Excel / CSV İndir</span>
          </button>
          <button type="button" class="safe-btn safe-btn-secondary" id="btnExportJSON">
            <span>💾</span> <span>JSON Yedek</span>
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
              <h3 class="safe-card-title"><span>🏢</span> Gerçekleşen Departman Dağılımı</h3>
              <p class="safe-card-desc">Olayların gerçekleştiği bölümler</p>
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
              <p class="safe-card-desc">Tanımlı vardiyaların katılım oranları</p>
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

  // ==================== EKRAN 4: YÖNETİM PANELİ (KULLANICI, ROL, DEPARTMAN, VARDİYA) ====================
  function renderManagementScreen() {
    return `
      <div class="safe-page-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
        <div>
          <span class="safe-page-badge indigo">⚙️ Yönetim Paneli</span>
          <h1 class="safe-page-title">Fabrika Yönetim &amp; Tanımlama Merkezi</h1>
          <p class="safe-page-subtitle">Kullanıcıları, dinamik rolleri, fabrika departmanlarını ve vardiya saatlerini tanımlayın.</p>
        </div>

        <div>
          ${state.activeMgmtTab === 'users' ? `
            <button type="button" class="safe-btn safe-btn-primary" id="btnOpenAddUser">
              <span>➕</span> <span>Yeni Kullanıcı Ekle</span>
            </button>
          ` : state.activeMgmtTab === 'roles' ? `
            <button type="button" class="safe-btn safe-btn-primary" id="btnOpenAddRole">
              <span>➕</span> <span>Yeni Rol Tanımla</span>
            </button>
          ` : state.activeMgmtTab === 'departments' ? `
            <button type="button" class="safe-btn safe-btn-primary" id="btnOpenAddDept">
              <span>➕</span> <span>Yeni Departman Ekle</span>
            </button>
          ` : `
            <button type="button" class="safe-btn safe-btn-primary" id="btnOpenAddShift">
              <span>➕</span> <span>Yeni Vardiya Ekle</span>
            </button>
          `}
        </div>
      </div>

      <!-- Alt Sekmeler -->
      <div class="safe-tabs-bar">
        <button type="button" class="safe-tab-btn ${state.activeMgmtTab === 'users' ? 'active' : ''}" data-mgmt-tab="users">
          👥 Kullanıcılar (${state.users.length})
        </button>
        <button type="button" class="safe-tab-btn ${state.activeMgmtTab === 'roles' ? 'active' : ''}" data-mgmt-tab="roles">
          🛡️ Roller &amp; Yetki Matrisi (${state.roles.length})
        </button>
        <button type="button" class="safe-tab-btn ${state.activeMgmtTab === 'departments' ? 'active' : ''}" data-mgmt-tab="departments">
          🏢 Departmanlar (${state.departments.length})
        </button>
        <button type="button" class="safe-tab-btn ${state.activeMgmtTab === 'shifts' ? 'active' : ''}" data-mgmt-tab="shifts">
          ⏰ Vardiya Saatleri (${state.shifts.length})
        </button>
      </div>

      ${state.activeMgmtTab === 'users' ? renderUsersTable()
        : state.activeMgmtTab === 'roles' ? renderRolesTable()
        : state.activeMgmtTab === 'departments' ? renderDepartmentsTable()
        : renderShiftsTable()
      }
    `;
  }

  // 4.1 Kullanıcılar Tablosu
  function renderUsersTable() {
    return `
      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>Kullanıcı Adı / TC</th>
              <th>Ad Soyad &amp; Ünvan</th>
              <th>Departman</th>
              <th>Vardiya</th>
              <th>Rolü</th>
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

  // 4.2 Roller & Yetki Matrisi Tablosu
  function renderRolesTable() {
    return `
      <div class="safe-card" style="margin-bottom:1.5rem; background:var(--safe-indigo-light); border-color:var(--safe-indigo-border);">
        <div style="font-weight:700; color:var(--safe-indigo); font-size:0.9rem; margin-bottom:0.25rem;">
          💡 Dinamik Rol &amp; Yetki Sistemi:
        </div>
        <div style="font-size:0.84rem; color:var(--safe-text-secondary); line-height:1.4;">
          Aşağıdaki matriste bir rolün yetkisini güncellediğinizde, o role atanmış <b>tüm kullanıcıların ekran ve işlem yetkileri anında güncellenir.</b>
          Ayrıca üstteki <b>"+ Yeni Rol Tanımla"</b> butonu ile fabrikanıza özel yeni roller oluşturabilirsiniz.
        </div>
      </div>

      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>Rol Adı &amp; Açıklaması</th>
              <th>Bağlı Personel</th>
              ${ALL_PERMISSIONS.map((p) => `<th style="text-align:center; font-size:0.78rem;">${p.label}</th>`).join('')}
              <th>İşlem</th>
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
                    <span style="font-weight:700; color:var(--safe-primary);">${assignedUserCount} kişi</span>
                  </td>
                  ${ALL_PERMISSIONS.map((col) => {
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
                  <td>
                    ${!isAdminRole ? `
                      <button type="button" class="safe-btn safe-btn-sm safe-btn-danger" data-remove-role-id="${r.id}" title="Rolü Sil">
                        <span>🗑️</span>
                      </button>
                    ` : '<span style="font-size:0.75rem; color:var(--safe-text-muted);">(Sistem)</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 4.3 Departmanlar Tablosu
  function renderDepartmentsTable() {
    return `
      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>Departman / Üretim Hattı Adı</th>
              <th>Kısa Kod</th>
              <th>Bağlı Personel</th>
              <th>Toplam Bildirim</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${state.departments.map((d) => {
              const userCount = state.users.filter((u) => u.department === d.name).length;
              const fbCount = state.feedbacks.filter((f) => f.departmentName === d.name).length;

              return `
                <tr>
                  <td><div style="font-weight:700; color:var(--safe-text); font-size:0.94rem;">🏢 ${d.name}</div></td>
                  <td><code style="font-weight:700; color:var(--safe-sky);">${d.code || '-'}</code></td>
                  <td><span style="font-weight:600;">${userCount} personel</span></td>
                  <td><span style="font-weight:700; color:var(--safe-primary);">${fbCount} bildirim</span></td>
                  <td>
                    <button type="button" class="safe-btn safe-btn-sm safe-btn-danger" data-remove-dept-id="${d.id}" title="Departmanı Sil">
                      <span>🗑️ Sil</span>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 4.4 Vardiyalar Tablosu
  function renderShiftsTable() {
    return `
      <div class="safe-table-container">
        <table class="safe-table">
          <thead>
            <tr>
              <th>Vardiya Adı</th>
              <th>Başlangıç Saati</th>
              <th>Bitiş Saati</th>
              <th>Atanmış Personel</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${state.shifts.map((s) => {
              const userCount = state.users.filter((u) => u.shift === s.name).length;

              return `
                <tr>
                  <td><div style="font-weight:700; color:var(--safe-text); font-size:0.94rem;">⏰ ${s.name}</div></td>
                  <td><b>${s.startTime || '-'}</b></td>
                  <td><b>${s.endTime || '-'}</b></td>
                  <td><span style="font-weight:600;">${userCount} personel</span></td>
                  <td>
                    <button type="button" class="safe-btn safe-btn-sm safe-btn-danger" data-remove-shift-id="${s.id}" title="Vardiyayı Sil">
                      <span>🗑️ Sil</span>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==================== EKRAN 5: BULUT VERİTABANI (FIREBASE) ====================
  function renderCloudSettingsScreen() {
    const isConnected = Boolean(state.firestoreDb);

    return `
      <div class="safe-page-header">
        <span class="safe-page-badge ${isConnected ? 'primary' : 'indigo'}">
          ${isConnected ? '● Canlı Bulut Aktif' : '☁️ Bulut Ayarları'}
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
                <span>Bağlantıyı Kes</span>
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

  // ==================== KART DİNLENMESİ ====================
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
    // 1. Çıkış Yap
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.onclick = logout;

    // 2. Şifre Değiştirme Modalı
    const modalPassword = document.getElementById('modalChangePassword');
    const btnOpenPassword = document.getElementById('btnOpenChangePassword');
    if (btnOpenPassword && modalPassword) {
      btnOpenPassword.onclick = () => modalPassword.classList.add('active');
    }

    const formChangePassword = document.getElementById('formChangePassword');
    if (formChangePassword) {
      formChangePassword.onsubmit = (e) => {
        e.preventDefault();
        const oldP = document.getElementById('inputOldPassword').value;
        const newP = document.getElementById('inputNewPassword').value;
        const confP = document.getElementById('inputConfirmPassword').value;

        const ok = changePassword(oldP, newP, confP);
        if (ok && modalPassword) {
          modalPassword.classList.remove('active');
          formChangePassword.reset();
        }
      };
    }

    // 3. Sidebar Navigasyon
    document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
      btn.onclick = () => {
        state.activeTab = btn.getAttribute('data-nav-tab');
        renderUI();
      };
    });

    // 4. Yönetim Paneli Alt Sekmeleri (Users, Roles, Departments, Shifts)
    document.querySelectorAll('[data-mgmt-tab]').forEach((btn) => {
      btn.onclick = () => {
        state.activeMgmtTab = btn.getAttribute('data-mgmt-tab');
        renderUI();
      };
    });

    // 5. Geri Bildirim Formu
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
        const dept = document.getElementById('inputDepartment').value;
        const message = document.getElementById('inputMessage').value;
        const shift = document.getElementById('inputShift').value;
        const isAnonymous = document.getElementById('inputIsAnonymous').checked;

        const success = submitFeedback({
          toTc,
          departmentName: dept,
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

    // 6. Tür ve Kategori Seçicileri
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

    // 7. Geri Bildirim İnceleme Filtreleri
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

    // 8. CSV & JSON
    const btnCSV = document.getElementById('btnExportCSV');
    if (btnCSV) btnCSV.onclick = exportCSV;

    const btnJSON = document.getElementById('btnExportJSON');
    if (btnJSON) btnJSON.onclick = exportJSON;

    // 9. Kullanıcı Ekleme / Düzenleme / Silme
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

    document.querySelectorAll('[data-remove-user-id]').forEach((btn) => {
      btn.onclick = () => removeUser(btn.getAttribute('data-remove-user-id'));
    });

    // 10. Rol Ekleme / Silme / Yetki Güncelleme
    const modalAddRole = document.getElementById('modalAddRole');
    const btnOpenAddRole = document.getElementById('btnOpenAddRole');
    if (btnOpenAddRole && modalAddRole) {
      btnOpenAddRole.onclick = () => modalAddRole.classList.add('active');
    }

    const formAddRole = document.getElementById('formAddRole');
    if (formAddRole) {
      formAddRole.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('newRoleName').value;
        const desc = document.getElementById('newRoleDesc').value;
        const perms = ['feedback'];
        document.querySelectorAll('.new-role-perm-chk:checked').forEach((chk) => {
          if (!perms.includes(chk.value)) perms.push(chk.value);
        });

        const ok = addRole(name, desc, perms);
        if (ok && modalAddRole) {
          modalAddRole.classList.remove('active');
          formAddRole.reset();
        }
      };
    }

    document.querySelectorAll('[data-remove-role-id]').forEach((btn) => {
      btn.onclick = () => removeRole(btn.getAttribute('data-remove-role-id'));
    });

    document.querySelectorAll('.safe-matrix-perm-chk').forEach((chk) => {
      chk.onchange = (e) => {
        const roleId = chk.getAttribute('data-role-id');
        const permKey = chk.getAttribute('data-perm-key');
        updateRolePermissions(roleId, permKey, e.target.checked);
      };
    });

    // 11. Departman Ekleme / Silme
    const modalAddDept = document.getElementById('modalAddDept');
    const btnOpenAddDept = document.getElementById('btnOpenAddDept');
    if (btnOpenAddDept && modalAddDept) {
      btnOpenAddDept.onclick = () => modalAddDept.classList.add('active');
    }

    const formAddDept = document.getElementById('formAddDept');
    if (formAddDept) {
      formAddDept.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('newDeptName').value;
        const code = document.getElementById('newDeptCode').value;
        const ok = addDepartment(name, code);
        if (ok && modalAddDept) {
          modalAddDept.classList.remove('active');
          formAddDept.reset();
        }
      };
    }

    document.querySelectorAll('[data-remove-dept-id]').forEach((btn) => {
      btn.onclick = () => removeDepartment(btn.getAttribute('data-remove-dept-id'));
    });

    // 12. Vardiya Ekleme / Silme
    const modalAddShift = document.getElementById('modalAddShift');
    const btnOpenAddShift = document.getElementById('btnOpenAddShift');
    if (btnOpenAddShift && modalAddShift) {
      btnOpenAddShift.onclick = () => modalAddShift.classList.add('active');
    }

    const formAddShift = document.getElementById('formAddShift');
    if (formAddShift) {
      formAddShift.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('newShiftName').value;
        const start = document.getElementById('newShiftStart').value;
        const end = document.getElementById('newShiftEnd').value;
        const ok = addShift(name, start, end);
        if (ok && modalAddShift) {
          modalAddShift.classList.remove('active');
          formAddShift.reset();
        }
      };
    }

    document.querySelectorAll('[data-remove-shift-id]').forEach((btn) => {
      btn.onclick = () => removeShift(btn.getAttribute('data-remove-shift-id'));
    });

    // 13. Bulut Veritabanı
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
          showToast('Firebase yapılandırması kaydedildi ve bulut senkronizasyonu başlatıldı!', 'success');
          renderUI();
        } catch (err) {
          showToast('Geçersiz JSON formatı.', 'warning');
        }
      };
    }

    const btnDisconnect = document.getElementById('btnDisconnectCloud');
    if (btnDisconnect) {
      btnDisconnect.onclick = () => {
        if (confirm('Bulut bağlantısını kesmek istediğinize emin misiniz?')) {
          state.firebaseConfig = null;
          state.firestoreDb = null;
          localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
          showToast('Bulut bağlantısı kesildi, yerel moda dönüldü.', 'info');
          renderUI();
        }
      };
    }

    // 14. Modalları Kapatma
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

  // Escape tuşuyla modalları kapat
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
