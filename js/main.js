/**
 * ============================================
 *  Feelings Website - Main JavaScript
 *  Handles: rendering, search, modals, themes, gallery, social follow prompt
 * ============================================
 */

// ──────────── STATE ────────────
const state = {
  currentCategory: null,
  currentTheme: localStorage.getItem('feelings-theme') || 'default',
  fontSize: localStorage.getItem('feelings-fontsize') || '16',
  searchQuery: '',
  // Social prompt tracking (session only)
  socialShown: JSON.parse(sessionStorage.getItem('feelings-social-shown') || '[]'),
  socialFollowed: JSON.parse(sessionStorage.getItem('feelings-social-followed') || '[]'),
  socialSkipCount: parseInt(sessionStorage.getItem('feelings-social-skips') || '0'),
  socialTimer: null
};

// ──────────── INIT ────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.currentTheme);
  applyFontSize(state.fontSize);
  renderCategories();
  bindEvents();
  showWelcome();
  // Show social follow prompt after welcome toast fades
  setTimeout(showSocialPrompt, 5000);
});

// ──────────── WELCOME TOAST ────────────
function showWelcome() {
  const toast = document.getElementById('welcome-toast');
  if (!toast) return;
  toast.textContent = SITE_DATA.site.welcomeMessage;
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// ──────────── RENDER CATEGORIES ────────────
function renderCategories(filterQuery = '') {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  let categories = SITE_DATA.categories;

  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase().trim();
    categories = categories.filter(cat => {
      const matchesCategory = cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
      const matchingItems = cat.items.filter(item =>
        item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
      );
      cat._filteredItems = matchingItems;
      return matchesCategory || matchingItems.length > 0;
    });
  }

  if (categories.length === 0) {
    grid.innerHTML = '<div class="search-no-results">😔 কিছু পাওয়া যায় নি। ভিন্ন কীওয়ার্ড দিয়ে চেষ্টা করুন।</div>';
    return;
  }

  grid.innerHTML = categories.map((cat, i) => {
    const color = cat.color || 'var(--color-accent)';
    return `
      <div class="category-card"
           style="--cat-color: ${color}; animation-delay: ${i * 0.05}s"
           data-category="${cat.id}">
        <span class="category-card__icon">${cat.icon || '📄'}</span>
        <span class="category-card__count">${cat.items.length} টি</span>
        <h3 class="category-card__name">${cat.name}</h3>
        <p class="category-card__desc">${cat.description}</p>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const catId = card.dataset.category;
      const category = SITE_DATA.categories.find(c => c.id === catId);
      if (category) showCategoryItems(category);
    });
  });
}

// ──────────── SHOW CATEGORY ITEMS ────────────
function showCategoryItems(category) {
  state.currentCategory = category;
  const grid = document.getElementById('categories-grid');
  const backBtn = document.getElementById('back-btn');
  const searchWrap = document.getElementById('search-wrapper');

  grid.innerHTML = '';
  backBtn.style.display = 'inline-flex';
  searchWrap.style.display = 'none';

  const items = category._filteredItems || category.items;

  grid.innerHTML = `
    <h2 style="color: ${category.color}; margin-bottom: 1rem; font-size: 1.3rem; font-weight: 700;">
      ${category.name}
    </h2>
    <p style="color: var(--color-text-muted); margin-bottom: 1.5rem; font-size: 0.9rem;">${category.description}</p>
    ${items.map(item => `
      <div class="item-card ${item.type || ''}" data-item-id="${item.id}">
        <span class="item-card__title">${item.title}</span>
        <span class="item-card__arrow">→</span>
      </div>
    `).join('')}
  `;

  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const itemId = card.dataset.itemId;
      const item = category.items.find(i => i.id === itemId);
      if (item) showItemModal(item, category);
    });
  });
}

// ──────────── SHOW ITEM IN MODAL ────────────
function showItemModal(item, category) {
  if (item.type === 'gallery' && item.images) { showGalleryModal(item); return; }
  if (item.type === 'video' && item.videoId) { showVideoModal(item); return; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title" style="color: ${category.color || 'var(--color-accent)'}">${item.title}</h3>
        <button class="modal__close" aria-label="Close">✕</button>
      </div>
      <div class="modal__body ${category.id === 'poetries' ? 'poetry' : category.id === 'stories' ? 'story' : ''}">
        ${escapeHtml(item.content)}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.modal__close');
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
  });
}

// ──────────── GALLERY MODAL ────────────
function showGalleryModal(item) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">${item.title}</h3>
        <button class="modal__close">✕</button>
      </div>
      <div class="modal__body">
        <div class="gallery-grid">
          ${item.images.map(img => `<img src="${img}" alt="Gallery" loading="lazy" class="gallery-img">`).join('')}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal__close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelectorAll('.gallery-img').forEach(img => {
    img.addEventListener('click', () => {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = `<button class="lightbox__close">✕</button><img src="${img.src}" alt="Full size">`;
      document.body.appendChild(lb);
      lb.addEventListener('click', () => lb.remove());
      document.addEventListener('keydown', function escH(e) {
        if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', escH); }
      });
    });
  });
}

// ──────────── VIDEO MODAL ────────────
function showVideoModal(item) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__header"><h3 class="modal__title">${item.title}</h3><button class="modal__close">✕</button></div>
      <div class="modal__body">
        <div class="video-wrapper">
          <iframe src="https://www.youtube.com/embed/${item.videoId}" title="YouTube video" allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal__close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ──────────── GO BACK ────────────
function goBack() {
  state.currentCategory = null;
  document.getElementById('back-btn').style.display = 'none';
  document.getElementById('search-wrapper').style.display = 'block';
  document.getElementById('search-input').value = '';
  state.searchQuery = '';
  document.getElementById('search-clear').classList.remove('visible');
  renderCategories();
}

// ============================================================
//  SOCIAL FOLLOW PROMPT SYSTEM
// ============================================================

function getAvailablePlatforms() {
  // Get platforms not yet shown or followed
  const allKeys = Object.keys(SITE_DATA.social);
  return allKeys.filter(key =>
    !state.socialShown.includes(key) && !state.socialFollowed.includes(key)
  );
}

function showSocialPrompt() {
  // Don't show if user is on a category sub-page
  if (state.currentCategory) return;

  // Don't show if already showing a prompt
  if (document.querySelector('.social-prompt.visible')) return;

  // Don't show if skipped too many times (max 3)
  if (state.socialSkipCount >= 3) return;

  const available = getAvailablePlatforms();
  if (available.length === 0) return;

  // Pick a random platform
  const key = available[Math.floor(Math.random() * available.length)];
  const platform = SITE_DATA.social[key];

  // Mark as shown
  state.socialShown.push(key);
  saveSocialState();

  // Remove any existing prompt
  const existing = document.querySelector('.social-prompt');
  if (existing) existing.remove();

  // Build prompt HTML
  const prompt = document.createElement('div');
  prompt.className = 'social-prompt';
  prompt.dataset.platform = key;
  prompt.innerHTML = `
    <button class="social-prompt__close" aria-label="Close">✕</button>
    <div class="social-prompt__icon" style="background: ${platform.color}">
      ${getSocialIcon(platform.icon)}
    </div>
    <div class="social-prompt__text">
      <strong>${platform.name}-এ ফলো করুন</strong>
      <span>আমার কন্টেন্ট মিস করবেন না!</span>
    </div>
    <div class="social-prompt__actions">
      <a href="${platform.url}" target="_blank" rel="noopener" class="social-prompt__btn social-prompt__btn--follow">
        ফলো করুন
      </a>
      <button class="social-prompt__btn social-prompt__btn--skip">
        পরে দেখবো
      </button>
    </div>
  `;

  document.body.appendChild(prompt);
  requestAnimationFrame(() => prompt.classList.add('visible'));

  // Follow button click
  const followBtn = prompt.querySelector('.social-prompt__btn--follow');
  followBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(platform.url, '_blank');
    // Mark as followed
    state.socialFollowed.push(key);
    saveSocialState();
    // Show thank you
    prompt.classList.add('thank-you');
    prompt.querySelector('.social-prompt__text').innerHTML = `
      <strong>ধন্যবাদ! 🤍</strong>
      <span>${platform.name}-এ ফলো করার জন্য কৃতজ্ঞ</span>
    `;
    prompt.querySelector('.social-prompt__actions').innerHTML = '';
    // Hide after 3 seconds
    setTimeout(() => {
      prompt.classList.remove('visible');
      setTimeout(() => prompt.remove(), 500);
    }, 3000);
    clearTimeout(state.socialTimer);
  });

  // Skip button click
  const skipBtn = prompt.querySelector('.social-prompt__btn--skip');
  skipBtn.addEventListener('click', () => {
    state.socialSkipCount++;
    saveSocialState();
    prompt.classList.remove('visible');
    setTimeout(() => prompt.remove(), 500);
    // Show next after 3 seconds
    clearTimeout(state.socialTimer);
    state.socialTimer = setTimeout(showSocialPrompt, 3000);
  });

  // Close button (X) - same as skip
  const closeBtn = prompt.querySelector('.social-prompt__close');
  closeBtn.addEventListener('click', () => {
    state.socialSkipCount++;
    saveSocialState();
    prompt.classList.remove('visible');
    setTimeout(() => prompt.remove(), 500);
    clearTimeout(state.socialTimer);
    state.socialTimer = setTimeout(showSocialPrompt, 3000);
  });
}

function getSocialIcon(iconName) {
  const icons = {
    facebook: `<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`
  };
  return icons[iconName] || '';
}

function saveSocialState() {
  sessionStorage.setItem('feelings-social-shown', JSON.stringify(state.socialShown));
  sessionStorage.setItem('feelings-social-followed', JSON.stringify(state.socialFollowed));
  sessionStorage.setItem('feelings-social-skips', state.socialSkipCount.toString());
}

// ──────────── BIND EVENTS ────────────
function bindEvents() {
  // Search
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      searchClear.classList.toggle('visible', e.target.value.length > 0);
      renderCategories(e.target.value);
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      searchClear.classList.remove('visible');
      renderCategories();
      searchInput.focus();
    });
  }

  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', goBack);

  // Settings toggle
  const st = document.getElementById('settings-toggle');
  const sp = document.getElementById('settings-panel');
  if (st && sp) {
    st.addEventListener('click', () => sp.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!st.contains(e.target) && !sp.contains(e.target)) sp.classList.remove('open');
    });
  }

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      state.currentTheme = theme;
      localStorage.setItem('feelings-theme', theme);
      applyTheme(theme);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Font size
  const fs = document.getElementById('font-size-slider');
  if (fs) {
    fs.addEventListener('input', (e) => {
      const size = e.target.value;
      state.fontSize = size;
      localStorage.setItem('feelings-fontsize', size);
      applyFontSize(size);
    });
  }

  // Feedback
  const fbBtn = document.getElementById('feedback-btn');
  const fbForm = document.getElementById('feedback-form');
  if (fbBtn && fbForm) {
    fbBtn.addEventListener('click', () => fbForm.classList.toggle('open'));
  }

  // ESC to go back
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.currentCategory) goBack();
  });
}

// ──────────── APPLY THEME ────────────
function applyTheme(themeName) {
  const theme = SITE_DATA.themes[themeName];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-card-bg', theme.cardBg);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeName);
  });
  showToast(`থিম "${theme.name}" প্রয়োগ ✨`);
}

// ──────────── FONT SIZE ────────────
function applyFontSize(size) {
  document.documentElement.style.fontSize = size + 'px';
}

// ──────────── TOAST ────────────
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ──────────── UTIL ────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
