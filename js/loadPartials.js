// loadPartials.js — partial loader + burger + SEARCH OVERLAY + SLIDING HEADER
document.addEventListener('DOMContentLoaded', loadPartials);

async function loadPartials() {
  // --- Base path helpers (works locally or on subdirs)
  const clean = (s) => s.replace(/\/+$/,'');
  const parts = clean(location.pathname).split('/').filter(Boolean);
  const projectBase = parts.length ? '/' + parts[0] + '/' : '/';
  const currentDir = '/' + parts.slice(0, -1).join('/') + (parts.length > 1 ? '/' : '/');

  const DIRS = ['', 'partials/', 'includes/', '_includes/', 'fragments/', 'components/', 'shared/', 'templates/'];

  const makeCandidates = (filename) => {
    const c = [];
    c.push(currentDir + filename);
    for (const d of DIRS) c.push(projectBase + d + filename);
    return [...new Set(c)];
  };

  const fetchFirstOk = async (filename) => {
    for (const url of makeCandidates(filename)) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) return { url, text: await res.text() };
      } catch(_) {}
    }
    return null;
  };

  // --- Inject header/footer if hosts exist
  const headerHost = document.getElementById('header-container');
  const footerHost = document.getElementById('footer-container');

  if (headerHost) {
    const header = await fetchFirstOk('header.html');
    if (header) headerHost.innerHTML = header.text;
  }
  if (footerHost) {
    const footer = await fetchFirstOk('footer.html');
    if (footer) footerHost.innerHTML = footer.text;
  }

  // After header is in DOM, init features
  initHeaderSpacer();        // sets --header-height
  initSlidingHeader();       // hide on down / show on up
  initBurgerMenu();          // menu-open toggle
  initSearchOverlay(projectBase); // overlay with page lock

  // Keep spacer correct on load/resize
  window.addEventListener('load', initHeaderSpacer);
  window.addEventListener('resize', debounce(initHeaderSpacer, 150));
}

/* ===================== Header spacer (prevents layout jump) ===================== */
function initHeaderSpacer() {
  const headerEl = document.querySelector('.header-area');
  if (!headerEl) return;

  let spacer = document.querySelector('.header-spacer');
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.className = 'header-spacer';
    const main = document.querySelector('main') || document.body;
    main.parentNode.insertBefore(spacer, main);
  }
  const h = Math.max(56, Math.round(headerEl.getBoundingClientRect().height));
  document.documentElement.style.setProperty('--header-height', h + 'px');
}

/* ===================== Sliding Header (hide down / show up) ===================== */
function initSlidingHeader() {
  const headerEl = document.querySelector('.header-area');
  if (!headerEl) return;

  // Start visible by default
  document.body.classList.add('header--visible');

  let lastY = window.scrollY || 0;
  let direction = 'up'; // last direction
  const HIDE_THRESHOLD = 14;
  const SHOW_THRESHOLD = 6;
  const PIN_AT_TOP = 4;

  const onScroll = () => {
    const y = window.scrollY || 0;
    const delta = y - lastY;

    // Styling flag
    if (y > 2) document.body.classList.add('header--scrolled');
    else document.body.classList.remove('header--scrolled');

    // Keep visible when overlays are open
    const forceVisible = document.body.classList.contains('menu-open') ||
                         document.body.classList.contains('search-open');

    if (y <= PIN_AT_TOP || forceVisible) {
      document.body.classList.add('header--visible');
      document.body.classList.remove('header--hidden');
      lastY = y;
      return;
    }

    if (delta > HIDE_THRESHOLD && direction !== 'down') {
      direction = 'down';
      document.body.classList.remove('header--visible');
      document.body.classList.add('header--hidden');
    } else if (delta < -SHOW_THRESHOLD && direction !== 'up') {
      direction = 'up';
      document.body.classList.add('header--visible');
      document.body.classList.remove('header--hidden');
    }

    lastY = y;
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
}

/* ===================== Burger (mobile) ===================== */
function initBurgerMenu(){
  const hamburger = document.querySelector('.hamburger-menu-icon');
  const mainHeader = document.getElementById('main-header');
  const navOverlay = mainHeader ? mainHeader.querySelector('.main-nav') : null;

  if (hamburger && navOverlay) {
    const toggleMenu = () => {
      document.body.classList.toggle('menu-open');
      // keep header visible when menu opens
      if (document.body.classList.contains('menu-open')) {
        document.body.classList.add('header--visible');
        document.body.classList.remove('header--hidden');
      }
    };
    hamburger.addEventListener('click', toggleMenu);
    navOverlay.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => document.body.classList.remove('menu-open'))
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') document.body.classList.remove('menu-open');
    });
  }
}

/* ===================== SEARCH OVERLAY ===================== */
function initSearchOverlay(projectBase){
  const openBtn = document.getElementById('header-search-toggle');
  const overlay  = document.getElementById('search-overlay');
  const input    = document.getElementById('search-overlay-input');
  const grid     = document.getElementById('search-overlay-grid');
  const stats    = document.getElementById('search-overlay-stats');
  const closeBtn = document.getElementById('search-overlay-close');

  if (!openBtn || !overlay || !input || !grid || !stats) return;

  // prefer global allFilms, else fetch same JSON as catalogue
  const getAllFilms = async () => {
    if (Array.isArray(window.allFilms) && window.allFilms.length) return window.allFilms;
    try {
      const r = await fetch(projectBase + 'data/all_html_data.json', { cache: 'no-cache' });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  let FILMS_CACHE = null;

  // Scroll guards (lock background, allow panel)
  const isInsidePanel = (target) => !!(target && target.closest('.search-overlay__panel'));
  const wheelGuard = (e) => {
    if (!document.body.classList.contains('search-open')) return;
    if (!isInsidePanel(e.target)) e.preventDefault();
  };
  const touchGuard = (e) => {
    if (!document.body.classList.contains('search-open')) return;
    if (!isInsidePanel(e.target)) e.preventDefault();
  };

  const addScrollGuards = () => {
    document.addEventListener('wheel', wheelGuard, { passive: false });
    document.addEventListener('touchmove', touchGuard, { passive: false });
  };
  const removeScrollGuards = () => {
    document.removeEventListener('wheel', wheelGuard, { passive: false });
    document.removeEventListener('touchmove', touchGuard, { passive: false });
  };

  const open = async () => {
    overlay.hidden = false;
    document.body.classList.add('search-open');
    // keep header visible when opening search
    document.body.classList.add('header--visible');
    document.body.classList.remove('header--hidden');
    openBtn.setAttribute('aria-expanded', 'true');

    if (!FILMS_CACHE) {
      FILMS_CACHE = await getAllFilms();
    }
    input.value = '';
    render();
    setTimeout(() => input.focus(), 0);
    addScrollGuards();
  };

  const close = () => {
    document.body.classList.remove('search-open');
    overlay.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    removeScrollGuards();
  };

  const normalize = (v) => (v ?? '').toString().toLowerCase();

  const filterFilms = () => {
    const q = normalize(input.value);
    if (!q) return FILMS_CACHE;

    return FILMS_CACHE.filter(item => {
      const F = item.Film || {};
      const C = item.Crew || {};
      const hay = [
        F.Title_English, F.Title_Original,
        C['Director(s)'],
        item.Logline, item.Synopsis
      ].map(x => normalize(x)).join(' ');
      return hay.includes(q);
    });
  };

  const render = () => {
    if (!Array.isArray(FILMS_CACHE)) return;
    const filtered = filterFilms();

    stats.textContent = filtered.length
      ? `${filtered.length} films`
      : (input.value ? `No results for “${input.value}”` : 'No films loaded');

    // Use catalogue's card renderer if available
    if (typeof window.displayFilms === 'function') {
      window.displayFilms(filtered, 'search-overlay-grid');
    } else {
      // Minimal fallback
      grid.innerHTML = filtered.map(f => {
        const F = f.Film || {};
        const title = (F.Title_English || F.Title_Original || 'Untitled').trim();
        const folder = (f.Source_File || '').replace(/\.html$/i, '').toLowerCase();
        const img = folder ? `images/stills/${folder}/${folder}_1.jpg` : '';
        return `
          <a class="preview-item-link" href="film_pages/${folder}.html">
            <div class="preview-item">
              <h3 class="film-card-title-meta">${escapeHtml(title)}</h3>
              <div class="news-item-image-wrapper">
                <img src="${escapeHtml(img)}" alt="Still from ${escapeHtml(title)}">
              </div>
            </div>
          </a>
        `;
      }).join('');
    }
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.querySelector('[data-close-search]')?.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-search]')) close();
  });

  input.addEventListener('input', render);
}

/* ===================== utils ===================== */
function debounce(fn, wait=150) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
