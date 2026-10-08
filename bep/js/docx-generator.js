// Resmî MEB Formatında Kapsamlı Word (.docx) Belgesi Üretim Motoru
// 1. BEP Planı (BÖP)
// 2. BEP Geliştirme Birimi Toplantı Tutanağı
// 3. BEP İzleme ve Değerlendirme Formu
// 4. Tam BEP Dosyası (Hepsini tek Word belgesinde birleştiren)

window.BepDocxGenerator = {
  // 1. BEP PLANI (BÖP)
  generate: async function (data) {
    return this.generatePlan(data);
  },

  generatePlan: async function (data) {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, PageOrientation } = window.docx;
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: this.buildPlanElements(data)
      }]
    });

    const blob = await Packer.toBlob(doc);
    const temizDosyaAdi = ((data.ogrenciAdi || "Ogrenci") + "_BEP_Plani_" + (data.dersAdi || "Ders")).replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
    window.saveAs(blob, `${temizDosyaAdi}.docx`);
  },

  // 2. BEP GELİŞTİRME BİRİMİ TOPLANTI TUTANAĞI
  generateTutanak: async function (data) {
    const { Document, Packer, PageOrientation } = window.docx;
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: this.buildTutanakElements(data)
      }]
    });

    const blob = await Packer.toBlob(doc);
    const temizDosyaAdi = ((data.ogrenciAdi || "Ogrenci") + "_BEP_Toplanti_Tutanagi").replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
    window.saveAs(blob, `${temizDosyaAdi}.docx`);
  },

  // 3. BEP İZLEME VE DEĞERLENDİRME FORMU
  generateIzleme: async function (data) {
    const { Document, Packer, PageOrientation } = window.docx;
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: this.buildIzlemeElements(data)
      }]
    });

    const blob = await Packer.toBlob(doc);
    const temizDosyaAdi = ((data.ogrenciAdi || "Ogrenci") + "_BEP_Izleme_Degerlendirme").replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
    window.saveAs(blob, `${temizDosyaAdi}.docx`);
  },

  // 4. TAM BEP DOSYASI (HEPSİ TEK DOSYADA)
  generateFullFolder: async function (data) {
    const { Document, Packer, PageOrientation } = window.docx;
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.LANDSCAPE },
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: this.buildPlanElements(data)
        },
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.PORTRAIT },
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: this.buildTutanakElements(data)
        },
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.LANDSCAPE },
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: this.buildIzlemeElements(data)
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const temizDosyaAdi = ((data.ogrenciAdi || "Ogrenci") + "_TAM_BEP_DOSYASI").replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
    window.saveAs(blob, `${temizDosyaAdi}.docx`);
  },

  // YARDIMCI: ÇOK SATIRLI PARAGRAFLAR
  parseParagraphs: function (text, fontSize = 16, bold = false, align = null) {
    const { Paragraph, TextRun, AlignmentType } = window.docx;
    const al = align || AlignmentType.LEFT;
    if (!text || text.toString().trim() === "") {
      return [new Paragraph({ alignment: al, children: [new TextRun({ text: "-", size: fontSize })] })];
    }
    const satirlar = text.toString().split(/\r?\n/).filter(s => s.trim().length > 0);
    if (satirlar.length === 0) {
      return [new Paragraph({ alignment: al, children: [new TextRun({ text: "-", size: fontSize })] })];
    }
    return satirlar.map((s, idx) => new Paragraph({
      alignment: al,
      spacing: { after: idx === satirlar.length - 1 ? 0 : 50 },
      children: [new TextRun({ text: s.trim(), bold, size: fontSize })]
    }));
  },

  // PLAN İÇERİK ELEMANLARI (YATAY A4)
  buildPlanElements: function (data) {
    const { Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } = window.docx;

    const okul = (data.okulAdi || "OKUL ADI BELİRTİLMEDİ").toUpperCase();
    const yil = data.egitimYili || "2026-2027";
    const donem = data.donem || "1. ve 2. Dönem (Yıllık)";
    const ders = data.dersAdi || "Belirtilmedi";
    const ogrenci = data.ogrenciAdi || "Öğrenci";
    const tc = data.tcNo || "-";
    const sinif = data.sinifSube || "-";
    const dogumTarihi = data.dogumTarihi || "-";
    const tani = data.taniTuru || "Özel Eğitim İhtiyacı";
    const ramRapor = data.ramRapor || "-";
    const bepTarihleri = (data.bepBaslangic || "-") + " / " + (data.bepBitis || "-");
    const veliBilgi = (data.anneAdi ? `Anne: ${data.anneAdi} ` : "") + (data.babaAdi ? `Baba: ${data.babaAdi} ` : "") + (data.veliTel ? `Tel: ${data.veliTel}` : "");
    const saglikCihaz = data.saglikCihaz || "Bulunmuyor";

    const standardBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
    };
    const cellMargins = { top: 120, bottom: 120, left: 140, right: 140 };
    const headerShading = { fill: "E2E8F0" };
    const labelShading = { fill: "F8FAFC" };

    // Bilgi Tablosu
    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Öğrencinin Adı Soyadı:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ogrenci, bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "T.C. Kimlik No:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: tc, size: 17 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "Sınıfı / Şubesi & No:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: sinif, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "Doğum Tarihi:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: dogumTarihi, size: 17 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "Eğitsel Tanı / Yetersizlik:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: tani, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "RAM Rapor No & Tarih:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: ramRapor, size: 17 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "Veli & İletişim:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: veliBilgi || "-", size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "Cihaz / Sağlık Durumu:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: saglikCihaz, size: 17 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "Ders / Gelişim Alanı:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: ders, bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: labelShading, children: [new Paragraph({ children: [new TextRun({ text: "BEP Süresi & Dönem:", bold: true, size: 17 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: bepTarihleri + " (" + donem + ")", size: 17 })] })] })
          ]
        })
      ]
    });

    // Kazanım Tablosu
    const tableHeaders = [
      { text: "Uzun Dönemli Amaç (ÜDA)", width: 22 },
      { text: "Kısa Dönemli Amaçlar (KDA) / Hedef Davranışlar", width: 28 },
      { text: "Başlama - Bitiş Tarihi", width: 12 },
      { text: "Yöntem ve Teknikler", width: 14 },
      { text: "Kullanılacak Araç - Gereçler", width: 12 },
      { text: "Değerlendirme Yöntemi ve Ölçütü", width: 12 }
    ];

    const headerRow = new TableRow({
      tableHeader: true,
      children: tableHeaders.map(col => new TableCell({
        shading: headerShading,
        borders: standardBorder,
        margins: cellMargins,
        width: { size: col.width, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: col.text, bold: true, size: 16 })] })]
      }))
    });

    const rowsData = data.kazanimlar || [];
    const contentRows = rowsData.length > 0 ? rowsData.map(item => new TableRow({
      children: [
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.uda, 15) }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.kda, 15) }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.tarih || "-", size: 15 })] })] }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.yontem, 15) }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.arac, 15) }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.deg, 15) })
      ]
    })) : [
      new TableRow({ children: tableHeaders.map(() => new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "-", size: 15 })] })] })) })
    ];

    const planTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...contentRows]
    });

    // Tedbirler
    const tedbirTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: headerShading, width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "DESTEK EĞİTİM ODASI HİZMETLERİ", bold: true, size: 16 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, shading: headerShading, width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "SINAV HİZMETLERİ VE ÖLÇME-DEĞERLENDİRME UYARLAMALARI", bold: true, size: 16 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(data.destekEgitim, 15) }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(data.sinavTedbirleri, 15) })
          ]
        })
      ]
    });

    return [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "T.C.", bold: true, size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MİLLÎ EĞİTİM BAKANLIĞI", bold: true, size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: okul, bold: true, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: `${yil} EĞİTİM ÖĞRETİM YILI BİREYSELLEŞTİRİLMİŞ EĞİTİM PROGRAMI (BEP) PLANI`, bold: true, size: 21, color: "1E3A8A" })] }),

      new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: "1. ÖĞRENCİ VE OKUL BİLGİLERİ", bold: true, size: 17, color: "1E3A8A" })] }),
      infoTable,

      new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "2. ÖĞRENCİNİN ŞİMDİKİ EĞİTSEL PERFORMANS DÜZEYİ", bold: true, size: 17, color: "1E3A8A" })] }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(data.egitselPerformans, 15) })] })] }),

      new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: `3. ${ders.toUpperCase()} DERSİ BİREYSELLEŞTİRİLMİŞ ÖĞRETİM PLANI (KAZANIM TABLOSU)`, bold: true, size: 17, color: "1E3A8A" })] }),
      planTable,

      new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "4. DESTEK EĞİTİM HİZMETLERİ VE SINAV UYARLAMALARI", bold: true, size: 17, color: "1E3A8A" })] }),
      tedbirTable,

      new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "5. BEP GELİŞTİRME BİRİMİ KARARLARI VE AÇIKLAMALAR", bold: true, size: 17, color: "1E3A8A" })] }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(data.birimKararlari, 15) })] })] }),

      new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "6. BEP GELİŞTİRME BİRİMİ ONAYI VE İMZA SİRKÜSÜ", bold: true, size: 17, color: "1E3A8A" })] }),
      this.buildImzaTable(data)
    ];
  },

  // TOPLANTI TUTANAĞI ELEMANLARI (DİKEY A4)
  buildTutanakElements: function (data) {
    const { Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } = window.docx;

    const okul = (data.okulAdi || "OKUL ADI BELİRTİLMEDİ").toUpperCase();
    const yil = data.egitimYili || "2026-2027";
    const ogrenci = data.ogrenciAdi || "Öğrenci";
    const ders = data.dersAdi || "Ders";
    const sinif = data.sinifSube || "-";
    const no = data.tcNo || "-";
    const toplantino = data.toplantiNo || "1. Toplantı (Sene Başı BEP Hazırlama)";
    const toplantitarih = data.toplantiTarihi || new Date().toLocaleDateString("tr-TR");
    const toplantiyer = data.toplantiYeri || "Rehberlik Servisi / BEP Odası";

    const standardBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
    };
    const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 };

    // Tutanak Başlık Tablosu
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Toplantı Adı / Türü:", bold: true, size: 19 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: toplantino, bold: true, size: 19 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Toplantı Tarihi ve Yeri:", bold: true, size: 19 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: `${toplantitarih} - ${toplantiyer}`, size: 19 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Öğrenci Adı Soyadı & No:", bold: true, size: 19 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: `${ogrenci} (${sinif})`, bold: true, size: 19 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Ders / Eğitsel Tanı:", bold: true, size: 19 })] })] }),
            new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: `${ders} - ${data.taniTuru || 'Özel Eğitim İhtiyacı'}`, size: 19 })] })] })
          ]
        })
      ]
    });

    const gundemMaddeleri = [
      "1. Açılış, yoklama ve BEP Geliştirme Birimi üyelerinin hazır bulunurluğunun tespiti.",
      "2. Öğrencinin RAM Eğitsel Değerlendirme Raporu ve gelişim dosyasının incelenmesi.",
      "3. Öğrencinin şimdiki eğitsel performans düzeyinin ders bazında değerlendirilmesi.",
      "4. Öğrenci için Uzun Dönemli Amaçlar (ÜDA) ve Kısa Dönemli Amaçların (KDA) tespiti.",
      "5. Destek Eğitim Odasından yararlanma süresi ve haftalık ders saatlerinin belirlenmesi.",
      "6. Sınav tedbirleri (ek süre, ayrı salon, okuyucu-kodlayıcı vb.) ve ölçme-değerlendirme uyarlamalarının görüşülmesi.",
      "7. Aile ile yapılacak iş birliği, veli bilgilendirme takvimi ve ev ortamı desteklerinin planlanması.",
      "8. Dilek, temenniler ve BEP planının imzalanarak onaylanması."
    ];

    const kararlar = [
      `1. ${ogrenci} isimli öğrencinin RAM raporu ve sınıf içi gözlem sonuçları incelenmiş, eğitsel performansına uygun BEP hazırlanması kararlaştırılmıştır.`,
      `2. ${ders} dersi kapsamında öğrencinin seviyesine uygun olarak hazırlanan Uzun Dönemli ve Kısa Dönemli Amaçlar kabul edilmiştir.`,
      `3. Öğrencinin destek eğitim ihtiyacı doğrultusunda Destek Eğitim Odasından yararlandırılmasına karar verilmiştir (${data.destekEgitim || 'Ders programına göre'}).`,
      `4. Yazılı sınavlarda öğrencinin tanı özellikleri dikkate alınarak sınav tedbirlerinin uygulanmasına oy birliğiyle karar verilmiştir (${data.sinavTedbirleri || 'Ek süre ve sınav uyarlaması'}).`,
      "5. Öğrencinin gelişim durumu dönem sonlarında BEP Geliştirme Birimi tarafından tekrar izlenecek ve veli ile koordineli çalışılacaktır."
    ];

    return [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "T.C.", bold: true, size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MİLLÎ EĞİTİM BAKANLIĞI", bold: true, size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: okul, bold: true, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: `${yil} EĞİTİM ÖĞRETİM YILI BEP GELİŞTİRME BİRİMİ TOPLANTI TUTANAĞI`, bold: true, size: 21, color: "1E3A8A" })] }),

      headerTable,

      new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: "TOPLANTI GÜNDEM MADDELERİ", bold: true, size: 19, color: "1E3A8A" })] }),
      ...gundemMaddeleri.map(g => new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: g, size: 18 })] })),

      new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: "TOPLANTIDA ALINAN KARARLAR", bold: true, size: 19, color: "1E3A8A" })] }),
      ...kararlar.map(k => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: k, size: 18 })] })),

      new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: "BEP GELİŞTİRME BİRİMİ KATILIMCILARI VE İMZA SİRKÜSÜ", bold: true, size: 19, color: "1E3A8A" })] }),
      this.buildImzaTable(data)
    ];
  },

  // İZLEME VE DEĞERLENDİRME FORMU ELEMANLARI (YATAY A4)
  buildIzlemeElements: function (data) {
    const { Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } = window.docx;

    const okul = (data.okulAdi || "OKUL ADI BELİRTİLMEDİ").toUpperCase();
    const yil = data.egitimYili || "2026-2027";
    const ogrenci = data.ogrenciAdi || "Öğrenci";
    const ders = data.dersAdi || "Ders";
    const sinif = data.sinifSube || "-";

    const standardBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
    };
    const cellMargins = { top: 120, bottom: 120, left: 140, right: 140 };
    const headerShading = { fill: "E2E8F0" };

    const tableHeaders = [
      { text: "Uzun Dönemli Amaç (ÜDA)", width: 25 },
      { text: "Kısa Dönemli Amaçlar (KDA) / Hedef Davranışlar", width: 35 },
      { text: "1. Dönem Sonu Gerçekleşme Düzeyi", width: 15 },
      { text: "2. Dönem Sonu Gerçekleşme Düzeyi", width: 15 },
      { text: "Açıklama / Karar", width: 10 }
    ];

    const headerRow = new TableRow({
      tableHeader: true,
      children: tableHeaders.map(col => new TableCell({
        shading: headerShading,
        borders: standardBorder,
        margins: cellMargins,
        width: { size: col.width, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: col.text, bold: true, size: 15 })] })]
      }))
    });

    const rowsData = data.kazanimlar || [];
    const contentRows = rowsData.length > 0 ? rowsData.map(item => new TableRow({
      children: [
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.uda, 14) }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: this.parseParagraphs(item.kda, 14) }),
        new TableCell({
          borders: standardBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "[  ] Gerçekleşti", size: 13 }),
                new TextRun({ text: "[  ] Kısmen", size: 13, break: 1 }),
                new TextRun({ text: "[  ] Gerçekleşmedi", size: 13, break: 1 })
              ]
            })
          ]
        }),
        new TableCell({
          borders: standardBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "[  ] Gerçekleşti", size: 13 }),
                new TextRun({ text: "[  ] Kısmen", size: 13, break: 1 }),
                new TextRun({ text: "[  ] Gerçekleşmedi", size: 13, break: 1 })
              ]
            })
          ]
        }),
        new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Devam / Tamamlandı", size: 13 })] })] })
      ]
    })) : [
      new TableRow({ children: tableHeaders.map(() => new TableCell({ borders: standardBorder, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "-", size: 14 })] })] })) })
    ];

    const izlemeTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...contentRows]
    });

    return [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "T.C.", bold: true, size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MİLLÎ EĞİTİM BAKANLIĞI", bold: true, size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: okul, bold: true, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: `${yil} EĞİTİM ÖĞRETİM YILI ${ders.toUpperCase()} DERSİ BEP İZLEME VE DEĞERLENDİRME FORMU`, bold: true, size: 20, color: "1E3A8A" })] }),

      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Öğrenci: ${ogrenci} | Sınıf: ${sinif} | Tanı: ${data.taniTuru || '-'}`, bold: true, size: 16 })] }),
      izlemeTable,

      new Paragraph({ spacing: { before: 140, after: 80 }, children: [new TextRun({ text: "BEP GELİŞTİRME BİRİMİ DEĞERLENDİRME ONAYI", bold: true, size: 17, color: "1E3A8A" })] }),
      this.buildImzaTable(data)
    ];
  },

  // ORTAK İMZA TABLOSU (6 ÜYELİ)
  buildImzaTable: function (data) {
    const { Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } = window.docx;

    const ders = data.dersAdi || "Ders";
    const imzaDers = data.imzaDersOgr || "Ders Öğretmeni";
    const imzaSinif = data.imzaSinifOgr || "Sınıf Rehber Öğretmeni";
    const imzaRehber = data.imzaRehberlik || "Rehberlik Öğretmeni / Psk. Dan.";
    const imzaOzelEgitim = data.imzaOzelEgitim || "Özel Eğitim Öğretmeni";
    const imzaVeli = data.imzaVeli || "Öğrenci Velisi";
    const imzaMudur = data.imzaMudur || "Birim Başkanı / Okul Müdürü";

    const standardBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "777777" },
    };

    const createImzaCell = (ad, unvan, genislik, son = false) => {
      return new TableCell({
        borders: standardBorder,
        margins: { top: 80, bottom: 80, left: 60, right: 60 },
        width: { size: genislik, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ad, bold: true, size: 14 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: unvan, size: 12 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: son ? "(Mühür - İmza)" : "(İmza)", size: 11, italics: true })] })
        ]
      });
    };

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createImzaCell(imzaDers, `${ders} Öğretmeni`, 16.6),
            createImzaCell(imzaSinif, "Sınıf Rehber Öğr.", 16.6),
            createImzaCell(imzaOzelEgitim, "Özel Eğitim Öğr.", 16.6),
            createImzaCell(imzaRehber, "Rehberlik / Psk. Dan.", 16.6),
            createImzaCell(imzaVeli, "Öğrenci Velisi", 16.6),
            createImzaCell(imzaMudur, "Birim Başkanı / Müdür", 17, true)
          ]
        })
      ]
    });
  }
};
