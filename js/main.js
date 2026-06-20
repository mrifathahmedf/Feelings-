/**
 * ============================================
 *  Feelings Website - Main JavaScript
 *  Handles: rendering, search, modals, themes, gallery, settings
 *  সব ফাংশন সহজ-সরল ও কমেন্টেড
 * ============================================
 */

// ──────────── STATE ────────────
const state = {
  currentCategory: null,
  currentTheme: localStorage.getItem('feelings-theme') || 'default',
  fontSize: localStorage.getItem('feelings-fontsize') || '16',
  searchQuery: ''
};

// ──────────── INIT ────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.currentTheme);
  applyFontSize(state.fontSize);
  renderCategories();
  bindEvents();
  showWelcome();
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

  // Filter by search query
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase().trim();
    categories = categories.filter(cat => {
      const matchesCategory = cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
      const matchingItems = cat.items.filter(item =>
        item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
      );
      // Attach filtered items for later rendering
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
        <h3 class="category-card__name">${cat.name.replace(/\(.*\)/, '')}</h3>
        <p class="category-card__desc">${cat.description}</p>
      </div>
    `;
  }).join('');

  // Attach click listeners
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

  const itemsHTML = items.map(item => `
    <div class="item-card ${item.type || ''}" data-item-id="${item.id}">
      <span class="item-card__title">${item.title}</span>
      <span class="item-card__arrow">→</span>
    </div>
  `).join('');

  grid.innerHTML = `
    <h2 style="color: ${category.color}; margin-bottom: 1rem; font-size: 1.5rem;">
      ${category.name}
    </h2>
    <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">${category.description}</p>
    ${itemsHTML}
  `;

  // Click handlers for items
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
  // Check for gallery type
  if (item.type === 'gallery' && item.images) {
    showGalleryModal(item);
    return;
  }

  // Check for video type
  if (item.type === 'video' && item.videoId) {
    showVideoModal(item);
    return;
  }

  // Regular content modal
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

  // Close handlers
  const closeBtn = overlay.querySelector('.modal__close');
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
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
          ${item.images.map(img => `
            <img src="${img}" alt="Gallery photo" loading="lazy" class="gallery-img">
          `).join('')}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close
  overlay.querySelector('.modal__close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Lightbox on image click
  overlay.querySelectorAll('.gallery-img').forEach(img => {
    img.addEventListener('click', () => {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = `
        <button class="lightbox__close">✕</button>
        <img src="${img.src}" alt="Full size photo">
      `;
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
      <div class="modal__header">
        <h3 class="modal__title">${item.title}</h3>
        <button class="modal__close">✕</button>
      </div>
      <div class="modal__body">
        <div class="video-wrapper">
          <iframe src="https://www.youtube.com/embed/${item.videoId}"
                  title="YouTube video" allowfullscreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
          </iframe>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal__close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ──────────── GO BACK TO CATEGORIES ────────────
function goBack() {
  state.currentCategory = null;
  document.getElementById('back-btn').style.display = 'none';
  document.getElementById('search-wrapper').style.display = 'block';
  document.getElementById('search-input').value = '';
  state.searchQuery = '';
  document.getElementById('search-clear').classList.remove('visible');
  renderCategories();
}

// ──────────── BIND GLOBAL EVENTS ────────────
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

  // Settings
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', () => {
      settingsPanel.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!settingsToggle.contains(e.target) && !settingsPanel.contains(e.target)) {
        settingsPanel.classList.remove('open');
      }
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

  // Font size slider
  const fontSizeSlider = document.getElementById('font-size-slider');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', (e) => {
      const size = e.target.value;
      state.fontSize = size;
      localStorage.setItem('feelings-fontsize', size);
      applyFontSize(size);
    });
  }

  // Feedback form
  const feedbackBtn = document.getElementById('feedback-btn');
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackBtn && feedbackForm) {
    feedbackBtn.addEventListener('click', () => {
      feedbackForm.classList.toggle('open');
    });
  }

  // Keyboard shortcut: ESC to go back
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.currentCategory) {
      goBack();
    }
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

  // Update active button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeName);
  });

  showToast(`থিম "${theme.name}" প্রয়োগ করা হয়েছে ✨`);
}

// ──────────── APPLY FONT SIZE ────────────
function applyFontSize(size) {
  document.documentElement.style.fontSize = size + 'px';
}

// ──────────── SHOW TOAST ────────────
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ──────────── UTILITIES ────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
