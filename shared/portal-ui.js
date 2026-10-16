/**
 * Workshop Unified Theme & Navigation Controller (portal-ui.js)
 * Tüm sayfalar arasında Koyu/Açık (Dark/Light) tema senkronizasyonunu
 * ve ortak üst bar etkileşimlerini yönetir.
 */
(function () {
  const STORAGE_KEY = 'workshop_theme';

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update all theme toggle buttons on the page
    const btns = document.querySelectorAll('[data-wp-theme-toggle]');
    btns.forEach((btn) => {
      const iconSpan = btn.querySelector('.wp-theme-icon');
      const labelSpan = btn.querySelector('.wp-theme-label');
      if (iconSpan) {
        iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
      }
      if (labelSpan) {
        labelSpan.textContent = theme === 'dark' ? 'Açık Tema' : 'Koyu Tema';
      }
      btn.setAttribute(
        'title',
        theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'
      );
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    applyTheme(next);
  }

  // Apply immediately on script load to avoid flash
  applyTheme(getSavedTheme());

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());

    document.querySelectorAll('[data-wp-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  });

  window.WorkshopUI = {
    getSavedTheme,
    applyTheme,
    toggleTheme,
  };
})();
