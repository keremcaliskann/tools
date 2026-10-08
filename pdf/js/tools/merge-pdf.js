/**
 * PDF Birleştirme Modülü (merge-pdf.js)
 * %100 İstemci Taraflı
 */

(function () {
  const { utils } = window.PDFTools;

  let mergeList = []; // { id, file, name, size, pageCount, buffer }

  const dropzone = document.getElementById('mergeDropzone');
  const fileInput = document.getElementById('mergeFileInput');
  const itemsList = document.getElementById('mergeItemsList');
  const actionArea = document.getElementById('mergeActionArea');
  const clearBtn = document.getElementById('mergeClearBtn');
  const executeBtn = document.getElementById('mergeExecuteBtn');

  if (!dropzone || !fileInput) return;

  utils.setupDropzone(dropzone, fileInput, handleFiles);

  async function handleFiles(files) {
    const validFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (validFiles.length === 0) {
      utils.showToast('Lütfen geçerli PDF dosyaları seçin', 'error');
      return;
    }

    utils.showProgress(true, 'PDF dosyaları analiz ediliyor...', 20);

    const { PDFDocument } = window.PDFLib;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const buffer = await utils.readFileAsArrayBuffer(file);
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pageCount = doc.getPageCount();

        mergeList.push({
          id: 'pdf_' + Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          pageCount,
          buffer
        });
      } catch (err) {
        console.error('PDF okuma hatası:', err);
        utils.showToast(`"${file.name}" okunamadı veya şifreli olabilir`, 'error');
      }
    }

    utils.showProgress(false);
    renderList();
    utils.showToast(`${validFiles.length} PDF dosyası listeye eklendi`, 'success');
  }

  function renderList() {
    itemsList.innerHTML = '';

    if (mergeList.length === 0) {
      actionArea.style.display = 'none';
      return;
    }

    actionArea.style.display = 'flex';

    mergeList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'list-item-card';

      card.innerHTML = `
        <div class="list-item-left">
          <span class="item-order-badge">#${index + 1}</span>
          <div style="min-width: 0;">
            <div class="list-item-title" title="${item.name}">${item.name}</div>
            <div class="list-item-meta">${utils.formatBytes(item.size)} • ${item.pageCount} Sayfa</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="card-action-btn" title="Yukarı Taşı" ${index === 0 ? 'disabled style="opacity:0.3"' : ''} data-action="up" data-id="${item.id}">▲</button>
          <button class="card-action-btn" title="Aşağı Taşı" ${index === mergeList.length - 1 ? 'disabled style="opacity:0.3"' : ''} data-action="down" data-id="${item.id}">▼</button>
          <button class="card-action-btn delete" title="Kaldır" data-action="delete" data-id="${item.id}">✕</button>
        </div>
      `;

      card.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          handleAction(action, id);
        });
      });

      itemsList.appendChild(card);
    });
  }

  function handleAction(action, id) {
    const idx = mergeList.findIndex(x => x.id === id);
    if (idx === -1) return;

    if (action === 'delete') {
      mergeList.splice(idx, 1);
      renderList();
      utils.showToast('Dosya listeden çıkarıldı', 'info');
    } else if (action === 'up' && idx > 0) {
      const temp = mergeList[idx];
      mergeList[idx] = mergeList[idx - 1];
      mergeList[idx - 1] = temp;
      renderList();
    } else if (action === 'down' && idx < mergeList.length - 1) {
      const temp = mergeList[idx];
      mergeList[idx] = mergeList[idx + 1];
      mergeList[idx + 1] = temp;
      renderList();
    }
  }

  clearBtn.addEventListener('click', () => {
    if (mergeList.length === 0) return;
    if (confirm('Eklenen tüm PDF dosyaları temizlensin mi?')) {
      mergeList = [];
      renderList();
      fileInput.value = '';
      utils.showToast('PDF listesi temizlendi', 'info');
    }
  });

  executeBtn.addEventListener('click', async () => {
    if (mergeList.length < 2) {
      utils.showToast('Birleştirmek için en az 2 PDF dosyası gereklidir', 'warning');
      return;
    }

    try {
      executeBtn.disabled = true;
      utils.showProgress(true, 'PDF belgeleri birleştiriliyor...', 10);

      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      const totalFiles = mergeList.length;

      for (let i = 0; i < totalFiles; i++) {
        const item = mergeList[i];
        utils.showProgress(true, `Dosya birleştiriliyor: ${item.name} (${i + 1}/${totalFiles})`, 10 + ((i + 1) / totalFiles) * 80);

        const srcDoc = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
        const pageIndices = srcDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);

        copiedPages.forEach(p => mergedPdf.addPage(p));
      }

      utils.showProgress(true, 'Birleştirilmiş dosya kaydediliyor...', 95);
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `birlestirilmis_${dateStr}_${Date.now().toString().slice(-4)}.pdf`;

      utils.downloadBlob(blob, filename);
      utils.showToast(`PDF'ler başarıyla birleştirildi (${utils.formatBytes(blob.size)})`, 'success');
    } catch (err) {
      console.error('Birleştirme hatası:', err);
      utils.showToast('PDF birleştirilirken hata oluştu: ' + err.message, 'error');
    } finally {
      utils.showProgress(false);
      executeBtn.disabled = false;
    }
  });
})();
