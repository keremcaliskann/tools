/**
 * PDF Bölme & Sayfa Çıkarma Modülü (split-pdf.js)
 * %100 İstemci Taraflı
 */

(function () {
  const { utils } = window.PDFTools;

  let currentFile = null;
  let currentBuffer = null;
  let totalPages = 0;
  let selectedPages = new Set(); // 1-indexed

  const dropzone = document.getElementById('splitDropzone');
  const fileInput = document.getElementById('splitFileInput');
  const optionsBar = document.getElementById('splitOptionsBar');
  const modeSelect = document.getElementById('splitMode');
  const rangeInput = document.getElementById('splitRangeInput');
  const rangeGroup = document.getElementById('splitRangeGroup');
  const thumbsGrid = document.getElementById('splitThumbnailsGrid');
  const actionArea = document.getElementById('splitActionArea');
  const clearBtn = document.getElementById('splitClearBtn');
  const executeBtn = document.getElementById('splitExecuteBtn');

  if (!dropzone || !fileInput) return;

  utils.setupDropzone(dropzone, fileInput, handleFile);

  async function handleFile(files) {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      utils.showToast('Lütfen geçerli bir PDF dosyası seçin', 'error');
      return;
    }

    try {
      utils.showProgress(true, 'PDF taranıyor...', 20);
      currentFile = file;
      currentBuffer = await utils.readFileAsArrayBuffer(file);

      const { PDFDocument } = window.PDFLib;
      const doc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });
      totalPages = doc.getPageCount();

      selectedPages.clear();
      // Varsayılan olarak tüm sayfaları seç
      for (let i = 1; i <= totalPages; i++) selectedPages.add(i);
      updateRangeInputFromSet();

      optionsBar.style.display = 'flex';
      actionArea.style.display = 'flex';

      await renderThumbnails();
      utils.showToast(`${totalPages} sayfalık PDF yüklendi`, 'success');
    } catch (err) {
      console.error('PDF açma hatası:', err);
      utils.showToast('PDF dosyası açılamadı: ' + err.message, 'error');
      resetUI();
    } finally {
      utils.showProgress(false);
    }
  }

  modeSelect.addEventListener('change', () => {
    if (modeSelect.value === 'each') {
      rangeGroup.style.display = 'none';
      executeBtn.textContent = 'Tüm Sayfaları Böl (ZIP İndir)';
    } else {
      rangeGroup.style.display = 'flex';
      executeBtn.textContent = 'Sayfaları Çıkar ve İndir';
    }
  });

  rangeInput.addEventListener('input', () => {
    parseRangeInput();
    updateThumbnailsHighlight();
  });

  function parseRangeInput() {
    selectedPages.clear();
    const str = rangeInput.value.trim();
    if (!str) return;

    const parts = str.split(',');
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          const min = Math.max(1, Math.min(s, e));
          const max = Math.min(totalPages, Math.max(s, e));
          for (let p = min; p <= max; p++) selectedPages.add(p);
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          selectedPages.add(p);
        }
      }
    });
  }

  function updateRangeInputFromSet() {
    if (selectedPages.size === 0) {
      rangeInput.value = '';
      return;
    }

    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    let ranges = [];
    let start = sorted[0];
    let end = start;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = sorted[i];
        end = start;
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    rangeInput.value = ranges.join(', ');
  }

  async function renderThumbnails() {
    thumbsGrid.innerHTML = '';
    if (!window.pdfjsLib) return;

    try {
      const pdfJsDoc = await window.pdfjsLib.getDocument({ data: currentBuffer.slice(0) }).promise;

      for (let pNum = 1; pNum <= totalPages; pNum++) {
        utils.showProgress(true, `Önizlemeler hazırlanıyor (${pNum}/${totalPages})...`, (pNum / totalPages) * 80);

        const page = await pdfJsDoc.getPage(pNum);
        const viewport = page.getViewport({ scale: 0.25 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        const card = document.createElement('div');
        card.className = `item-card ${selectedPages.has(pNum) ? 'selected' : ''}`;
        card.dataset.pageNum = pNum;
        card.style.cursor = 'pointer';

        if (selectedPages.has(pNum)) {
          card.style.borderColor = 'var(--primary)';
        }

        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'item-thumb-container';

        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.className = 'item-thumb';
        thumbContainer.appendChild(img);

        const info = document.createElement('div');
        info.className = 'item-info';
        info.style.textAlign = 'center';
        info.textContent = `Sayfa ${pNum}`;

        card.appendChild(thumbContainer);
        card.appendChild(info);

        card.addEventListener('click', () => {
          if (selectedPages.has(pNum)) {
            selectedPages.delete(pNum);
          } else {
            selectedPages.add(pNum);
          }
          updateRangeInputFromSet();
          updateThumbnailsHighlight();
        });

        thumbsGrid.appendChild(card);
      }
    } catch (err) {
      console.warn('Önizleme oluşturulamadı:', err);
    }
  }

  function updateThumbnailsHighlight() {
    thumbsGrid.querySelectorAll('.item-card').forEach(card => {
      const pNum = parseInt(card.dataset.pageNum, 10);
      if (selectedPages.has(pNum)) {
        card.style.borderColor = 'var(--primary)';
        card.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.4)';
      } else {
        card.style.borderColor = 'var(--border-color)';
        card.style.boxShadow = 'none';
      }
    });
  }

  function resetUI() {
    currentFile = null;
    currentBuffer = null;
    totalPages = 0;
    selectedPages.clear();
    thumbsGrid.innerHTML = '';
    optionsBar.style.display = 'none';
    actionArea.style.display = 'none';
    fileInput.value = '';
  }

  clearBtn.addEventListener('click', resetUI);

  executeBtn.addEventListener('click', async () => {
    if (!currentBuffer) return;

    const { PDFDocument } = window.PDFLib;
    const mode = modeSelect.value;

    try {
      executeBtn.disabled = true;

      if (mode === 'each') {
        // Her sayfayı ayrı ayrı PDF yapıp ZIP olarak indir
        utils.showProgress(true, 'Sayfalar tek tek bölünüyor...', 10);

        if (!window.JSZip) {
          throw new Error('JSZip kütüphanesi yüklenemedi.');
        }

        const zip = new window.JSZip();
        const srcDoc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });

        for (let i = 0; i < totalPages; i++) {
          utils.showProgress(true, `Sayfa ${i + 1}/${totalPages} ayrıştırılıyor...`, 10 + ((i + 1) / totalPages) * 75);

          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
          singleDoc.addPage(copiedPage);

          const pdfBytes = await singleDoc.save();
          const pageName = `sayfa_${String(i + 1).padStart(3, '0')}.pdf`;
          zip.file(pageName, pdfBytes);
        }

        utils.showProgress(true, 'ZIP arşivi oluşturuluyor...', 90);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const baseName = currentFile.name.replace(/\.pdf$/i, '');
        utils.downloadBlob(zipBlob, `${baseName}_sayfalar.zip`);
        utils.showToast('Tüm sayfalar başarıyla ZIP olarak indirildi', 'success');

      } else {
        // Seçili sayfaları tek bir PDF olarak çıkar
        if (selectedPages.size === 0) {
          utils.showToast('Lütfen en az bir sayfa seçin', 'warning');
          return;
        }

        utils.showProgress(true, 'Seçili sayfalar ayıklanıyor...', 20);
        const srcDoc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });
        const newDoc = await PDFDocument.create();

        // 1-indexed to 0-indexed
        const indices = Array.from(selectedPages)
          .sort((a, b) => a - b)
          .map(p => p - 1);

        const copiedPages = await newDoc.copyPages(srcDoc, indices);
        copiedPages.forEach(p => newDoc.addPage(p));

        utils.showProgress(true, 'PDF kaydediliyor...', 90);
        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const baseName = currentFile.name.replace(/\.pdf$/i, '');
        utils.downloadBlob(blob, `${baseName}_secili_${indices.length}_sayfa.pdf`);
        utils.showToast(`${indices.length} sayfalık yeni PDF oluşturuldu`, 'success');
      }
    } catch (err) {
      console.error('PDF bölme hatası:', err);
      utils.showToast('İşlem sırasında hata oluştu: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
      executeBtn.disabled = false;
    }
  });
})();
