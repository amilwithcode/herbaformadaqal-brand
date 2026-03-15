/**
 * Herbalife Popup Component
 * Vanilla JavaScript popup with accessibility features.
 *
 * FIX: API-dan config əvvəlcə yüklənir, sonra popup göstərilir.
 * Beləliklə ad-soyad həmişə güncel olur.
 */

(function () {
  'use strict';

  const POPUP_STORAGE_KEY    = 'herbalife_popup_shown';
  const POPUP_CONFIG_KEY     = 'herbalife_popup_config';
  const POPUP_CONFIG_VERSION = 'herbalife_popup_config_ts';

  // Default configuration (fullName həmişə API-dan gəlir; title/description dilə görə aşağıdakı çevirilərdən)
  var config = {
    fullName:    'AD SOYAD',
    title:       'Müstəqil Herbalife Tərəfdaşı',
    description: 'İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.',
    updatedAt:   null,
  };

  // Dillərə görə sabit mətnlər (admin yalnız Ad Soyad redaktə edir)
  var translations = {
    az: {
      title:       'Müstəqil Herbalife Tərəfdaşı',
      description: 'İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.',
      closeLabel:  'Popup-ı bağla',
    },
    en: {
      title:       'Independent Herbalife Partner',
      description: 'You are not on the company\'s official site but on an independent partner\'s page.',
      closeLabel:  'Close popup',
    },
    tr: {
      title:       'Bağımsız Herbalife İş Ortağı',
      description: 'Kullanıcı şirketin resmi sitesinde değil, bağımsız bir iş ortağının sayfasındadır.',
      closeLabel:  'Açılır pencereyi kapat',
    },
    ru: {
      title:       'Независимый партнёр Herbalife',
      description: 'Вы находитесь не на официальном сайте компании, а на странице независимого партнёра.',
      closeLabel:  'Закрыть всплывающее окно',
    },
  };

  function getLocale() {
    try {
      var loc = (typeof window !== 'undefined' && window.__HERBALIFE_LOCALE__) || '';
      if (translations[loc]) return loc;
      var match = typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.match(/^\/(az|en|tr|ru)(?:\/|$)/);
      if (match && translations[match[1]]) return match[1];
    } catch (e) { /* ignore */ }
    return 'az';
  }

  /* ── localStorage helpers ── */
  function loadLocalConfig() {
    try {
      var stored = localStorage.getItem(POPUP_CONFIG_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        config = Object.assign({}, config, parsed);
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function saveLocalConfig() {
    try {
      localStorage.setItem(POPUP_CONFIG_KEY, JSON.stringify(config));
      if (config.updatedAt) {
        localStorage.setItem(POPUP_CONFIG_VERSION, config.updatedAt);
      }
    } catch (e) { /* ignore */ }
  }

  function getLocalVersion() {
    try { return localStorage.getItem(POPUP_CONFIG_VERSION) || ''; } catch (e) { return ''; }
  }

  /* ── session check ── */
  function shouldShowPopup() {
    try { return !sessionStorage.getItem(POPUP_STORAGE_KEY); } catch (e) { return true; }
  }

  function markPopupShown() {
    try { sessionStorage.setItem(POPUP_STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
  }

  /* ── HTML helpers ── */
  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function createPopupHTML() {
    var locale = getLocale();
    var t = translations[locale] || translations.az;
    var titleText = t.title;
    var descText = t.description;
    var closeLabelText = t.closeLabel;
    // Ad Soyad həmişə admin/API-dan (config.fullName)
    var nameText = config.fullName;
    return (
      '<div class="herbalife-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="herbalife-popup-title">' +
        '<div class="herbalife-popup-container">' +
          '<button class="herbalife-popup-close" aria-label="' + escapeHtml(closeLabelText) + '" type="button">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
            '</svg>' +
          '</button>' +
          '<div class="herbalife-popup-content">' +
            '<h2 id="herbalife-popup-title" class="herbalife-popup-title">' + escapeHtml(titleText) + '</h2>' +
            '<p class="herbalife-popup-description">' + escapeHtml(descText) + '</p>' +
            '<p class="herbalife-popup-name"><strong>' + escapeHtml(nameText) + '</strong></p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── Focus Trap ── */
  function FocusTrap(container) {
    var els = container.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    this.first = els[0];
    this.last  = els[els.length - 1];
    if (this.first) this.first.focus();
    this._handler = this._onKey.bind(this);
    container.addEventListener('keydown', this._handler);
    this._container = container;
  }
  FocusTrap.prototype._onKey = function (e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === this.first) { e.preventDefault(); if (this.last) this.last.focus(); }
    } else {
      if (document.activeElement === this.last)  { e.preventDefault(); if (this.first) this.first.focus(); }
    }
  };
  FocusTrap.prototype.destroy = function () {
    this._container.removeEventListener('keydown', this._handler);
  };

  /* ── Popup class ── */
  function HerbalifePopup() {
    this.overlay       = null;
    this.focusTrap     = null;
    this.autoCloseTimer = null;
    this._closeHandler = this.close.bind(this);
  }

  HerbalifePopup.prototype.show = function () {
    if (!shouldShowPopup()) return;

    // Render
    var temp = document.createElement('div');
    temp.innerHTML = createPopupHTML();
    this.overlay = temp.firstElementChild;
    document.body.appendChild(this.overlay);

    // Focus trap
    this.focusTrap = new FocusTrap(this.overlay);

    // Close button
    var closeBtn = this.overlay.querySelector('.herbalife-popup-close');
    if (closeBtn) closeBtn.addEventListener('click', this._closeHandler);

    // Prevent scroll
    document.body.style.overflow = 'hidden';

    // Animate in
    var self = this;
    requestAnimationFrame(function () {
      if (self.overlay) {
        self.overlay.classList.add('herbalife-popup-visible');
      }
    });

    markPopupShown();

    // Auto-close after 5 seconds
    var self2 = this;
    this.autoCloseTimer = setTimeout(function () { self2.close(); }, 5000);
  };

  HerbalifePopup.prototype.close = function () {
    if (!this.overlay) return;
    this.overlay.classList.remove('herbalife-popup-visible');
    var self = this;
    setTimeout(function () { self.destroy(); }, 300);
  };

  HerbalifePopup.prototype.destroy = function () {
    if (this.autoCloseTimer) { clearTimeout(this.autoCloseTimer); this.autoCloseTimer = null; }
    if (this.focusTrap)  { this.focusTrap.destroy();  this.focusTrap = null; }
    if (this.overlay) {
      var closeBtn = this.overlay.querySelector('.herbalife-popup-close');
      if (closeBtn) closeBtn.removeEventListener('click', this._closeHandler);
      this.overlay.remove();
      this.overlay = null;
    }
    document.body.style.overflow = '';
  };

  /* ──────────────────────────────────────────────────
   * MAIN ENTRY: Əvvəlcə API-dan config yüklə,
   * sonra popup-u göstər.
   * Bu race condition-u tamamilə həll edir.
   * ────────────────────────────────────────────────── */
  function start() {
    if (!shouldShowPopup()) return; // Artıq bu sessiyada göstərilib

    var finished = false;

    function renderPopup() {
      if (finished) return;
      finished = true;
      new HerbalifePopup().show();
    }

    // 2.5 saniyəlik gözləmə limiti — API gec cavab versə localStorage/default istifadə et
    var fallbackTimer = setTimeout(function () {
      loadLocalConfig(); // stale olsa da, heç-olmasa bir şey göstər
      renderPopup();
    }, 2500);

    // API-dan ən güncel config-i al
    fetch('/api/admin/popup')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        clearTimeout(fallbackTimer);

        if (data && data.fullName) {
          var localVer = getLocalVersion();
          var apiVer   = data.updatedAt || '';

          // API daha yeni versiya qaytarırsa (və ya localStorage boşdursa), yenilə
          if (!localVer || !apiVer || apiVer > localVer) {
            config = Object.assign({}, config, data);
            saveLocalConfig();
          } else {
            // localStorage versiyası daha güncel (mümkünsüz amma ehtiyatla)
            loadLocalConfig();
          }
        } else {
          loadLocalConfig();
        }

        renderPopup();
      })
      .catch(function () {
        clearTimeout(fallbackTimer);
        loadLocalConfig();
        renderPopup();
      });
  }

  /* ── DOM hazır olduqda başlat ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* ── Admin panel üçün global API ── */
  if (typeof window !== 'undefined') {
    window.HerbalifePopup = {
      /**
       * Admin paneldən çağrılır: yeni config-i həm yaddaşa, həm localStorage-a yazır.
       * @param {object} newConfig - { fullName, title, description, updatedAt }
       */
      updateConfig: function (newConfig) {
        config = Object.assign({}, config, newConfig);
        saveLocalConfig();
      },
      getConfig: function () {
        return Object.assign({}, config);
      },
      /**
       * Popup cache-ni sıfırlayır. Növbəti ziyarətdə popup yenidən görünəcək.
       */
      reset: function () {
        try { sessionStorage.removeItem(POPUP_STORAGE_KEY); } catch (e) {}
        try { localStorage.removeItem(POPUP_CONFIG_KEY);    } catch (e) {}
        try { localStorage.removeItem(POPUP_CONFIG_VERSION);} catch (e) {}
      },
    };
  }
})();
