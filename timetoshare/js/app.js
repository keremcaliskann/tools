/**
 * TimeToShare — Canlı Ekran Paylaşımı, Ekran Üzeri Çizim & P2P Sohbet
 * %100 İstemci Taraflı WebRTC & Canvas Motoru (app.js)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. KULLANICI RENK PALETİ VE DURUM (STATE)
  // ==========================================================================
  const PALETTE = [
    '#00f0ff', // Neon Cyan
    '#ff0055', // Neon Pembe
    '#00ff66', // Neon Yeşil
    '#ffcc00', // Parlak Sarı
    '#b026ff', // Neon Mor
    '#ff6600', // Canlı Turuncu
    '#38bdf8', // Açık Mavi
    '#f43f5e', // Mercan
  ];

  // Rastgele kullanıcı rengi ata
  const assignedColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];

  const state = {
    peer: null,
    peerId: null,
    roomId: null,
    isHost: false,
    connections: [],     // P2P Data bağlantıları
    mediaCalls: [],      // WebRTC Media Call nesneleri
    localStream: null,   // Ekran akışı (Host)
    remoteStream: null,  // Gelen akış (Katılımcı)

    // Kullanıcı Kimliği
    userColor: assignedColor,
    userName: 'Kullanıcı-' + Math.floor(100 + Math.random() * 900),

    // Çizim Durumu: Sadece 2 Kalem (Kalıcı ve Geçici) + Pasif İşaretçi
    currentTool: 'pen',  // 'pointer' | 'pen' (Kalıcı) | 'fade' (Geçici)
    currentSize: 4,
    isDrawing: false,
    currentStroke: null,
    strokeHistory: [],   // Kalıcı çizgiler
    fadingStrokes: [],   // Kendiliğinden kaybolan geçici çizgiler
    canvasVisible: true,

    // Sohbet Durumu
    isChatOpen: false,
    unreadCount: 0,
  };

  // Google & Mozilla Açık STUN Sunucuları (Farklı ağlardaki katılımcıların ekranı görebilmesi için)
  const PEER_CONFIG = {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
      ],
      sdpSemantics: 'unified-plan',
    },
  };

  // DOM Elemanları
  const dom = {
    lobby: document.getElementById('ttsLobby'),
    stage: document.getElementById('ttsStage'),
    btnStartHost: document.getElementById('btnStartHost'),
    btnJoinRoom: document.getElementById('btnJoinRoom'),
    inputRoomCode: document.getElementById('inputRoomCode'),

    // Sahne Üstü
    roomCodeDisplay: document.getElementById('roomCodeDisplay'),
    btnCopyLink: document.getElementById('btnCopyLink'),
    peerCountBadge: document.getElementById('peerCountBadge'),
    btnStopStream: document.getElementById('btnStopStream'),
    btnFullscreen: document.getElementById('btnFullscreen'),
    userBadge: document.getElementById('userBadge'),
    userColorDot: document.getElementById('userColorDot'),
    userBadgeText: document.getElementById('userBadgeText'),

    // Video & Canvas
    viewportWrapper: document.getElementById('ttsViewport'),
    video: document.getElementById('ttsVideo'),
    canvas: document.getElementById('ttsCanvas'),
    placeholder: document.getElementById('ttsPlaceholder'),
    placeholderText: document.getElementById('ttsPlaceholderText'),
    btnUnmute: document.getElementById('btnUnmute'),
    liveChatOverlay: document.getElementById('liveChatOverlay'),

    // Çizim Araçları (Basitleştirilmiş: Kalıcı & Geçici Kalem)
    toolBtns: document.querySelectorAll('[data-tool]'),
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
  // 2. YARDIMCI VE SES SİSTEMİ
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

  function playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const actx = new AudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, actx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.25);
    } catch (e) {}
  }

  // ==========================================================================
  // 3. WEBRTC / PEERJS MOTORU (GELİŞMİŞ STUN & BAĞLANTI)
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

      const peer = customId ? new Peer(customId, PEER_CONFIG) : new Peer(PEER_CONFIG);

      peer.on('open', (id) => {
        state.peer = peer;
        state.peerId = id;
        resolve(peer);
      });

      peer.on('error', (err) => {
        console.warn('PeerJS Durumu/Hatası:', err);
        if (err.type === 'unavailable-id') {
          showToast('Bu oda kodu kullanımda, yeni oda açılıyor...', '⚠️');
        } else if (err.type === 'peer-unavailable') {
          showToast('Oda bulunamadı veya yayıncı henüz yayında değil.', '❌');
          if (dom.placeholderText) {
            dom.placeholderText.textContent = 'Yayıncı bulunamadı. Lütfen oda kodunu kontrol edin.';
          }
        }
      });

      // Gelen DataChannel Bağlantısı
      peer.on('connection', (conn) => {
        setupDataConnection(conn);
      });

      // Gelen Canlı Video Akışı (Katılımcı Ekran Alımı)
      peer.on('call', (call) => {
        call.answer(); // Cevapla
        handleIncomingCall(call);
      });
    });
  }

  function handleIncomingCall(call) {
    call.on('stream', (remoteStream) => {
      attachRemoteStream(remoteStream);
    });

    // Fallback: WebRTC ontrack olayı
    if (call.peerConnection) {
      call.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          attachRemoteStream(event.streams[0]);
        }
      };
    }
  }

  function attachRemoteStream(stream) {
    state.remoteStream = stream;
    dom.video.srcObject = stream;
    
    // Tarayıcı otomatik oynatma (autoplay) engeline takılmamak için önce sessiz başlat
    dom.video.muted = true;
    
    const playPromise = dom.video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (dom.placeholder) dom.placeholder.style.display = 'none';
        showToast('Canlı yayın görüntüsü başarıyla alındı!', '📺');
        resizeCanvas();

        // Eğer yayında ses parçası varsa "Sesi Aç" butonunu göster
        const audioTracks = stream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0 && dom.btnUnmute) {
          dom.btnUnmute.style.display = 'inline-flex';
        }
      }).catch((err) => {
        console.warn('Otomatik oynatma bekliyor:', err);
        if (dom.btnUnmute) {
          dom.btnUnmute.style.display = 'inline-flex';
          dom.btnUnmute.innerHTML = '<span>▶️</span><span>Yayını Başlat</span>';
        }
      });
    }
  }

  function setupDataConnection(conn) {
    conn.on('open', () => {
      if (!state.connections.includes(conn)) {
        state.connections.push(conn);
      }
      updatePeerCount();

      // Eğer Host isek ve akış mevcutsa, yeni katılan kişiyi ara ve akışı gönder
      if (state.isHost && state.localStream) {
        callPeerWithStream(conn.peer, state.localStream);

        // Kalıcı çizim geçmişini gönder
        conn.send({
          type: 'sync_history',
          history: state.strokeHistory,
        });
      }

      // Katılımcı isek Host'a akış talep mesajı at
      if (!state.isHost) {
        conn.send({ type: 'request_stream' });
      }

      addChatMessage({
        sender: 'Sistem',
        text: 'Bir katılımcı odaya bağlandı.',
        type: 'system',
      });
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

  function callPeerWithStream(targetPeerId, stream) {
    if (!state.peer || !stream) return;
    try {
      const call = state.peer.call(targetPeerId, stream);
      state.mediaCalls.push(call);
    } catch (e) {
      console.warn('Yayın arama hatası:', e);
    }
  }

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

      // Paylaşım çubuğundan durdurulursa
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopStream();
          showToast('Ekran paylaşımı durduruldu.', '⏹️');
        };
      }

      // Tüm bağlı katılımcılara çağrı açarak akışı gönder
      state.connections.forEach((conn) => {
        if (conn.open) {
          callPeerWithStream(conn.peer, stream);
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
      dom.placeholderText.textContent = 'Yayın durduruldu.';
    }
    broadcastData({ type: 'stream_stopped' });
  }

  function updatePeerCount() {
    const count = state.connections.length + 1;
    if (dom.peerCountBadge) {
      dom.peerCountBadge.textContent = `👥 ${count} Kişi`;
    }
  }

  // ==========================================================================
  // 5. ODA YÖNETİMİ & ARAYÜZ GEÇİŞLERİ
  // ==========================================================================
  function updateUserBadge() {
    if (dom.userColorDot) dom.userColorDot.style.backgroundColor = state.userColor;
    if (dom.userBadgeText) dom.userBadgeText.textContent = state.isHost ? 'Yayıncı (Sen)' : 'Sen';
    if (dom.userBadge) dom.userBadge.style.color = state.userColor;
  }

  async function startHostSession() {
    const roomId = generateRoomId();
    state.roomId = roomId;
    state.isHost = true;
    state.userName = 'Yayıncı';
    updateUserBadge();

    try {
      showToast('Oda başlatılıyor, lütfen bekleyin...', '⏳');
      await initPeer(roomId);

      dom.lobby.style.display = 'none';
      dom.stage.style.display = 'flex';
      dom.roomCodeDisplay.textContent = roomId;

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('oda', roomId);
      window.history.pushState({}, '', newUrl);

      const success = await startScreenShare();
      if (!success && dom.placeholderText) {
        dom.placeholderText.textContent = 'Ekran paylaşımı bekleniyor. Sayfayı yenileyerek tekrar başlatabilirsiniz.';
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
    updateUserBadge();

    try {
      showToast('Odaya bağlanılıyor...', '⏳');
      const peer = await initPeer();

      dom.lobby.style.display = 'none';
      dom.stage.style.display = 'flex';
      dom.roomCodeDisplay.textContent = state.roomId;
      if (dom.btnStopStream) dom.btnStopStream.style.display = 'none';

      if (dom.placeholderText) {
        dom.placeholderText.textContent = 'Yayıncının ekran görüntüsü bekleniyor...';
      }

      // Host'a bağlan
      const conn = peer.connect(state.roomId, { reliable: true });
      setupDataConnection(conn);

      showToast('Odaya bağlanıldı!', '✅');
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
  // 6. ÇİZİM MOTORU (2 KALEM: KALICI & GEÇİCİ / FADING)
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

    redrawCanvas();
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

    state.currentStroke = {
      id: 's-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      tool: state.currentTool, // 'pen' (Kalıcı) veya 'fade' (Geçici)
      color: state.userColor,
      size: state.currentTool === 'fade' ? 6 : 4,
      createdAt: performance.now(),
      points: [coords],
    };

    if (state.currentTool === 'fade') {
      state.fadingStrokes.push(state.currentStroke);
    }

    drawSegment(coords, coords, state.currentStroke, 1);

    broadcastData({
      type: 'draw_start',
      stroke: state.currentStroke,
    });
  }

  function moveDrawing(e) {
    if (!state.isDrawing || !state.canvasVisible || !state.currentStroke) return;
    const coords = getNormalizedCoords(e);
    const prevPoint = state.currentStroke.points[state.currentStroke.points.length - 1];
    state.currentStroke.points.push(coords);

    drawSegment(prevPoint, coords, state.currentStroke, 1);

    broadcastData({
      type: 'draw_point',
      strokeId: state.currentStroke.id,
      point: coords,
    });
  }

  function stopDrawing() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    if (state.currentStroke) {
      if (state.currentStroke.tool === 'pen') {
        state.strokeHistory.push(state.currentStroke);
      }
      broadcastData({
        type: 'draw_end',
        strokeId: state.currentStroke.id,
      });
      state.currentStroke = null;
    }
  }

  function drawSegment(p1, p2, stroke, alphaMultiplier = 1) {
    if (!ctx || !dom.canvas) return;
    const w = dom.canvas.width;
    const h = dom.canvas.height;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'fade') {
      // Geçici Kalem: Parlak, ışıldayan neon çizgi
      ctx.globalAlpha = Math.max(0, 0.9 * alphaMultiplier);
      ctx.shadowBlur = 10;
      ctx.shadowColor = stroke.color;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    } else {
      // Kalıcı Kalem: Net, belirgin çizgi
      ctx.globalAlpha = Math.max(0, 1 * alphaMultiplier);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }

    ctx.beginPath();
    ctx.moveTo(p1.x * w, p1.y * h);
    ctx.lineTo(p2.x * w, p2.y * h);
    ctx.stroke();
    ctx.restore();
  }

  function redrawCanvas() {
    if (!ctx || !dom.canvas) return;
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);

    if (!state.canvasVisible) return;

    // 1. Kalıcı Çizgileri Çiz
    state.strokeHistory.forEach((stroke) => {
      for (let i = 1; i < stroke.points.length; i++) {
        drawSegment(stroke.points[i - 1], stroke.points[i], stroke, 1);
      }
    });

    // 2. Geçici Çizgileri Kalan Süresine Göre Çiz
    const now = performance.now();
    const FADE_DURATION = 2500; // 2.5 saniyede kaybolur

    state.fadingStrokes = state.fadingStrokes.filter((stroke) => {
      const age = now - stroke.createdAt;
      return age < FADE_DURATION;
    });

    state.fadingStrokes.forEach((stroke) => {
      const age = now - stroke.createdAt;
      const progress = age / FADE_DURATION; // 0 -> 1
      const alpha = Math.max(0, 1 - progress);

      for (let i = 1; i < stroke.points.length; i++) {
        drawSegment(stroke.points[i - 1], stroke.points[i], stroke, alpha);
      }
    });
  }

  // Geçici çizgileri pürüzsüz kaybettiren animasyon döngüsü
  function animationLoop() {
    if (state.fadingStrokes.length > 0) {
      redrawCanvas();
    }
    requestAnimationFrame(animationLoop);
  }

  // ==========================================================================
  // 7. CANLI YAYIN EKRANI SOHBET BİNDİRMESİ (LIVE STREAM OVERLAY CHAT)
  // ==========================================================================
  function showLiveChatBubble(msg) {
    if (!dom.liveChatOverlay) return;

    const bubble = document.createElement('div');
    bubble.className = 'tts-live-bubble';
    bubble.style.setProperty('--bubble-color', msg.color || '#6366f1');
    bubble.innerHTML = `
      <span class="tts-live-sender" style="color: ${msg.color || '#6366f1'}">${escapeHtml(msg.sender)}:</span>
      <span>${escapeHtml(msg.text)}</span>
    `;

    dom.liveChatOverlay.appendChild(bubble);

    // Ekranda en fazla 4 baloncuk tut
    while (dom.liveChatOverlay.children.length > 4) {
      dom.liveChatOverlay.removeChild(dom.liveChatOverlay.firstChild);
    }

    // 4.5 saniye sonra yumuşakça kaybolsun
    setTimeout(() => {
      bubble.classList.add('fade-out');
      setTimeout(() => bubble.remove(), 400);
    }, 4500);
  }

  // ==========================================================================
  // 8. GELEN P2P VERİLERİNİN İŞLENMESİ
  // ==========================================================================
  const remoteStrokes = {};

  function handleIncomingData(data, conn) {
    switch (data.type) {
      case 'request_stream':
        if (state.isHost && state.localStream) {
          callPeerWithStream(conn.peer, state.localStream);
        }
        break;

      case 'chat':
        addChatMessage(data);
        showLiveChatBubble(data);
        if (!state.isChatOpen) {
          state.unreadCount++;
          if (dom.unreadBadge) {
            dom.unreadBadge.style.display = 'inline-block';
            dom.unreadBadge.textContent = state.unreadCount;
          }
        }
        playNotificationSound();
        break;

      case 'draw_start':
        remoteStrokes[data.stroke.id] = data.stroke;
        if (data.stroke.tool === 'fade') {
          data.stroke.createdAt = performance.now();
          state.fadingStrokes.push(data.stroke);
        }
        break;

      case 'draw_point':
        if (remoteStrokes[data.strokeId]) {
          const s = remoteStrokes[data.strokeId];
          const prev = s.points[s.points.length - 1];
          s.points.push(data.point);
          if (state.canvasVisible) {
            drawSegment(prev, data.point, s, 1);
          }
        }
        break;

      case 'draw_end':
        if (remoteStrokes[data.strokeId]) {
          const s = remoteStrokes[data.strokeId];
          if (s.tool === 'pen') {
            state.strokeHistory.push(s);
          }
          delete remoteStrokes[data.strokeId];
        }
        break;

      case 'draw_clear':
        state.strokeHistory = [];
        state.fadingStrokes = [];
        redrawCanvas();
        showToast('Çizimler temizlendi.', '🧹');
        break;

      case 'draw_undo':
        state.strokeHistory.pop();
        redrawCanvas();
        break;

      case 'sync_history':
        state.strokeHistory = data.history || [];
        redrawCanvas();
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
  // 9. P2P SOHBET VE MOBİL KLAVYE UYUMLULUĞU
  // ==========================================================================
  function sendChatMessage() {
    const text = dom.chatInput.value.trim();
    if (!text) return;

    const msg = {
      type: 'chat',
      id: 'msg-' + Date.now(),
      sender: state.userName,
      color: state.userColor,
      text: text,
      timestamp: Date.now(),
      isMe: true,
    };

    addChatMessage(msg);
    showLiveChatBubble(msg);
    dom.chatInput.value = '';

    broadcastData({
      type: 'chat',
      id: msg.id,
      sender: state.userName,
      color: state.userColor,
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
          <span style="font-weight: 700; color: ${msg.color || 'inherit'}">${escapeHtml(msg.sender)}</span>
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
        setTimeout(() => dom.chatInput && dom.chatInput.focus(), 250);
      } else {
        dom.chatPanel.classList.remove('open');
        if (dom.chatInput) dom.chatInput.blur();
      }
    }
  }

  // Mobil klavye açıldığında sohbet panelini visualViewport'a sabitle
  function setupMobileViewportFix() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (dom.chatPanel && dom.chatPanel.classList.contains('open')) {
          dom.chatPanel.style.height = `${window.visualViewport.height}px`;
          dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
        }
      });
      window.visualViewport.addEventListener('scroll', () => {
        if (dom.chatPanel && dom.chatPanel.classList.contains('open')) {
          dom.chatPanel.style.top = `${window.visualViewport.offsetTop}px`;
        }
      });
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
    // Oda Aç & Katıl
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

    // Sesi Aç Butonu (Tarayıcı autoplay kısıtlaması için)
    if (dom.btnUnmute) {
      dom.btnUnmute.addEventListener('click', () => {
        if (dom.video) {
          dom.video.muted = false;
          dom.video.play().catch(() => {});
          dom.btnUnmute.style.display = 'none';
          showToast('Yayın sesi açıldı.', '🔊');
        }
      });
    }

    // Çizim Araçları (Kalıcı ve Geçici Kalem)
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

    // Geri Al (Undo)
    if (dom.btnUndo) {
      dom.btnUndo.addEventListener('click', () => {
        if (state.strokeHistory.length > 0) {
          state.strokeHistory.pop();
          redrawCanvas();
          broadcastData({ type: 'draw_undo' });
        }
      });
    }

    // Tümünü Temizle
    if (dom.btnClearCanvas) {
      dom.btnClearCanvas.addEventListener('click', () => {
        if (confirm('Tüm çizimleri temizlemek istiyor musunuz?')) {
          state.strokeHistory = [];
          state.fadingStrokes = [];
          redrawCanvas();
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
        redrawCanvas();
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

    // Sohbet Butonları
    if (dom.chatToggleBtn) dom.chatToggleBtn.addEventListener('click', () => toggleChat());
    if (dom.chatCloseBtn) dom.chatCloseBtn.addEventListener('click', () => toggleChat(false));
    if (dom.chatSendBtn) dom.chatSendBtn.addEventListener('click', sendChatMessage);
    if (dom.chatInput) {
      dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
      });
    }

    // Boyutlandırma
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 200));

    if (dom.video) {
      dom.video.addEventListener('loadedmetadata', resizeCanvas);
      dom.video.addEventListener('play', resizeCanvas);
    }

    if (window.ResizeObserver && dom.viewportWrapper) {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(dom.viewportWrapper);
    }

    setupMobileViewportFix();
  }

  // ==========================================================================
  // 11. BAŞLATMA
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    updateUserBadge();
    setupEventListeners();
    requestAnimationFrame(animationLoop);

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('oda') || params.get('room');
    if (roomParam) {
      joinSession(roomParam);
    }
  });

})();
