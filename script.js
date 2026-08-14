// ==========================================================================
// SOUNDWALE — shared interactions
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Theme preference: stored choice, then OS preference ---- */
  const themeToggle = document.querySelector('.theme-toggle');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  const savedTheme = localStorage.getItem('soundwale-theme');
  applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('soundwale-theme', next);
    applyTheme(next);
  });

  /* ---- Sticky header shrink ---- */
  const header = document.querySelector('.site-header');
  if (header) {
    let scrollFrame;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
        document.querySelectorAll('.hero-parallax').forEach(el => el.style.setProperty('--scroll-shift', `${Math.min(window.scrollY * .035, 24)}px`));
        scrollFrame = undefined;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Pointer parallax: transform only, no layout reads during movement ---- */
  const hero = document.querySelector('.hero');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hero && !reducedMotion && !navigator.connection?.saveData) {
    let pointerFrame;
    hero.addEventListener('pointermove', (event) => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - .5) * 2;
        const y = (event.clientY / window.innerHeight - .5) * 2;
        hero.querySelectorAll('.hero-orb').forEach((orb, index) => { orb.style.setProperty('--px', `${x * (index + 1) * 16}px`); orb.style.setProperty('--py', `${y * (index + 1) * 12}px`); });
        hero.querySelectorAll('.hero-parallax').forEach(el => { el.style.setProperty('--tilt-x', `${x * 2}deg`); el.style.setProperty('--tilt-y', `${-y * 2}deg`); });
        pointerFrame = undefined;
      });
    }, { passive: true });
  }

  /* ---- Mobile nav ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navScrim = document.querySelector('.nav-scrim');

  const closeNav = () => {
    navLinks?.classList.remove('is-open');
    navScrim?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const openNav = () => {
    navLinks?.classList.add('is-open');
    navScrim?.classList.add('is-open');
    navToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.contains('is-open');
    isOpen ? closeNav() : openNav();
  });
  navScrim?.addEventListener('click', closeNav);
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  /* ---- Smooth scroll for in-page anchors (respects reduced motion via CSS) ---- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---- Scroll-reveal (single orchestrated pass, not scattered per element) ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    btn?.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // close siblings
      item.parentElement.querySelectorAll('.faq-item.is-open').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
    });
  });

  /* ---- Audience toggle (download page) ---- */
  const toggle = document.querySelector('.audience-toggle');
  if (toggle) {
    const buttons = toggle.querySelectorAll('button');
    const panels = document.querySelectorAll('[data-audience-panel]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        const which = btn.dataset.audience;
        panels.forEach(p => {
          p.hidden = p.dataset.audiencePanel !== which;
        });
      });
    });
  }

  /* ---- Simple client-side form validation (progressive enhancement demo) ---- */
  const form = document.querySelector('.js-contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        const wrap = field.closest('.field');
        const filled = field.value.trim().length > 0;
        wrap.classList.toggle('has-error', !filled);
        if (!filled) valid = false;
      });
      const successEl = form.querySelector('.form-success');
      if (valid) {
        form.reset();
        successEl?.classList.add('is-visible');
        successEl?.setAttribute('role', 'status');
      }
    });
  }

});
