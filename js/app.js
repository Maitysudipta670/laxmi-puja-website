/**
 * Laxmi Puja Interactive Application
 * Powers photo uploads, public viewing gallery, multi-category updates,
 * flower shower particle physics, and devotional controls.
 */

async function initPujaApp() {
  // Initialize Database
  try {
    await window.pujaDB.init();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // Application State
  const state = {
    isAdmin: (sessionStorage.getItem('puja_is_admin') === 'true'),
    currentTab: 'darshan',
    currentPhotoCategory: 'all',
    currentPhotoSearch: '',
    currentUpdateCategory: 'all',
    currentUpdateSearch: '',
    allPhotos: [],
    allUpdates: [],
    allWishes: [],
    lightboxIndex: 0,
    filteredPhotosForLightbox: [],
    diyasLit: 108,
    isDhaakActive: false,
    isDroneActive: false
  };

  // Setup DOM Elements
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');
  const photoGrid = document.getElementById('photo-grid');
  const updatesList = document.getElementById('updates-list');
  const wishesWall = document.getElementById('wishes-wall');
  const photoCategoryChips = document.querySelectorAll('#photo-chips .chip-btn');
  const updateCategoryChips = document.querySelectorAll('#update-chips .chip-btn');
  const photoSearchInput = document.getElementById('photo-search-input');
  const updateSearchInput = document.getElementById('update-search-input');

  // Admin Controls
  const adminStatusPill = document.getElementById('admin-status-pill');
  const adminModal = document.getElementById('admin-modal');
  const btnCloseAdminModal = document.getElementById('btn-close-admin-modal');
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminPinInput = document.getElementById('admin-pin-input');
  const publicNoticeTag = document.getElementById('public-notice-tag');
  const btnOpenUpdateModal = document.getElementById('btn-open-update-modal');
  const adminBanner = document.getElementById('admin-active-banner');
  const btnTogglePinVisibility = document.getElementById('btn-toggle-pin-visibility');

  // Virtual Darshan Deity Elements (Admin Only Change/Delete)
  const deityMainImg = document.getElementById('deity-main-img');
  const darshanAdminControls = document.getElementById('darshan-admin-controls');
  const darshanPhotoInput = document.getElementById('darshan-photo-input');
  const btnChangeDarshanPhoto = document.getElementById('btn-change-darshan-photo');
  const btnLinkDarshanPhoto = document.getElementById('btn-link-darshan-photo');
  const btnResetDarshanPhoto = document.getElementById('btn-reset-darshan-photo');
  const DEFAULT_DEITY_URL = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Raja_Ravi_Varma%2C_Goddess_Lakshmi%2C_1896.jpg/960px-Raja_Ravi_Varma%2C_Goddess_Lakshmi%2C_1896.jpg';

  // Stats Elements
  const statPhotos = document.getElementById('stat-photos');
  const statUpdates = document.getElementById('stat-updates');
  const statWishes = document.getElementById('stat-wishes');
  const statDiyas = document.getElementById('stat-diyas');

  // Clear any residual dark-mode state
  try {
    localStorage.removeItem('amfan_theme');
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  } catch (err) {}

  // ==========================================================
  // 1. PUJA COUNTDOWN TIMER (1 November 2026, 06:00:00 AM IST)
  // ==========================================================
  function initPujaCountdown() {
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMins = document.getElementById('cd-mins');
    const cdSecs = document.getElementById('cd-secs');

    if (!cdDays) return;

    // Target: 1 November 2026, 06:00:00 IST (Kojagari Laxmi Puja Start)
    const targetDate = new Date('2026-11-01T06:00:00+05:30').getTime();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    function toBn(num) {
      return String(num).padStart(2, '0').split('').map(d => {
        const idx = parseInt(d, 10);
        return isNaN(idx) ? d : bnDigits[idx];
      }).join('');
    }

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        cdDays.textContent = '০০';
        cdHours.textContent = '০০';
        cdMins.textContent = '০০';
        cdSecs.textContent = '০০';
        const titleEl = document.querySelector('.countdown-badge-title');
        if (titleEl) {
          titleEl.innerHTML = '<span>🎉</span><span>শুভ কোজাগরী লক্ষ্মী পূজা! পূজা শুরু হয়েছে!</span>';
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      cdDays.textContent = toBn(days);
      cdHours.textContent = toBn(hours);
      cdMins.textContent = toBn(mins);
      cdSecs.textContent = toBn(secs);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
  initPujaCountdown();

  // ==========================================================
  // 2. WHATSAPP SHARE INVITATION
  // ==========================================================
  function initWhatsAppShare() {
    const btnShare = document.getElementById('btn-whatsapp-share');
    const btnLightboxShare = document.getElementById('lightbox-whatsapp-btn');

    function shareGeneralPuja() {
      const currentUrl = window.location.href.split('#')[0];
      const message = 
`🪔 আমফান (N.S.C.C) সার্বজনীন কোজাগরী লক্ষ্মী পূজা ও বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান 🌺

প্রণাম ও শারদ শুভেচ্ছা! আমাদের আমফান (N.S.C.C) ক্লাবের পুণ্য পূজায় আপনারা সপরিবারে আমন্ত্রিত:

📌 বাংলা তারিখ: ১৪, ১৫ ও ১৬ কার্তিক, ১৪৩৩
📌 ইংরেজি তারিখ: ১, ২ ও ৩ নভেম্বর, ২০২৬

📍 পূজা প্রাঙ্গণ: নাইকুন্ডি শীতলামাতা মন্দির প্রাঙ্গণ
ঠিকানা: নাইকুন্ডি,কুমোরআড়া,নন্দকুমার,পূর্ব মেদিনীপুর,পিন-৭২১৬৩২
🗺️ ম্যাপ লোকেশন: https://maps.app.goo.gl/vdFZix7KHu1ypo9M9

মা লক্ষ্মীর পবিত্র প্রতিমা দর্শন, আরতি, শঙ্খধ্বনি ও ক্লাবের অনুষ্ঠানের মুহূর্ত দেখতে আমাদের ওয়েবসাইট দেখুন:
👉 ${currentUrl}

"এসো মা লক্ষ্মী বসো ঘরে, আমারই ঘরে থাকো আলো করে..." 🙏✨`;

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        navigator.share({
          title: 'আমফান (N.S.C.C) কোজাগরী লক্ষ্মী পূজা',
          text: message,
          url: currentUrl
        }).catch(() => {
          window.open(whatsappUrl, '_blank');
        });
      } else {
        window.open(whatsappUrl, '_blank');
      }
    }

    if (btnShare) {
      btnShare.addEventListener('click', shareGeneralPuja);
    }

    if (btnLightboxShare) {
      btnLightboxShare.addEventListener('click', () => {
        const photoTitle = document.getElementById('lightbox-title')?.textContent || 'পূজা মুহূর্ত';
        const currentUrl = window.location.href.split('#')[0];
        const photoMsg = `🪔 আমফান (N.S.C.C) কোজাগরী লক্ষ্মী পূজা\n📸 ছবি: ${photoTitle}\n\nসম্পূর্ণ প্রতিমা দর্শন ও ক্লাবের গ্যালারি দেখুন:\n👉 ${currentUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(photoMsg)}`;
        window.open(whatsappUrl, '_blank');
      });
    }
  }
  initWhatsAppShare();

  // ==========================================================
  // TAB NAVIGATION
  // ==========================================================
  const tabManageBtn = document.getElementById('tab-manage-btn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (target === 'manage' && !state.isAdmin) {
        showToast('🔒 ব্যাকআপ ও ডাটা অপশন শুধুমাত্র ক্লাবের অ্যাডমিনের জন্য।');
        return;
      }
      state.currentTab = target;
      if (target === 'manage' && typeof populateSecuritySettingsForm === 'function') {
        populateSecuritySettingsForm();
      }

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panes.forEach(p => {
        if (p.id === `pane-${target}`) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });

      // Smooth scroll to top of pane if on mobile
      if (window.innerWidth < 768) {
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
          navContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Direct tab switcher helper
  window.switchTab = (tabName) => {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.click();
  };

  // ==========================================================
  // DEVOTIONAL CONTROLS & CANVAS FLOWER PARTICLES
  // ==========================================================
  const canvas = document.getElementById('flower-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class FlowerPetal {
    constructor(isSpark = false) {
      this.isSpark = isSpark;
      this.x = Math.random() * canvas.width;
      this.y = isSpark ? canvas.height * 0.45 + (Math.random() * 100 - 50) : -20;
      this.size = isSpark ? Math.random() * 4 + 2 : Math.random() * 16 + 12;
      this.speedY = isSpark ? (Math.random() - 0.5) * 4 : Math.random() * 2 + 1.8;
      this.speedX = Math.random() * 2 - 1;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.05;
      this.opacity = isSpark ? 1 : 0.9;
      // Lotus pink, Marigold orange, or Sparkle gold
      const types = ['lotus', 'marigold', 'jasmine', 'gold'];
      this.type = isSpark ? 'gold' : types[Math.floor(Math.random() * types.length)];
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.015) * 0.7;
      this.rotation += this.rotSpeed;
      if (this.isSpark) {
        this.opacity -= 0.018;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.opacity);

      if (this.type === 'lotus') {
        // Red / Pink Lotus Petal
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.6, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.3, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'marigold') {
        // Vibrant Orange Marigold Petal
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(this.size * 0.1, -this.size * 0.1, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'jasmine') {
        // White Jasmine / Bel Phool
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.4, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing Gold Sparkle
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.y > canvas.height + 30 || p.opacity <= 0) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  function triggerPetalShower(count = 45) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        particles.push(new FlowerPetal(false));
      }, i * 35);
    }
  }

  function triggerGoldenSparks(count = 30) {
    for (let i = 0; i < count; i++) {
      particles.push(new FlowerPetal(true));
    }
  }

  // Hook Up Audio and Ritual Buttons
  const btnShankh = document.getElementById('btn-shankh');
  const btnBell = document.getElementById('btn-bell');
  const btnDhaak = document.getElementById('btn-dhaak');
  const btnDrone = document.getElementById('btn-drone');
  const btnLightDiya = document.getElementById('btn-light-diya');
  const btnOfferFlowers = document.getElementById('btn-offer-flowers');
  const altarFlame = document.getElementById('altar-diya-flame');

  if (btnShankh) {
    btnShankh.addEventListener('click', () => {
      window.pujaAudio.playShankh();
      showToast('🪔 Conch Shell blown! শঙ্খধ্বনি reverberating with blessings.');
    });
  }

  if (btnBell) {
    btnBell.addEventListener('click', () => {
      window.pujaAudio.playTempleBell();
      showToast('🔔 Temple Bell ringing! ঘণ্টা ধ্বনি');
    });
  }

  if (btnDhaak) {
    btnDhaak.addEventListener('click', () => {
      window.pujaAudio.toggleDhaak((isActive) => {
        state.isDhaakActive = isActive;
        btnDhaak.classList.toggle('active', isActive);
        btnDhaak.innerHTML = isActive 
          ? `🥁 Dhaak Beats (Playing...)` 
          : `🥁 Dhaak Beats (ঢাক)`;
        showToast(isActive ? '🥁 Festive Dhaak rhythm started!' : '🥁 Dhaak paused.');
      });
    });
  }

  if (btnDrone) {
    btnDrone.addEventListener('click', () => {
      window.pujaAudio.toggleAmbientDrone((isActive) => {
        state.isDroneActive = isActive;
        btnDrone.classList.toggle('active', isActive);
        btnDrone.innerHTML = isActive 
          ? `🎶 Temple Chants (Playing...)` 
          : `🎶 Temple Chants (সুর)`;
        showToast(isActive ? '🎶 Peaceful temple drone playing.' : '🎶 Music muted.');
      });
    });
  }

  if (btnLightDiya) {
    btnLightDiya.addEventListener('click', async () => {
      window.pujaAudio.playTempleBell();
      triggerGoldenSparks(40);
      if (altarFlame) {
        altarFlame.style.display = 'block';
        altarFlame.classList.add('diya-flame');
      }
      const newCount = await window.pujaDB.incrementCounter('diyas_lit');
      state.diyasLit = newCount;
      if (statDiyas) statDiyas.textContent = newCount;
      btnLightDiya.classList.add('lit');
      btnLightDiya.innerHTML = `✨ Diya Lit for Maa (${newCount})`;
      showToast('🪔 You have lit a sacred Diya for Maa Lakshmi! May peace fill your home.');
    });
  }

  if (btnOfferFlowers) {
    btnOfferFlowers.addEventListener('click', () => {
      window.pujaAudio.playFlowerChime();
      triggerPetalShower(55);
      showToast('🌸 Pushpanjali flowers offered at the lotus feet of Maa Lakshmi! জয় মা লক্ষ্মী!');
    });
  }

  // ==========================================================
  // PHOTO GALLERY SYSTEM ("easily save photo for view public")
  // ==========================================================
  async function loadPhotos() {
    state.allPhotos = await window.pujaDB.getAllPhotos();
    if (statPhotos) statPhotos.textContent = state.allPhotos.length;
    renderPhotos();
  }

  function filterPhotos() {
    let filtered = [...state.allPhotos];

    // Filter by Category
    if (state.currentPhotoCategory !== 'all') {
      filtered = filtered.filter(p => p.category === state.currentPhotoCategory);
    }

    // Filter by Search Query
    if (state.currentPhotoSearch.trim() !== '') {
      const q = state.currentPhotoSearch.toLowerCase();
      filtered = filtered.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.caption && p.caption.toLowerCase().includes(q)) ||
        (p.photographer && p.photographer.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  function renderPhotos() {
    const photos = filterPhotos();
    state.filteredPhotosForLightbox = photos;

    if (!photoGrid) return;

    if (photos.length === 0) {
      photoGrid.innerHTML = `
        <div class="photo-empty-state">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">📷</div>
          <h3 style="font-family: var(--font-heading); color: var(--color-primary); margin-bottom: 0.5rem;">No Photos Found</h3>
          <p>No photos match the selected category or search query.</p>
          <button class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-open-upload-modal').click()">
            Upload First Photo
          </button>
        </div>
      `;
      return;
    }

    photoGrid.innerHTML = photos.map((p, index) => `
      <div class="photo-card" data-id="${p.id}">
        <div class="photo-thumbnail-container" onclick="openLightbox(${index})">
          <img src="${p.imageUrl}" alt="${escapeHtml(p.title)}" class="photo-thumbnail" loading="lazy" />
          <span class="photo-category-badge">${escapeHtml(p.category || 'Puja')}</span>
        </div>
        <div class="photo-info">
          <h4 class="photo-title" onclick="openLightbox(${index})" style="cursor: pointer;">${escapeHtml(p.title)}</h4>
          <p class="photo-caption">${escapeHtml(p.caption || '')}</p>
          <div class="photo-meta">
            <span class="photo-credit">
              👤 ${escapeHtml(p.photographer || 'Devotee')}
            </span>
            <div class="photo-actions">
              <button class="photo-like-btn" onclick="likePhoto('${p.id}', event)">
                ❤️ <span class="like-count">${p.likes || 0}</span>
              </button>
              <button class="photo-like-btn" style="background: #f7f3eb; border-color: #e5d5be; color: #555;" onclick="sharePhoto('${p.id}', event)" title="Share Photo">
                🔗
              </button>
              ${state.isAdmin ? `
                <button class="photo-like-btn" style="background: #fff0f0; border-color: #ffcdd2; color: #b32134; cursor: pointer;" onclick="adminDeletePhoto('${p.id}', event)" title="Delete Photo (Admin Only)">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Admin delete photo
  window.adminDeletePhoto = async (photoId, event) => {
    if (event) event.stopPropagation();
    if (!state.isAdmin) return;
    const photo = state.allPhotos.find(p => p.id === photoId);
    const title = photo ? photo.title : 'photo';
    if (confirm(`আপনি কি "${title}" ছবিটি পাবলিক গ্যালারি থেকে মুছে ফেলতে চান?`)) {
      await window.pujaDB.deletePhoto(photoId);
      await loadPhotos();
      showToast('🗑️ ছবিটি সফলভাবে মুছে ফেলা হয়েছে।');
    }
  };

  // Category Filtering
  photoCategoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      photoCategoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentPhotoCategory = chip.dataset.category;
      renderPhotos();
    });
  });

  // Search input with debounce
  if (photoSearchInput) {
    photoSearchInput.addEventListener('input', (e) => {
      state.currentPhotoSearch = e.target.value;
      renderPhotos();
    });
  }

  // Like Photo
  window.likePhoto = async (photoId, event) => {
    if (event) event.stopPropagation();
    const newLikes = await window.pujaDB.toggleLikePhoto(photoId);
    if (newLikes !== null) {
      // Update local state
      const photo = state.allPhotos.find(p => p.id === photoId);
      if (photo) photo.likes = newLikes;
      renderPhotos();
      window.pujaAudio.playFlowerChime();
    }
  };

  // Share Photo
  window.sharePhoto = (photoId, event) => {
    if (event) event.stopPropagation();
    const photo = state.allPhotos.find(p => p.id === photoId);
    if (!photo) return;

    if (navigator.share) {
      navigator.share({
        title: photo.title,
        text: `View this Laxmi Puja photo: ${photo.title} by ${photo.photographer}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('📋 Link copied to clipboard to share with family!');
    }
  };

  // ==========================================================
  // PHOTO UPLOADER MODAL & IMAGE COMPRESSION
  // ==========================================================
  const uploadModal = document.getElementById('upload-modal');
  const btnOpenUploadModal = document.getElementById('btn-open-upload-modal');
  const btnCloseUploadModal = document.getElementById('btn-close-upload-modal');
  const photoForm = document.getElementById('photo-upload-form');
  const fileDropzone = document.getElementById('file-dropzone');
  const photoFileInput = document.getElementById('photo-file-input');
  const filePreview = document.getElementById('file-preview');
  let selectedImageDataUrl = null;

  if (btnOpenUploadModal) {
    btnOpenUploadModal.addEventListener('click', () => {
      uploadModal.classList.add('active');
    });
  }

  if (btnCloseUploadModal) {
    btnCloseUploadModal.addEventListener('click', () => {
      uploadModal.classList.remove('active');
    });
  }

  // Drag and drop events
  if (fileDropzone) {
    fileDropzone.addEventListener('click', () => photoFileInput.click());
    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = 'var(--color-primary)';
      fileDropzone.style.background = '#f7e3e7';
    });
    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.style.borderColor = 'var(--color-gold)';
      fileDropzone.style.background = '#fdf8ee';
    });
    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = 'var(--color-gold)';
      fileDropzone.style.background = '#fdf8ee';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processSelectedImage(e.dataTransfer.files[0]);
      }
    });
  }

  if (photoFileInput) {
    photoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processSelectedImage(e.target.files[0]);
      }
    });
  }

  // Compress & convert file to optimized Base64
  function processSelectedImage(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas max 1400px width/height to keep storage slim and fast
        const maxDimension = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = width;
        resizeCanvas.height = height;
        const rCtx = resizeCanvas.getContext('2d');
        rCtx.drawImage(img, 0, 0, width, height);

        // Quality 0.85 JPEG
        selectedImageDataUrl = resizeCanvas.toDataURL('image/jpeg', 0.85);

        // Update preview
        filePreview.src = selectedImageDataUrl;
        filePreview.style.display = 'block';
        document.getElementById('dropzone-text').textContent = `Selected: ${file.name} (${Math.round(selectedImageDataUrl.length / 1024)} KB)`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Handle Photo Form Submission
  if (photoForm) {
    photoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!selectedImageDataUrl) {
        alert('Please choose or drop an image to upload.');
        return;
      }

      const title = document.getElementById('photo-title-input').value.trim();
      const category = document.getElementById('photo-category-input').value;
      const photographer = document.getElementById('photo-author-input').value.trim() || 'Devotee';
      const caption = document.getElementById('photo-caption-input').value.trim();

      const newPhoto = {
        title,
        category,
        photographer,
        caption,
        imageUrl: selectedImageDataUrl,
        timestamp: new Date().toISOString(),
        likes: 0
      };

      try {
        await window.pujaDB.savePhoto(newPhoto);
        uploadModal.classList.remove('active');
        photoForm.reset();
        selectedImageDataUrl = null;
        filePreview.style.display = 'none';
        document.getElementById('dropzone-text').textContent = 'Click to browse or drag & drop photo here';

        // Reload and switch to gallery
        await loadPhotos();
        window.switchTab('gallery');
        window.pujaAudio.playTempleBell();
        triggerPetalShower(30);
        showToast('🎉 Photo successfully saved! It is now live in the Public Gallery for everyone to view.');
      } catch (err) {
        console.error('Error saving photo:', err);
        alert('Could not save photo. Please try again.');
      }
    });
  }

  // ==========================================================
  // LIGHTBOX MODAL (Full Resolution Public Viewing)
  // ==========================================================
  const lightboxModal = document.getElementById('lightbox-modal');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxAuthor = document.getElementById('lightbox-author');
  const lightboxTime = document.getElementById('lightbox-time');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxLikeBtn = document.getElementById('lightbox-like-btn');
  const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxDeleteBtn = document.getElementById('lightbox-delete-btn');

  window.openLightbox = (index) => {
    if (!state.filteredPhotosForLightbox || state.filteredPhotosForLightbox.length === 0) return;
    state.lightboxIndex = index;
    renderLightboxContent();
    lightboxModal.classList.add('active');
  };

  function renderLightboxContent() {
    const photo = state.filteredPhotosForLightbox[state.lightboxIndex];
    if (!photo) return;

    lightboxImg.src = photo.imageUrl;
    lightboxTitle.textContent = photo.title;
    lightboxCategory.textContent = photo.category;
    lightboxAuthor.textContent = `Captured by ${photo.photographer || 'Devotee'}`;
    lightboxTime.textContent = formatTimeAgo(photo.timestamp);
    lightboxCaption.textContent = photo.caption || '';
    lightboxLikeBtn.innerHTML = `❤️ Like (${photo.likes || 0})`;

    // Download action
    lightboxDownloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = photo.imageUrl;
      a.download = `LaxmiPuja_${photo.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      a.click();
    };

    // Like in lightbox
    lightboxLikeBtn.onclick = async () => {
      const newLikes = await window.pujaDB.toggleLikePhoto(photo.id);
      if (newLikes !== null) {
        photo.likes = newLikes;
        lightboxLikeBtn.innerHTML = `❤️ Like (${newLikes})`;
        renderPhotos();
        window.pujaAudio.playFlowerChime();
      }
    };

    // Delete in lightbox (Admin only)
    if (state.isAdmin) {
      lightboxDeleteBtn.style.display = 'inline-flex';
      lightboxDeleteBtn.onclick = async () => {
        if (confirm(`Delete "${photo.title}" from public gallery?`)) {
          await window.pujaDB.deletePhoto(photo.id);
          lightboxModal.classList.remove('active');
          await loadPhotos();
          showToast('🗑️ Photo removed from gallery.');
        }
      };
    } else {
      lightboxDeleteBtn.style.display = 'none';
    }
  }

  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', () => {
      if (state.lightboxIndex > 0) {
        state.lightboxIndex--;
      } else {
        state.lightboxIndex = state.filteredPhotosForLightbox.length - 1;
      }
      renderLightboxContent();
    });
  }

  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', () => {
      if (state.lightboxIndex < state.filteredPhotosForLightbox.length - 1) {
        state.lightboxIndex++;
      } else {
        state.lightboxIndex = 0;
      }
      renderLightboxContent();
    });
  }

  if (btnCloseLightbox) {
    btnCloseLightbox.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
  }

  // Keyboard navigation for lightbox
  window.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') lightboxModal.classList.remove('active');
    if (e.key === 'ArrowLeft') lightboxPrevBtn.click();
    if (e.key === 'ArrowRight') lightboxNextBtn.click();
  });

  // ==========================================================
  // UPDATES & ANNOUNCEMENTS NOTICE BOARD
  // ("diffarent types of update": Schedule, Bhog, Urgent, Cultural, etc.)
  // ==========================================================
  async function loadUpdates() {
    state.allUpdates = await window.pujaDB.getAllUpdates();
    if (statUpdates) statUpdates.textContent = state.allUpdates.length;
    renderUpdates();
  }

  function filterUpdates() {
    let list = [...state.allUpdates];

    if (state.currentUpdateCategory !== 'all') {
      list = list.filter(u => u.category === state.currentUpdateCategory);
    }

    if (state.currentUpdateSearch.trim() !== '') {
      const q = state.currentUpdateSearch.toLowerCase();
      list = list.filter(u => 
        (u.title && u.title.toLowerCase().includes(q)) ||
        (u.body && u.body.toLowerCase().includes(q)) ||
        (u.author && u.author.toLowerCase().includes(q))
      );
    }

    return list;
  }

  function getBadgeHtml(category, isPinned, priority) {
    let categoryBadge = '';
    switch (category) {
      case 'schedule':
        categoryBadge = `<span class="update-badge badge-schedule">🕒 Puja Schedule</span>`;
        break;
      case 'bhog':
        categoryBadge = `<span class="update-badge badge-bhog">🍲 Bhog & Prasad</span>`;
        break;
      case 'urgent':
        categoryBadge = `<span class="update-badge badge-urgent">🔴 Urgent Notice</span>`;
        break;
      case 'cultural':
        categoryBadge = `<span class="update-badge badge-cultural">🎭 Cultural & Event</span>`;
        break;
      default:
        categoryBadge = `<span class="update-badge badge-general">📢 General Info</span>`;
    }

    const pinBadge = isPinned ? `<span class="update-badge badge-pinned">📌 Pinned</span>` : '';
    const priorityBadge = priority === 'urgent' && category !== 'urgent' 
      ? `<span class="update-badge badge-urgent">⚡ Priority</span>` 
      : '';

    return `${pinBadge} ${categoryBadge} ${priorityBadge}`;
  }

  function renderUpdates() {
    const updates = filterUpdates();
    if (!updatesList) return;

    if (updates.length === 0) {
      updatesList.innerHTML = `
        <div class="photo-empty-state">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">📜</div>
          <h3 style="font-family: var(--font-heading); color: var(--color-primary);">কোনো নোটিশ পাওয়া যায়নি</h3>
          <p>নির্বাচিত ক্যাটাগরিতে এই মুহূর্তে কোনো নোটিশ বা ঘোষণা নেই।</p>
          ${state.isAdmin ? `
            <button class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-open-update-modal').click()">
              📢 Post New Notice
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    updatesList.innerHTML = updates.map(u => `
      <div class="update-card ${u.category} ${u.isPinned ? 'pinned' : ''}" data-id="${u.id}">
        <div class="update-header">
          <div class="update-badge-group">
            ${getBadgeHtml(u.category, u.isPinned, u.priority)}
          </div>
          <span class="update-time">${formatTimeAgo(u.timestamp)}</span>
        </div>
        <h3 class="update-title">${escapeHtml(u.title)}</h3>
        <p class="update-body">${escapeHtml(u.body)}</p>
        <div class="update-footer">
          <span class="update-author">✍️ ${escapeHtml(u.author || 'Amfan (N.S.C.C)')}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="photo-like-btn" onclick="likeUpdate('${u.id}', event)" title="Like this notice">
              ❤️ <span class="like-count">${u.likes || 0}</span>
            </button>
            ${state.isAdmin ? `
              <button class="photo-like-btn" style="background: #fff0f0; border-color: #ffcdd2; color: #b32134; cursor: pointer;" onclick="deleteUpdate('${u.id}')" title="Delete Announcement">
                🗑️ Delete
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Like update (Public & Admin can like)
  window.likeUpdate = async (updateId, event) => {
    if (event) event.stopPropagation();
    const newLikes = await window.pujaDB.toggleLikeUpdate(updateId);
    if (newLikes !== null) {
      const update = state.allUpdates.find(u => u.id === updateId);
      if (update) update.likes = newLikes;
      renderUpdates();
      window.pujaAudio.playFlowerChime();
    }
  };

  // Filter chips for updates
  updateCategoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      updateCategoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentUpdateCategory = chip.dataset.category;
      renderUpdates();
    });
  });

  // Search input for updates
  if (updateSearchInput) {
    updateSearchInput.addEventListener('input', (e) => {
      state.currentUpdateSearch = e.target.value;
      renderUpdates();
    });
  }

  // Delete update (Admin only)
  window.deleteUpdate = async (updateId) => {
    if (!state.isAdmin) return;
    if (confirm('Are you sure you want to delete this notice?')) {
      await window.pujaDB.deleteUpdate(updateId);
      await loadUpdates();
      showToast('Notice removed.');
    }
  };

  // Create Update Modal (Admin only)
  const updateModal = document.getElementById('update-modal');
  const btnCloseUpdateModal = document.getElementById('btn-close-update-modal');
  const updateForm = document.getElementById('update-post-form');

  if (btnOpenUpdateModal) {
    btnOpenUpdateModal.addEventListener('click', () => {
      if (!state.isAdmin) {
        showToast('🔒 নোটিশ বোর্ড শুধুমাত্র ক্লাবের অ্যাডমিন নিয়ন্ত্রণ করতে পারেন।');
        return;
      }
      updateModal.classList.add('active');
    });
  }

  if (btnCloseUpdateModal) {
    btnCloseUpdateModal.addEventListener('click', () => {
      updateModal.classList.remove('active');
    });
  }

  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.isAdmin) {
        alert('🔒 শুধুমাত্র ক্লাবের দায়িত্বপ্রাপ্ত অ্যাডমিন নোটিশ পোস্ট করতে পারেন।');
        return;
      }

      const title = document.getElementById('update-title-input').value.trim();
      const category = document.getElementById('update-category-input').value;
      const priority = document.getElementById('update-priority-input').value;
      const isPinned = document.getElementById('update-pin-input').checked;
      const author = document.getElementById('update-author-input').value.trim() || 'Puja Committee';
      const body = document.getElementById('update-body-input').value.trim();

      const newUpdate = {
        title,
        category,
        priority,
        isPinned,
        author,
        body,
        likes: 0,
        timestamp: new Date().toISOString()
      };

      try {
        await window.pujaDB.saveUpdate(newUpdate);
        updateModal.classList.remove('active');
        updateForm.reset();
        await loadUpdates();
        window.switchTab('updates');
        window.pujaAudio.playTempleBell();
        showToast('📢 New update successfully posted on the public notice board!');
      } catch (err) {
        console.error('Error saving update:', err);
        alert('Could not post update. Please try again.');
      }
    });
  }

  // Load saved deity photo if set by Admin
  const savedDeityPhoto = localStorage.getItem('puja_deity_photo');
  if (savedDeityPhoto && deityMainImg) {
    deityMainImg.src = savedDeityPhoto;
  }

  // ==========================================================
  // AMFAN (N.S.C.C) CLUB ADMIN MANAGEMENT
  // ==========================================================
  function updateAdminUI() {
    if (state.isAdmin) {
      if (adminStatusPill) {
        adminStatusPill.innerHTML = `👑 Amfan (N.S.C.C) অ্যাডমিন [লগআউট]`;
        adminStatusPill.style.background = '#ffd700';
        adminStatusPill.style.color = '#3e0409';
        adminStatusPill.style.fontWeight = '700';
      }
      if (btnOpenUpdateModal) btnOpenUpdateModal.style.display = 'inline-flex';
      if (publicNoticeTag) publicNoticeTag.style.display = 'none';
      if (adminBanner) adminBanner.style.display = 'flex';
      if (darshanAdminControls) darshanAdminControls.style.display = 'flex';
      if (tabManageBtn) tabManageBtn.style.display = 'inline-flex';
      if (firebaseStatusPill) firebaseStatusPill.style.display = 'inline-flex';
      const btnAddMem = document.getElementById('btn-add-committee-member');
      if (btnAddMem) btnAddMem.style.display = 'inline-flex';
      const donAdminPanel = document.getElementById('admin-donation-panel');
      if (donAdminPanel) donAdminPanel.style.display = 'block';
      const donTableSec = document.getElementById('admin-donations-table-section');
      if (donTableSec) donTableSec.style.display = 'block';
    } else {
      if (adminStatusPill) {
        adminStatusPill.innerHTML = `👑 ক্লাবের অ্যাডমিন`;
        adminStatusPill.style.background = 'rgba(255, 255, 255, 0.12)';
        adminStatusPill.style.color = 'var(--color-ivory)';
        adminStatusPill.style.fontWeight = '500';
      }
      if (btnOpenUpdateModal) btnOpenUpdateModal.style.display = 'none';
      if (publicNoticeTag) publicNoticeTag.style.display = 'inline-block';
      if (adminBanner) adminBanner.style.display = 'none';
      if (darshanAdminControls) darshanAdminControls.style.display = 'none';
      if (tabManageBtn) tabManageBtn.style.display = 'none';
      if (firebaseStatusPill) firebaseStatusPill.style.display = 'none';
      const btnAddMem = document.getElementById('btn-add-committee-member');
      if (btnAddMem) btnAddMem.style.display = 'none';
      const donAdminPanel = document.getElementById('admin-donation-panel');
      if (donAdminPanel) donAdminPanel.style.display = 'none';
      const donTableSec = document.getElementById('admin-donations-table-section');
      if (donTableSec) donTableSec.style.display = 'none';
    }
    renderUpdates();
    renderPhotos();
    renderWishes();
    if (typeof renderCommittee === 'function') renderCommittee();
    if (typeof renderDonationsAdmin === 'function') renderDonationsAdmin();
  }

  if (adminStatusPill) {
    adminStatusPill.addEventListener('click', () => {
      if (state.isAdmin) {
        if (confirm('আমফান (N.S.C.C) ক্লাব অ্যাডমিন মোড থেকে লগআউট করতে চান?')) {
          sessionStorage.removeItem('puja_is_admin');
          state.isAdmin = false;
          updateAdminUI();
          renderUpdates();
          if (state.currentTab === 'manage') {
            window.switchTab('darshan');
          }
          showToast('🔒 অ্যাডমিন মোড থেকে লগআউট করা হয়েছে। এখন পাবলিক ভিউ সক্রিয়।');
        }
      } else {
        if (typeof resetForgotModal === 'function') resetForgotModal();
        if (adminModal) adminModal.classList.add('active');
      }
    });
  }

  if (btnCloseAdminModal) {
    btnCloseAdminModal.addEventListener('click', () => {
      if (adminModal) adminModal.classList.remove('active');
      if (typeof resetForgotModal === 'function') resetForgotModal();
    });
  }

  // Admin PIN Visibility Toggle
  if (btnTogglePinVisibility && adminPinInput) {
    btnTogglePinVisibility.addEventListener('click', () => {
      if (adminPinInput.type === 'password') {
        adminPinInput.type = 'text';
        btnTogglePinVisibility.innerHTML = '🙈 পাসওয়ার্ড লুকান';
      } else {
        adminPinInput.type = 'password';
        btnTogglePinVisibility.innerHTML = '👁️ পাসওয়ার্ড দেখুন';
      }
    });
  }

  // Virtual Darshan Photo Handlers (Admin Only)
  if (btnChangeDarshanPhoto && darshanPhotoInput) {
    btnChangeDarshanPhoto.addEventListener('click', () => {
      darshanPhotoInput.click();
    });

    darshanPhotoInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

          try {
            await window.pujaDB.saveDeityPhoto(dataUrl);
            if (deityMainImg) deityMainImg.src = dataUrl;
            showToast('🪔 ভার্চুয়াল দর্শনের প্রতিমা ছবি সফলভাবে সেভ করা হয়েছে!');
            window.pujaAudio.playTempleBell();
          } catch (err) {
            console.warn('Storage limit for deity image:', err);
            if (deityMainImg) deityMainImg.src = dataUrl;
            showToast('🪔 প্রতিমা ছবি আপডেট করা হয়েছে!');
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnResetDarshanPhoto) {
    btnResetDarshanPhoto.addEventListener('click', async () => {
      if (confirm('ভার্চুয়াল দর্শনের প্রতিমা ছবি মুছে আসল ছবিতে ফিরিয়ে আনতে চান?')) {
        await window.pujaDB.resetDeityPhoto();
        if (deityMainImg) deityMainImg.src = DEFAULT_DEITY_URL;
        showToast('🗑️ প্রতিমা ছবি মুছে আসল ছবিতে রিসেট করা হয়েছে।');
      }
    });
  }

  if (btnLinkDarshanPhoto) {
    btnLinkDarshanPhoto.addEventListener('click', async () => {
      const url = prompt('প্রতিমার ছবির সরাসরি অনলাইন লিংক (Image URL) পেস্ট করুন:');
      if (url && url.trim().startsWith('http')) {
        try {
          await window.pujaDB.saveDeityPhoto(url.trim());
          if (deityMainImg) deityMainImg.src = url.trim();
          showToast('🪔 প্রতিমা ছবির অনলাইন লিংক সফলভাবে সেভ করা হয়েছে!');
          window.pujaAudio.playTempleBell();
        } catch (err) {
          console.warn('Error saving deity link:', err);
        }
      } else if (url !== null && url.trim() !== '') {
        alert('অনুগ্রহ করে একটি সঠিক অনলাইন ছবির লিংক (http:// বা https://) দিন।');
      }
    });
  }

  // ==========================================================
  // ADMIN LOGIN & FORGOT PASSWORD RECOVERY SYSTEM
  // ==========================================================
  const adminLoginView = document.getElementById('admin-login-view');
  const adminForgotView = document.getElementById('admin-forgot-view');
  const btnGotoForgotPwd = document.getElementById('btn-goto-forgot-pwd');
  const btnBackToLogin = document.getElementById('btn-back-to-login');
  const adminModalTitle = document.getElementById('admin-modal-title');

  const forgotStep1 = document.getElementById('forgot-step-1');
  const forgotStep2 = document.getElementById('forgot-step-2');
  const forgotStepSuccess = document.getElementById('forgot-step-success');

  const forgotSecQuestionDisplay = document.getElementById('forgot-sec-question-display');
  const forgotSecAnswerInput = document.getElementById('forgot-sec-answer-input');
  const forgotStep1Error = document.getElementById('forgot-step1-error');
  const btnVerifySecurityAnswer = document.getElementById('btn-verify-security-answer');

  const forgotNewPwdInput = document.getElementById('forgot-new-pwd-input');
  const forgotConfirmPwdInput = document.getElementById('forgot-confirm-pwd-input');
  const btnToggleNewPwd = document.getElementById('btn-toggle-new-pwd');
  const btnToggleConfirmPwd = document.getElementById('btn-toggle-confirm-pwd');
  const forgotPwdMatchMsg = document.getElementById('forgot-pwd-match-msg');
  const btnSaveNewPwd = document.getElementById('btn-save-new-pwd');
  const btnCancelStep2 = document.getElementById('btn-cancel-step2');
  const btnLoginWithNewPwd = document.getElementById('btn-login-with-new-pwd');

  function resetForgotModal() {
    if (adminLoginView) adminLoginView.style.display = 'block';
    if (adminForgotView) adminForgotView.style.display = 'none';
    if (forgotStep1) forgotStep1.style.display = 'block';
    if (forgotStep2) forgotStep2.style.display = 'none';
    if (forgotStepSuccess) forgotStepSuccess.style.display = 'none';
    if (adminModalTitle) adminModalTitle.textContent = '👑 Amfan (N.S.C.C) অ্যাডমিন লগইন';
    if (forgotSecAnswerInput) forgotSecAnswerInput.value = '';
    if (forgotStep1Error) {
      forgotStep1Error.textContent = '';
      forgotStep1Error.style.display = 'none';
    }
    if (forgotNewPwdInput) {
      forgotNewPwdInput.value = '';
      forgotNewPwdInput.type = 'password';
    }
    if (forgotConfirmPwdInput) {
      forgotConfirmPwdInput.value = '';
      forgotConfirmPwdInput.type = 'password';
    }
    if (btnToggleNewPwd) btnToggleNewPwd.textContent = '👁️ দেখুন';
    if (btnToggleConfirmPwd) btnToggleConfirmPwd.textContent = '👁️ দেখুন';
    if (forgotPwdMatchMsg) forgotPwdMatchMsg.textContent = '';
  }

  // Admin Login Submit
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredPin = (adminPinInput ? adminPinInput.value.trim() : '');
      const auth = window.pujaDB ? await window.pujaDB.getAdminAuth() : null;
      const validPin = (auth && auth.pin) ? auth.pin : (localStorage.getItem('puja_admin_pin') || '24689011');
      if (enteredPin && enteredPin === validPin) {
        sessionStorage.setItem('puja_is_admin', 'true');
        state.isAdmin = true;
        if (adminModal) adminModal.classList.remove('active');
        if (adminPinInput) adminPinInput.value = '';
        resetForgotModal();
        updateAdminUI();
        renderUpdates();
        if (window.pujaAudio) window.pujaAudio.playTempleBell();
        showToast('👑 স্বাগতম! আমফান (N.S.C.C) অ্যাডমিন হিসেবে লগইন সফল। আপনি এখন আপডেট ও ফটো ম্যানেজ করতে পারবেন।');
      } else {
        alert('❌ ভুল পাসওয়ার্ড! পাসওয়ার্ড মনে না থাকলে "পাসওয়ার্ড ভুলে গেছেন?" বাটনে ক্লিক করে সিকিউরিটি প্রশ্নের মাধ্যমে রিসেট করুন।');
      }
    });
  }

  // Open Forgot Password Screen
  if (btnGotoForgotPwd) {
    btnGotoForgotPwd.addEventListener('click', () => {
      const auth = window.pujaDB ? window.pujaDB.getAdminAuthLocal() : {};
      const cleanQ = (window.pujaDB && typeof window.pujaDB.cleanSecurityQuestion === 'function')
        ? window.pujaDB.cleanSecurityQuestion(auth.securityQuestion)
        : 'আমফান ক্লাবের গোপন সিকিউরিটি পাসফ্রেস কী?';
      if (forgotSecQuestionDisplay) {
        forgotSecQuestionDisplay.textContent = cleanQ;
      }
      if (adminLoginView) adminLoginView.style.display = 'none';
      if (adminForgotView) adminForgotView.style.display = 'block';
      if (forgotStep1) forgotStep1.style.display = 'block';
      if (forgotStep2) forgotStep2.style.display = 'none';
      if (forgotStepSuccess) forgotStepSuccess.style.display = 'none';
      if (adminModalTitle) adminModalTitle.textContent = '🔑 পাসওয়ার্ড রিসেট ও সিকিউরিটি ভেরিফিকেশন';
      if (forgotSecAnswerInput) {
        forgotSecAnswerInput.value = '';
        setTimeout(() => forgotSecAnswerInput.focus(), 150);
      }
    });
  }

  // Back to Login Screen
  if (btnBackToLogin) btnBackToLogin.addEventListener('click', resetForgotModal);
  if (btnCancelStep2) btnCancelStep2.addEventListener('click', resetForgotModal);

  // Step 1: Verify Security Answer
  function handleVerifySecurityAnswer() {
    if (!forgotSecAnswerInput) return;
    const answer = forgotSecAnswerInput.value.trim();
    if (!answer) {
      if (forgotStep1Error) {
        forgotStep1Error.textContent = '⚠️ অনুগ্রহ করে ক্লাবের সিকিউরিটি উত্তরটি লিখুন!';
        forgotStep1Error.style.display = 'block';
      }
      forgotSecAnswerInput.focus();
      return;
    }

    const isCorrect = window.pujaDB && window.pujaDB.verifySecurityAnswer(answer);
    if (!isCorrect) {
      if (forgotStep1Error) {
        forgotStep1Error.textContent = '❌ ভুল সিকিউরিটি উত্তর! সঠিক উত্তর লিখে আবার চেষ্টা করুন।';
        forgotStep1Error.style.display = 'block';
      }
      forgotSecAnswerInput.focus();
      return;
    }

    // Correct Answer: Advance to Step 2
    if (forgotStep1Error) forgotStep1Error.style.display = 'none';
    if (forgotStep1) forgotStep1.style.display = 'none';
    if (forgotStep2) forgotStep2.style.display = 'block';
    if (adminModalTitle) adminModalTitle.textContent = '🔑 নতুন পাসওয়ার্ড সেট করুন';
    if (window.pujaAudio) window.pujaAudio.playTempleBell();
    showToast('✅ সিকিউরিটি উত্তর সঠিক হয়েছে! এবার নতুন পাসওয়ার্ড সেট করুন।');
    if (forgotNewPwdInput) {
      forgotNewPwdInput.value = '';
      setTimeout(() => forgotNewPwdInput.focus(), 150);
    }
  }

  if (btnVerifySecurityAnswer) {
    btnVerifySecurityAnswer.addEventListener('click', handleVerifySecurityAnswer);
  }
  if (forgotSecAnswerInput) {
    forgotSecAnswerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleVerifySecurityAnswer();
      }
    });
  }

  // Toggle Visibility for New & Confirm Password
  if (btnToggleNewPwd && forgotNewPwdInput) {
    btnToggleNewPwd.addEventListener('click', () => {
      if (forgotNewPwdInput.type === 'password') {
        forgotNewPwdInput.type = 'text';
        btnToggleNewPwd.textContent = '🙈 লুকান';
      } else {
        forgotNewPwdInput.type = 'password';
        btnToggleNewPwd.textContent = '👁️ দেখুন';
      }
    });
  }
  if (btnToggleConfirmPwd && forgotConfirmPwdInput) {
    btnToggleConfirmPwd.addEventListener('click', () => {
      if (forgotConfirmPwdInput.type === 'password') {
        forgotConfirmPwdInput.type = 'text';
        btnToggleConfirmPwd.textContent = '🙈 লুকান';
      } else {
        forgotConfirmPwdInput.type = 'password';
        btnToggleConfirmPwd.textContent = '👁️ দেখুন';
      }
    });
  }

  // Real-time password matching check
  function checkPasswordMatch() {
    if (!forgotPwdMatchMsg || !forgotNewPwdInput || !forgotConfirmPwdInput) return;
    const p1 = forgotNewPwdInput.value;
    const p2 = forgotConfirmPwdInput.value;
    if (!p2) {
      forgotPwdMatchMsg.textContent = '';
      return;
    }
    if (p1 === p2) {
      forgotPwdMatchMsg.textContent = '✅ পাসওয়ার্ড দুটি হুবহু মিলেছে!';
      forgotPwdMatchMsg.style.color = '#2e7d32';
    } else {
      forgotPwdMatchMsg.textContent = '⚠️ পাসওয়ার্ড দুটি মিলছে না!';
      forgotPwdMatchMsg.style.color = '#b32134';
    }
  }
  if (forgotNewPwdInput) forgotNewPwdInput.addEventListener('input', checkPasswordMatch);
  if (forgotConfirmPwdInput) forgotConfirmPwdInput.addEventListener('input', checkPasswordMatch);

  // Step 2 -> Step 3: Save New Password
  if (btnSaveNewPwd) {
    btnSaveNewPwd.addEventListener('click', async () => {
      const p1 = forgotNewPwdInput ? forgotNewPwdInput.value.trim() : '';
      const p2 = forgotConfirmPwdInput ? forgotConfirmPwdInput.value.trim() : '';

      if (!p1) {
        alert('অনুগ্রহ করে নতুন পাসওয়ার্ড লিখুন!');
        if (forgotNewPwdInput) forgotNewPwdInput.focus();
        return;
      }
      if (p1.length < 4) {
        alert('পাসওয়ার্ডটি অন্তত ৪ অক্ষরের বা সংখ্যার হওয়া আবশ্যক!');
        if (forgotNewPwdInput) forgotNewPwdInput.focus();
        return;
      }
      if (p1 !== p2) {
        alert('পাসওয়ার্ড দুটি মেলেনি! অনুগ্রহ করে নিশ্চিত করুন যে দুটি পাসওয়ার্ডই এক।');
        if (forgotConfirmPwdInput) forgotConfirmPwdInput.focus();
        return;
      }

      btnSaveNewPwd.disabled = true;
      btnSaveNewPwd.textContent = '⏳ সংরক্ষণ হচ্ছে...';
      try {
        await window.pujaDB.saveAdminAuth({ pin: p1 });
        if (forgotStep2) forgotStep2.style.display = 'none';
        if (forgotStepSuccess) forgotStepSuccess.style.display = 'block';
        if (adminModalTitle) adminModalTitle.textContent = '🎉 পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে';
        if (window.pujaAudio) window.pujaAudio.playTempleBell();
        showToast('🎉 সফলভাবে পাসওয়ার্ড পরিবর্তন করা হয়েছে!');
      } catch (err) {
        console.error('Password save error:', err);
        alert('পাসওয়ার্ড সেভ করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
      } finally {
        btnSaveNewPwd.disabled = false;
        btnSaveNewPwd.textContent = '💾 নতুন পাসওয়ার্ড সংরক্ষণ করুন';
      }
    });
  }

  // Step 3 Success Screen: Direct login button
  if (btnLoginWithNewPwd) {
    btnLoginWithNewPwd.addEventListener('click', () => {
      sessionStorage.setItem('puja_is_admin', 'true');
      state.isAdmin = true;
      if (adminModal) adminModal.classList.remove('active');
      resetForgotModal();
      updateAdminUI();
      renderUpdates();
      if (window.pujaAudio) window.pujaAudio.playTempleBell();
      showToast('👑 স্বাগতম! আপনার নতুন পাসওয়ার্ড দিয়ে সফলভাবে অ্যাডমিন মোডে লগইন হয়েছে!');
    });
  }

  // Pane-Manage Security Settings Handlers
  const settingAdminPin = document.getElementById('setting-admin-pin');
  const settingSecQuestion = document.getElementById('setting-sec-question');
  const settingSecAnswer = document.getElementById('setting-sec-answer');
  const btnSaveSecSettings = document.getElementById('btn-save-security-settings');

  function populateSecuritySettingsForm() {
    if (!window.pujaDB) return;
    const auth = window.pujaDB.getAdminAuthLocal();
    if (settingAdminPin) settingAdminPin.value = auth.pin || '24689011';
    if (settingSecQuestion) settingSecQuestion.value = auth.securityQuestion || 'আমফান ক্লাবের গোপন সিকিউরিটি পাসফ্রেস কী?';
    if (settingSecAnswer) settingSecAnswer.value = auth.securityAnswer || 'I AM A GOOD BOY';
  }

  if (btnSaveSecSettings) {
    btnSaveSecSettings.addEventListener('click', async () => {
      if (!state.isAdmin) {
        showToast('🔒 এই সেটিংস পরিবর্তন শুধুমাত্র ক্লাবের অ্যাডমিনের জন্য।');
        return;
      }
      const pin = settingAdminPin ? settingAdminPin.value.trim() : '';
      const question = settingSecQuestion ? settingSecQuestion.value.trim() : '';
      const answer = settingSecAnswer ? settingSecAnswer.value.trim() : '';

      if (!pin || pin.length < 4) {
        alert('অ্যাডমিন পাসওয়ার্ড অন্তত ৪ অক্ষরের বা সংখ্যার হওয়া প্রয়োজন!');
        return;
      }
      if (!question || !answer) {
        alert('সিকিউরিটি প্রশ্ন ও উত্তর উভয়ই পূরণ করা আবশ্যক!');
        return;
      }

      btnSaveSecSettings.disabled = true;
      btnSaveSecSettings.textContent = '⏳ সংরক্ষণ হচ্ছে...';
      try {
        await window.pujaDB.saveAdminAuth({ pin, securityQuestion: question, securityAnswer: answer });
        showToast('✅ অ্যাডমিন পাসওয়ার্ড ও সিকিউরিটি সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        if (window.pujaAudio) window.pujaAudio.playTempleBell();
      } catch (err) {
        console.error('Settings save error:', err);
        showToast('⚠️ সেটিংস সংরক্ষণে সমস্যা হয়েছে।');
      } finally {
        btnSaveSecSettings.disabled = false;
        btnSaveSecSettings.textContent = '💾 সিকিউরিটি সেটিংস সংরক্ষণ করুন';
      }
    });
  }

  // ==========================================================
  // WISHES & PRANAM GUESTBOOK
  // ==========================================================
  async function loadWishes() {
    state.allWishes = await window.pujaDB.getAllWishes();
    if (statWishes) statWishes.textContent = state.allWishes.length;
    renderWishes();
  }

  function renderWishes() {
    if (!wishesWall) return;

    if (state.allWishes.length === 0) {
      wishesWall.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #888;">
          Be the first to offer wishes and pranam to Maa Lakshmi!
        </div>
      `;
      return;
    }

    wishesWall.innerHTML = state.allWishes.map(w => `
      <div class="wish-card" data-id="${w.id}">
        <p class="wish-message">"${escapeHtml(w.message)}"</p>
        <div class="wish-author-info">
          <span class="wish-name">🙏 ${escapeHtml(w.name)}</span>
          <span>${escapeHtml(w.location || '')}</span>
        </div>
        ${state.isAdmin ? `
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eedfcb; display: flex; justify-content: flex-end;">
            <button class="photo-like-btn" style="background: #fff0f0; border-color: #ffcdd2; color: #b32134; cursor: pointer; padding: 4px 10px; font-size: 0.8rem;" onclick="deleteWish('${w.id}')" title="Delete Wish (Admin Only)">
              🗑️ ডিলিট (Delete)
            </button>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // Delete wish (Strictly Admin only)
  window.deleteWish = async (wishId) => {
    if (!state.isAdmin) {
      showToast('🔒 বার্তা ডিলিট করার অধিকার শুধুমাত্র ক্লাবের অ্যাডমিনের রয়েছে।');
      return;
    }
    if (confirm('আপনি কি এই শুভেচ্ছা বার্তাটি মুছে ফেলতে চান? (Delete this wish?)')) {
      await window.pujaDB.deleteWish(wishId);
      await loadWishes();
      showToast('🗑️ শুভেচ্ছা বার্তা সফলভাবে মুছে ফেলা হয়েছে।');
    }
  };

  const wishForm = document.getElementById('wish-form');
  if (wishForm) {
    wishForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('wish-name-input').value.trim();
      const location = document.getElementById('wish-location-input').value.trim();
      const message = document.getElementById('wish-message-input').value.trim();

      if (!name || !message) return;

      const newWish = {
        name,
        location,
        message,
        timestamp: new Date().toISOString()
      };

      await window.pujaDB.saveWish(newWish);
      wishForm.reset();
      await loadWishes();
      window.pujaAudio.playFlowerChime();
      triggerPetalShower(25);
      showToast('🌸 Your blessings and pranam wish have been placed on the board!');
    });
  }

  // ==========================================================
  // BACKUP, EXPORT & IMPORT DATA
  // ==========================================================
  const btnExportData = document.getElementById('btn-export-data');
  const btnImportData = document.getElementById('btn-import-data');
  const importFileInput = document.getElementById('import-file-input');
  const btnResetData = document.getElementById('btn-reset-data');

  if (btnExportData) {
    btnExportData.addEventListener('click', async () => {
      const jsonBackup = await window.pujaDB.exportFullBackup();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LaxmiPuja_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 Database backup exported successfully!');
    });
  }

  if (btnImportData && importFileInput) {
    btnImportData.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            await window.pujaDB.importFullBackup(event.target.result);
            await loadPhotos();
            await loadUpdates();
            await loadWishes();
            showToast('✅ Backup imported successfully! All photos and updates restored.');
          } catch (err) {
            alert('Failed to import backup: ' + err.message);
          }
        };
        reader.readAsText(file);
      }
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener('click', async () => {
      if (confirm('Reset to original festive demo photos and schedule? Custom uploads will be replaced.')) {
        indexedDB.deleteDatabase('LaxmiPujaDB');
        location.reload();
      }
    });
  }

  // ==========================================================
  // FIREBASE CLOUD REAL-TIME SYNC & CONTROLS
  // ==========================================================
  const firebaseStatusPill = document.getElementById('firebase-status-pill');
  const firebaseStatusText = document.getElementById('firebase-status-text');
  const firebaseStatusDot = document.getElementById('firebase-status-dot');
  const firebaseModal = document.getElementById('firebase-modal');
  const btnCloseFirebaseModal = document.getElementById('btn-close-firebase-modal');
  const btnOpenFirebaseModal = document.getElementById('btn-open-firebase-modal');
  const btnFirebaseQuickParse = document.getElementById('btn-firebase-quick-parse');
  const btnFirebaseTest = document.getElementById('btn-firebase-test');
  const btnFirebaseSave = document.getElementById('btn-firebase-save');
  const btnFirebaseDisconnect = document.getElementById('btn-firebase-disconnect');
  const btnFirebaseSyncLocal = document.getElementById('btn-firebase-sync-local');
  const firebaseTestStatus = document.getElementById('firebase-test-status');

  function updateFirebaseUIStatus() {
    if (firebaseStatusPill) {
      firebaseStatusPill.style.display = state.isAdmin ? 'inline-flex' : 'none';
    }
    if (window.firebaseService && window.firebaseService.isReady) {
      const projId = window.firebaseService.config.projectId || 'Connected';
      if (firebaseStatusText) firebaseStatusText.textContent = `🟢 Firebase Cloud: ${projId}`;
      if (firebaseStatusDot) firebaseStatusDot.style.background = '#4caf50';
      if (btnFirebaseDisconnect) btnFirebaseDisconnect.style.display = 'inline-flex';
      if (btnFirebaseSyncLocal) btnFirebaseSyncLocal.style.display = 'inline-flex';
    } else {
      if (firebaseStatusText) firebaseStatusText.textContent = `🟡 Local Mode (Click to Connect Firebase)`;
      if (firebaseStatusDot) firebaseStatusDot.style.background = '#ffc107';
      if (btnFirebaseDisconnect) btnFirebaseDisconnect.style.display = 'none';
      if (btnFirebaseSyncLocal) btnFirebaseSyncLocal.style.display = 'none';
    }
  }

  function setupFirebaseRealtimeListeners() {
    if (!window.firebaseService || !window.firebaseService.isReady) return;

    window.firebaseService.onPhotosChanged((photos) => {
      console.log('Firebase: Real-time photos update received (' + photos.length + ' photos)');
      state.allPhotos = photos;
      if (statPhotos) statPhotos.textContent = photos.length;
      renderPhotos();
    });

    window.firebaseService.onUpdatesChanged((updates) => {
      console.log('Firebase: Real-time updates update received (' + updates.length + ' updates)');
      state.allUpdates = updates;
      if (statUpdates) statUpdates.textContent = updates.length;
      renderUpdates();
    });

    window.firebaseService.onWishesChanged((wishes) => {
      state.allWishes = wishes;
      if (statWishes) statWishes.textContent = wishes.length;
      renderWishes();
    });

    window.firebaseService.onCounterChanged('diyas_lit', (count) => {
      state.diyasLit = count;
      if (statDiyas) statDiyas.textContent = count;
      const btnDiya = document.getElementById('btn-light-diya');
      if (btnDiya) btnDiya.innerHTML = `✨ Diya Lit for Maa (${count})`;
    });

    window.firebaseService.onDeityPhotoChanged((photoUrl) => {
      console.log('Firebase: Real-time deity photo received');
      if (photoUrl && deityMainImg) {
        deityMainImg.src = photoUrl;
        localStorage.setItem('puja_deity_photo', photoUrl);
      } else if (!photoUrl && deityMainImg) {
        deityMainImg.src = DEFAULT_DEITY_URL;
        localStorage.removeItem('puja_deity_photo');
      }
    });

    window.firebaseService.onCommitteeMembersChanged((members) => {
      console.log('Firebase: Real-time committee members received:', members.length);
      state.committeeMembers = members;
      renderCommittee();
      try {
        localStorage.setItem('amfan_committee_members', JSON.stringify(members));
      } catch (e) {}
    });

    if (window.firebaseService.onAdminAuthChanged) {
      window.firebaseService.onAdminAuthChanged((authData) => {
        if (authData && authData.pin) {
          const localUpdated = localStorage.getItem('puja_admin_pin_updated') || '';
          const cloudUpdated = authData.updatedAt || '';
          if (!localStorage.getItem('puja_admin_pin') || !localUpdated || (cloudUpdated && cloudUpdated >= localUpdated)) {
            const cleanQ = (window.pujaDB && typeof window.pujaDB.cleanSecurityQuestion === 'function')
              ? window.pujaDB.cleanSecurityQuestion(authData.securityQuestion)
              : 'আমফান ক্লাবের গোপন সিকিউরিটি পাসফ্রেস কী?';
            localStorage.setItem('puja_security_question', cleanQ);
            if (authData.securityAnswer) localStorage.setItem('puja_security_answer', authData.securityAnswer);
            if (cloudUpdated) localStorage.setItem('puja_admin_pin_updated', cloudUpdated);
            console.log('Firebase: Real-time admin auth updated');
            const setPin = document.getElementById('setting-admin-pin');
            const setQ = document.getElementById('setting-sec-question');
            const setA = document.getElementById('setting-sec-answer');
            if (setPin) setPin.value = authData.pin;
            if (setQ) setQ.value = cleanQ;
            if (setA && authData.securityAnswer) setA.value = authData.securityAnswer;
            if (forgotSecQuestionDisplay) forgotSecQuestionDisplay.textContent = cleanQ;
          }
        }
      });
    }

    if (window.firebaseService.onDonationsChanged) {
      window.firebaseService.onDonationsChanged((donations) => {
        console.log('Firebase: Real-time donations received:', donations.length);
        if (typeof setDonationsList === 'function') {
          setDonationsList(donations);
        } else {
          allDonationsList = donations;
        }
        if (typeof renderDonationsWall === 'function') renderDonationsWall();
        if (state.isAdmin && typeof renderDonationsAdmin === 'function') renderDonationsAdmin();
        try {
          localStorage.setItem('amfan_puja_donations', JSON.stringify(allDonationsList));
        } catch (e) {}
      });
    }

    if (window.firebaseService.onPaymentConfigChanged) {
      window.firebaseService.onPaymentConfigChanged((cfg) => {
        if (cfg) {
          activePaymentConfig = { ...activePaymentConfig, ...cfg };
          if (typeof updatePaymentUIFromConfig === 'function') updatePaymentUIFromConfig();
          try {
            localStorage.setItem('amfan_payment_config', JSON.stringify(activePaymentConfig));
          } catch (e) {}
        }
      });
    }
  }

  // Open/Close Firebase Modal
  const openFbModal = () => {
    if (firebaseModal) {
      firebaseModal.classList.add('active');
      // Populate fields if config exists
      const cfg = (window.firebaseService && window.firebaseService.config) || window.FIREBASE_CONFIG || {};
      if (cfg.apiKey) document.getElementById('fb-api-key').value = cfg.apiKey;
      if (cfg.projectId) document.getElementById('fb-project-id').value = cfg.projectId;
      if (cfg.authDomain) document.getElementById('fb-auth-domain').value = cfg.authDomain;
      if (cfg.storageBucket) document.getElementById('fb-storage-bucket').value = cfg.storageBucket;
      if (cfg.messagingSenderId) document.getElementById('fb-messaging-id').value = cfg.messagingSenderId;
      if (cfg.appId) document.getElementById('fb-app-id').value = cfg.appId;
    }
  };

  if (firebaseStatusPill) firebaseStatusPill.addEventListener('click', openFbModal);
  if (btnOpenFirebaseModal) btnOpenFirebaseModal.addEventListener('click', openFbModal);
  if (btnCloseFirebaseModal) {
    btnCloseFirebaseModal.addEventListener('click', () => {
      firebaseModal.classList.remove('active');
    });
  }

  // Quick Parse Firebase Code Snippet
  if (btnFirebaseQuickParse) {
    btnFirebaseQuickParse.addEventListener('click', () => {
      const snippet = document.getElementById('fb-raw-snippet').value;
      if (!snippet.trim()) {
        alert('Please paste your Firebase config snippet first.');
        return;
      }

      const extract = (key) => {
        const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`, 'i');
        const match = snippet.match(regex);
        return match ? match[1] : '';
      };

      const apiKey = extract('apiKey');
      const projectId = extract('projectId');
      const authDomain = extract('authDomain');
      const storageBucket = extract('storageBucket');
      const messagingSenderId = extract('messagingSenderId');
      const appId = extract('appId');

      if (apiKey) document.getElementById('fb-api-key').value = apiKey;
      if (projectId) document.getElementById('fb-project-id').value = projectId;
      if (authDomain) document.getElementById('fb-auth-domain').value = authDomain;
      if (storageBucket) document.getElementById('fb-storage-bucket').value = storageBucket;
      if (messagingSenderId) document.getElementById('fb-messaging-id').value = messagingSenderId;
      if (appId) document.getElementById('fb-app-id').value = appId;

      if (apiKey && projectId) {
        showToast('✨ Firebase keys parsed and extracted successfully!');
      } else {
        alert('Could not find apiKey or projectId. Please check the snippet format or fill fields manually.');
      }
    });
  }

  // Test Firebase Connection
  function getEnteredFirebaseConfig() {
    return {
      apiKey: document.getElementById('fb-api-key').value.trim(),
      projectId: document.getElementById('fb-project-id').value.trim(),
      authDomain: document.getElementById('fb-auth-domain').value.trim() || `${document.getElementById('fb-project-id').value.trim()}.firebaseapp.com`,
      storageBucket: document.getElementById('fb-storage-bucket').value.trim() || `${document.getElementById('fb-project-id').value.trim()}.appspot.com`,
      messagingSenderId: document.getElementById('fb-messaging-id').value.trim(),
      appId: document.getElementById('fb-app-id').value.trim()
    };
  }

  if (btnFirebaseTest) {
    btnFirebaseTest.addEventListener('click', async () => {
      const config = getEnteredFirebaseConfig();
      if (!config.apiKey || !config.projectId) {
        alert('Please provide at least API Key and Project ID to test connection.');
        return;
      }

      firebaseTestStatus.style.display = 'block';
      firebaseTestStatus.style.background = '#fff8e1';
      firebaseTestStatus.style.color = '#7a4603';
      firebaseTestStatus.innerHTML = '⏳ Testing connection to Firebase Cloud Firestore from localhost...';

      try {
        await window.firebaseService.testConnection(config);
        firebaseTestStatus.style.background = '#e8f5e9';
        firebaseTestStatus.style.color = '#2e7d32';
        firebaseTestStatus.innerHTML = `✅ <strong>Success!</strong> Connected to Firestore project "<strong>${config.projectId}</strong>". Read & write operations verified!`;
      } catch (err) {
        console.error('Firebase test error:', err);
        firebaseTestStatus.style.background = '#ffebee';
        firebaseTestStatus.style.color = '#c62828';
        firebaseTestStatus.innerHTML = `❌ <strong>Connection Error:</strong> ${err.message}<br><small>Tip: In Firebase Console &rarr; Firestore Database &rarr; Rules, make sure rules allow read/write: <code>allow read, write: if true;</code></small>`;
      }
    });
  }

  // Save & Connect to Firebase
  if (btnFirebaseSave) {
    btnFirebaseSave.addEventListener('click', async () => {
      const config = getEnteredFirebaseConfig();
      if (!config.apiKey || !config.projectId) {
        alert('Please enter at least API Key and Project ID.');
        return;
      }

      window.firebaseService.saveConfig(config);
      const connected = await window.firebaseService.init();

      if (connected) {
        updateFirebaseUIStatus();
        setupFirebaseRealtimeListeners();
        firebaseModal.classList.remove('active');
        await loadPhotos();
        await loadUpdates();
        await loadWishes();
        window.pujaAudio.playTempleBell();
        showToast(`🎉 Connected to Firebase Project "${config.projectId}"! Real-time public sync is now active.`);
      } else {
        alert('Could not initialize Firebase with these credentials. Please test connection first.');
      }
    });
  }

  // Disconnect Firebase
  if (btnFirebaseDisconnect) {
    btnFirebaseDisconnect.addEventListener('click', () => {
      if (confirm('Disconnect from Firebase and switch back to local IndexedDB mode?')) {
        window.firebaseService.clearConfig();
        location.reload();
      }
    });
  }

  // Sync Local Data to Firebase
  if (btnFirebaseSyncLocal) {
    btnFirebaseSyncLocal.addEventListener('click', async () => {
      if (!window.firebaseService.isReady) {
        alert('Please connect Firebase first.');
        return;
      }

      if (confirm('Upload all current local photos, updates, and wishes to your live Firebase Cloud database?')) {
        try {
          const res = await window.firebaseService.syncLocalDataToCloud(state.allPhotos, state.allUpdates, state.allWishes);
          showToast(`☁️ Uploaded ${res.pCount} photos, ${res.uCount} updates, and ${res.wCount} wishes to Firebase!`);
        } catch (e) {
          alert('Sync failed: ' + e.message);
        }
      }
    });
  }

  // ==========================================================
  // DIGITAL BLESSING CARD / ASHIRBAD PATRA (For Everyone)
  // ==========================================================
  // ==========================================================
  // DIGITAL BLESSING CARD / ASHIRBAD PATRA (For Everyone)
  // ==========================================================
  function initBlessingCard() {
    const modal = document.getElementById('blessing-modal');
    const btnOpenAltar = document.getElementById('btn-open-blessing-modal');
    const btnOpenHero = document.getElementById('btn-hero-blessing');
    const btnClose = document.getElementById('btn-close-blessing-modal');
    const titleSelect = document.getElementById('blessing-title-select');
    const nameInput = document.getElementById('blessing-name-input');
    const placeInput = document.getElementById('blessing-place-input');
    const wishSelect = document.getElementById('blessing-wish-type');
    const canvas = document.getElementById('blessing-canvas');
    const btnDownload = document.getElementById('btn-download-blessing');
    const btnWhatsApp = document.getElementById('btn-share-blessing-whatsapp');
    const deityMainImg = document.getElementById('deity-main-img');
    const btnTranslitName = document.getElementById('btn-transliterate-name');
    const btnTranslitPlace = document.getElementById('btn-transliterate-place');

    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Built-in English to Bangla Transliteration Engine for Mobile Users
    function transliterateToBangla(text) {
      if (!text) return '';
      const wordDict = {
        'sudipto': 'সুদীপ্ত', 'sudipta': 'সুদীপ্ত', 'maity': 'মাইতি', 'maiti': 'মাইতি',
        'mondal': 'মণ্ডল', 'mandal': 'মণ্ডল', 'das': 'দাস', 'dash': 'দাস',
        'ghosh': 'ঘোষ', 'hazra': 'হাজরা', 'jana': 'জানা', 'bera': 'বেড়া',
        'samanta': 'সামন্ত', 'sau': 'সাউ', 'sahu': 'সাউ', 'sahoo': 'সাউ',
        'pradhan': 'প্রধান', 'karan': 'করণ', 'adak': 'আদক', 'dey': 'দে',
        'dutta': 'দত্ত', 'pal': 'পাল', 'paul': 'পাল', 'roy': 'রায়',
        'ray': 'রায়', 'sen': 'সেন', 'bhattacharya': 'ভট্টাচার্য', 'banerjee': 'ব্যানার্জী',
        'chatterjee': 'চট্টোপাধ্যায়', 'chakraborty': 'চক্রবর্তী', 'mukherjee': 'মুখার্জী',
        'kundu': 'কুন্ডু', 'patra': 'পাত্র', 'manna': 'মান্না', 'khatua': 'খাটুয়া',
        'panja': 'পাঁজা', 'khan': 'খান', 'malik': 'মালিক', 'poribar': 'পরিবার',
        'paribar': 'পরিবার', 'bhaktobrindo': 'ভক্তবৃন্দ', 'bhakto': 'ভক্ত',
        'rahul': 'রাহুল', 'amit': 'অমিত', 'subir': 'সুবীর', 'sourav': 'সৌরভ',
        'ananya': 'অনন্যা', 'priya': 'প্রিয়া', 'puja': 'পূজা', 'rohit': 'রোহিত',
        'raju': 'রাজু', 'raj': 'রাজু', 'somnath': 'সোমনাথ', 'debashis': 'দেবাশীষ',
        'biswajit': 'বিশ্বজিৎ', 'animesh': 'অনিমেষ', 'manas': 'মানস', 'tapas': 'তাপস',
        'swapan': 'স্বপন', 'prabir': 'প্রবীর', 'alok': 'আলোক', 'arun': 'অরুণ',
        'bikash': 'বিকাশ', 'chandan': 'চন্দন', 'dipak': 'দীপক', 'gouranga': 'গৌরাঙ্গ',
        'kalyan': 'কল্যাণ', 'narayan': 'নারায়ণ', 'prasanta': 'প্রশান্ত', 'ratan': 'রতন',
        'sanjay': 'সঞ্জয়', 'tarun': 'তরুণ', 'uttam': 'উত্তম', 'subrata': 'সুব্রত',
        'subhas': 'সুভাষ', 'sujit': 'সুজিত', 'sunil': 'সুনীল', 'shyamal': 'শ্যামল',
        'sankar': 'শংকর', 'shankar': 'শংকর', 'ram': 'রাম', 'krishna': 'কৃষ্ণ',
        'gopal': 'গোপাল', 'haradhan': 'হরাধন', 'nimai': 'নিমাই', 'nitai': 'নিতাই',
        'bimal': 'বিমল', 'anup': 'অনুপ', 'ashok': 'অশোক', 'ajoy': 'অজয়',
        'joy': 'জয়', 'mantu': 'মন্টু', 'babu': 'বাবু', 'da': 'দা', 'didi': 'দিদি',
        'kakima': 'কাকীমা', 'kaku': 'কাকু', 'jethu': 'জেঠু', 'mashima': 'মাসিমা',
        'pishima': 'পিসিমা', 'anita': 'অনিতা', 'anima': 'অনিমা', 'uma': 'উমা',
        'naikundi': 'নাইকুন্ডি', 'nandakumar': 'নন্দকুমার', 'nandokumar': 'নন্দকুমার',
        'kumarara': 'কুমোরআড়া', 'kumorara': 'কুমোরআড়া', 'purba': 'পূর্ব',
        'medinipur': 'মেদিনীপুর', 'kolkata': 'কলকাতা', 'tamluk': 'তমলুক',
        'haldia': 'হলদিয়া', 'howrah': 'হাওড়া', 'shitalamata': 'শীতলামাতা',
        'mandir': 'মন্দির', 'prangan': 'প্রাঙ্গণ', 'sri': 'শ্রী', 'sree': 'শ্রী',
        'srimati': 'শ্রীমতী', 'shrimati': 'শ্রীমতী', 'kumari': 'কুমারী'
      };

      const vowels = {
        'aa': 'া', 'a': 'া', 'ii': 'ী', 'ee': 'ী', 'i': 'ি',
        'uu': 'ূ', 'oo': 'ূ', 'u': 'ু', 'oi': 'ৈ', 'ai': 'ৈ',
        'ou': 'ৌ', 'au': 'ৌ', 'e': 'ে', 'o': 'ো', 'ri': 'ৃ'
      };
      const initVowels = {
        'aa': 'আ', 'a': 'অ', 'ii': 'ঈ', 'ee': 'ঈ', 'i': 'ই',
        'uu': 'ঊ', 'oo': 'ঊ', 'u': 'উ', 'oi': 'ঐ', 'ai': 'ঐ',
        'ou': 'ঔ', 'au': 'ঔ', 'e': 'এ', 'o': 'ও', 'ri': 'ঋ'
      };
      const consonants = [
        ['kkh', 'ক্ষ'], ['chh', 'ছ'], ['ng', 'ঙ'], ['kh', 'খ'], ['gh', 'ঘ'],
        ['ch', 'চ'], ['jh', 'ঝ'], ['th', 'থ'], ['dh', 'ধ'], ['ph', 'ফ'],
        ['bh', 'ভ'], ['sh', 'শ'], ['k', 'ক'], ['g', 'গ'], ['j', 'জ'],
        ['t', 'ট'], ['d', 'দ'], ['n', 'ন'], ['p', 'প'], ['f', 'ফ'],
        ['b', 'ব'], ['v', 'ভ'], ['m', 'ম'], ['r', 'র'], ['l', 'ল'],
        ['s', 'স'], ['h', 'হ'], ['y', 'য়'], ['z', 'য'], ['w', 'ওয়']
      ];

      return text.split(/(\s+|[,\.!\?&]+)/).map(token => {
        if (!token || /^\s+$/.test(token) || /^[,\.!\?&]+$/.test(token)) {
          return token;
        }
        const lower = token.toLowerCase();
        if (wordDict[lower]) return wordDict[lower];

        // Rule-based phonetic converter
        let res = '';
        let i = 0;
        let isStart = true;
        while (i < lower.length) {
          let matchedConsonant = null;
          let consLen = 0;
          for (const [seq, char] of consonants) {
            if (lower.startsWith(seq, i)) {
              matchedConsonant = char;
              consLen = seq.length;
              break;
            }
          }

          if (matchedConsonant) {
            res += matchedConsonant;
            i += consLen;
            isStart = false;

            let matchedVowel = null;
            let vowLen = 0;
            for (const [seq, sign] of Object.entries(vowels)) {
              if (lower.startsWith(seq, i)) {
                matchedVowel = sign;
                vowLen = seq.length;
                break;
              }
            }
            if (matchedVowel) {
              if (lower.startsWith('a', i) && !lower.startsWith('aa', i)) {
                res += 'া';
              } else {
                res += matchedVowel;
              }
              i += vowLen;
            }
          } else {
            let matchedInit = null;
            let vowLen = 0;
            for (const [seq, char] of Object.entries(initVowels)) {
              if (lower.startsWith(seq, i)) {
                matchedInit = char;
                vowLen = seq.length;
                break;
              }
            }
            if (matchedInit) {
              res += isStart ? matchedInit : (vowels[lower.substr(i, vowLen)] || matchedInit);
              i += vowLen;
            } else {
              res += lower[i];
              i++;
            }
            isStart = false;
          }
        }
        return res || token;
      }).join('');
    }

    function getFormattedDevoteeName() {
      const rawName = (nameInput?.value.trim()) || '';
      if (!rawName) return '';
      const title = titleSelect?.value || 'শ্রী';
      if (title === 'none') {
        return rawName;
      } else if (title === 'পরিবার') {
        return rawName.includes('পরিবার') ? rawName : `${rawName} ও পরিবার`;
      } else {
        return rawName.startsWith(title) ? rawName : `${title} ${rawName}`;
      }
    }

    function drawCard(options = {}) {
      const displayName = getFormattedDevoteeName();
      const place = (placeInput?.value.trim()) || '';
      const wish = wishSelect?.value || 'পারিবারিক সুখ, শান্তি ও সর্বাঙ্গীন সমৃদ্ধি';

      const w = canvas.width;
      const h = canvas.height;

      // 1. Background Parchment
      const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, 450);
      grad.addColorStop(0, '#fffef8');
      grad.addColorStop(0.7, '#fef6e4');
      grad.addColorStop(1, '#f5e0be');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Ornate Festive Borders
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#5c0712'; // Deep auspicious vermilion
      ctx.strokeRect(7, 7, w - 14, h - 14);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd700'; // Radiant gold
      ctx.strokeRect(20, 20, w - 40, h - 40);

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#b37e19'; // Antique gold
      ctx.strokeRect(25, 25, w - 50, h - 50);

      // Corner Ornaments
      const drawCorner = (x, y, dx, dy) => {
        ctx.fillStyle = '#b37e19';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + dx * 8, y);
        ctx.lineTo(x + dx * 26, y);
        ctx.moveTo(x, y + dy * 8);
        ctx.lineTo(x, y + dy * 26);
        ctx.stroke();
      };
      drawCorner(32, 32, 1, 1);
      drawCorner(w - 32, 32, -1, 1);
      drawCorner(32, h - 32, 1, -1);
      drawCorner(w - 32, h - 32, -1, -1);

      // 3. Top Festive Header (Pure Kojagari Lakshmi Puja)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6b0814';
      ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
      ctx.fillText('🪔 শ্রী শ্রী কোজাগরী লক্ষ্মী পূজা ও বার্ষিক ক্রীড়া-সাংস্কৃতিক অনুষ্ঠান 🪔', w / 2, 52);

      ctx.fillStyle = '#b37e19';
      ctx.font = 'bold 13px "Hind Siliguri", sans-serif';
      ctx.fillText('আমফান (এন.এস.সি.সি) সার্বজনীন কোজাগরী লক্ষ্মী পূজা ২০২৬', w / 2, 73);

      // Gold divider line under header
      ctx.strokeStyle = 'rgba(179, 126, 25, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(38, 83);
      ctx.lineTo(w - 38, 83);
      ctx.stroke();

      // ========================================================
      // 4. LEFT SIDE: Virtual Darshan Deity Photo Frame
      // ========================================================
      const fx = 42, fy = 96, fw = 205, fh = 320;

      // Dark temple frame background
      ctx.save();
      ctx.fillStyle = '#260408';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(fx, fy, fw, fh, 12);
      } else {
        ctx.rect(fx, fy, fw, fh);
      }
      ctx.fill();
      ctx.restore();

      // Draw Altar Deity Image
      let imageDrawn = false;
      const deityImg = deityMainImg;

      if (!options?.skipExternalImg && deityImg && deityImg.complete && deityImg.naturalWidth > 0) {
        try {
          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(fx + 4, fy + 4, fw - 8, fh - 36, 10);
          } else {
            ctx.rect(fx + 4, fy + 4, fw - 8, fh - 36);
          }
          ctx.clip();

          // Object-fit: cover calculation
          const iw = deityImg.naturalWidth || deityImg.width;
          const ih = deityImg.naturalHeight || deityImg.height;
          const destW = fw - 8;
          const destH = fh - 36;
          const imgRatio = iw / ih;
          const targetRatio = destW / destH;
          let sx, sy, sWidth, sHeight;

          if (imgRatio > targetRatio) {
            sHeight = ih;
            sWidth = ih * targetRatio;
            sx = (iw - sWidth) / 2;
            sy = 0;
          } else {
            sWidth = iw;
            sHeight = iw / targetRatio;
            sx = 0;
            sy = (ih - sHeight) / 2;
          }

          ctx.drawImage(deityImg, sx, sy, sWidth, sHeight, fx + 4, fy + 4, destW, destH);
          ctx.restore();
          imageDrawn = true;
        } catch (err) {
          console.warn('Deity image draw skipped:', err);
          imageDrawn = false;
        }
      }

      // Decorative fallback if image still loading
      if (!imageDrawn) {
        ctx.save();
        ctx.fillStyle = '#4a0810';
        ctx.fillRect(fx + 4, fy + 4, fw - 8, fh - 36);
        ctx.fillStyle = '#ffd700';
        ctx.font = '50px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌺', fx + fw / 2, fy + fh / 2 - 15);
        ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
        ctx.fillText('মা লক্ষ্মী', fx + fw / 2, fy + fh / 2 + 25);
        ctx.restore();
      }

      // Golden ornate frame borders
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#ffd700';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(fx, fy, fw, fh, 12);
      } else {
        ctx.rect(fx, fy, fw, fh);
      }
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#b37e19';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(fx + 3, fy + 3, fw - 6, fh - 6, 10);
      } else {
        ctx.rect(fx + 3, fy + 3, fw - 6, fh - 6);
      }
      ctx.stroke();
      ctx.restore();

      // Golden arch banner under deity photo
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(fx + 8, fy + fh - 30, fw - 16, 24, 6);
      } else {
        ctx.rect(fx + 8, fy + fh - 30, fw - 16, 24);
      }
      ctx.fill();
      ctx.strokeStyle = '#5c0712';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#3a0208';
      ctx.font = 'bold 12.5px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌸 শ্রী শ্রী প্রতিমা দর্শন 🌸', fx + fw / 2, fy + fh - 14);

      // ========================================================
      // 5. RIGHT SIDE: Blessing Certificate Details
      // ========================================================
      const rx = 265;
      const rw = w - rx - 35; // ~500px wide
      const cx = rx + rw / 2; // ~515

      // Ribbon / Certificate Badge
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      const badgeW = 220, badgeH = 28, badgeX = cx - badgeW / 2, badgeY = 96;
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();
      ctx.strokeStyle = '#b37e19';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#3a0208';
      ctx.font = 'bold 14.5px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ পুণ্য আশীর্বাদপত্র ★', cx, badgeY + 19);

      // Dedication greeting
      ctx.fillStyle = '#5c0712';
      ctx.font = '13.5px "Hind Siliguri", sans-serif';
      ctx.fillText('মা লক্ষ্মীর পরম কৃপা ও শুভাশিস জ্ঞাপন করা হচ্ছে:', cx, 148);

      // Recipient Name (with Sri / Srimati)
      if (displayName) {
        ctx.fillStyle = '#8b1320';
        ctx.font = 'bold 23px "Hind Siliguri", serif';
        ctx.fillText(displayName, cx, 180);
      } else {
        // Blank line when not typed yet (faka)
        ctx.strokeStyle = 'rgba(139, 19, 32, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 130, 185);
        ctx.lineTo(cx + 130, 185);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#a87a82';
        ctx.font = 'italic 13.5px "Hind Siliguri", sans-serif';
        ctx.fillText('(এখানে আপনার নাম দেখা যাবে)', cx, 178);
      }

      // Place (Only shown if filled by user)
      if (place) {
        ctx.fillStyle = '#666666';
        ctx.font = '12.5px "Hind Siliguri", sans-serif';
        ctx.fillText(`(${place})`, cx, 202);
      }

      // Prayer / Wish
      ctx.fillStyle = '#b37e19';
      ctx.font = 'bold 13px "Hind Siliguri", sans-serif';
      ctx.fillText('মা লক্ষ্মীর আশীর্বাদ প্রার্থনা:', cx, 228);

      ctx.fillStyle = '#9c1425';
      ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
      ctx.fillText(`“${wish}”`, cx, 248);

      // Sacred Shloka Box
      const bx = rx + 15, by = 266, bw = rw - 30, bh = 76;
      ctx.fillStyle = 'rgba(139, 19, 32, 0.04)';
      ctx.strokeStyle = 'rgba(179, 126, 25, 0.35)';
      ctx.lineWidth = 1;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#4a0b12';
      ctx.font = 'italic bold 13.5px "Hind Siliguri", serif';
      ctx.fillText('“ওঁ শ্রীং হ্রীং ক্লীং মহালক্ষ্ম্যৈ নমঃ”', cx, by + 23);

      ctx.fillStyle = '#6b0814';
      ctx.font = 'italic 12px "Hind Siliguri", serif';
      ctx.fillText('“ধনং ধান্যং পশূন্ বহুন্ পুত্রলাভং তথা পরম্।”', cx, by + 45);
      ctx.fillText('“মা লক্ষ্মী ত্বং মে দেহি সৌভাগ্যং দেহি মে সদা॥”', cx, by + 63);

      // Mandap Venue & Dates
      ctx.fillStyle = '#555555';
      ctx.font = '11.5px "Hind Siliguri", sans-serif';
      ctx.fillText('📍 নাইকুন্ডি শীতলামাতা মন্দির প্রাঙ্গণ, কুমোরআড়া, নন্দকুমার, পূর্ব মেদিনীপুর', cx, 364);

      ctx.fillStyle = '#7a1b24';
      ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
      ctx.fillText('📅 পুণ্য তিথি: ১৪, ১৫ ও ১৬ কার্তিক, ১৪৩৩ (১, ২ ও ৩ নভেম্বর, ২০২৬)', cx, 384);

      // Signatures / Authorities on Certificate
      ctx.textAlign = 'left';
      ctx.fillStyle = '#5c0712';
      ctx.font = 'bold 11.5px "Hind Siliguri", sans-serif';
      ctx.fillText('✍️ সভাপতি ও সম্পাদক', rx + 25, 414);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#5c0712';
      ctx.font = 'bold 11.5px "Hind Siliguri", sans-serif';
      ctx.fillText('📜 পূজা পরিচালনা কমিটি', w - 48, 414);

      // Bottom Gold Seal
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, 412, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#b37e19';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#3a0208';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🪔', cx, 417);
      ctx.restore();

      // ========================================================
      // 6. BOTTOM BAR (Club portal seal)
      // ========================================================
      ctx.strokeStyle = 'rgba(179, 126, 25, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(38, 436);
      ctx.lineTo(w - 38, 436);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#b37e19';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('✨ AMFAN (N.S.C.C) KOJAGARI LAKSHMI PUJA FESTIVE BLESSING PORTAL • NAIKUNDI ✨', w / 2, 458);

      ctx.fillStyle = '#777777';
      ctx.font = '10.5px "Hind Siliguri", sans-serif';
      ctx.fillText('আমফান (N.S.C.C) ক্লাবের সকল কর্মকর্তা ও সদস্যবৃন্দের পক্ষ থেকে আন্তরিক প্রীতি ও শুভেচ্ছা', w / 2, 478);
    }

    function openModal() {
      if (modal) {
        modal.classList.add('active');
        setTimeout(() => drawCard(), 80);
      }
    }

    if (btnOpenAltar) btnOpenAltar.addEventListener('click', openModal);
    if (btnOpenHero) btnOpenHero.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', () => modal && modal.classList.remove('active'));

    if (titleSelect) titleSelect.addEventListener('change', () => drawCard());
    if (nameInput) nameInput.addEventListener('input', () => drawCard());
    if (placeInput) placeInput.addEventListener('input', () => drawCard());
    if (wishSelect) wishSelect.addEventListener('change', () => drawCard());

    // Connect Transliteration Buttons
    if (btnTranslitName && nameInput) {
      btnTranslitName.addEventListener('click', () => {
        const current = nameInput.value.trim();
        if (current) {
          nameInput.value = transliterateToBangla(current);
          drawCard();
          showToast('✨ নামটি সফলভাবে বাংলায় রূপান্তর করা হয়েছে!');
        } else {
          showToast('⚠️ অনুগ্রহ করে প্রথমে নাম লিখুন!');
        }
      });
    }

    if (btnTranslitPlace && placeInput) {
      btnTranslitPlace.addEventListener('click', () => {
        const current = placeInput.value.trim();
        if (current) {
          placeInput.value = transliterateToBangla(current);
          drawCard();
          showToast('✨ স্থানটি সফলভাবে বাংলায় রূপান্তর করা হয়েছে!');
        } else {
          showToast('⚠️ অনুগ্রহ করে প্রথমে স্থান লিখুন!');
        }
      });
    }

    // Connect Quick Chips for Name & Place
    document.querySelectorAll('.quick-chip-btn[data-append-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-append-name');
        if (nameInput) {
          if (!nameInput.value.includes(text.trim())) {
            nameInput.value = (nameInput.value.trim() + text).trim();
          }
          drawCard();
        }
      });
    });

    document.querySelectorAll('.quick-chip-btn[data-set-place]').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-set-place');
        if (placeInput) {
          placeInput.value = text;
          drawCard();
        }
      });
    });

    if (deityMainImg) {
      deityMainImg.addEventListener('load', () => {
        if (modal && modal.classList.contains('active')) {
          drawCard();
        }
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const raw = (nameInput?.value.trim()) || '';
        if (!raw) {
          showToast('⚠️ অনুগ্রহ করে প্রথমে আপনার বা পরিবারের নাম লিখুন!');
          if (nameInput) nameInput.focus();
          return;
        }
        const cleanName = (getFormattedDevoteeName() || 'Devotee').replace(/[\s\/\\]+/g, '_');
        try {
          const link = document.createElement('a');
          link.download = `Amfan_Lakshmi_Puja_Ashirbad_${cleanName}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('📥 আপনার ডিজিটাল আশীর্বাদপত্রটি সফলভাবে ডাউনলোড হয়েছে!');
        } catch (err) {
          console.warn('Canvas export tainted fallback:', err);
          // Redraw skipping external image to bypass CORS taint
          drawCard({ skipExternalImg: true });
          setTimeout(() => {
            try {
              const link = document.createElement('a');
              link.download = `Amfan_Lakshmi_Puja_Ashirbad_${cleanName}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              showToast('📥 আপনার ডিজিটাল আশীর্বাদপত্রটি ডাউনলোড হয়েছে!');
              drawCard(); // restore image preview
            } catch (e2) {
              alert('ডাউনলোড করতে সমস্যা হচ্ছে। অনুগ্রহ করে কার্ডটির একটি স্ক্রিনশট নিন।');
            }
          }, 60);
        }
      });
    }

    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => {
        const raw = (nameInput?.value.trim()) || '';
        if (!raw) {
          showToast('⚠️ অনুগ্রহ করে প্রথমে আপনার বা পরিবারের নাম লিখুন!');
          if (nameInput) nameInput.focus();
          return;
        }
        const fullName = getFormattedDevoteeName() || 'ভক্ত সুধীবৃন্দ';
        const wish = wishSelect?.value || 'পারিবারিক সুখ ও শান্তি';
        const currentUrl = window.location.href.split('#')[0];
        const shareMsg = 
`🪔 শ্রী শ্রী কোজাগরী লক্ষ্মী পূজা পুণ্য আশীর্বাদপত্র 🌺
আমফান (N.S.C.C) কোজাগরী লক্ষ্মী পূজা ও বাৎসরিক ক্রীড়া-সাংস্কৃতিক অনুষ্ঠান

প্রণাম! মা লক্ষ্মীর কৃপায় "${fullName}"-এর জীবনে "${wish}" বর্ষিত হোক।
“ওঁ শ্রীং হ্রীং ক্লীং মহালক্ষ্ম্যৈ নমঃ”

স্থান: নাইকুন্ডি শীতলামাতা মন্দির প্রাঙ্গণ, কুমোরআড়া, নন্দকুমার, পূর্ব মেদিনীপুর
তারিখ: ১, ২ ও ৩ নভেম্বর, ২০২৬ (১৪, ১৫ ও ১৬ কার্তিক, ১৪৩৩)

আপনার নিজের ডিজিটাল আশীর্বাদপত্র সংগ্রহ করতে ও মা লক্ষ্মীর প্রতিমা দর্শন করতে ক্লিক করুন:
👉 ${currentUrl}`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;
        window.open(url, '_blank');
      });
    }
  }

  // ==========================================================
  // COMMITTEE SECTION (Admin Manage, Public View)
  // ==========================================================
  state.committeeMembers = [];
  state.committeeCategory = 'all';
  state.committeeSearch = '';

  const committeeGrid = document.getElementById('committee-grid');
  const btnAddCommitteeMember = document.getElementById('btn-add-committee-member');
  const memberModal = document.getElementById('member-modal');
  const btnCloseMemberModal = document.getElementById('btn-close-member-modal');
  const memberForm = document.getElementById('member-form');
  const memberIdInput = document.getElementById('member-id-input');
  const memberNameInput = document.getElementById('member-name-input');
  const memberRoleInput = document.getElementById('member-role-input');
  const memberCategoryInput = document.getElementById('member-category-input');
  const memberPhoneInput = document.getElementById('member-phone-input');
  const memberPhotoFile = document.getElementById('member-photo-file');
  const memberPhotoUrl = document.getElementById('member-photo-url');
  const committeeSearchInput = document.getElementById('committee-search-input');

  async function loadCommittee() {
    try {
      state.committeeMembers = await window.pujaDB.getCommitteeMembers();
    } catch (e) {
      console.warn('Error loading committee:', e);
      state.committeeMembers = [];
    }
    renderCommittee();
  }

  function renderCommittee() {
    if (!committeeGrid) return;

    let filtered = state.committeeMembers || [];

    if (state.committeeCategory !== 'all') {
      filtered = filtered.filter(m => m.category === state.committeeCategory);
    }

    if (state.committeeSearch.trim() !== '') {
      const q = state.committeeSearch.toLowerCase();
      filtered = filtered.filter(m => 
        (m.name && m.name.toLowerCase().includes(q)) || 
        (m.role && m.role.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      committeeGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #888; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
          <p style="font-size: 1.1rem; color: var(--color-primary-dark); font-weight: 600;">কোনো কর্মকর্তা বা সদস্যের নাম পাওয়া যায়নি</p>
          <p style="font-size: 0.9rem;">${state.isAdmin ? 'ওপরের "নতুন কর্মকর্তা / সদস্য যোগ করুন" বাটনে ক্লিক করে নাম যোগ করুন।' : 'অনুগ্রহ করে অন্য বিভাগে খুঁজুন।'}</p>
        </div>
      `;
      return;
    }

    committeeGrid.innerHTML = filtered.map(member => {
      const categoryNames = {
        executive: 'প্রধান কর্মকর্তা',
        sports_cultural: 'ক্রীড়া ও সাংস্কৃতিক বিভাগ',
        advisory: 'উপদেষ্টা মণ্ডলী',
        member: 'কার্যকরী সদস্য'
      };
      const catLabel = categoryNames[member.category] || 'সদস্য';
      const avatarContent = member.photo 
        ? `<img src="${member.photo}" alt="${escapeHtml(member.name)}" class="member-avatar-img" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='block';" /><span class="member-avatar-placeholder" style="display:none;">👤</span>`
        : `<span class="member-avatar-placeholder">👤</span>`;

      return `
        <div class="committee-card" data-id="${member.id}">
          <div class="member-avatar-wrap">
            ${avatarContent}
          </div>
          <h4 class="member-name">${escapeHtml(member.name)}</h4>
          <div class="member-role-badge">${escapeHtml(member.role)}</div>
          <div class="member-category-tag">${catLabel}</div>
          ${member.phone ? `<a href="tel:${escapeHtml(member.phone)}" class="member-phone">📞 ${escapeHtml(member.phone)}</a>` : ''}

          ${state.isAdmin ? `
            <div class="member-admin-actions">
              <button class="pill-btn btn-edit-member" data-id="${member.id}" style="padding: 4px 10px; font-size: 0.78rem; background: #fffdf7; border-color: #ffd54f;">
                ✏️ সম্পাদনা
              </button>
              <button class="pill-btn btn-delete-member" data-id="${member.id}" style="padding: 4px 10px; font-size: 0.78rem; background: #6b0814; color: #fff; border-color: #6b0814;">
                🗑️ মুছুন
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach Admin Edit/Delete Event Listeners
    if (state.isAdmin) {
      committeeGrid.querySelectorAll('.btn-edit-member').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const member = state.committeeMembers.find(m => m.id === id);
          if (member && memberModal) {
            memberIdInput.value = member.id;
            memberNameInput.value = member.name;
            memberRoleInput.value = member.role;
            memberCategoryInput.value = member.category || 'executive';
            memberPhoneInput.value = member.phone || '';
            selectedMemberPhoto = member.photo || '';
            if (memberPhotoFile) memberPhotoFile.value = '';
            if (memberPhotoUrl) memberPhotoUrl.value = (member.photo && member.photo.startsWith('http')) ? member.photo : '';
            updateMemberPhotoPreview(selectedMemberPhoto);
            if (memberPhotoStatus) {
              memberPhotoStatus.textContent = member.photo ? '✅ সদস্যের ছবি সংরক্ষিত আছে (বদলাতে চাইলে নতুন ছবি বাছুন)।' : 'নতুন ছবি আপলোড করতে পারেন।';
            }
            document.getElementById('member-modal-title').textContent = '✏️ সদস্য তথ্য সম্পাদনা';
            memberModal.classList.add('active');
          }
        });
      });

      committeeGrid.querySelectorAll('.btn-delete-member').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const member = state.committeeMembers.find(m => m.id === id);
          if (!member) return;
          if (confirm(`আপনি কি "${member.name}"-এর নাম তালিকা থেকে মুছে ফেলতে চান?`)) {
            await window.pujaDB.deleteCommitteeMember(id);
            state.committeeMembers = state.committeeMembers.filter(m => m.id !== id);
            renderCommittee();
            showToast(`🗑️ "${member.name}" তালিকা থেকে সফলভাবে মুছে ফেলা হয়েছে!`);
          }
        });
      });
    }
  }

  // Automatic Avatar Image Compression Helper (HD Quality, small size ~20 KB for seamless sync)
  function compressAvatarImage(file, maxDimension = 320, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const memberPhotoPreviewImg = document.getElementById('member-photo-preview-img');
  const memberPhotoPreviewPlaceholder = document.getElementById('member-photo-preview-placeholder');
  const memberPhotoStatus = document.getElementById('member-photo-status');
  let selectedMemberPhoto = '';

  function updateMemberPhotoPreview(photoUrl) {
    if (photoUrl && (photoUrl.startsWith('data:image') || photoUrl.startsWith('http'))) {
      if (memberPhotoPreviewImg) {
        memberPhotoPreviewImg.src = photoUrl;
        memberPhotoPreviewImg.style.display = 'block';
      }
      if (memberPhotoPreviewPlaceholder) memberPhotoPreviewPlaceholder.style.display = 'none';
    } else {
      if (memberPhotoPreviewImg) {
        memberPhotoPreviewImg.src = '';
        memberPhotoPreviewImg.style.display = 'none';
      }
      if (memberPhotoPreviewPlaceholder) memberPhotoPreviewPlaceholder.style.display = 'block';
    }
  }

  function initCommitteeSection() {
    if (btnAddCommitteeMember) {
      btnAddCommitteeMember.addEventListener('click', () => {
        if (!state.isAdmin) {
          showToast('🔒 সদস্য যোগ করার অধিকার শুধুমাত্র ক্লাবের অ্যাডমিনের জন্য।');
          return;
        }
        if (memberForm) memberForm.reset();
        if (memberIdInput) memberIdInput.value = '';
        selectedMemberPhoto = '';
        if (memberPhotoFile) memberPhotoFile.value = '';
        if (memberPhotoUrl) memberPhotoUrl.value = '';
        updateMemberPhotoPreview('');
        if (memberPhotoStatus) memberPhotoStatus.textContent = 'মোবাইল বা কম্পিউটার থেকে ছবি আপলোড করলে তা স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে লাইভ হয়ে যাবে।';
        document.getElementById('member-modal-title').textContent = '➕ নতুন কর্মকর্তা / সদস্য যোগ করুন';
        if (memberModal) memberModal.classList.add('active');
      });
    }

    if (btnCloseMemberModal) {
      btnCloseMemberModal.addEventListener('click', () => {
        if (memberModal) memberModal.classList.remove('active');
      });
    }

    // Filter pills
    const filterPills = document.querySelectorAll('#committee-filter-pills .filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.committeeCategory = pill.dataset.category;
        renderCommittee();
      });
    });

    // Search filter
    if (committeeSearchInput) {
      committeeSearchInput.addEventListener('input', (e) => {
        state.committeeSearch = e.target.value;
        renderCommittee();
      });
    }

    // Photo file reader with auto-compression for committee avatar
    if (memberPhotoFile) {
      memberPhotoFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          if (memberPhotoStatus) memberPhotoStatus.textContent = '⏳ ছবি অপ্টিমাইজ করা হচ্ছে...';
          try {
            const compressed = await compressAvatarImage(file, 320, 0.82);
            selectedMemberPhoto = compressed;
            updateMemberPhotoPreview(compressed);
            if (memberPhotoUrl) memberPhotoUrl.value = '';
            const sizeKb = Math.round((compressed.length * 3) / 4 / 1024);
            if (memberPhotoStatus) memberPhotoStatus.textContent = `✅ ছবি প্রস্তুত (${sizeKb} KB) — লাইভ প্রদর্শনের জন্য রেডি।`;
          } catch (err) {
            console.error('Photo compression error:', err);
            if (memberPhotoStatus) memberPhotoStatus.textContent = '⚠️ ছবি পড়তে সমস্যা হয়েছে, অন্য ছবি বেছে নিন।';
          }
        }
      });
    }

    if (memberPhotoUrl) {
      memberPhotoUrl.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          selectedMemberPhoto = url;
          updateMemberPhotoPreview(url);
          if (memberPhotoStatus) memberPhotoStatus.textContent = '✅ ওয়েব লিংক ছবি যুক্ত হয়েছে।';
        } else if (!memberPhotoFile?.files?.length) {
          selectedMemberPhoto = '';
          updateMemberPhotoPreview('');
          if (memberPhotoStatus) memberPhotoStatus.textContent = 'মোবাইল বা কম্পিউটার থেকে ছবি আপলোড করতে পারেন।';
        }
      });
    }

    // Form submit
    if (memberForm) {
      memberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.isAdmin) {
          alert('শুধুমাত্র অ্যাডমিন সদস্য তথ্য সংরক্ষণ করতে পারেন।');
          return;
        }

        const name = memberNameInput.value.trim();
        const role = memberRoleInput.value.trim();
        const category = memberCategoryInput.value;
        const phone = memberPhoneInput.value.trim();
        const photo = selectedMemberPhoto || memberPhotoUrl.value.trim() || '';
        const id = memberIdInput.value || '';

        if (!name || !role) {
          alert('সদস্যের নাম এবং পদবী আবশ্যক!');
          return;
        }

        const memberData = {
          id: id || undefined,
          name,
          role,
          category,
          phone,
          photo
        };

        const saved = await window.pujaDB.saveCommitteeMember(memberData);
        if (id) {
          const idx = state.committeeMembers.findIndex(m => m.id === id);
          if (idx >= 0) state.committeeMembers[idx] = saved;
        } else {
          state.committeeMembers.push(saved);
        }

        renderCommittee();
        if (memberModal) memberModal.classList.remove('active');
        showToast(`✅ "${name}"-এর তথ্য ও ছবি সফলভাবে সংরক্ষিত হয়েছে!`);
        selectedMemberPhoto = '';
        if (memberPhotoFile) memberPhotoFile.value = '';
        if (memberPhotoUrl) memberPhotoUrl.value = '';
        updateMemberPhotoPreview('');
      });
    }
  }

  // ==========================================================
  // DONATION, PRONAMI & DIGITAL RECEIPT PORTAL (100% FREE UPI)
  // ==========================================================
  let activePaymentConfig = {
    primaryUpiId: 'sudiptamaity670@ybl',
    secondaryUpiId: '7407352005@axl',
    payeeName: 'Amfan NSCC Kojagari Laxmi Puja',
    customQrUrl: ''
  };

  let selectedAmount = 101;
  let allDonationsList = [];
  let currentReceiptData = null;

  // Security: Track authenticated receipt sessions (Devotee must verify mobile to view/download)
  const verifiedReceiptSessions = new Set();
  let pendingAuthDonationId = null;

  // Deduplicate and sanitize donations list to prevent duplicate admin rows
  function setDonationsList(list) {
    const seenIds = new Set();
    const seenReceipts = new Set();
    const deduped = [];

    (list || []).forEach(item => {
      if (!item) return;

      // Filter legacy demo/sample records
      if (String(item.id || '').startsWith('don_init_')) return;
      if (item.donorName && (item.donorName.includes('সুদীপ্ত') || item.donorName.includes('Sudipta'))) return;

      const idKey = item.id ? String(item.id).trim() : null;
      const rcptKey = item.receiptNo ? String(item.receiptNo).trim() : null;

      if (idKey && seenIds.has(idKey)) return;
      if (rcptKey && seenReceipts.has(rcptKey)) return;

      if (idKey) seenIds.add(idKey);
      if (rcptKey) seenReceipts.add(rcptKey);
      deduped.push(item);
    });

    allDonationsList = deduped;
  }

  // Bengali numerals & words helpers
  function toBengaliNumerals(num) {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, d => bengaliDigits[d]);
  }

  function convertNumberToBengaliWords(num) {
    num = parseInt(num, 10);
    if (isNaN(num) || num <= 0) return 'শূন্য টাকা মাত্র';
    if (num === 51) return 'একান্ন টাকা মাত্র';
    if (num === 101) return 'একশত এক টাকা মাত্র';
    if (num === 251) return 'দুইশত একান্ন টাকা মাত্র';
    if (num === 501) return 'পাঁচশত এক টাকা মাত্র';
    if (num === 1001) return 'এক হাজার এক টাকা মাত্র';
    if (num === 2101) return 'দুই হাজার একশত এক টাকা মাত্র';
    if (num === 5001) return 'পাঁচ হাজার এক টাকা মাত্র';

    let words = '';
    if (num >= 100000) {
      const lakh = Math.floor(num / 100000);
      words += `${lakh} লক্ষ `;
      num %= 100000;
    }
    if (num >= 1000) {
      const thousand = Math.floor(num / 1000);
      words += `${thousand} হাজার `;
      num %= 1000;
    }
    if (num >= 100) {
      const hundred = Math.floor(num / 100);
      words += `${hundred === 1 ? 'একশত' : hundred + ' শত'} `;
      num %= 100;
    }
    if (num > 0) {
      words += `${num} `;
    }
    return (words.trim() + ' টাকা মাত্র');
  }

  let selectedUpiId = 'sudiptamaity670@ybl';

  function getUpiUri(appScheme = 'upi', amount = selectedAmount) {
    const upiId = selectedUpiId || activePaymentConfig.primaryUpiId || 'sudiptamaity670@ybl';
    const payee = 'Amfan NSCC Laxmi Puja';
    const note = 'Laxmi Puja Pronami';
    const amtStr = Number(amount).toFixed(2);

    // CRITICAL NPCI STANDARD: 'pa' MUST contain literal '@' character (NOT %40).
    // Encoding '@' to '%40' breaks Google Pay, BHIM, and PhonePe QR scanners.
    const query = `pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(note)}`;

    if (appScheme === 'phonepe') return `phonepe://pay?${query}`;
    if (appScheme === 'paytm') return `paytmmp://pay?${query}`;
    // Universal intent works for Google Pay, BHIM, Cred, and all UPI apps
    return `upi://pay?${query}`;
  }

  function updatePaymentUIFromConfig() {
    const textPrimary = document.getElementById('text-primary-upi');
    const textSecondary = document.getElementById('text-secondary-upi');
    const settingPrimary = document.getElementById('setting-primary-upi');
    const settingSecondary = document.getElementById('setting-secondary-upi');
    const settingPayee = document.getElementById('setting-payee-name');

    if (textPrimary) textPrimary.textContent = activePaymentConfig.primaryUpiId;
    if (textSecondary) textSecondary.textContent = activePaymentConfig.secondaryUpiId || '7407352005@axl';
    if (settingPrimary) settingPrimary.value = activePaymentConfig.primaryUpiId;
    if (settingSecondary) settingSecondary.value = activePaymentConfig.secondaryUpiId || '7407352005@axl';
    if (settingPayee) settingPayee.value = activePaymentConfig.payeeName;

    document.querySelectorAll('.btn-copy-upi').forEach(btn => {
      const isPrimary = btn.parentElement && btn.parentElement.textContent.includes('Primary');
      btn.dataset.copy = isPrimary ? activePaymentConfig.primaryUpiId : (activePaymentConfig.secondaryUpiId || '7407352005@axl');
    });

    if (activePaymentConfig.customQrUrl) {
      const clubQr = document.getElementById('club-qr-img');
      const zoomQr = document.getElementById('qr-zoom-img');
      if (clubQr) clubQr.src = activePaymentConfig.customQrUrl;
      if (zoomQr) zoomQr.src = activePaymentConfig.customQrUrl;
    }

    updateUpiAppLinks();
  }

  function updateUpiAppLinks() {
    const currentUpi = selectedUpiId || activePaymentConfig.primaryUpiId || 'sudiptamaity670@ybl';
    const phonepeBtn = document.getElementById('btn-upi-phonepe');
    const gpayBtn = document.getElementById('btn-upi-gpay');
    const paytmBtn = document.getElementById('btn-upi-paytm');
    const genericBtn = document.getElementById('btn-upi-generic');

    if (phonepeBtn) phonepeBtn.href = getUpiUri('phonepe');
    if (gpayBtn) gpayBtn.href = getUpiUri('upi'); // Universal intent for GPay
    if (paytmBtn) paytmBtn.href = getUpiUri('paytm');
    if (genericBtn) genericBtn.href = getUpiUri('upi');

    // Dynamic QR update with unencoded '@' in UPI payload
    const dynamicQrImg = document.getElementById('dynamic-qr-img');
    const dynamicLabel = document.getElementById('qr-dynamic-amount-label');
    if (dynamicLabel) dynamicLabel.textContent = `₹${toBengaliNumerals(selectedAmount)}`;
    if (dynamicQrImg) {
      const upiPayload = `upi://pay?pa=${currentUpi}&pn=${encodeURIComponent('Amfan NSCC Laxmi Puja')}&am=${Number(selectedAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Laxmi Puja Pronami')}`;
      dynamicQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiPayload)}`;
    }

    // Update club-qr-img so it matches selected UPI ID without encoding errors
    const clubQrImg = document.getElementById('club-qr-img');
    if (clubQrImg && !activePaymentConfig.customQrUrl) {
      const staticPayload = `upi://pay?pa=${currentUpi}&pn=${encodeURIComponent('Amfan NSCC Laxmi Puja')}&cu=INR&tn=${encodeURIComponent('Laxmi Puja Pronami')}`;
      clubQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(staticPayload)}`;
    }

    // Sync Devotee Form amount input
    const donorAmtInput = document.getElementById('donor-amount-input');
    if (donorAmtInput && Number(donorAmtInput.value) !== selectedAmount) {
      donorAmtInput.value = selectedAmount;
    }
  }

  // Render Public Donors Wall (ONLY verified donations are displayed to prevent fraud)
  function renderDonationsWall() {
    const wallCount = document.getElementById('wall-donors-count');
    const cardsGrid = document.getElementById('donors-cards-grid');
    if (!cardsGrid) return;

    const verifiedDonations = allDonationsList.filter(d => d.status === 'verified');

    if (wallCount) wallCount.textContent = toBengaliNumerals(verifiedDonations.length);

    if (verifiedDonations.length === 0) {
      cardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1.5rem; color: #777; background: #fffcf5; border-radius: 12px; border: 1.5px dashed #fedc97;">
          🌸 এখনো কোনো যাচাইকৃত প্রণামী তালিকাভুক্ত হয়নি। প্রথম পুণ্যার্থী হিসেবে আপনি ভক্তিভরে প্রণামী অর্পণ করুন।
        </div>
      `;
      return;
    }

    cardsGrid.innerHTML = verifiedDonations.slice(0, 18).map(d => {
      const dateStr = d.timestamp ? new Date(d.timestamp).toLocaleDateString('bn-IN', { day: 'numeric', month: 'short' }) : '';
      return `
        <div class="donor-card">
          <div>
            <div class="donor-card-top">
              <div class="donor-card-name">${escapeHtml(d.donorName)}</div>
              <div class="donor-amount-tag">₹${toBengaliNumerals(d.amount)}</div>
            </div>
            <div class="donor-details-row">
              ${d.gotra ? `<span>🏷️ <strong>গোত্র:</strong> ${escapeHtml(d.gotra)}</span>` : ''}
              ${d.village ? `<span>📍 ${escapeHtml(d.village)}</span>` : ''}
              <span>💳 ${escapeHtml(d.paymentMethod || 'UPI')}</span>
            </div>
            ${d.prayer ? `<div class="donor-prayer-quote">"${escapeHtml(d.prayer)}"</div>` : ''}
          </div>
          <div class="donor-card-bottom">
            <span>📅 ${dateStr}</span>
            <button type="button" class="btn-view-rcpt" onclick="requestReceiptAccess('${d.id}')" title="রসিদ দেখতে ও ডাউনলোড করতে মোবাইল নম্বর যাচাই করুন">
              🔒 রসিদ দেখুন
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Privacy Protection: Devotee must enter their 10-digit mobile number to view/download receipt
  window.requestReceiptAccess = (id) => {
    const donation = allDonationsList.find(d => d.id === id);
    if (!donation) {
      alert('প্রণামী রেকর্ড পাওয়া যায়নি');
      return;
    }

    // Admin has full access directly
    if (state.isAdmin || verifiedReceiptSessions.has(id)) {
      displayReceiptModal(donation);
      return;
    }

    // Public user must verify mobile number
    pendingAuthDonationId = id;
    const authModal = document.getElementById('receipt-auth-modal');
    const donorNameEl = document.getElementById('receipt-auth-donor-name');
    const phoneInput = document.getElementById('input-auth-mobile');
    const errorMsg = document.getElementById('auth-error-msg');

    if (donorNameEl) {
      donorNameEl.textContent = `ভক্ত: ${donation.donorName}`;
    }
    if (phoneInput) {
      phoneInput.value = '';
    }
    if (errorMsg) {
      errorMsg.style.display = 'none';
      errorMsg.textContent = '';
    }

    if (authModal) {
      authModal.classList.add('active');
      setTimeout(() => {
        if (phoneInput) phoneInput.focus();
      }, 100);
    }
  };

  // Admin Direct View (no phone prompt needed)
  window.adminViewReceipt = (id) => {
    const donation = allDonationsList.find(d => d.id === id);
    if (donation) {
      displayReceiptModal(donation);
    }
  };

  // Safe wrapper for backwards compatibility
  window.displayReceiptById = (id) => {
    if (state.isAdmin) {
      window.adminViewReceipt(id);
    } else {
      window.requestReceiptAccess(id);
    }
  };

  // Display Receipt Modal with devotee data (Dual state: Pending Slip vs Approved Receipt)
  function displayReceiptModal(rcpt) {
    currentReceiptData = rcpt;

    const modal = document.getElementById('donation-receipt-modal');
    const rcptNo = document.getElementById('rcpt-no');
    const rcptDate = document.getElementById('rcpt-date');
    const rcptName = document.getElementById('rcpt-donor-name');
    const rcptGotra = document.getElementById('rcpt-gotra');
    const rcptVillage = document.getElementById('rcpt-village');
    const rcptPhone = document.getElementById('rcpt-phone');
    const rcptMethod = document.getElementById('rcpt-method');
    const rcptUtr = document.getElementById('rcpt-utr');
    const rcptAmount = document.getElementById('rcpt-amount');
    const rcptAmountWords = document.getElementById('rcpt-amount-words');

    const statusBanner = document.getElementById('rcpt-status-banner');
    const statusIcon = document.getElementById('rcpt-status-icon');
    const statusText = document.getElementById('rcpt-status-text');
    const sealStar = document.getElementById('rcpt-seal-star');
    const watermark = document.getElementById('rcpt-watermark');
    const btnDownload = document.getElementById('btn-download-receipt-img');

    const isVerified = (rcpt.status === 'verified');

    if (statusBanner) {
      if (isVerified) {
        statusBanner.style.background = '#e8f5e9';
        statusBanner.style.color = '#2e7d32';
        statusBanner.style.borderColor = '#a5d6a7';
        if (statusIcon) statusIcon.textContent = '✅';
        if (statusText) statusText.textContent = 'অনুমোদিত ও যাচাইকৃত অফিসিয়াল রসিদ (Official Verified Receipt)';
      } else {
        statusBanner.style.background = '#fff3e0';
        statusBanner.style.color = '#e65100';
        statusBanner.style.borderColor = '#ffcc80';
        if (statusIcon) statusIcon.textContent = '⏳';
        if (statusText) statusText.textContent = 'পেমেন্ট যাচাইকরণ প্রক্রিয়াধীন (Verification in Progress)';
      }
    }

    if (sealStar) {
      sealStar.textContent = isVerified ? '★ VERIFIED ★' : '⏳ PENDING ⏳';
      sealStar.style.color = isVerified ? '#2e7d32' : '#e65100';
    }

    if (watermark) {
      watermark.textContent = isVerified ? 'AMFAN LAXMI PUJA 2026' : 'VERIFICATION PENDING';
      watermark.style.color = isVerified ? 'rgba(229, 169, 59, 0.08)' : 'rgba(230, 81, 0, 0.08)';
    }

    if (btnDownload) {
      btnDownload.innerHTML = isVerified ? '📥 রসিদ ডাউনলোড (PNG)' : '📥 অস্থায়ী স্লিপ ডাউনলোড';
    }

    if (rcptNo) rcptNo.textContent = rcpt.receiptNo || 'AMF-LK-2026-0000';
    if (rcptDate) {
      const d = rcpt.timestamp ? new Date(rcpt.timestamp) : new Date();
      rcptDate.textContent = d.toLocaleString('bn-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (rcptName) rcptName.textContent = rcpt.donorName || '--';
    if (rcptGotra) rcptGotra.textContent = rcpt.gotra || 'স্বগোত্র';
    if (rcptVillage) rcptVillage.textContent = rcpt.village || '--';
    if (rcptPhone) rcptPhone.textContent = rcpt.phone ? String(rcpt.phone).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]) : '--';
    if (rcptMethod) rcptMethod.textContent = rcpt.paymentMethod || 'UPI';
    if (rcptUtr) rcptUtr.textContent = rcpt.utrNumber || 'CONFIRMED';
    if (rcptAmount) rcptAmount.textContent = `₹${toBengaliNumerals(rcpt.amount)} /-`;
    if (rcptAmountWords) rcptAmountWords.textContent = `কথায়: ${convertNumberToBengaliWords(rcpt.amount)}`;

    if (modal) modal.classList.add('active');
  }

  // Render Admin Donors Register Table & Financial Stats (Pending vs Verified)
  function renderDonationsAdmin() {
    if (!state.isAdmin) return;

    let totalAmount = 0;
    let onlineAmount = 0;
    let cashAmount = 0;
    let pendingCount = 0;

    allDonationsList.forEach(d => {
      const amt = Number(d.amount) || 0;
      if (d.status === 'verified') {
        totalAmount += amt;
        const method = (d.paymentMethod || '').toLowerCase();
        if (method.includes('cash') || method.includes('নগদ')) {
          cashAmount += amt;
        } else {
          onlineAmount += amt;
        }
      } else {
        pendingCount++;
      }
    });

    const statTotal = document.getElementById('stat-total-amount');
    const statDonors = document.getElementById('stat-total-donors');
    const statOnline = document.getElementById('stat-online-amount');
    const statCash = document.getElementById('stat-cash-amount');

    if (statTotal) statTotal.textContent = `₹${toBengaliNumerals(totalAmount)}`;
    if (statDonors) {
      statDonors.textContent = `${toBengaliNumerals(allDonationsList.length)} জন ${pendingCount > 0 ? `(${toBengaliNumerals(pendingCount)} টি যাচাই বাকি)` : ''}`;
    }
    if (statOnline) statOnline.textContent = `₹${toBengaliNumerals(onlineAmount)}`;
    if (statCash) statCash.textContent = `₹${toBengaliNumerals(cashAmount)}`;

    const tbody = document.getElementById('admin-donations-table-body');
    if (!tbody) return;

    const searchTerm = (document.getElementById('admin-donor-search')?.value || '').trim().toLowerCase();

    const filtered = allDonationsList.filter(d => {
      if (!searchTerm) return true;
      const haystack = `${d.donorName} ${d.phone} ${d.receiptNo} ${d.utrNumber} ${d.village} ${d.gotra}`.toLowerCase();
      return haystack.includes(searchTerm);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:#777;">কোনো অনুদান রেকর্ড পাওয়া যায়নি</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(d => {
      const dateStr = d.timestamp ? new Date(d.timestamp).toLocaleDateString('bn-IN') : '';
      const isVerified = (d.status === 'verified');
      return `
        <tr style="${!isVerified ? 'background: #fffcf2;' : ''}">
          <td style="white-space: nowrap;">${dateStr}</td>
          <td><span class="highlight-receipt-no" style="font-size:0.8rem;">${escapeHtml(d.receiptNo)}</span></td>
          <td>
            <strong>${escapeHtml(d.donorName)}</strong>
            ${d.gotra ? `<div style="font-size:0.75rem; color:#777;">গোত্র: ${escapeHtml(d.gotra)}</div>` : ''}
          </td>
          <td>
            <div>${escapeHtml(d.village)}</div>
            <div style="font-size:0.75rem; color:#777;">${escapeHtml(d.phone)}</div>
          </td>
          <td style="font-weight:700; color:#5c0712; font-size:0.95rem;">₹${toBengaliNumerals(d.amount)}</td>
          <td><span class="update-badge" style="background:#f5f5f5; font-size:0.72rem;">${escapeHtml(d.paymentMethod || 'UPI')}</span></td>
          <td style="font-family:monospace; font-size:0.76rem; font-weight:700; color:${isVerified ? '#2e7d32' : '#b32134'};">
            ${escapeHtml(d.utrNumber || '--')}
          </td>
          <td>
            ${isVerified ? `
              <span style="display:inline-flex; align-items:center; gap:3px; padding: 3px 8px; border-radius: 9999px; font-size:0.74rem; background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; font-weight:700;">
                ✓ যাচাইকৃত
              </span>
            ` : `
              <span style="display:inline-flex; align-items:center; gap:3px; padding: 3px 8px; border-radius: 9999px; font-size:0.74rem; background:#fff3e0; color:#e65100; border:1px solid #ffcc80; font-weight:700;">
                ⏳ যাচাই বাকি
              </span>
            `}
          </td>
          <td style="white-space: nowrap;">
            ${!isVerified ? `
              <button type="button" class="btn-donor-approve" onclick="adminApproveDonation('${d.id}')" title="ব্যাংক অ্যাকাউন্ট চেক করে পেমেন্ট নিশ্চিত থাকলে অনুমোদন করুন">
                ✅ পেয়েছি
              </button>
              <button type="button" class="btn-donor-reject" onclick="adminRejectDonation('${d.id}')" title="টাকা না এলে বা ফেক এন্ট্রি হলে সরাসরি বাতিল করুন">
                ❌ আসেনি
              </button>
            ` : `
              <button type="button" class="pill-btn" onclick="toggleDonationStatus('${d.id}')" style="padding: 2px 7px; font-size:0.72rem; background:#f5f5f5; border-color:#ccc; color:#555;" title="স্ট্যাটাস পরিবর্তন">
                🔄 রিভার্স
              </button>
            `}
            <button type="button" class="pill-btn" onclick="adminViewReceipt('${d.id}')" style="padding: 2px 8px; font-size:0.74rem; background:#fff8e1; border-color:#ffd54f; color:#5c0712;" title="রসিদ দেখুন">
              📜 রসিদ
            </button>
            <button type="button" class="photo-like-btn" onclick="adminDeleteDonation('${d.id}')" style="background: #fff0f0; border-color: #ffcdd2; color: #b32134; cursor: pointer; padding: 2px 6px; font-size: 0.74rem;" title="ডিলিট করুন">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // One-click Admin Approval for Pending Payments
  window.adminApproveDonation = async (id) => {
    if (!state.isAdmin) return;
    const item = allDonationsList.find(d => d.id === id);
    if (!item) return;

    item.status = 'verified';
    await window.pujaDB.updateDonationStatus(id, 'verified');

    window.pujaAudio.playTempleBell();
    triggerPetalShower(30);
    renderDonationsAdmin();
    renderDonationsWall();
    showToast(`✅ "${item.donorName}"-এর ₹${toBengaliNumerals(item.amount)} প্রণামী অনুমোদিত ও যাচাইকৃত হয়েছে!`);
  };

  // One-click Admin Rejection for Fake/Unpaid Entries
  window.adminRejectDonation = async (id) => {
    if (!state.isAdmin) return;
    const item = allDonationsList.find(d => d.id === id);
    if (!item) return;

    if (confirm(`আপনি কি নিশ্চিত যে "${item.donorName}"-এর এই এন্ট্রিটি পেমেন্ট না আসায় বা ফেক হওয়ায় বাতিল করে মুছে ফেলতে চান?`)) {
      await window.pujaDB.deleteDonation(id);
      allDonationsList = allDonationsList.filter(d => d.id !== id);
      renderDonationsAdmin();
      renderDonationsWall();
      showToast('🗑️ ভুয়ো প্রণামী এন্ট্রি বাতিল ও স্থায়ীভাবে মুছে ফেলা হয়েছে।');
    }
  };

  window.toggleDonationStatus = async (id) => {
    if (!state.isAdmin) return;
    const item = allDonationsList.find(d => d.id === id);
    if (!item) return;
    const newStatus = (item.status === 'verified') ? 'pending' : 'verified';
    item.status = newStatus;
    await window.pujaDB.updateDonationStatus(id, newStatus);
    renderDonationsAdmin();
    renderDonationsWall();
    showToast(`স্ট্যাটাস আপডেট হয়েছে: ${newStatus === 'verified' ? 'যাচাইকৃত' : 'পেন্ডিং'}`);
  };

  window.adminDeleteDonation = async (id) => {
    if (!state.isAdmin) return;
    const item = allDonationsList.find(d => d.id === id);
    const name = item ? item.donorName : 'এই প্রণামীটি';
    if (confirm(`আপনি কি নিশ্চিত যে "${name}"-এর প্রণামী রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      await window.pujaDB.deleteDonation(id);
      allDonationsList = allDonationsList.filter(d => d.id !== id);
      renderDonationsWall();
      renderDonationsAdmin();
      showToast('🗑️ প্রণামী রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।');
    }
  };

  // Export Donors to CSV / Excel (UTF-8 BOM)
  window.exportDonationsToCSV = () => {
    if (allDonationsList.length === 0) {
      alert('কোনো প্রণামী রেকর্ড পাওয়া যায়নি।');
      return;
    }

    const headers = ['রসিদ নং', 'তারিখ', 'ভক্তের নাম', 'গোত্র', 'গ্রাম/ঠিকানা', 'ফোন নম্বর', 'প্রণামীর পরিমাণ (টাকা)', 'পেমেন্ট মাধ্যম', 'UTR/রেফারেন্স নং', 'স্ট্যাটাস', 'প্রার্থনা/মন্তব্য'];

    const rows = allDonationsList.map(d => {
      const dateStr = d.timestamp ? new Date(d.timestamp).toLocaleString('bn-IN') : '';
      return [
        `"${(d.receiptNo || '').replace(/"/g, '""')}"`,
        `"${dateStr.replace(/"/g, '""')}"`,
        `"${(d.donorName || '').replace(/"/g, '""')}"`,
        `"${(d.gotra || '').replace(/"/g, '""')}"`,
        `"${(d.village || '').replace(/"/g, '""')}"`,
        `"${(d.phone || '').replace(/"/g, '""')}"`,
        `"${d.amount || 0}"`,
        `"${(d.paymentMethod || 'UPI').replace(/"/g, '""')}"`,
        `"${(d.utrNumber || '').replace(/"/g, '""')}"`,
        `"${(d.status || 'verified').replace(/"/g, '""')}"`,
        `"${(d.prayer || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Amfan_NSCC_Laxmi_Puja_Donations_2026_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📥 প্রণামী খাতা এক্সেল/CSV ফাইলে ডাউনলোড সম্পন্ন হয়েছে!');
  };

  // High-Resolution Canvas Digital Receipt Image Generator (Dual state & NO personal name/address)
  function downloadReceiptAsImage(rcpt) {
    if (!rcpt) return;

    // Security check: Must be Admin OR verified owner of receipt
    if (!state.isAdmin && !verifiedReceiptSessions.has(rcpt.id)) {
      alert('নিরাপত্তার স্বার্থে সঠিক মোবাইল নম্বর যাচাই ছাড়া রসিদ ডাউনলোড করা যাবে না।');
      return;
    }

    const isVerified = (rcpt.status === 'verified');
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1250;
    const ctx = canvas.getContext('2d');

    // 1. Parchment Background
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background pattern
    ctx.fillStyle = 'rgba(229, 169, 59, 0.03)';
    for (let i = 0; i < canvas.width; i += 40) {
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.fillRect(i, j, 2, 2);
      }
    }

    // 2. Auspicious Borders
    // Outer border
    ctx.strokeStyle = '#8b1320';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Inner gold border
    ctx.strokeStyle = '#b37e19';
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);

    // Corner decorative squares
    ctx.fillStyle = '#8b1320';
    ctx.fillRect(20, 20, 30, 30);
    ctx.fillRect(canvas.width - 50, 20, 30, 30);
    ctx.fillRect(20, canvas.height - 50, 30, 30);
    ctx.fillRect(canvas.width - 50, canvas.height - 50, 30, 30);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(28, 28, 14, 14);
    ctx.fillRect(canvas.width - 42, 28, 14, 14);
    ctx.fillRect(28, canvas.height - 42, 14, 14);
    ctx.fillRect(canvas.width - 42, canvas.height - 42, 14, 14);

    // 3. Header
    // Sacred Om
    ctx.fillStyle = '#8b1320';
    ctx.font = 'bold 50px "Hind Siliguri", "Noto Serif Bengali", serif';
    ctx.textAlign = 'center';
    ctx.fillText('ॐ', canvas.width / 2, 95);

    // Puja Title (ONLY PUJA - NO MOHOTSAV)
    ctx.fillStyle = '#5c0712';
    ctx.font = 'bold 32px "Hind Siliguri", sans-serif';
    ctx.fillText('শ্রী শ্রী কোজাগরী লক্ষ্মী পূজা ২০২৬', canvas.width / 2, 145);

    // Club Name
    ctx.fillStyle = '#b37e19';
    ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
    ctx.fillText('আমফান (N.S.C.C) ক্লাব ও পূজা কমিটি', canvas.width / 2, 185);

    // Mandap Line (No personal address, ONLY PUJA)
    ctx.fillStyle = '#5d4037';
    ctx.font = '500 17px "Hind Siliguri", sans-serif';
    ctx.fillText('আমফান (N.S.C.C) ক্লাব প্রাঙ্গণ • সর্বজনীন কোজাগরী লক্ষ্মী পূজা ২০২৬', canvas.width / 2, 218);

    // Sloka
    ctx.fillStyle = '#8b1320';
    ctx.font = 'italic 16px "Hind Siliguri", sans-serif';
    ctx.fillText('"ধনং ধান্যং পশূন্ বহুন্ পুত্রলাভং তথা পরম্। মা লক্ষ্মী ত্বং মে দেহি সৌভাগ্যং দেহি মে সদা॥"', canvas.width / 2, 246);

    // Divider Line
    ctx.strokeStyle = '#edd7ba';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 265);
    ctx.lineTo(canvas.width - 60, 265);
    ctx.stroke();

    // 4. Receipt Title Badge
    ctx.fillStyle = isVerified ? '#8b1320' : '#d97706';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 210, 285, 420, 42, 21);
    ctx.fill();

    ctx.fillStyle = isVerified ? '#ffd700' : '#ffffff';
    ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
    ctx.fillText(isVerified ? '📜 ডিজিটাল দান ও প্রণামী রসিদ (অনুমোদিত)' : '⏳ প্রণামী স্বীকৃতি স্লিপ (যাচাইকরণ প্রক্রিয়াধীন)', canvas.width / 2, 313);

    // Diagonal Background Watermark
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 30);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    ctx.font = isVerified ? 'bold 64px "Hind Siliguri", sans-serif' : 'bold 48px "Hind Siliguri", sans-serif';
    ctx.fillStyle = isVerified ? 'rgba(229, 169, 59, 0.07)' : 'rgba(217, 119, 6, 0.08)';
    ctx.fillText(isVerified ? 'AMFAN N.S.C.C' : 'যাচাইকরণ প্রক্রিয়াধীন', 0, 0);
    ctx.restore();

    // 5. Meta Box: Receipt No & Date
    ctx.fillStyle = '#fff9ea';
    ctx.strokeStyle = '#e5a93b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(60, 350, canvas.width - 120, 50, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#5c0712';
    ctx.font = 'bold 18px monospace, sans-serif';
    ctx.fillText(`রসিদ নং: ${rcpt.receiptNo || 'AMF-LK-2026-0000'}`, 80, 382);

    ctx.textAlign = 'right';
    const dateFormatted = rcpt.timestamp ? new Date(rcpt.timestamp).toLocaleDateString('bn-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : new Date().toLocaleDateString('bn-IN');
    ctx.fillStyle = '#5d4037';
    ctx.font = '16px "Hind Siliguri", sans-serif';
    ctx.fillText(`তারিখ: ${dateFormatted}`, canvas.width - 80, 382);

    // 6. Devotee Details List
    const startY = 440;
    const lineGap = 48;
    const leftColX = 80;
    const rightColX = 480;

    ctx.textAlign = 'left';

    // Name (Full Width)
    ctx.fillStyle = '#6b4c52';
    ctx.font = '17px "Hind Siliguri", sans-serif';
    ctx.fillText('ভক্ত / দানকারীর নাম:', leftColX, startY);

    ctx.fillStyle = '#5c0712';
    ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
    ctx.fillText(rcpt.donorName || '--', leftColX + 180, startY);

    // Gotra & Village
    const y1 = startY + lineGap;
    ctx.fillStyle = '#6b4c52';
    ctx.font = '17px "Hind Siliguri", sans-serif';
    ctx.fillText('গোত্র (Gotra):', leftColX, y1);
    ctx.fillStyle = '#2b1317';
    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    ctx.fillText(rcpt.gotra || 'স্বগোত্র', leftColX + 110, y1);

    ctx.fillStyle = '#6b4c52';
    ctx.font = '17px "Hind Siliguri", sans-serif';
    ctx.fillText('গ্রাম / বাসস্থান:', rightColX, y1);
    ctx.fillStyle = '#2b1317';
    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    ctx.fillText(rcpt.village || '--', rightColX + 120, y1);

    // Phone & Method
    const y2 = y1 + lineGap;
    ctx.fillStyle = '#6b4c52';
    ctx.font = '17px "Hind Siliguri", sans-serif';
    ctx.fillText('মোবাইল নম্বর:', leftColX, y2);
    ctx.fillStyle = '#2b1317';
    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    const phoneBn = rcpt.phone ? String(rcpt.phone).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]) : '--';
    ctx.fillText(phoneBn, leftColX + 110, y2);

    ctx.fillStyle = '#6b4c52';
    ctx.font = '17px "Hind Siliguri", sans-serif';
    ctx.fillText('পেমেন্ট মাধ্যম:', rightColX, y2);
    ctx.fillStyle = '#2b1317';
    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    ctx.fillText(rcpt.paymentMethod || 'UPI', rightColX + 120, y2);

    // UTR / Transaction ID
    const y3 = y2 + lineGap;
    ctx.fillStyle = '#6b4c52';
    ctx.font = '17px "Hind Siliguri", sans-serif';
    ctx.fillText('UTR / ট্রানজ্যাকশন আইডি:', leftColX, y3);
    ctx.fillStyle = '#2b1317';
    ctx.font = 'bold 17px monospace, sans-serif';
    ctx.fillText(rcpt.utrNumber || 'CONFIRMED', leftColX + 210, y3);

    // 7. Auspicious Amount Box
    const amtBoxY = y3 + 45;
    ctx.fillStyle = '#fff7e6';
    ctx.strokeStyle = '#b37e19';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(60, amtBoxY, canvas.width - 120, 130, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#5d4037';
    ctx.font = '16px "Hind Siliguri", sans-serif';
    ctx.fillText('প্রণামীর পরিমাণ (Amount Paid):', canvas.width / 2, amtBoxY + 36);

    ctx.fillStyle = '#8b1320';
    ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
    ctx.fillText(`₹${toBengaliNumerals(rcpt.amount)} /-`, canvas.width / 2, amtBoxY + 84);

    ctx.fillStyle = '#b37e19';
    ctx.font = 'bold 17px "Hind Siliguri", sans-serif';
    ctx.fillText(`কথায়: ${convertNumberToBengaliWords(rcpt.amount)}`, canvas.width / 2, amtBoxY + 114);

    // 8. Blessing Quote Card
    const blessY = amtBoxY + 155;
    ctx.fillStyle = 'rgba(229, 169, 59, 0.12)';
    ctx.beginPath();
    ctx.roundRect(60, blessY, canvas.width - 120, 60, 8);
    ctx.fill();

    ctx.fillStyle = '#5c0712';
    ctx.font = 'italic 16px "Hind Siliguri", sans-serif';
    ctx.fillText('🌸 "মা শ্রী শ্রী কোজাগরী লক্ষ্মীর চরণে আপনার ও আপনার পরিবারের সর্বাঙ্গীণ সুখ, সমৃদ্ধি, সুস্বাস্থ্য ও মঙ্গল কামনা করি।"', canvas.width / 2, blessY + 36);

    // 9. Signatures and Official Stamp
    const footerY = blessY + 150;

    // Stamp (Left)
    const sealX = 170;
    const sealY = footerY + 20;

    // Outer circle
    ctx.strokeStyle = isVerified ? '#b37e19' : '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.strokeStyle = isVerified ? '#8b1320' : '#d97706';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(sealX, sealY, 43, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stamp text
    ctx.fillStyle = isVerified ? '#8b1320' : '#d97706';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('AMFAN N.S.C.C', sealX, sealY - 14);
    ctx.fillStyle = isVerified ? '#ff9800' : '#e65100';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(isVerified ? '★ VERIFIED ★' : '⏳ PENDING ⏳', sealX, sealY + 2);
    ctx.fillStyle = isVerified ? '#8b1320' : '#d97706';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('LAXMI PUJA 2026', sealX, sealY + 18);

    ctx.font = 'bold 14px "Hind Siliguri", sans-serif';
    ctx.fillText(isVerified ? 'ক্লাব সীলমোহর (Official Seal)' : 'অস্থায়ী ভেরিফিকেশন সিল', sealX, sealY + 74);

    // Signatures (Right)
    const signX = canvas.width - 180;
    ctx.strokeStyle = '#2b1317';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(signX - 90, sealY + 40);
    ctx.lineTo(signX + 90, sealY + 40);
    ctx.stroke();

    ctx.fillStyle = '#5c0712';
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.fillText('কোষাধ্যক্ষ / সম্পাদক', signX, sealY + 64);
    ctx.font = '14px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#777';
    ctx.fillText('আমফান (N.S.C.C) পূজা কমিটি', signX, sealY + 84);

    // 10. Footer Credit Line (ONLY PUJA)
    ctx.fillStyle = '#b37e19';
    ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
    ctx.fillText('✨ আমফান (N.S.C.C) কোজাগরী লক্ষ্মী পূজা ২০২৬ ✨', canvas.width / 2, canvas.height - 35);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    const prefix = isVerified ? 'Amfan_Laxmi_Puja_Receipt' : 'Amfan_Laxmi_Puja_Pending_Slip';
    a.download = `${prefix}_${rcpt.receiptNo || '2026'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(isVerified ? '📥 ডিজিটাল প্রণামী রসিদ ছবি হিসেবে ডাউনলোড হয়েছে!' : '📥 প্রণামী যাচাইকরণ স্লিপ ডাউনলোড হয়েছে!');
  }

  // Master Donation Portal Initializer
  async function initDonationPortal() {
    // 1. Load active config & donations
    try {
      const cfg = await window.pujaDB.getPaymentConfig();
      if (cfg) {
        activePaymentConfig = { ...activePaymentConfig, ...cfg };
      }
    } catch (e) {
      console.warn('Could not load payment config:', e);
    }

    try {
      const loaded = await window.pujaDB.getAllDonations();
      setDonationsList(loaded);
    } catch (e) {
      console.warn('Could not load donations:', e);
    }

    updatePaymentUIFromConfig();
    renderDonationsWall();
    if (state.isAdmin) renderDonationsAdmin();

    // 2. Amount Chip Clicks
    const chips = document.querySelectorAll('.amount-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedAmount = parseInt(chip.dataset.amount, 10) || 101;
        const customInput = document.getElementById('input-custom-amount');
        if (customInput) customInput.value = selectedAmount;
        updateUpiAppLinks();
      });
    });

    // 3. Custom Amount Apply
    const btnApplyAmt = document.getElementById('btn-apply-custom-amount');
    const customAmtInput = document.getElementById('input-custom-amount');

    const applyCustomAmount = () => {
      const val = parseInt(customAmtInput?.value, 10);
      if (!val || val <= 0) {
        alert('অনুগ্রহ করে সঠিক পরিমাণ টাকা লিখুন (কমপক্ষে ১ টাকা)');
        return;
      }
      selectedAmount = val;
      chips.forEach(c => {
        if (parseInt(c.dataset.amount, 10) === val) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
      updateUpiAppLinks();
      showToast(`🪙 প্রণামী পরিমাণ ₹${toBengaliNumerals(selectedAmount)} নির্ধারিত হয়েছে`);
    };

    if (btnApplyAmt) btnApplyAmt.addEventListener('click', applyCustomAmount);
    if (customAmtInput) {
      customAmtInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCustomAmount();
        }
      });
    }

    // 3B. Select Primary vs Secondary UPI ID
    const btnSelectPri = document.getElementById('btn-select-upi-pri');
    const btnSelectSec = document.getElementById('btn-select-upi-sec');

    if (btnSelectPri) {
      btnSelectPri.addEventListener('click', () => {
        selectedUpiId = activePaymentConfig.primaryUpiId || 'sudiptamaity670@ybl';
        btnSelectPri.classList.add('active');
        if (btnSelectSec) btnSelectSec.classList.remove('active');
        updateUpiAppLinks();
        showToast(`✅ প্রাথমিক UPI আইডি (${selectedUpiId}) নির্বাচন করা হয়েছে`);
      });
    }

    if (btnSelectSec) {
      btnSelectSec.addEventListener('click', () => {
        selectedUpiId = activePaymentConfig.secondaryUpiId || '7407352005@axl';
        btnSelectSec.classList.add('active');
        if (btnSelectPri) btnSelectPri.classList.remove('active');
        updateUpiAppLinks();
        showToast(`✅ বিকল্প UPI আইডি (${selectedUpiId}) নির্বাচন করা হয়েছে`);
      });
    }

    // 4. Mobile UPI App Click Handler (Prompt on Desktop)
    document.querySelectorAll('.upi-app-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.innerWidth > 800) {
          showToast('💡 মোবাইল থেকে ক্লিক করলে সরাসরি অ্যাপ খুলবে। কম্পিউটারে স্ক্রিনের কিউআর কোড স্ক্যান করুন।');
        }
      });
    });

    // 5. QR Code Mode Switch
    const btnQrOfficial = document.getElementById('btn-qr-mode-official');
    const btnQrDynamic = document.getElementById('btn-qr-mode-dynamic');
    const clubQrImg = document.getElementById('club-qr-img');
    const dynamicQrImg = document.getElementById('dynamic-qr-img');
    const btnEnlargeQr = document.getElementById('btn-enlarge-qr');

    if (btnQrOfficial && btnQrDynamic) {
      btnQrOfficial.addEventListener('click', () => {
        btnQrOfficial.classList.add('active');
        btnQrDynamic.classList.remove('active');
        if (clubQrImg) clubQrImg.style.display = 'block';
        if (dynamicQrImg) dynamicQrImg.style.display = 'none';
      });

      btnQrDynamic.addEventListener('click', () => {
        btnQrDynamic.classList.add('active');
        btnQrOfficial.classList.remove('active');
        if (clubQrImg) clubQrImg.style.display = 'none';
        if (dynamicQrImg) dynamicQrImg.style.display = 'block';
      });
    }

    if (btnEnlargeQr) {
      btnEnlargeQr.addEventListener('click', () => {
        const zoomImg = document.getElementById('qr-zoom-img');
        const zoomModal = document.getElementById('qr-zoom-modal');
        if (zoomImg) {
          const isOfficial = btnQrOfficial && btnQrOfficial.classList.contains('active');
          zoomImg.src = isOfficial ? (clubQrImg?.src || 'assets/club-upi-qr.jpg') : (dynamicQrImg?.src || 'assets/club-upi-qr.jpg');
        }
        if (zoomModal) zoomModal.classList.add('active');
      });
    }

    // 6. Copy UPI Buttons
    document.querySelectorAll('.btn-copy-upi').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.copy || btn.previousElementSibling?.textContent?.trim();
        if (!val) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(() => {
            showToast(`📋 UPI আইডি কপি হয়েছে: ${val}`);
          }).catch(() => {
            fallbackCopy(val);
          });
        } else {
          fallbackCopy(val);
        }
      });
    });

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(`📋 UPI আইডি কপি হয়েছে: ${text}`);
      } catch (e) {
        prompt('UPI আইডি কপি করুন:', text);
      }
      document.body.removeChild(ta);
    }

    // 7. Devotee Form Submission (Anti-Fraud & Pending Verification)
    const donationForm = document.getElementById('donation-devotee-form');
    if (donationForm) {
      donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = donationForm.querySelector('button[type="submit"]');
        if (submitBtn && submitBtn.disabled) return;

        const nameInput = document.getElementById('donor-name-input');
        const gotraInput = document.getElementById('donor-gotra-input');
        const phoneInput = document.getElementById('donor-phone-input');
        const villageInput = document.getElementById('donor-village-input');
        const amountInput = document.getElementById('donor-amount-input');
        const methodSelect = document.getElementById('donor-method-select');
        const utrInput = document.getElementById('donor-utr-input');
        const prayerInput = document.getElementById('donor-prayer-input');

        const name = (nameInput?.value || '').trim();
        const gotra = (gotraInput?.value || '').trim() || 'স্বগোত্র';
        const phone = (phoneInput?.value || '').trim();
        const village = (villageInput?.value || '').trim();
        const amt = parseInt(amountInput?.value, 10);
        const method = methodSelect?.value || 'UPI';
        const utr = (utrInput?.value || '').trim();
        const prayer = (prayerInput?.value || '').trim();

        if (!name) {
          alert('অনুগ্রহ করে ভক্তের পূর্ণ নাম লিখুন');
          return;
        }
        if (!phone) {
          alert('অনুগ্রহ করে ১০ সংখ্যার মোবাইল নম্বর লিখুন');
          return;
        }
        if (!village) {
          alert('অনুগ্রহ করে গ্রাম বা এলাকা লিখুন');
          return;
        }
        if (!amt || amt <= 0) {
          alert('অনুগ্রহ করে সঠিক পরিমাণ টাকা নির্বাচন করুন');
          return;
        }
        if (!utr || utr.length < 8) {
          alert('অনুগ্রহ করে আপনার পেমেন্ট অ্যাপ (PhonePe / GPay / Paytm) থেকে ১২ সংখ্যার সঠিক UTR / Transaction ID লিখুন। এটি ছাড়া প্রণামী যাচাই করা সম্ভব নয়।');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.origText = submitBtn.innerHTML;
          submitBtn.innerHTML = '⏳ প্রণামী তথ্য যাচাই ও জমা হচ্ছে...';
        }

        try {
          const donationData = {
            donorName: name,
            gotra: gotra,
            phone: phone,
            village: village,
            amount: amt,
            paymentMethod: method,
            upiIdUsed: activePaymentConfig.primaryUpiId,
            utrNumber: utr,
            receiptNo: `AMF-LK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            prayer: prayer,
            status: 'pending', // Public submission is pending until Admin verification
            timestamp: new Date().toISOString()
          };

          const saved = await window.pujaDB.saveDonation(donationData);

          // Deduplicate into allDonationsList
          const exists = allDonationsList.some(d => (d.id && d.id === saved.id) || (d.receiptNo && d.receiptNo === saved.receiptNo));
          if (!exists) {
            allDonationsList.unshift(saved);
          }

          renderDonationsWall();
          if (state.isAdmin) renderDonationsAdmin();

          // Devotee who submitted can immediately view their pending slip
          verifiedReceiptSessions.add(saved.id);

          window.pujaAudio.playTempleBell();
          triggerPetalShower(35);
          showToast('🙏 প্রণামী তথ্য সফলভাবে জমা হয়েছে! ব্যাংক ভেরিফিকেশনের জন্য অস্থায়ী স্লিপ নিচে প্রস্তুত।');

          displayReceiptModal(saved);

          // Reset form
          donationForm.reset();
          selectedAmount = 101;
          const customInput = document.getElementById('input-custom-amount');
          if (customInput) customInput.value = 101;
          updateUpiAppLinks();
        } catch (err) {
          console.error('Error saving donation:', err);
          alert('প্রণামী তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে পুনরায় চেষ্টা করুন।');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.origText || '🙏 প্রণামী তথ্য জমা দিন ও যাচাইকরণ স্লিপ সংগ্রহ করুন';
          }
        }
      });
    }

    // 8. Receipt Privacy Authentication Modal Handling
    const authForm = document.getElementById('receipt-auth-form');
    const authModal = document.getElementById('receipt-auth-modal');
    const btnCloseAuthModal = document.getElementById('btn-close-receipt-auth-modal');

    const handleReceiptAuthSubmit = () => {
      if (!pendingAuthDonationId) return;
      const donation = allDonationsList.find(d => d.id === pendingAuthDonationId);
      if (!donation) return;

      const phoneInput = document.getElementById('input-auth-mobile');
      const errorMsg = document.getElementById('auth-error-msg');
      const enteredDigits = (phoneInput?.value || '').replace(/[^0-9]/g, '');

      if (enteredDigits.length < 10) {
        if (errorMsg) {
          errorMsg.textContent = 'অনুগ্রহ করে সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন';
          errorMsg.style.display = 'block';
        }
        return;
      }

      const targetDigits = String(donation.phone || '').replace(/[^0-9]/g, '');
      const isMatch = (targetDigits.length >= 10 && targetDigits.slice(-10) === enteredDigits.slice(-10));

      if (isMatch) {
        verifiedReceiptSessions.add(donation.id);
        if (authModal) authModal.classList.remove('active');
        displayReceiptModal(donation);
        showToast(`✅ মোবাইল নম্বর যাচাই সফল! ${donation.donorName}-এর রসিদ প্রদর্শিত হলো।`);
        pendingAuthDonationId = null;
      } else {
        if (errorMsg) {
          errorMsg.textContent = '❌ ভুল মোবাইল নম্বর! এই রসিদটির সাথে আপনার দেওয়া নম্বর মেলেনি। শুধুমাত্র সংশ্লিষ্ট ভক্তই সঠিক মোবাইল নম্বর দিয়ে রসিদ দেখতে ও ডাউনলোড করতে পারবেন।';
          errorMsg.style.display = 'block';
        }
        if (phoneInput) phoneInput.select();
      }
    };

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleReceiptAuthSubmit();
      });
    }

    if (btnCloseAuthModal && authModal) {
      btnCloseAuthModal.addEventListener('click', () => {
        authModal.classList.remove('active');
        pendingAuthDonationId = null;
      });
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          authModal.classList.remove('active');
          pendingAuthDonationId = null;
        }
      });
    }

    // 9. Public Devotee Receipt Search (Requires 10-digit Mobile Verification)
    const btnPublicSearch = document.getElementById('btn-public-receipt-search');
    const inputPublicSearch = document.getElementById('public-receipt-search-input');

    const handlePublicReceiptSearch = () => {
      const rawQuery = (inputPublicSearch?.value || '').trim();
      if (!rawQuery) {
        alert('অনুগ্রহ করে আপনার ১০ সংখ্যার মোবাইল নম্বর লিখুন');
        return;
      }

      const queryDigits = rawQuery.replace(/[^0-9]/g, '');

      // 1. If 10 digits entered -> match directly by phone number
      if (queryDigits.length >= 10) {
        const match = allDonationsList.find(d => {
          const p = String(d.phone || '').replace(/[^0-9]/g, '');
          return p.length >= 10 && p.slice(-10) === queryDigits.slice(-10);
        });

        if (match) {
          // Devotee entered their own phone number -> authenticate and open!
          verifiedReceiptSessions.add(match.id);
          displayReceiptModal(match);
          if (match.status === 'verified') {
            showToast(`✅ ${match.donorName}-এর অনুমোদিত রসিদ পাওয়া গেছে!`);
          } else {
            showToast(`⏳ ${match.donorName}-এর প্রণামী এখনো যাচাইকরণ প্রক্রিয়াধীন রয়েছে।`);
          }
          return;
        }
      }

      // 2. If entered by receiptNo -> find receipt but require phone verification for privacy!
      const cleanText = rawQuery.toLowerCase();
      const matchByRcpt = allDonationsList.find(d => {
        const r = String(d.receiptNo || '').toLowerCase();
        return r.includes(cleanText);
      });

      if (matchByRcpt) {
        // Require phone verification before displaying
        window.requestReceiptAccess(matchByRcpt.id);
        return;
      }

      alert(`"${rawQuery}" দিয়ে কোনো প্রণামী রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে প্রণামী দেওয়ার সময় ব্যবহৃত সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন।`);
    };

    if (btnPublicSearch) btnPublicSearch.addEventListener('click', handlePublicReceiptSearch);
    if (inputPublicSearch) {
      inputPublicSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handlePublicReceiptSearch();
        }
      });
    }

    // 10. Quick Pronami Navigation Buttons (Header, Mandap, Mobile)
    const headerPronamiBtn = document.getElementById('header-btn-pronami');
    if (headerPronamiBtn) {
      headerPronamiBtn.addEventListener('click', () => {
        window.switchTab('donation');
        const donPane = document.getElementById('pane-donation');
        if (donPane) donPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const mandapPronamiBtn = document.getElementById('mandap-banner-btn-pronami');
    if (mandapPronamiBtn) {
      mandapPronamiBtn.addEventListener('click', () => {
        window.switchTab('donation');
        const donPane = document.getElementById('pane-donation');
        if (donPane) donPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const floatPronamiBtn = document.getElementById('floating-mobile-pronami');
    if (floatPronamiBtn) {
      floatPronamiBtn.addEventListener('click', () => {
        window.switchTab('donation');
        const donPane = document.getElementById('pane-donation');
        if (donPane) donPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // 11. Receipt Modal Actions (Secure download & print checks)
    const btnCloseReceipt = document.getElementById('btn-close-receipt-modal');
    const receiptModal = document.getElementById('donation-receipt-modal');
    if (btnCloseReceipt && receiptModal) {
      btnCloseReceipt.addEventListener('click', () => {
        receiptModal.classList.remove('active');
      });
    }

    const btnDownloadImg = document.getElementById('btn-download-receipt-img');
    if (btnDownloadImg) {
      btnDownloadImg.addEventListener('click', () => {
        if (!currentReceiptData) return;
        if (!state.isAdmin && !verifiedReceiptSessions.has(currentReceiptData.id)) {
          alert('নিরাপত্তার স্বার্থে সঠিক মোবাইল নম্বর যাচাই ছাড়া রসিদ ডাউনলোড করা যাবে না।');
          return;
        }
        downloadReceiptAsImage(currentReceiptData);
      });
    }

    const btnPrintReceipt = document.getElementById('btn-print-receipt');
    if (btnPrintReceipt) {
      btnPrintReceipt.addEventListener('click', () => {
        if (!currentReceiptData) return;
        if (!state.isAdmin && !verifiedReceiptSessions.has(currentReceiptData.id)) {
          alert('নিরাপত্তার স্বার্থে সঠিক মোবাইল নম্বর যাচাই ছাড়া রসিদ প্রিন্ট করা যাবে না।');
          return;
        }
        window.print();
      });
    }

    const btnShareWhatsapp = document.getElementById('btn-share-receipt-whatsapp');
    if (btnShareWhatsapp) {
      btnShareWhatsapp.addEventListener('click', () => {
        if (!currentReceiptData) return;
        if (!state.isAdmin && !verifiedReceiptSessions.has(currentReceiptData.id)) {
          alert('নিরাপত্তার স্বার্থে সঠিক মোবাইল নম্বর যাচাই ছাড়া রসিদ শেয়ার করা যাবে না।');
          return;
        }
        const isVer = (currentReceiptData.status === 'verified');
        const statusLabel = isVer ? 'অনুমোদিত রসিদ' : 'যাচাইকরণ প্রক্রিয়াধীন স্লিপ';
        const msg = `🌺 *শ্রী শ্রী কোজাগরী লক্ষ্মী পূজা ২০২৬* 🌺\n` +
          `*আমফান (N.S.C.C) ক্লাব ও পূজা কমিটি*\n` +
          `-----------------------------------------\n` +
          `আমি মা লক্ষ্মীর চরণে ভক্তিভরে প্রণামী অর্পণ করেছি।\n` +
          `📜 *রসিদ নং:* ${currentReceiptData.receiptNo}\n` +
          `👤 *ভক্তের নাম:* ${currentReceiptData.donorName}\n` +
          `🪙 *প্রণামী পরিমাণ:* ₹${currentReceiptData.amount} /- (${convertNumberToBengaliWords(currentReceiptData.amount)})\n` +
          `📌 *স্ট্যাটাস:* ${statusLabel}\n` +
          `-----------------------------------------\n` +
          `"মা লক্ষ্মীর আশীর্বাদে আপনার ও আপনার সমগ্র পরিবারের সুখ, সমৃদ্ধি ও শান্তি বজায় থাকুক।"\n\n` +
          `🙏 ঘরে বসে ভার্চুয়াল দর্শন ও পূজায় অংশগ্রহণ করতে ভিজিট করুন:\n${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      });
    }

    // 12. Admin Settings Toggle & Save
    const btnToggleUpi = document.getElementById('btn-toggle-upi-settings');
    const upiSettingsWrap = document.getElementById('admin-upi-settings-wrap');
    if (btnToggleUpi && upiSettingsWrap) {
      btnToggleUpi.addEventListener('click', () => {
        upiSettingsWrap.style.display = (upiSettingsWrap.style.display === 'none' || !upiSettingsWrap.style.display) ? 'block' : 'none';
      });
    }

    const btnSaveUpi = document.getElementById('btn-save-upi-settings');
    if (btnSaveUpi) {
      btnSaveUpi.addEventListener('click', async () => {
        if (!state.isAdmin) return;
        const pri = (document.getElementById('setting-primary-upi')?.value || '').trim();
        const sec = (document.getElementById('setting-secondary-upi')?.value || '').trim();
        const payee = (document.getElementById('setting-payee-name')?.value || '').trim();
        const qrFileInput = document.getElementById('setting-qr-file');

        if (!pri) {
          alert('প্রাথমিক UPI ID আবশ্যক');
          return;
        }

        let customQrUrl = activePaymentConfig.customQrUrl;

        if (qrFileInput && qrFileInput.files && qrFileInput.files[0]) {
          const file = qrFileInput.files[0];
          customQrUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }

        activePaymentConfig = {
          ...activePaymentConfig,
          primaryUpiId: pri,
          secondaryUpiId: sec,
          payeeName: payee || 'Amfan NSCC Kojagari Laxmi Puja',
          customQrUrl: customQrUrl
        };

        await window.pujaDB.savePaymentConfig(activePaymentConfig);
        updatePaymentUIFromConfig();
        showToast('✅ ক্লাবের UPI ও কিউআর সেটিংস সফলভাবে আপডেট হয়েছে!');
      });
    }

    // 13. Admin Export CSV Button
    const btnExportDonations = document.getElementById('btn-export-donations-csv');
    if (btnExportDonations) {
      btnExportDonations.addEventListener('click', () => {
        window.exportDonationsToCSV();
      });
    }

    // 14. Admin Add Offline / Cash Donation Modal (Verified immediately)
    const btnAdminAddDonation = document.getElementById('btn-admin-add-donation');
    const offlineModal = document.getElementById('admin-offline-donation-modal');
    const btnCloseOffline = document.getElementById('btn-close-offline-donation-modal');
    const offlineForm = document.getElementById('admin-offline-donation-form');

    if (btnAdminAddDonation && offlineModal) {
      btnAdminAddDonation.addEventListener('click', () => {
        offlineModal.classList.add('active');
      });
    }
    if (btnCloseOffline && offlineModal) {
      btnCloseOffline.addEventListener('click', () => {
        offlineModal.classList.remove('active');
      });
    }
    if (offlineForm) {
      offlineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('offline-donor-name')?.value || '').trim();
        const gotra = (document.getElementById('offline-donor-gotra')?.value || '').trim() || 'স্বগোত্র';
        const village = (document.getElementById('offline-donor-village')?.value || '').trim();
        const phone = (document.getElementById('offline-donor-phone')?.value || '').trim();
        const amt = parseInt(document.getElementById('offline-donor-amount')?.value, 10);
        const method = document.getElementById('offline-donor-method')?.value || 'Cash';

        if (!name || !village || !amt || amt <= 0) {
          alert('অনুগ্রহ করে নাম, ঠিকানা ও টাকার পরিমাণ সঠিকভাবে পূরণ করুন');
          return;
        }

        const donationData = {
          donorName: name,
          gotra: gotra,
          phone: phone,
          village: village,
          amount: amt,
          paymentMethod: method,
          upiIdUsed: 'N/A',
          utrNumber: `CASH-${Date.now().toString().slice(-6)}`,
          receiptNo: `AMF-LK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          prayer: 'মণ্ডপে নগদ প্রণামী',
          status: 'verified', // Admin offline donations are verified immediately
          timestamp: new Date().toISOString()
        };

        const saved = await window.pujaDB.saveDonation(donationData);

        const exists = allDonationsList.some(d => (d.id && d.id === saved.id) || (d.receiptNo && d.receiptNo === saved.receiptNo));
        if (!exists) {
          allDonationsList.unshift(saved);
        }

        renderDonationsWall();
        renderDonationsAdmin();
        if (offlineModal) offlineModal.classList.remove('active');

        // Admin who added can view immediately
        verifiedReceiptSessions.add(saved.id);

        window.pujaAudio.playTempleBell();
        triggerPetalShower(30);
        showToast('✅ নতুন নগদ/অফলাইন প্রণামী সফলভাবে সংরক্ষণ হয়েছে!');
        displayReceiptModal(saved);

        offlineForm.reset();
      });
    }

    // 15. Admin Search Input
    const adminSearch = document.getElementById('admin-donor-search');
    if (adminSearch) {
      adminSearch.addEventListener('input', () => {
        renderDonationsAdmin();
      });
    }
  }
  // ==========================================================
  // INITIAL DATA LOADING & LIVE CLOCK
  // ==========================================================
  updateFirebaseUIStatus();
  updateAdminUI();
  setupFirebaseRealtimeListeners();

  await loadPhotos();
  await loadUpdates();
  await loadWishes();
  await loadCommittee();
  initBlessingCard();
  initCommitteeSection();
  await initDonationPortal();

  try {
    const savedDeity = await window.pujaDB.getDeityPhoto();
    if (savedDeity && deityMainImg) {
      deityMainImg.src = savedDeity;
    }
  } catch (err) {
    console.warn('Deity load error:', err);
  }

  const initialDiyas = await window.pujaDB.getCounter('diyas_lit', 142);
  state.diyasLit = initialDiyas;
  if (statDiyas) statDiyas.textContent = initialDiyas;

  // Live Kojagari Countdown / Clock
  function updateLiveClock() {
    const clockEl = document.getElementById('live-tithi-timer');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // Helper Toast notification
  function showToast(message) {
    let toast = document.getElementById('puja-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'puja-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #2b080e;
        color: #fff9e6;
        border: 2px solid var(--color-gold);
        padding: 12px 20px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        z-index: 2000;
        font-size: 0.92rem;
        font-weight: 500;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
        max-width: 90vw;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 4000);
  }

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper Relative Time
  function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diff = Math.floor((new Date() - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPujaApp);
} else {
  initPujaApp();
}