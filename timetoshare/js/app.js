/**
 * TimeToShare — Canlı Ekran Paylaşımı, Ekran Üzeri Çizim & P2P Sohbet
 * %100 İstemci Taraflı WebRTC & Canvas Motoru (app.js)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. STATE & DEĞİŞKENLER
  // ==========================================================================
  const state = {
    peer: null,
    peerId: null,
    roomId: null,
    isHost: false,
    connections: [],     // P2P Data bağlantıları (Host için birden fazla olabilir)
    mediaCalls: [],      // WebRTC Media Call nesneleri
    localStream: null,   // Ekran akışı
    remoteStream: null,  // Katılımcı için gelen akış

    // Çizim Durumu
    currentTool: 'pen',  // 'pointer' | 'pen' | 'highlighter' | 'laser' | 'eraser'
    currentColor: '#ef4444',
    currentSize: 4,
    isDrawing: false,
    currentStroke: null,
    strokeHistory: [],
    activeLasers: [],    // Lazer izleri [{ x, y, timestamp, color }]
    canvasVisible: true,

    // Sohbet Durumu
    isChatOpen: false,
    unreadCount: 0,
    userName: 'Kullanıcı-' + Math.floor(100 + Math.random() * 900),
  };

  // DOM Elemanları
  const dom = {
    lobby: document.getElementById('ttsLobby'),
    stage: document.getElementById('ttsStage'),
    btnStartHost: document.getElementById('btnStartHost'),
    btnJoinRoom: document.getElementById('btnJoinRoom'),
    inputRoomCode: document.getElementById('inputRoomCode'),
    
    // Sahne
    roomCodeDisplay: document.getElementById('roomCodeDisplay'),
    btnCopyLink: document.getElementById('btnCopyLink'),
    peerCountBadge: document.getElementById('peerCountBadge'),
    btnStopStream: document.getElementById('btnStopStream'),
    btnToggleMic: document.getElementById('btnToggleMic'),
    btnFullscreen: document.getElementById('btnFullscreen'),
    
    // Video & Canvas
    viewportWrapper: document.getElementById('ttsViewport'),
    video: document.getElementById('ttsVideo'),
    canvas: document.getElementById('ttsCanvas'),
    placeholder: document.getElementById('ttsPlaceholder'),
    placeholderText: document.getElementById('ttsPlaceholderText'),
    
    // Çizim Araçları
    toolBtns: document.querySelectorAll('[data-tool]'),
    colorBtns: document.querySelectorAll('[data-color]'),
    sizeBtns: document.querySelectorAll('[data-size]'),
    btnUndo: document.getElementById('btnUndo'),
    btnClearCanvas: document.getElementById('btnClearCanvas'),
    btnToggleCanvas: document.getElementById('btnToggleCanvas'),

    // Sohbet
    chatPanel: document.getElementById('ttsChatPanel'),
    chatToggleBtn: document.getElementById('btnToggleChat'),
    chatCloseBtn: document.getElementById('btnCloseChat'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSendBtn: document.getElementById('chatSendBtn'),
    unreadBadge: document.getElementById('chatUnreadBadge'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer'),
  };

  const ctx = dom.canvas ? dom.canvas.getContext('2d') : null;

  // ==========================================================================
  // 2. YARDIMCI SES VE TOAST SİSTEMİ
  // ==========================================================================
  function showToast(message, icon = 'ℹ️', duration = 3000) {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'tts-toast';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Hafif Web Audio API Bildirim Sesi (Harici dosya indirmeden)
  function playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const actx = new AudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, actx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, actx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.25);
    } catch (e) {
      // Ses engellendiyse sessizce geç
    }
  }

  // ==========================================================================
  // 3. WEBRTC / PEERJS BAĞLANTI MOTORU
  // ==========================================================================
  function generateRoomId() {
    return 'tts-' + Math.random().toString(36).substring(2, 8);
  }

  function initPeer(customId = null) {
    return new Promise((resolve, reject) => {
      if (typeof Peer === 'undefined') {
        reject(new Error('PeerJS kütüphanesi yüklenemedi.'));
        return;
      }

      // Ücretsiz açık PeerJS broker bulutu
      const peer = customId ? new Peer(customId) : new Peer();

      peer.on('open', (id) => {
        state.peer = peer;
        state.peerId = id;
        resolve(peer);
      });

      peer.on('error', (err) => {
        console.error('PeerJS Hatası:', err);
        showToast('Bağlantı hatası: ' + (err.type || err.message), '⚠️');
        if (err.type === 'unavailable-id') {
          showToast('Bu oda kodu zaten kullanımda, lütfen yeni bir oda açın.', '❌');
        }
      });

      // Gelen P2P Veri Bağlantısı (DataChannel)
      peer.on('connection', (conn) => {
        setupDataConnection(conn);
      });

      // Gelen Canlı Medya Akışı (Katılımcı tarafında video alma)
      peer.on('call', (call) => {
        call.answer(); // Cevapla
        call.on('stream', (remoteStream) => {
          state.remoteStream = remoteStream;
          dom.video.srcObject = remoteStream;
          dom.video.play().catch(e => console.log('Oynatma izni:', e));
          if (dom.placeholder) dom.placeholder.style.display = 'none';
          showToast('Canlı yayın görüntüsü alındı!', '📺');
          resizeCanvas();
        });
      });
    });
  }

  function setupDataConnection(conn) {
    conn.on('open', () => {
      if (!state.connections.includes(conn)) {
        state.connections.push(conn);
      }
      updatePeerCount();

      // Eğer biz Host isek ve halihazırda yayın yapıyorsak, yeni gelene yayını ilet
      if (state.isHost && state.localStream) {
        const call = state.peer.call(conn.peer, state.localStream);
        state.mediaCalls.push(call);
        // Mevcut çizim geçmişini yeni katılan kullanıcıya gönder
        conn.send({
          type: 'sync_history',
          history: state.strokeHistory,
        });
      }

      // Katılım bildirimi
      addChatMessage({
        sender: 'Sistem',
        text: 'Bir katılımcı odaya bağlandı.',
        type: 'system',
      });
      playNotificationSound();
    });

    conn.on('data', (data) => {
      handleIncomingData(data, conn);
    });

    conn.on('close', () => {
      state.connections = state.connections.filter(c => c !== conn);
      updatePeerCount();
      addChatMessage({
        sender: 'Sistem',
        text: 'Bir katılımcı odadan ayrıldı.',
        type: 'system',
      });
    });
  }

  // Tüm bağlı kullanıcılara veri yayma
  function broadcastData(data) {
    state.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  // ==========================================================================
  // 4. EKRAN PAYLAŞIMI (HOST)
  // ==========================================================================
  async function startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: true,
      });

      state.localStream = stream;
      dom.video.srcObject = stream;
      dom.video.muted = true; // Kendi sesimizi yankı yapmamak için kıs
      await dom.video.play();
      if (dom.placeholder) dom.placeholder.style.display = 'none';

      // Ekran paylaşımı tarayıcı çubuğundan durdurulursa
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopStream();
          showToast('Ekran paylaşımı durduruldu.', '⏹️');
        };
      }

      // Tüm bağlı katılımcılara çağrı başlat
      state.connections.forEach((conn) => {
        if (conn.open) {
          const call = state.peer.call(conn.peer, stream);
          state.mediaCalls.push(call);
        }
      });

      resizeCanvas();
      showToast('Ekran paylaşımı ve yayın başladı!', '🚀');
      return true;
    } catch (err) {
      console.error('Ekran paylaşımı hatası:', err);
      if (err.name !== 'NotAllowedError') {
        showToast('Ekran yakalanamadı: ' + err.message, '⚠️');
      }
      return false;
    }
  }

  function stopStream() {
    if (state.localStream) {
      state.localStream.getTracks().forEach(t => t.stop());
      state.localStream = null;
    }
    state.mediaCalls.forEach(call => call.close());
    state.mediaCalls = [];
    dom.video.srcObject = null;
    if (dom.placeholder) {
      dom.placeholder.style.display = 'flex';
      dom.placeholderText.textContent = 'Yayın durduruldu. Yeniden başlatmak için butonu kullanın.';
    }
    broadcastData({ type: 'stream_stopped' });
  }

  function updatePeerCount() {
    const count = state.connections.length + 1; // Biz + diğerleri
    if (dom.peerCountBadge) {
      dom.peerCountBadge.textContent = `👥 ${count} Kişi`;
    }
  }

  // ==========================================================================
  // 5. ODA YÖNETİMİ & ARAYÜZ GEÇİŞLERİ
  // ==========================================================================
  async function startHostSession() {
    const roomId = generateRoomId();
    state.roomId = roomId;
    state.isHost = true;
    state.userName = 'Yayıncı';

    try {
      showToast('Oda başlatılıyor, lütfen bekleyin...', '⏳');
      await initPeer(roomId);
      
      // Sahneyi göster
      dom.lobby.style.display = 'none';
      dom.stage.style.display = 'flex';
      dom.roomCodeDisplay.textContent = roomId;

      // URL'e oda parametresini ekle (yenilemede kaybolmasın)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('oda', roomId);
      window.history.pushState({}, '', newUrl);

      // Ekran paylaşımını başlat
      const success = await startScreenShare();
      if (!success) {
        if (dom.placeholderText) {
          dom.placeholderText.textContent = 'Ekran paylaşımı bekleniyor. Yukarıdaki "Ekranı Başlat" butonuyla açabilirsiniz.';
        }
      }

      showToast('Oda hazır! Davet linkini kopyalayabilirsiniz.', '🎉', 4000);
    } catch (err) {
      showToast('Oda oluşturulamadı: ' + err.message, '❌');
    }
  }

  async function joinSession(targetRoomId) {
    if (!targetRoomId || !targetRoomId.trim()) {
      showToast('Lütfen geçerli bir oda kodu girin.', '⚠️');
      return;
    }

    state.roomId = targetRoomId.trim();
    state.isHost = false;
    state.userName = 'Misafir-' + Math.floor(100 + Math.random() * 900);

    try {
      showToast('Odaya bağlanılıyor...', '⏳');
      const peer = await initPeer(); // Rastgele ID ile aç

      // Sahneyi aç
      dom.lobby.style.display = 'none';
      dom.stage.style.display = 'flex';
      dom.roomCodeDisplay.textContent = state.roomId;
      if (dom.btnStopStream) dom.btnStopStream.style.display = 'none'; // Katılımcı yayını durduramaz

      if (dom.placeholderText) {
        dom.placeholderText.textContent = 'Yayıncının ekran akışı bekleniyor...';
      }

      // Host'a P2P veri bağlantısı kur
      const conn = peer.connect(state.roomId, { reliable: true });
      setupDataConnection(conn);

      showToast('Odaya başarıyla katıldınız!', '✅');
    } catch (err) {
      showToast('Odaya bağlanılamadı: ' + err.message, '❌');
    }
  }

  function copyInviteLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('oda', state.roomId);
    const link = url.toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        showToast('Davet linki panoya kopyalandı!', '📋');
      }).catch(() => promptCopyFallback(link));
    } else {
      promptCopyFallback(link);
    }
  }

  function promptCopyFallback(link) {
    prompt('Davet linkinizi kopyalayın (Ctrl+C / Cmd+C):', link);
  }

  // ==========================================================================
  // 6. ÇİZİM & ANNOTATION MOTORU (CANVAS OVERLAY)
  // ==========================================================================
  function resizeCanvas() {
    if (!dom.canvas || !dom.video) return;
    const rect = dom.video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    dom.canvas.width = rect.width;
    dom.canvas.height = rect.height;
    dom.canvas.style.width = rect.width + 'px';
    dom.canvas.style.height = rect.height + 'px';
    dom.canvas.style.top = dom.video.offsetTop + 'px';
    dom.canvas.style.left = dom.video.offsetLeft + 'px';

    redrawAllStrokes();
  }

  function getNormalizedCoords(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function startDrawing(e) {
    if (state.currentTool === 'pointer' || !state.canvasVisible) return;
    state.isDrawing = true;
    const coords = getNormalizedCoords(e);

    if (state.currentTool === 'laser') {
      addLaserPoint(coords.x, coords.y, state.currentColor);
      broadcastData({
        type: 'laser',
        x: coords.x,
        y: coords.y,
        color: state.currentColor,
      });
      return;
    }

    state.currentStroke = {
      id: 'stroke-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      tool: state.currentTool,
      color: state.currentTool === 'eraser' ? null : state.currentColor,
      size: state.currentSize,
      points: [coords],
    };

    drawSegment(coords, coords, state.currentStroke);

    broadcastData({
      type: 'draw_start',
      stroke: state.currentStroke,
    });
  }

  function moveDrawing(e) {
    if (!state.isDrawing || !state.canvasVisible) return;
    const coords = getNormalizedCoords(e);

    if (state.currentTool === 'laser') {
      addLaserPoint(coords.x, coords.y, state.currentColor);
      broadcastData({
        type: 'laser',
        x: coords.x,
        y: coords.y,
        color: state.currentColor,
      });
      return;
    }

    if (!state.currentStroke) return;
    const prevPoint = state.currentStroke.points[state.currentStroke.points.length - 1];
    state.currentStroke.points.push(coords);

    drawSegment(prevPoint, coords, state.currentStroke);

    broadcastData({
      type: 'draw_point',
      strokeId: state.currentStroke.id,
      point: coords,
    });
  }

  function stopDrawing() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    if (state.currentStroke && state.currentTool !== 'laser') {
      state.strokeHistory.push(state.currentStroke);
      broadcastData({
        type: 'draw_end',
        strokeId: state.currentStroke.id,
      });
      state.currentStroke = null;
    }
  }

  function drawSegment(p1, p2, stroke) {
    if (!ctx || !dom.canvas) return;
    const w = dom.canvas.width;
    const h = dom.canvas.height;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.size * 3;
    } else if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 3.5;
    } else {
      // Kalem
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }

    ctx.beginPath();
    ctx.moveTo(p1.x * w, p1.y * h);
    ctx.lineTo(p2.x * w, p2.y * h);
    ctx.stroke();
    ctx.restore();
  }

  function redrawAllStrokes() {
    if (!ctx || !dom.canvas) return;
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);

    if (!state.canvasVisible) return;

    state.strokeHistory.forEach((stroke) => {
      for (let i = 1; i < stroke.points.length; i++) {
        drawSegment(stroke.points[i - 1], stroke.points[i], stroke);
      }
    });
  }

  // ==========================================================================
  // 7. LAZER İŞARETÇİ ANİMASYON DÖNGÜSÜ (LASER TRAIL)
  // ==========================================================================
  function addLaserPoint(normX, normY, color) {
    state.activeLasers.push({
      x: normX,
      y: normY,
      color: color || '#00f0ff',
      timestamp: performance.now(),
    });
  }

  function renderLaserLoop(now) {
    if (state.activeLasers.length > 0 && ctx && dom.canvas && state.canvasVisible) {
      const w = dom.canvas.width;
      const h = dom.canvas.height;
      const maxAge = 1200; // 1.2 saniyede kaybolur

      // Önceki çizimleri bozmadan sadece lazer çizmek için
      redrawAllStrokes();

      // Eski noktaları temizle
      state.activeLasers = state.activeLasers.filter(l => now - l.timestamp < maxAge);

      state.activeLasers.forEach((laser) => {
        const age = now - laser.timestamp;
        const progress = age / maxAge; // 0 -> 1
        const alpha = Math.max(0, 1 - progress);
        const radius = Math.max(3, 10 * (1 - progress * 0.5));

        const px = laser.x * w;
        const py = laser.y * h;

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = laser.color;
        ctx.fillStyle = laser.color;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ortada beyaz parlama
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    }

    requestAnimationFrame(renderLaserLoop);
  }

  // ==========================================================================
  // 8. GELEN P2P VERİLERİNİN İŞLENMESİ (DATA DISPATCHER)
  // ==========================================================================
  const remoteStrokes = {};

  function handleIncomingData(data) {
    switch (data.type) {
      case 'chat':
        addChatMessage(data);
        if (!state.isChatOpen) {
          state.unreadCount++;
          if (dom.unreadBadge) {
            dom.unreadBadge.style.display = 'inline-block';
            dom.unreadBadge.textContent = state.unreadCount;
          }
          showToast(`${data.sender}: ${data.text.substring(0, 30)}...`, '💬');
        }
        playNotificationSound();
        break;

      case 'draw_start':
        remoteStrokes[data.stroke.id] = data.stroke;
        break;

      case 'draw_point':
        if (remoteStrokes[data.strokeId]) {
          const s = remoteStrokes[data.strokeId];
          const prev = s.points[s.points.length - 1];
          s.points.push(data.point);
          if (state.canvasVisible) {
            drawSegment(prev, data.point, s);
          }
        }
        break;

      case 'draw_end':
        if (remoteStrokes[data.strokeId]) {
          state.strokeHistory.push(remoteStrokes[data.strokeId]);
          delete remoteStrokes[data.strokeId];
        }
        break;

      case 'draw_clear':
        state.strokeHistory = [];
        redrawAllStrokes();
        showToast('Çizimler temizlendi.', '🧹');
        break;

      case 'draw_undo':
        state.strokeHistory.pop();
        redrawAllStrokes();
        break;

      case 'laser':
        addLaserPoint(data.x, data.y, data.color);
        break;

      case 'sync_history':
        state.strokeHistory = data.history || [];
        redrawAllStrokes();
        break;

      case 'stream_stopped':
        if (dom.placeholder) {
          dom.placeholder.style.display = 'flex';
          dom.placeholderText.textContent = 'Yayıncı ekran paylaşımını sonlandırdı.';
        }
        break;
    }
  }

  // ==========================================================================
  // 9. P2P SOHBET YÖNETİMİ
  // ==========================================================================
  function sendChatMessage() {
    const text = dom.chatInput.value.trim();
    if (!text) return;

    const msg = {
      type: 'chat',
      id: 'msg-' + Date.now(),
      sender: state.userName,
      text: text,
      timestamp: Date.now(),
      isMe: true,
    };

    addChatMessage(msg);
    dom.chatInput.value = '';

    // Karşı taraflara ilet
    broadcastData({
      type: 'chat',
      id: msg.id,
      sender: state.userName,
      text: text,
      timestamp: msg.timestamp,
      isMe: false,
    });
  }

  function addChatMessage(msg) {
    if (!dom.chatMessages) return;

    const el = document.createElement('div');
    if (msg.type === 'system') {
      el.className = 'tts-msg system';
      el.textContent = msg.text;
    } else {
      el.className = `tts-msg ${msg.isMe ? 'me' : 'remote'}`;
      const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `
        <div class="tts-msg-info">
          <span>${msg.sender}</span>
          <span>•</span>
          <span>${timeStr}</span>
        </div>
        <div class="tts-msg-bubble">${escapeHtml(msg.text)}</div>
      `;
    }

    dom.chatMessages.appendChild(el);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  }

  function toggleChat(forceOpen = null) {
    state.isChatOpen = forceOpen !== null ? forceOpen : !state.isChatOpen;
    if (dom.chatPanel) {
      if (state.isChatOpen) {
        dom.chatPanel.classList.add('open');
        state.unreadCount = 0;
        if (dom.unreadBadge) dom.unreadBadge.style.display = 'none';
        setTimeout(() => dom.chatInput && dom.chatInput.focus(), 200);
      } else {
        dom.chatPanel.classList.remove('open');
      }
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // ==========================================================================
  // 10. OLAY DİNLEYİCİLERİ VE BAŞLATMA
  // ==========================================================================
  function setupEventListeners() {
    // Oda Açma & Katılma
    if (dom.btnStartHost) dom.btnStartHost.addEventListener('click', startHostSession);
    if (dom.btnJoinRoom) dom.btnJoinRoom.addEventListener('click', () => joinSession(dom.inputRoomCode.value));
    if (dom.inputRoomCode) {
      dom.inputRoomCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') joinSession(dom.inputRoomCode.value);
      });
    }

    // Sahne Eylemleri
    if (dom.btnCopyLink) dom.btnCopyLink.addEventListener('click', copyInviteLink);
    if (dom.btnStopStream) dom.btnStopStream.addEventListener('click', stopStream);
    if (dom.btnFullscreen) {
      dom.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          dom.viewportWrapper.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Çizim Araçları Seçimi
    dom.toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        dom.toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTool = btn.dataset.tool;

        if (dom.canvas) {
          if (state.currentTool === 'pointer') {
            dom.canvas.classList.add('pointer-mode');
          } else {
            dom.canvas.classList.remove('pointer-mode');
          }
        }
      });
    });

    // Renk Seçimi
    dom.colorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        dom.colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentColor = btn.dataset.color;
      });
    });

    // Kalınlık Seçimi
    dom.sizeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        dom.sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentSize = parseInt(btn.dataset.size, 10);
      });
    });

    // Geri Al (Undo)
    if (dom.btnUndo) {
      dom.btnUndo.addEventListener('click', () => {
        if (state.strokeHistory.length > 0) {
          state.strokeHistory.pop();
          redrawAllStrokes();
          broadcastData({ type: 'draw_undo' });
        }
      });
    }

    // Temizle
    if (dom.btnClearCanvas) {
      dom.btnClearCanvas.addEventListener('click', () => {
        if (confirm('Tüm çizimleri temizlemek istiyor musunuz?')) {
          state.strokeHistory = [];
          redrawAllStrokes();
          broadcastData({ type: 'draw_clear' });
        }
      });
    }

    // Çizimleri Gizle/Göster
    if (dom.btnToggleCanvas) {
      dom.btnToggleCanvas.addEventListener('click', () => {
        state.canvasVisible = !state.canvasVisible;
        dom.btnToggleCanvas.classList.toggle('active', state.canvasVisible);
        dom.btnToggleCanvas.setAttribute('title', state.canvasVisible ? 'Çizimleri Gizle' : 'Çizimleri Göster');
        redrawAllStrokes();
      });
    }

    // Canvas Çizim Olayları
    if (dom.canvas) {
      dom.canvas.addEventListener('mousedown', startDrawing);
      window.addEventListener('mousemove', moveDrawing);
      window.addEventListener('mouseup', stopDrawing);

      // Dokunmatik desteği
      dom.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
      }, { passive: false });
      window.addEventListener('touchmove', (e) => {
        if (state.isDrawing) e.preventDefault();
        moveDrawing(e);
      }, { passive: false });
      window.addEventListener('touchend', stopDrawing);
    }

    // Sohbet
    if (dom.chatToggleBtn) dom.chatToggleBtn.addEventListener('click', () => toggleChat());
    if (dom.chatCloseBtn) dom.chatCloseBtn.addEventListener('click', () => toggleChat(false));
    if (dom.chatSendBtn) dom.chatSendBtn.addEventListener('click', sendChatMessage);
    if (dom.chatInput) {
      dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
      });
    }

    // Yeniden boyutlandırma
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 200));

    // Video yüklendiğinde canvası ayarla
    if (dom.video) {
      dom.video.addEventListener('loadedmetadata', resizeCanvas);
      dom.video.addEventListener('play', resizeCanvas);
    }

    // ResizeObserver ile video kapsayıcısını dinamik takip et
    if (window.ResizeObserver && dom.viewportWrapper) {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(dom.viewportWrapper);
    }
  }

  // ==========================================================================
  // 11. SAYFA YÜKLENME VE BAŞLANGIÇ
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    requestAnimationFrame(renderLaserLoop);

    // URL'de oda parametresi kontrolü (?oda=xyz veya ?room=xyz)
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('oda') || params.get('room');
    if (roomParam) {
      joinSession(roomParam);
    }
  });

})();
