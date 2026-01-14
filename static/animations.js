// ======================================
// Pharmacy App Animation & Interaction JS
// ======================================

// === LOADING SPINNER ===
class LoadingSpinner {
  constructor() {
    this.spinner = document.getElementById('spinner-container');
    this.forms = document.querySelectorAll('form[data-loading="true"]');
    this.init();
  }

  init() {
    if (this.forms) {
      this.forms.forEach(form => {
        form.addEventListener('submit', (e) => this.showSpinner(e));
      });
    }
  }

  showSpinner(event) {
    // Don't show spinner for certain actions
    if (event.target.querySelector('button[type="submit"]').dataset.noSpinner) {
      return;
    }
    if (this.spinner) {
      this.spinner.classList.add('show');
    }
  }

  hideSpinner() {
    if (this.spinner) {
      this.spinner.classList.remove('show');
    }
  }
}

// === ALERT AUTO-DISMISS ===
class AlertManager {
  constructor(autoDismissTime = 5000) {
    this.autoDismissTime = autoDismissTime;
    this.init();
  }

  init() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
      // Add close button if not present
      if (!alert.querySelector('.btn-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close';
        closeBtn.setAttribute('data-bs-dismiss', 'alert');
        closeBtn.setAttribute('aria-label', 'Close');
        alert.appendChild(closeBtn);
      }

      // Auto-dismiss after time
      if (alert.classList.contains('alert-success') || alert.classList.contains('alert-info')) {
        setTimeout(() => {
          this.dismissAlert(alert);
        }, this.autoDismissTime);
      }

      // Manual dismiss on close button
      const closeBtn = alert.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.dismissAlert(alert));
      }
    });
  }

  dismissAlert(alert) {
    alert.classList.add('fade-out');
    setTimeout(() => {
      alert.remove();
    }, 400);
  }
}

// === FORM VALIDATION ANIMATIONS ===
class FormValidator {
  constructor() {
    this.forms = document.querySelectorAll('form');
    this.init();
  }

  init() {
    this.forms.forEach(form => {
      form.addEventListener('submit', (e) => this.validateForm(e, form));
      form.addEventListener('input', (e) => this.validateField(e.target));
    });
  }

  validateField(field) {
    if (field.classList.contains('form-control') || field.classList.contains('form-select')) {
      // Remove invalid class on input
      if (field.value.trim() !== '') {
        field.classList.remove('is-invalid');
      }
    }
  }

  validateForm(e, form) {
    if (!form.checkValidity() === false) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    form.classList.add('was-validated');
  }
}

// === SMOOTH SCROLL ===
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// === PAGE LOAD ANIMATION ===
function initPageLoad() {
  // Add fade-in class to main content
  const mainContent = document.querySelector('main') || document.querySelector('.container');
  if (mainContent) {
    mainContent.classList.add('fade-in');
  }

  // Fade out loading spinner if page loads successfully
  window.addEventListener('load', () => {
    const spinner = new LoadingSpinner();
    spinner.hideSpinner();
  });
}

// === TABLE ROW HOVER EFFECT ===
function initTableAnimations() {
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('mouseenter', function() {
        this.style.cursor = 'pointer';
      });
    });
  });
}

// === BUTTON CLICK FEEDBACK ===
function initButtonFeedback() {
  const buttons = document.querySelectorAll('button, a.btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Add visual feedback
      if (!this.classList.contains('btn-close')) {
        this.style.opacity = '0.8';
        setTimeout(() => {
          this.style.opacity = '1';
        }, 100);
      }
    });
  });
}

// === NAVBAR SCROLL EFFECT ===
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 8px 40px rgba(2,6,23,0.15)';
    } else {
      navbar.style.boxShadow = '0 6px 30px rgba(2,6,23,0.12)';
    }
  });
}

// === INITIALIZE ALL ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all animations and interactions
  new LoadingSpinner();
  new AlertManager(5000); // Auto-dismiss after 5 seconds
  new FormValidator();
  initSmoothScroll();
  initPageLoad();
  initTableAnimations();
  initButtonFeedback();
  initNavbarScroll();

  console.log('✓ Pharmacy animations initialized');
});

// Hide spinner on page unload (for form submissions that redirect)
window.addEventListener('beforeunload', () => {
  const spinner = document.getElementById('spinner-container');
  if (spinner) {
    spinner.classList.add('show');
  }
});
