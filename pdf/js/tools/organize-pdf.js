/**
 * PDF Sayfalarını Düzenleme, Döndürme & Sıralama Modülü (organize-pdf.js)
 * %100 İstemci Taraflı
 */

(function () {
  const { utils } = window.PDFTools;

  let currentFile = null;
  let currentBuffer = null;
  let pagesList = []; // { id, originalIndex, rotation, thumbUrl }

  const dropzone = document.getElementById('orgDropzone');
  const fileInput = document.getElementById('orgFileInput');
  const pagesGrid = document.getElementById('orgPagesGrid');
  const actionArea = document.getElementById('orgActionArea');
  const rotateAllBtn = document.getElementById('orgRotateAllBtn');
  const clearBtn = document.getElementById('orgClearBtn');
  const saveBtn = document.getElementById('orgSaveBtn');

  if (!dropzone || !fileInput) return;

  utils.setupDropzone(dropzone, fileInput, handleFile);

  async function handleFile(files) {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      utils.showToast('Lütfen geçerli bir PDF dosyası seçin', 'error');
      return;
    }

    try {
      utils.showProgress(true, 'PDF sayfaları taranıyor...', 15);
      currentFile = file;
      currentBuffer = await utils.readFileAsArrayBuffer(file);

      const pdf = await window.pdfjsLib.getDocument({ data: currentBuffer.slice(0) }).promise;
      const count = pdf.numPages;

      pagesList = [];

      for (let pNum = 1; pNum <= count; pNum++) {
        utils.showProgress(true, `Sayfa ${pNum}/${count} hazırlanıyor...`, 15 + (pNum / count) * 75);

        const page = await pdf.getPage(pNum);
        const viewport = page.getViewport({ scale: 0.3 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        pagesList.push({
          id: 'page_' + pNum + '_' + Math.random().toString(36).substr(2, 5),
          originalIndex: pNum - 1, // 0-based
          rotation: 0,
          thumbUrl: canvas.toDataURL()
        });
      }

      actionArea.style.display = 'flex';
      renderGrid();
      utils.showToast(`${count} sayfa yüklendi`, 'success');
    } catch (err) {
      console.error('PDF organize hatası:', err);
      utils.showToast('PDF okunurken hata oluştu: ' + err.message, 'error');
      resetUI();
    } finally {
      utils.showProgress(false);
    }
  }

  function renderGrid() {
    pagesGrid.innerHTML = '';

    if (pagesList.length === 0) {
      actionArea.style.display = 'none';
      return;
    }

    actionArea.style.display = 'flex';

    pagesList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="item-thumb-container">
          <img src="${item.thumbUrl}" alt="Sayfa ${item.originalIndex + 1}" class="item-thumb" style="transform: rotate(${item.rotation}deg);">
        </div>
        <div class="item-info">Sayfa ${item.originalIndex + 1} ${item.rotation > 0 ? `(${item.rotation}°)` : ''}</div>
        <div class="item-actions">
          <span class="item-order-badge">#${index + 1}</span>
          <div style="display: flex; gap: 4px;">
            <button class="card-action-btn" title="Sola Taşı" ${index === 0 ? 'disabled style="opacity:0.3"' : ''} data-action="prev" data-id="${item.id}">◀</button>
            <button class="card-action-btn" title="Sağa Taşı" ${index === pagesList.length - 1 ? 'disabled style="opacity:0.3"' : ''} data-action="next" data-id="${item.id}">▶</button>
            <button class="card-action-btn" title="90° Döndür" data-action="rotate" data-id="${item.id}">↻</button>
            <button class="card-action-btn delete" title="Sayfayı Sil" data-action="delete" data-id="${item.id}">✕</button>
          </div>
        </div>
      `;

      card.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          handleCardAction(action, id);
        });
      });

      pagesGrid.appendChild(card);
    });
  }

  function handleCardAction(action, id) {
    const idx = pagesList.findIndex(x => x.id === id);
    if (idx === -1) return;

    if (action === 'delete') {
      pagesList.splice(idx, 1);
      renderGrid();
      utils.showToast('Sayfa silindi', 'info');
    } else if (action === 'prev' && idx > 0) {
      const temp = pagesList[idx];
      pagesList[idx] = pagesList[idx - 1];
      pagesList[idx - 1] = temp;
      renderGrid();
    } else if (action === 'next' && idx < pagesList.length - 1) {
      const temp = pagesList[idx];
      pagesList[idx] = pagesList[idx + 1];
      pagesList[idx + 1] = temp;
      renderGrid();
    } else if (action === 'rotate') {
      pagesList[idx].rotation = (pagesList[idx].rotation + 90) % 360;
      renderGrid();
    }
  }

  rotateAllBtn.addEventListener('click', () => {
    pagesList.forEach(p => {
      p.rotation = (p.rotation + 90) % 360;
    });
    renderGrid();
    utils.showToast('Tüm sayfalar 90° döndürüldü', 'info');
  });

  function resetUI() {
    currentFile = null;
    currentBuffer = null;
    pagesList = [];
    pagesGrid.innerHTML = '';
    actionArea.style.display = 'none';
    fileInput.value = '';
  }

  clearBtn.addEventListener('click', resetUI);

  saveBtn.addEventListener('click', async () => {
    if (pagesList.length === 0) {
      utils.showToast('Kaydedilecek en az bir sayfa bulunmalıdır', 'warning');
      return;
    }

    try {
      saveBtn.disabled = true;
      utils.showProgress(true, 'Yeni PDF oluşturuluyor...', 15);

      const { PDFDocument, degrees } = window.PDFLib;
      const srcDoc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const total = pagesList.length;

      for (let i = 0; i < total; i++) {
        utils.showProgress(true, `Sayfa ekleniyor (${i + 1}/${total})...`, 15 + ((i + 1) / total) * 75);
        const item = pagesList[i];

        const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);

        if (item.rotation > 0) {
          const currentAngle = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
        }

        newDoc.addPage(copiedPage);
      }

      utils.showProgress(true, 'PDF kaydediliyor...', 92);
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      const baseName = currentFile.name.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_duzenlenmis.pdf`;

      utils.downloadBlob(blob, fileName);
      utils.showToast(`Yeni PDF hazırlandı (${utils.formatBytes(blob.size)})`, 'success');
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      utils.showToast('PDF kaydedilirken hata oluştu: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
      saveBtn.disabled = false;
    }
  });
})();
