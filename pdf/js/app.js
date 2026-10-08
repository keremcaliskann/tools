/**
 * PDF Araçları - Ana Yönetim ve Yardımcı Fonksiyonlar (app.js)
 * %100 İstemci Taraflı ve Güvenli
 */

// Global App Namespace
window.PDFTools = {
  // Aktif araç adı
  currentTool: 'image-to-pdf',

  // Yardımcı fonksiyonlar
  utils: {
    formatBytes(bytes, decimals = 1) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    },

    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      });
    },

    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    },

    showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (type === 'error') {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      } else {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
      }

      toast.innerHTML = `${iconSvg}<span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    showProgress(show, text = 'İşleniyor...', percent = 0) {
      const progEl = document.getElementById('globalProgress');
      const textEl = document.getElementById('progressText');
      const pctEl = document.getElementById('progressPercent');
      const barEl = document.getElementById('progressBar');

      if (!progEl) return;

      if (show) {
        progEl.style.display = 'block';
        if (textEl) textEl.textContent = text;
        const clamped = Math.min(100, Math.max(0, percent));
        if (pctEl) pctEl.textContent = `${Math.round(clamped)}%`;
        if (barEl) barEl.style.width = `${clamped}%`;
      } else {
        progEl.style.display = 'none';
        if (barEl) barEl.style.width = '0%';
      }
    },

    setupDropzone(dropzoneEl, fileInputEl, onFilesSelected) {
      if (!dropzoneEl || !fileInputEl) return;

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzoneEl.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzoneEl.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzoneEl.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzoneEl.classList.remove('dragover');
        });
      });

      dropzoneEl.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          onFilesSelected(Array.from(files));
        }
      });

      fileInputEl.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          onFilesSelected(Array.from(files));
        }
      });
    }
  }
};

// Sayfa Yüklendiğinde Başlatma
document.addEventListener('DOMContentLoaded', () => {
  // 1. Tema Yönetimi (Dark / Light)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('pdf_tools_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pdf_tools_theme', next);
      PDFTools.utils.showToast(next === 'dark' ? 'Koyu tema aktif' : 'Açık tema aktif', 'info');
    });
  }

  // 2. Sekme Yönetimi
  const tabs = document.querySelectorAll('.tool-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const toolId = tab.dataset.tool;
      switchTab(toolId);
    });
  });

  function switchTab(toolId) {
    PDFTools.currentTool = toolId;
    tabs.forEach(t => {
      if (t.dataset.tool === toolId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    document.querySelectorAll('.tool-view').forEach(view => {
      if (view.id === `tool-${toolId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Hash güncelle
    window.location.hash = toolId;
  }

  // Sayfa ilk yüklendiğinde Hash varsa aç
  if (window.location.hash) {
    const hashTool = window.location.hash.substring(1);
    const valid = document.querySelector(`.tool-tab-btn[data-tool="${hashTool}"]`);
    if (valid) {
      switchTab(hashTool);
    }
  }
});
