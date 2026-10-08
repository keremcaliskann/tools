/**
 * PDF Filigran ve Sayfa Numaralandırma Modülü (watermark-pdf.js)
 * %100 İstemci Taraflı
 */

(function () {
  const { utils } = window.PDFTools;

  let currentFile = null;
  let currentBuffer = null;
  let totalPages = 0;

  const dropzone = document.getElementById('wmDropzone');
  const fileInput = document.getElementById('wmFileInput');
  const optionsBar = document.getElementById('wmOptionsBar');
  const wmTextInput = document.getElementById('wmText');
  const wmOpacitySelect = document.getElementById('wmOpacity');
  const wmPageNumbersSelect = document.getElementById('wmPageNumbers');
  const fileInfoContainer = document.getElementById('wmFileInfo');
  const actionArea = document.getElementById('wmActionArea');
  const clearBtn = document.getElementById('wmClearBtn');
  const executeBtn = document.getElementById('wmExecuteBtn');

  if (!dropzone || !fileInput) return;

  utils.setupDropzone(dropzone, fileInput, handleFile);

  async function handleFile(files) {
    const file = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!file) {
      utils.showToast('Lütfen geçerli bir PDF dosyası seçin', 'error');
      return;
    }

    try {
      utils.showProgress(true, 'PDF inceleniyor...', 25);
      currentFile = file;
      currentBuffer = await utils.readFileAsArrayBuffer(file);

      const { PDFDocument } = window.PDFLib;
      const doc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });
      totalPages = doc.getPageCount();

      renderFileInfo();
      optionsBar.style.display = 'flex';
      actionArea.style.display = 'flex';
      utils.showToast(`${currentFile.name} (${totalPages} sayfa) hazır`, 'success');
    } catch (err) {
      console.error('PDF açma hatası:', err);
      utils.showToast('PDF dosyası açılamadı: ' + err.message, 'error');
      resetUI();
    } finally {
      utils.showProgress(false);
    }
  }

  function renderFileInfo() {
    fileInfoContainer.innerHTML = `
      <div class="list-item-card">
        <div class="list-item-left">
          <span class="item-order-badge">PDF</span>
          <div>
            <div class="list-item-title">${currentFile.name}</div>
            <div class="list-item-meta">${utils.formatBytes(currentFile.size)} • ${totalPages} Sayfa</div>
          </div>
        </div>
      </div>
    `;
  }

  function resetUI() {
    currentFile = null;
    currentBuffer = null;
    totalPages = 0;
    fileInfoContainer.innerHTML = '';
    optionsBar.style.display = 'none';
    actionArea.style.display = 'none';
    fileInput.value = '';
    wmTextInput.value = '';
  }

  clearBtn.addEventListener('click', resetUI);

  executeBtn.addEventListener('click', async () => {
    if (!currentBuffer) return;

    const wmText = wmTextInput.value.trim();
    const pageNumMode = wmPageNumbersSelect.value;
    const opacity = parseFloat(wmOpacitySelect.value) || 0.3;

    if (!wmText && pageNumMode === 'none') {
      utils.showToast('Lütfen filigran metni girin veya sayfa numarası seçeneğini etkinleştirin', 'warning');
      return;
    }

    try {
      executeBtn.disabled = true;
      utils.showProgress(true, 'Filigran ve sayfa numaraları ekleniyor...', 15);

      const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;
      const doc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });
      const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);

      const pages = doc.getPages();
      const count = pages.length;

      for (let i = 0; i < count; i++) {
        utils.showProgress(true, `Sayfa ${i + 1}/${count} işleniyor...`, 15 + ((i + 1) / count) * 75);

        const page = pages[i];
        const { width, height } = page.getSize();

        // 1. Filigran Metni Ekle (Çapraz 45 derece)
        if (wmText) {
          const fontSize = Math.min(width, height) * 0.12;
          const textWidth = helveticaFont.widthOfTextAtSize(wmText, fontSize);
          const textHeight = helveticaFont.heightAtSize(fontSize);

          // Sayfa merkezine çapraz yerleştirme
          const centerX = width / 2;
          const centerY = height / 2;

          page.drawText(wmText, {
            x: centerX - (textWidth / 2) * Math.cos(Math.PI / 4),
            y: centerY - (textWidth / 2) * Math.sin(Math.PI / 4),
            size: fontSize,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
            opacity: opacity,
            rotate: degrees(45)
          });
        }

        // 2. Sayfa Numarası Ekle
        if (pageNumMode !== 'none') {
          const numText = `Sayfa ${i + 1} / ${count}`;
          const numFontSize = 10;
          const numWidth = regularFont.widthOfTextAtSize(numText, numFontSize);

          let numX = 0;
          let numY = 0;

          if (pageNumMode === 'bottom-center') {
            numX = (width - numWidth) / 2;
            numY = 24;
          } else if (pageNumMode === 'bottom-right') {
            numX = width - numWidth - 30;
            numY = 24;
          } else if (pageNumMode === 'top-right') {
            numX = width - numWidth - 30;
            numY = height - 28;
          }

          page.drawText(numText, {
            x: numX,
            y: numY,
            size: numFontSize,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2),
            opacity: 0.8
          });
        }
      }

      utils.showProgress(true, 'PDF kaydediliyor...', 92);
      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      const baseName = currentFile.name.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_filigranli.pdf`;

      utils.downloadBlob(blob, fileName);
      utils.showToast(`Filigranlı PDF indirildi (${utils.formatBytes(blob.size)})`, 'success');
    } catch (err) {
      console.error('Filigran ekleme hatası:', err);
      utils.showToast('İşlem sırasında hata: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
      executeBtn.disabled = false;
    }
  });
})();
