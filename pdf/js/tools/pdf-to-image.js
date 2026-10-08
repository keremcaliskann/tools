/**
 * PDF'ten Görsele Dönüştürme Modülü (pdf-to-image.js)
 * %100 İstemci Taraflı
 */

(function () {
  const { utils } = window.PDFTools;

  let currentFile = null;
  let currentBuffer = null;
  let renderedPages = []; // { pageNum, blob, dataUrl, width, height }

  const dropzone = document.getElementById('p2iDropzone');
  const fileInput = document.getElementById('p2iFileInput');
  const optionsBar = document.getElementById('p2iOptionsBar');
  const formatSelect = document.getElementById('p2iFormat');
  const qualitySelect = document.getElementById('p2iQuality');
  const previewGrid = document.getElementById('p2iPreviewGrid');
  const actionArea = document.getElementById('p2iActionArea');
  const clearBtn = document.getElementById('p2iClearBtn');
  const downloadAllZipBtn = document.getElementById('p2iDownloadAllZipBtn');

  if (!dropzone || !fileInput) return;

  utils.setupDropzone(dropzone, fileInput, handleFile);

  async function handleFile(files) {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      utils.showToast('Lütfen geçerli bir PDF dosyası seçin', 'error');
      return;
    }

    currentFile = file;
    currentBuffer = await utils.readFileAsArrayBuffer(file);
    optionsBar.style.display = 'flex';
    actionArea.style.display = 'flex';

    await renderAllPages();
  }

  // Ayarlar değişirse sayfaları yeniden render et
  formatSelect.addEventListener('change', () => {
    if (currentBuffer) renderAllPages();
  });
  qualitySelect.addEventListener('change', () => {
    if (currentBuffer) renderAllPages();
  });

  async function renderAllPages() {
    if (!currentBuffer || !window.pdfjsLib) return;

    previewGrid.innerHTML = '';
    renderedPages = [];

    const format = formatSelect.value; // 'png' or 'jpeg'
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const scale = parseFloat(qualitySelect.value) || 2.0;

    try {
      utils.showProgress(true, 'PDF taranıyor...', 10);
      const pdf = await window.pdfjsLib.getDocument({ data: currentBuffer.slice(0) }).promise;
      const numPages = pdf.numPages;

      for (let pNum = 1; pNum <= numPages; pNum++) {
        utils.showProgress(true, `Sayfa ${pNum}/${numPages} görsele dönüştürülüyor...`, 10 + (pNum / numPages) * 80);

        const page = await pdf.getPage(pNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        const blob = await new Promise(res => canvas.toBlob(res, mimeType, 0.92));

        const pageObj = {
          pageNum: pNum,
          blob,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
          ext
        };
        renderedPages.push(pageObj);

        // Grid Kartını Ekle
        renderCard(pageObj);
      }

      utils.showToast(`${numPages} sayfa başarıyla dönüştürüldü`, 'success');
    } catch (err) {
      console.error('PDF görsel dönüştürme hatası:', err);
      utils.showToast('Görsele dönüştürme sırasında hata: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
    }
  }

  function renderCard(pageObj) {
    const card = document.createElement('div');
    card.className = 'item-card';

    card.innerHTML = `
      <div class="item-thumb-container">
        <img src="${pageObj.dataUrl}" alt="Sayfa ${pageObj.pageNum}" class="item-thumb">
      </div>
      <div class="item-info">Sayfa ${pageObj.pageNum}</div>
      <div class="item-subinfo">${Math.round(pageObj.width)}x${Math.round(pageObj.height)}px • ${utils.formatBytes(pageObj.blob.size)}</div>
      <div class="item-actions">
        <span class="item-order-badge">#${pageObj.pageNum}</span>
        <button class="btn btn-secondary card-download-btn" style="padding: 0.25rem 0.6rem; font-size: 0.78rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          İndir
        </button>
      </div>
    `;

    card.querySelector('.card-download-btn').addEventListener('click', () => {
      const baseName = currentFile.name.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_sayfa_${String(pageObj.pageNum).padStart(3, '0')}.${pageObj.ext}`;
      utils.downloadBlob(pageObj.blob, fileName);
      utils.showToast(`Sayfa ${pageObj.pageNum} indirildi`, 'success');
    });

    previewGrid.appendChild(card);
  }

  function resetUI() {
    currentFile = null;
    currentBuffer = null;
    renderedPages = [];
    previewGrid.innerHTML = '';
    optionsBar.style.display = 'none';
    actionArea.style.display = 'none';
    fileInput.value = '';
  }

  clearBtn.addEventListener('click', resetUI);

  downloadAllZipBtn.addEventListener('click', async () => {
    if (renderedPages.length === 0) return;

    try {
      downloadAllZipBtn.disabled = true;
      utils.showProgress(true, 'ZIP arşivi paketleniyor...', 20);

      const zip = new window.JSZip();
      const baseName = currentFile.name.replace(/\.pdf$/i, '');

      renderedPages.forEach(p => {
        const fileName = `${baseName}_sayfa_${String(p.pageNum).padStart(3, '0')}.${p.ext}`;
        zip.file(fileName, p.blob);
      });

      utils.showProgress(true, 'ZIP dosyası oluşturuluyor...', 80);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      utils.downloadBlob(zipBlob, `${baseName}_gorseller.zip`);

      utils.showToast('Tüm sayfalar ZIP olarak indirildi', 'success');
    } catch (err) {
      console.error('ZIP oluşturma hatası:', err);
      utils.showToast('ZIP oluşturulurken hata: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
      downloadAllZipBtn.disabled = false;
    }
  });
})();
