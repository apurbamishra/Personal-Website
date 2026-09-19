/* =============================================================
   Apurba Mishra — site behaviour
   Plain JavaScript, no dependencies, no build step.
   Sections: config · theme · navigation · scroll · reveal ·
             project filter · copy email · contact form
   ============================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     1. CONTACT FORM CONFIGURATION  ←←← THE ONLY THING TO EDIT
     -----------------------------------------------------------
     The form is fully built (validation, states, accessibility)
     but is NOT connected to an email service yet. Nothing is sent
     anywhere until you fill `endpoint` in below.

     Formspree:  endpoint = 'https://formspree.io/f/YOUR_FORM_ID'
                 accessKey = ''            (not used)

     Web3Forms:  endpoint = 'https://api.web3forms.com/submit'
                 accessKey = 'YOUR_PUBLIC_ACCESS_KEY'

     Both keys above are public by design — safe in client code.
     Never paste a private/secret API key here.
     ----------------------------------------------------------- */

  var CONTACT_FORM = {
    endpoint: '',
    accessKey: ''
  };

  /* ---------- small helpers ---------- */

  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ===========================================================
     2. Theme
     =========================================================== */

  function initTheme() {
    var toggle = $('#themeToggle');
    var label = $('#themeToggleLabel');
    if (!toggle) return;

    var root = document.documentElement;
    var media = window.matchMedia('(prefers-color-scheme: dark)');

    function sync() {
      var isDark = root.dataset.theme === 'dark';
      toggle.setAttribute('aria-pressed', String(isDark));
      if (label) label.textContent = isDark ? 'Switch to light theme' : 'Switch to dark theme';
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute('content', isDark ? '#0a111c' : '#eceff3');
    }

    function setTheme(theme, remember) {
      root.dataset.theme = theme;
      if (remember) {
        try { localStorage.setItem('am-theme', theme); } catch (e) { /* storage blocked */ }
      }
      sync();
    }

    toggle.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });

    // Follow the system only while the visitor has never chosen manually.
    var hasChoice = false;
    try { hasChoice = !!localStorage.getItem('am-theme'); } catch (e) { hasChoice = false; }
    if (!hasChoice && typeof media.addEventListener === 'function') {
      media.addEventListener('change', function (event) {
        setTheme(event.matches ? 'dark' : 'light', false);
      });
    }

    sync();
  }

  /* ===========================================================
     3. Navigation (mobile panel + focus handling)
     =========================================================== */

  function initNavigation() {
    var toggle = $('#navToggle');
    var nav = $('#primary-nav');
    var header = $('.site-header');
    if (!toggle || !nav) return;

    var toggleLabel = $('.visually-hidden', toggle);
    var desktop = window.matchMedia('(min-width: 900px)');
    var isOpen = false;

    function focusable() {
      return [toggle].concat($$('a[href], button:not([disabled])', nav));
    }

    function openNav() {
      isOpen = true;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      document.documentElement.classList.add('nav-open');
      if (toggleLabel) toggleLabel.textContent = 'Close menu';
    }

    function closeNav(returnFocus) {
      isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      document.documentElement.classList.remove('nav-open');
      if (toggleLabel) toggleLabel.textContent = 'Open menu';
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (isOpen) { closeNav(false); } else { openNav(); }
    });

    // Close after choosing a section.
    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { if (isOpen) closeNav(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        closeNav(true);
        return;
      }

      if (event.key === 'Tab') {
        var items = focusable();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // Clicking outside the panel closes it.
    document.addEventListener('click', function (event) {
      if (!isOpen) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      if (header && header.contains(event.target)) return;
      closeNav(false);
    });

    // Never leave the panel state hanging when resizing to desktop.
    var onBreakpoint = function () { if (desktop.matches && isOpen) closeNav(false); };
    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', onBreakpoint);
    } else {
      window.addEventListener('resize', onBreakpoint);
    }
  }

  /* ===========================================================
     4. Scroll: header state, reading progress, active link, top button
     =========================================================== */

  function initScroll() {
    var header = $('.site-header');
    var progress = $('#readingProgress');
    var toTop = $('#toTop');
    var links = $$('.nav__link');
    var sections = links
      .map(function (link) {
        var id = link.getAttribute('href');
        return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    var ticking = false;
    var toTopShown = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      if (header) header.classList.toggle('is-stuck', y > 8);

      if (progress) {
        var ratio = max > 0 ? Math.min(y / max, 1) : 0;
        progress.style.width = (ratio * 100).toFixed(2) + '%';
      }

      if (toTop) {
        var shouldShow = y > window.innerHeight * 0.9;
        if (shouldShow !== toTopShown) {
          toTopShown = shouldShow;
          if (shouldShow) toTop.hidden = false;
          toTop.classList.toggle('is-visible', shouldShow);
        }
      }

      if (sections.length) {
        var line = y + (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) * 9;
        var current = sections[0];
        sections.forEach(function (section) {
          if (section.offsetTop <= line) current = section;
        });
        // At the very bottom, the last section is the one being read.
        if (max > 0 && y >= max - 4) current = sections[sections.length - 1];

        links.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + current.id;
          link.classList.toggle('is-active', active);
          if (active) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
        });
        var brand = $('.brand');
        if (brand) brand.focus({ preventScroll: true });
      });
    }
  }

  /* ===========================================================
     5. Reveal on scroll (skipped entirely for reduced motion)
     =========================================================== */

  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    // Stagger siblings slightly so a row of cards arrives in sequence.
    var counters = new Map();
    items.forEach(function (item) {
      var parent = item.parentElement;
      var index = counters.get(parent) || 0;
      counters.set(parent, index + 1);
      item.style.setProperty('--i', String(Math.min(index, 5)));
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  /* ===========================================================
     6. Project filter
     =========================================================== */

  function initFilters() {
    var buttons = $$('.filter');
    var projects = $$('#projectGrid .project');
    var status = $('#filterStatus');
    if (!buttons.length || !projects.length) return;

    function apply(value, label) {
      var shown = 0;

      projects.forEach(function (project) {
        var categories = (project.dataset.cat || '').split(/\s+/);
        var match = value === 'all' || categories.indexOf(value) !== -1;
        project.hidden = !match;
        if (match) shown += 1;
      });

      buttons.forEach(function (button) {
        var active = button.dataset.filter === value;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      if (status) {
        status.textContent = value === 'all'
          ? 'Showing all ' + shown + ' projects.'
          : 'Showing ' + shown + ' ' + (shown === 1 ? 'project' : 'projects') + ' in ' + label + '.';
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        apply(button.dataset.filter, button.textContent.trim());
      });
    });
  }

  /* ===========================================================
     7. Copy email
     =========================================================== */

  function initCopyEmail() {
    var button = $('#copyEmail');
    if (!button) return;

    var textEl = $('.copy-btn__text', button) || button;
    var original = textEl.textContent;
    var timer = null;

    function feedback(message) {
      textEl.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { textEl.textContent = original; }, 2200);
    }

    function legacyCopy(value) {
      var field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(field);
      return ok;
    }

    button.addEventListener('click', function () {
      var email = button.dataset.email || '';
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(
          function () { feedback('Copied'); },
          function () { feedback(legacyCopy(email) ? 'Copied' : 'Press Ctrl+C'); }
        );
      } else {
        feedback(legacyCopy(email) ? 'Copied' : 'Press Ctrl+C');
      }
    });
  }

  /* ===========================================================
     8. Contact form
     =========================================================== */

  function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;

    var status = $('#formStatus');
    var submitBtn = $('#submitBtn');
    var buttonLabel = submitBtn ? $('.btn__label', submitBtn) : null;
    var honeypot = form.elements.company;
    var openedAt = Date.now();
    var busy = false;

    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var rules = {
      name: function (value) {
        if (!value) return 'Please enter your name.';
        if (value.length < 2) return 'That looks a little short — please enter your full name.';
        return '';
      },
      email: function (value) {
        if (!value) return 'Please enter your email address.';
        if (!EMAIL_PATTERN.test(value)) return 'That email address does not look right.';
        return '';
      },
      subject: function (value) {
        if (!value) return 'Please add a subject.';
        if (value.length < 3) return 'Please use at least 3 characters.';
        return '';
      },
      message: function (value) {
        if (!value) return 'Please write your message.';
        if (value.length < 20) return 'Please write at least 20 characters so I know how to help.';
        return '';
      }
    };

    function fieldError(name) { return document.getElementById(name + '-error'); }

    function showFieldError(input, message) {
      var box = fieldError(input.name);
      input.setAttribute('aria-invalid', 'true');
      if (box) {
        box.textContent = message;
        box.hidden = false;
      }
    }

    function clearFieldError(input) {
      var box = fieldError(input.name);
      input.removeAttribute('aria-invalid');
      if (box) {
        box.textContent = '';
        box.hidden = true;
      }
    }

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var message = rule(String(input.value || '').trim());
      if (message) {
        showFieldError(input, message);
        return false;
      }
      clearFieldError(input);
      return true;
    }

    function validateAll() {
      var invalid = [];
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        if (input && !validateField(input)) invalid.push(input);
      });
      return invalid;
    }

    function setStatus(kind, html) {
      if (!status) return;
      status.className = 'form__status form__status--' + kind;
      status.setAttribute('data-icon', kind === 'ok' ? '\u2713' : kind === 'error' ? '!' : 'i');
      status.innerHTML = html;
      status.hidden = false;
    }

    function clearStatus() {
      if (status) status.hidden = true;
    }

    function setBusy(state) {
      busy = state;
      form.classList.toggle('is-submitting', state);
      if (submitBtn) submitBtn.disabled = state;
      if (buttonLabel) buttonLabel.textContent = state ? 'Sending…' : 'Send message';
    }

    // Validate on blur; clear the error as soon as the field is fixed.
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    function payload() {
      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        subject: form.elements.subject.value.trim(),
        reason: form.elements.reason ? form.elements.reason.value : '',
        message: form.elements.message.value.trim()
      };
      if (CONTACT_FORM.accessKey) data.access_key = CONTACT_FORM.accessKey;
      return data;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy) return;
      clearStatus();

      var invalid = validateAll();
      if (invalid.length) {
        setStatus('error', invalid.length === 1
          ? 'One field needs attention before this can be sent.'
          : invalid.length + ' fields need attention before this can be sent.');
        invalid[0].focus();
        return;
      }

      // Quiet spam checks: a hidden field nobody should fill, and a form
      // completed impossibly fast.
      if (honeypot && honeypot.value) return;
      if (Date.now() - openedAt < 2000) {
        setStatus('error', 'That was submitted very quickly. Please try once more.');
        return;
      }

      if (!CONTACT_FORM.endpoint) {
        setStatus('info',
          'This form is not connected to an email service yet, so nothing was sent. ' +
          'Your message is still in the box — please email it to ' +
          '<a href="mailto:apurba.mishra01@gmail.com">apurba.mishra01@gmail.com</a> in the meantime.');
        return;
      }

      setBusy(true);

      fetch(CONTACT_FORM.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload())
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed with status ' + response.status);
          return response.json().catch(function () { return {}; });
        })
        .then(function () {
          form.reset();
          setStatus('ok', 'Thank you — your message has been sent. I will reply to the address you gave.');
        })
        .catch(function () {
          setStatus('error',
            'The message could not be sent. Please try again, or email ' +
            '<a href="mailto:apurba.mishra01@gmail.com">apurba.mishra01@gmail.com</a> directly.');
        })
        .then(function () { setBusy(false); });
    });
  }

  /* ===========================================================
     9. Footer year
     =========================================================== */

  function initYear() {
    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ===========================================================
     Start
     =========================================================== */

  function init() {
    initTheme();
    initNavigation();
    initScroll();
    initReveal();
    initFilters();
    initCopyEmail();
    initContactForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
