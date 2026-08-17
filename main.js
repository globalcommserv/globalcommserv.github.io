const SHORTCODES = [
  { selector: 'site-header', source: 'header.html' },
  { selector: 'site-footer', source: 'footer.html' }
];

async function loadShortcodes() {
  await Promise.all(SHORTCODES.map(async ({ selector, source }) => {
    const placeholders = document.querySelectorAll(selector);
    if (!placeholders.length) return;

    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Unable to load ${source}: ${response.status}`);
    }

    const markup = await response.text();
    const template = document.createElement('template');
    template.innerHTML = markup;
    placeholders.forEach((placeholder) => {
      placeholder.replaceWith(template.content.cloneNode(true));
    });
  }));
}

function setActiveNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('[data-active-pages]').forEach((link) => {
    const activePages = link.dataset.activePages.split(' ');
    const isActive = activePages.includes(currentPage);
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function initializeSite() {
  const mobileToggle = document.querySelector('.mobile-toggle, .menu-button');
  const nav = document.querySelector('.nav');
  const desktop = window.matchMedia('(min-width: 901px)');
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  if (mobileToggle && nav) {
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.addEventListener('click', () => {
      if (desktop.matches) return;
      const open = nav.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(open));
    });
  }

  dropdowns.forEach((dropdown) => {
    const summary = dropdown.querySelector('summary');
    if (!summary) return;

    let closeTimer = null;
    const cancelClose = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    const openDesktopMenu = () => {
      if (!desktop.matches) return;
      cancelClose();
      dropdown.open = true;
    };
    const scheduleDesktopClose = () => {
      if (!desktop.matches) return;
      cancelClose();
      closeTimer = window.setTimeout(() => {
        if (!dropdown.matches(':hover') && !dropdown.contains(document.activeElement)) {
          dropdown.open = false;
        }
      }, 140);
    };

    // Desktop: pointer and keyboard focus control the native details state.
    // The submenu is inside the details element, so moving into it keeps the
    // pointer within the same dropdown and it stays open reliably.
    dropdown.addEventListener('pointerenter', openDesktopMenu);
    dropdown.addEventListener('pointerleave', scheduleDesktopClose);
    dropdown.addEventListener('focusin', openDesktopMenu);
    dropdown.addEventListener('focusout', (event) => {
      if (desktop.matches && !dropdown.contains(event.relatedTarget)) {
        scheduleDesktopClose();
      }
    });

    // On desktop, clicking the label should open/keep open rather than toggle
    // closed. On mobile, preserve the native <details> tap behavior.
    summary.addEventListener('click', (event) => {
      if (desktop.matches) {
        event.preventDefault();
        openDesktopMenu();
      }
    });

    dropdown.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        cancelClose();
        dropdown.open = false;
        summary.focus();
      }
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!desktop.matches) return;
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) dropdown.open = false;
    });
  });

  desktop.addEventListener('change', (event) => {
    dropdowns.forEach((dropdown) => { dropdown.open = false; });
    if (event.matches && nav) nav.classList.remove('open');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
  });

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadShortcodes();
    setActiveNavigation();
    initializeSite();
  } catch (error) {
    console.error('Shortcode loading failed:', error);
  }
});
