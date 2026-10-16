/**
 * ImageStudio Core Client-Side Engine (js/studio-core.js)
 * %100 Tarayıcı İçi Görsel İşleme, Hedef KB İkili Arama (Binary Search) Sıkıştırma ve Yardımcı Fonksiyonlar
 */

window.ImageStudio = {
  formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  },

  showToast(msg, icon = '✨') {
    let container = document.getElementById('isToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'isToastContainer';
      container.className = 'is-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'is-toast';
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  },

  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight, file });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Görsel dosyası okunamadı: ' + file.name));
      };
      img.src = url;
    });
  },

  canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.9) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
  },

  /**
   * Binary Search compression to fit within targetKB.
   * Adjusts JPEG/WebP quality (and slightly scales down if needed for very tight targets like <50KB).
   */
  async compressCanvasToTargetKB(sourceCanvas, targetKB, mimeType = 'image/jpeg') {
    const targetBytes = targetKB * 1024;

    // 1. Binary search quality from 0.10 to 0.96 at original canvas size
    let low = 0.08;
    let high = 0.96;
    let bestBlob = null;
    let bestQuality = 0.85;

    for (let step = 0; step < 7; step++) {
      const mid = (low + high) / 2;
      const blob = await this.canvasToBlob(sourceCanvas, mimeType, mid);
      if (blob && blob.size <= targetBytes) {
        bestBlob = blob;
        bestQuality = mid;
        low = mid; // try higher quality
      } else {
        high = mid; // need lower quality
      }
    }

    if (bestBlob && bestBlob.size <= targetBytes) {
      return { blob: bestBlob, quality: Math.round(bestQuality * 100), scale: 1 };
    }

    // 2. If even at minimum quality it exceeds targetKB, progressively scale down dimensions
    let scale = 0.85;
    while (scale >= 0.25) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.max(64, Math.round(sourceCanvas.width * scale));
      tempCanvas.height = Math.max(64, Math.round(sourceCanvas.height * scale));
      const ctx = tempCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(sourceCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

      const blob = await this.canvasToBlob(tempCanvas, mimeType, 0.72);
      if (blob && blob.size <= targetBytes) {
        return { blob, quality: 72, scale: Number(scale.toFixed(2)) };
      }
      scale -= 0.15;
    }

    const fallbackBlob = await this.canvasToBlob(sourceCanvas, mimeType, 0.1);
    return { blob: fallbackBlob, quality: 10, scale: 0.25 };
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
    }, 250);
  },

  setupDropzone(dropzoneEl, fileInputEl, onFiles) {
    if (!dropzoneEl || !fileInputEl) return;
    ['dragenter', 'dragover'].forEach((ev) => {
      dropzoneEl.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzoneEl.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      dropzoneEl.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove('dragover');
      });
    });
    dropzoneEl.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(Array.from(e.dataTransfer.files));
      }
    });
    fileInputEl.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(Array.from(e.target.files));
      }
    });
  }
};
