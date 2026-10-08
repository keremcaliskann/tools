/**
 * Görselden PDF Oluşturma Modülü (image-to-pdf.js)
 * %100 İstemci Taraflı
 */

(function () {
  const { utils } = window.PDFTools;

  let imageList = []; // { id, file, dataUrl, name, size, rotation, width, height }

  // DOM Elemanları
  const dropzone = document.getElementById('imgDropzone');
  const fileInput = document.getElementById('imgFileInput');
  const itemsGrid = document.getElementById('imgItemsGrid');
  const actionArea = document.getElementById('imgActionArea');
  const clearBtn = document.getElementById('imgClearBtn');
  const convertBtn = document.getElementById('imgConvertToPdfBtn');

  const pageSizeSelect = document.getElementById('imgPageSize');
  const orientationSelect = document.getElementById('imgOrientation');
  const marginSelect = document.getElementById('imgMargin');
  const fitSelect = document.getElementById('imgFit');

  if (!dropzone || !fileInput) return;

  // Sürükle - Bırak Olayları
  utils.setupDropzone(dropzone, fileInput, handleFiles);

  async function handleFiles(files) {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      utils.showToast('Lütfen geçerli görsel dosyaları seçin (JPG, PNG, WebP vb.)', 'error');
      return;
    }

    utils.showProgress(true, 'Görseller yükleniyor...', 10);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const dataUrl = await utils.readFileAsDataURL(file);
        const { width, height } = await getImageDimensions(dataUrl);

        imageList.push({
          id: 'img_' + Math.random().toString(36).substr(2, 9),
          file,
          dataUrl,
          name: file.name,
          size: file.size,
          rotation: 0,
          width,
          height
        });
      } catch (err) {
        console.error('Görsel okuma hatası:', err);
      }
    }

    utils.showProgress(false);
    renderGrid();
    utils.showToast(`${validFiles.length} görsel listeye eklendi`, 'success');
  }

  function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 800, height: 600 });
      img.src = dataUrl;
    });
  }

  function renderGrid() {
    itemsGrid.innerHTML = '';

    if (imageList.length === 0) {
      actionArea.style.display = 'none';
      return;
    }

    actionArea.style.display = 'flex';

    imageList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-thumb-container">
          <img src="${item.dataUrl}" alt="${item.name}" class="item-thumb" style="transform: rotate(${item.rotation}deg);">
        </div>
        <div class="item-info" title="${item.name}">${item.name}</div>
        <div class="item-subinfo">${utils.formatBytes(item.size)} • ${item.width}x${item.height}px</div>
        <div class="item-actions">
          <span class="item-order-badge">#${index + 1}</span>
          <div style="display: flex; gap: 4px;">
            <button class="card-action-btn" title="Sola Taşı" ${index === 0 ? 'disabled style="opacity:0.3"' : ''} data-action="prev" data-id="${item.id}">◀</button>
            <button class="card-action-btn" title="Sağa Taşı" ${index === imageList.length - 1 ? 'disabled style="opacity:0.3"' : ''} data-action="next" data-id="${item.id}">▶</button>
            <button class="card-action-btn" title="90° Döndür" data-action="rotate" data-id="${item.id}">↻</button>
            <button class="card-action-btn delete" title="Kaldır" data-action="delete" data-id="${item.id}">✕</button>
          </div>
        </div>
      `;

      // Kart Buton Olayları
      card.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          handleCardAction(action, id);
        });
      });

      itemsGrid.appendChild(card);
    });
  }

  function handleCardAction(action, id) {
    const idx = imageList.findIndex(x => x.id === id);
    if (idx === -1) return;

    if (action === 'delete') {
      imageList.splice(idx, 1);
      renderGrid();
      utils.showToast('Görsel listeden çıkarıldı', 'info');
    } else if (action === 'prev' && idx > 0) {
      const temp = imageList[idx];
      imageList[idx] = imageList[idx - 1];
      imageList[idx - 1] = temp;
      renderGrid();
    } else if (action === 'next' && idx < imageList.length - 1) {
      const temp = imageList[idx];
      imageList[idx] = imageList[idx + 1];
      imageList[idx + 1] = temp;
      renderGrid();
    } else if (action === 'rotate') {
      imageList[idx].rotation = (imageList[idx].rotation + 90) % 360;
      renderGrid();
    }
  }

  clearBtn.addEventListener('click', () => {
    if (imageList.length === 0) return;
    if (confirm('Eklenen tüm görseller temizlensin mi?')) {
      imageList = [];
      renderGrid();
      fileInput.value = '';
      utils.showToast('Görsel listesi temizlendi', 'info');
    }
  });

  // Görselleri Canvas ile Döndürülmüş PNG Blob/ArrayBuffer'a çevirme
  async function prepareImageBytes(item) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const rad = (item.rotation * Math.PI) / 180;
        const isRotated90or270 = item.rotation === 90 || item.rotation === 270;

        const w = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
        const h = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

        canvas.width = w;
        canvas.height = h;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob başarısız'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve({ buffer: reader.result, width: w, height: h });
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = item.dataUrl;
    });
  }

  // PDF Dönüştürme Mantığı
  convertBtn.addEventListener('click', async () => {
    if (imageList.length === 0) {
      utils.showToast('Lütfen önce en az bir görsel yükleyin', 'error');
      return;
    }

    try {
      convertBtn.disabled = true;
      utils.showProgress(true, 'PDF belgesi hazırlanıyor...', 15);

      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();

      const pageSizeChoice = pageSizeSelect.value; // 'a4', 'letter', 'original'
      const orientChoice = orientationSelect.value; // 'auto', 'portrait', 'landscape'
      const margin = parseFloat(marginSelect.value) || 0;
      const fitMode = fitSelect.value; // 'contain', 'cover'

      // Standart boyutlar (points: 1 inch = 72 pt, A4 = 595.28 x 841.89)
      const SIZES = {
        a4: [595.28, 841.89],
        letter: [612.00, 792.00]
      };

      const total = imageList.length;

      for (let i = 0; i < total; i++) {
        const item = imageList[i];
        utils.showProgress(true, `Görsel ${i + 1}/${total} işleniyor...`, 15 + ((i + 1) / total) * 75);

        // Görseli canvas üzerinden standardize et (döndürme ve format uyumluluğu için)
        const { buffer, width: imgW, height: imgH } = await prepareImageBytes(item);
        const embeddedImg = await pdfDoc.embedPng(buffer);

        let pageWidth, pageHeight;

        if (pageSizeChoice === 'original') {
          pageWidth = imgW + margin * 2;
          pageHeight = imgH + margin * 2;
        } else {
          const [baseW, baseH] = SIZES[pageSizeChoice];
          let isLandscape = false;

          if (orientChoice === 'landscape') {
            isLandscape = true;
          } else if (orientChoice === 'portrait') {
            isLandscape = false;
          } else {
            // Auto
            isLandscape = imgW > imgH;
          }

          pageWidth = isLandscape ? baseH : baseW;
          pageHeight = isLandscape ? baseW : baseH;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const availW = Math.max(10, pageWidth - margin * 2);
        const availH = Math.max(10, pageHeight - margin * 2);

        let drawW, drawH, drawX, drawY;

        if (fitMode === 'contain' || pageSizeChoice === 'original') {
          const scale = Math.min(availW / imgW, availH / imgH);
          drawW = imgW * scale;
          drawH = imgH * scale;
          drawX = margin + (availW - drawW) / 2;
          drawY = margin + (availH - drawH) / 2;
        } else {
          // Cover
          const scale = Math.max(availW / imgW, availH / imgH);
          drawW = imgW * scale;
          drawH = imgH * scale;
          drawX = margin + (availW - drawW) / 2;
          drawY = margin + (availH - drawH) / 2;
        }

        page.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH
        });
      }

      utils.showProgress(true, 'PDF kaydediliyor...', 95);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `gorseller_${dateStr}_${Date.now().toString().slice(-4)}.pdf`;

      utils.downloadBlob(blob, fileName);
      utils.showToast(`PDF başarıyla oluşturuldu (${utils.formatBytes(blob.size)})`, 'success');
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      utils.showToast('PDF oluşturulurken bir hata oluştu: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
      convertBtn.disabled = false;
    }
  });
})();
