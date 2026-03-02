/**
 * Herbalife Popup Component
 * Vanilla JavaScript popup with accessibility features
 */

(function () {
  'use strict';

  const POPUP_STORAGE_KEY = 'herbalife_popup_shown';
  const POPUP_CONFIG_KEY = 'herbalife_popup_config';

  // Default configuration
  let config = {
    fullName: 'AD SOYAD',
    title: 'Müstəqil Herbalife Tərəfdaşı',
    description: 'İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.',
  };

  // Load config from localStorage or API
  function loadConfig() {
    try {
      const stored = localStorage.getItem(POPUP_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        config = { ...config, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load popup config:', e);
    }
  }

  // Check if popup should be shown
  function shouldShowPopup() {
    if (typeof sessionStorage === 'undefined') return true;
    const shown = sessionStorage.getItem(POPUP_STORAGE_KEY);
    return !shown;
  }

  // Mark popup as shown
  function markPopupShown() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(POPUP_STORAGE_KEY, 'true');
    }
  }

  // Create popup HTML
  function createPopupHTML() {
    return `
      <div class="herbalife-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="herbalife-popup-title">
        <div class="herbalife-popup-container">
          <button 
            class="herbalife-popup-close" 
            aria-label="Popup-ı bağla"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="herbalife-popup-content">
            <h2 id="herbalife-popup-title" class="herbalife-popup-title">${escapeHtml(config.title)}</h2>
            <p class="herbalife-popup-description">${escapeHtml(config.description)}</p>
            <p class="herbalife-popup-name">
              <strong>${escapeHtml(config.fullName)}</strong>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Focus trap implementation
  class FocusTrap {
    constructor(container) {
      this.container = container;
      this.firstFocusable = null;
      this.lastFocusable = null;
      this.boundKeyHandler = this.handleKeyDown.bind(this);
      this.init();
    }

    init() {
      const focusableElements = this.container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      this.firstFocusable = focusableElements[0];
      this.lastFocusable = focusableElements[focusableElements.length - 1];
      
      if (this.firstFocusable) {
        this.firstFocusable.focus();
      }
      
      this.container.addEventListener('keydown', this.boundKeyHandler);
    }

    handleKeyDown(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable?.focus();
        }
      }
    }

    destroy() {
      this.container.removeEventListener('keydown', this.boundKeyHandler);
    }
  }

  // Popup class
  class HerbalifePopup {
    constructor() {
      this.overlay = null;
      this.focusTrap = null;
      this.boundEscapeHandler = this.handleEscape.bind(this);
      this.boundCloseHandler = this.close.bind(this);
      this.boundOverlayClickHandler = this.handleOverlayClick.bind(this);
    }

    init() {
      if (!shouldShowPopup()) return;

      loadConfig();
      this.render();
      this.attachEvents();
      this.show();
      markPopupShown();
    }

    render() {
      const temp = document.createElement('div');
      temp.innerHTML = createPopupHTML();
      this.overlay = temp.firstElementChild;
      document.body.appendChild(this.overlay);
      
      // Initialize focus trap
      this.focusTrap = new FocusTrap(this.overlay);
    }

    attachEvents() {
      const closeBtn = this.overlay.querySelector('.herbalife-popup-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', this.boundCloseHandler);
      }

      // Escape key handler
      document.addEventListener('keydown', this.boundEscapeHandler);

      // Overlay click handler (close on backdrop click)
      this.overlay.addEventListener('click', this.boundOverlayClickHandler);
    }

    handleEscape(e) {
      if (e.key === 'Escape' && this.overlay) {
        this.close();
      }
    }

    handleOverlayClick(e) {
      // Close only if clicking directly on overlay (not on popup content)
      if (e.target === this.overlay) {
        this.close();
      }
    }

    show() {
      if (!this.overlay) return;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Trigger animation
      requestAnimationFrame(() => {
        this.overlay.classList.add('herbalife-popup-visible');
      });
    }

    close() {
      if (!this.overlay) return;

      // Remove visible class for fade-out animation
      this.overlay.classList.remove('herbalife-popup-visible');
      
      // Wait for animation to complete
      setTimeout(() => {
        this.destroy();
      }, 300);
    }

    destroy() {
      if (this.focusTrap) {
        this.focusTrap.destroy();
        this.focusTrap = null;
      }

      if (this.overlay) {
        const closeBtn = this.overlay.querySelector('.herbalife-popup-close');
        if (closeBtn) {
          closeBtn.removeEventListener('click', this.boundCloseHandler);
        }

        document.removeEventListener('keydown', this.boundEscapeHandler);
        this.overlay.removeEventListener('click', this.boundOverlayClickHandler);
        
        this.overlay.remove();
        this.overlay = null;
      }

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  // Initialize on DOM ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const popup = new HerbalifePopup();
        popup.init();
      });
    } else {
      const popup = new HerbalifePopup();
      popup.init();
    }
  }

  // Fetch config from API on load (optional, for admin updates)
  function fetchConfigFromAPI() {
    fetch('/api/admin/popup')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.fullName) {
          config = { ...config, ...data };
          localStorage.setItem(POPUP_CONFIG_KEY, JSON.stringify(config));
        }
      })
      .catch(() => {
        // Silently fail if API is not available
      });
  }

  // Start initialization
  init();
  fetchConfigFromAPI();

  // Expose updateConfig for admin panel
  if (typeof window !== 'undefined') {
    window.HerbalifePopup = {
      updateConfig: function(newConfig) {
        config = { ...config, ...newConfig };
        localStorage.setItem(POPUP_CONFIG_KEY, JSON.stringify(config));
      },
      getConfig: function() {
        return { ...config };
      },
      reset: function() {
        sessionStorage.removeItem(POPUP_STORAGE_KEY);
        localStorage.removeItem(POPUP_CONFIG_KEY);
      }
    };
  }
})();
