// Shared progressively enhanced interactions.
document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const themeToggle = document.querySelector('.theme-toggle');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  let savedTheme;
  try { savedTheme = localStorage.getItem('soundwale-theme'); } catch (_) {}
  applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('soundwale-theme', next); } catch (_) {}
    applyTheme(next);
  });

  const header = document.querySelector('.site-header');
  if (header) {
    let scrollFrame;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', scrollY > 8);
        if (!reducedMotion) document.querySelectorAll('.hero-parallax').forEach((el) => el.style.setProperty('--scroll-shift', `${Math.min(scrollY * .035, 24)}px`));
        scrollFrame = undefined;
      });
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  const hero = document.querySelector('.hero');
  if (hero && !reducedMotion && !navigator.connection?.saveData && matchMedia('(pointer: fine)').matches) {
    let pointerFrame;
    hero.addEventListener('pointermove', (event) => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        const x = (event.clientX / innerWidth - .5) * 2;
        const y = (event.clientY / innerHeight - .5) * 2;
        hero.querySelectorAll('.hero-orb').forEach((orb, index) => {
          orb.style.setProperty('--px', `${x * (index + 1) * 16}px`);
          orb.style.setProperty('--py', `${y * (index + 1) * 12}px`);
        });
        hero.querySelectorAll('.hero-parallax').forEach((el) => {
          el.style.setProperty('--tilt-x', `${x * 2}deg`);
          el.style.setProperty('--tilt-y', `${-y * 2}deg`);
        });
        pointerFrame = undefined;
      });
    }, { passive: true });
  }

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navScrim = document.querySelector('.nav-scrim');
  let previousFocus;
  const closeNav = ({ restoreFocus = true } = {}) => {
    if (!navLinks?.classList.contains('is-open')) return;
    navLinks.classList.remove('is-open'); navScrim?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false'); navToggle?.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (restoreFocus) previousFocus?.focus();
  };
  const openNav = () => {
    if (!navLinks || navLinks.classList.contains('is-open')) return;
    previousFocus = document.activeElement;
    navLinks.classList.add('is-open'); navScrim?.classList.add('is-open');
    navToggle?.setAttribute('aria-expanded', 'true'); navToggle?.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open'); navLinks.querySelector('a')?.focus();
  };
  navToggle?.addEventListener('click', () => navLinks?.classList.contains('is-open') ? closeNav() : openNav());
  navScrim?.addEventListener('click', closeNav);
  navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeNav({ restoreFocus: false })));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
    if (event.key !== 'Tab' || !navLinks?.classList.contains('is-open')) return;
    const focusable = [...navLinks.querySelectorAll('a, button:not([disabled])')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  matchMedia('(min-width: 1024px)').addEventListener('change', (event) => { if (event.matches) closeNav({ restoreFocus: false }); });

  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    scrollTo({ top: target.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 0) - 16, behavior: reducedMotion ? 'auto' : 'smooth' });
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
  }));

  const revealEls = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) revealEls.forEach((el) => el.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => observer.observe(el));
  }

  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const button = item.querySelector('.faq-q'), answer = item.querySelector('.faq-a');
    if (!button || !answer) return;
    button.id ||= `faq-question-${index + 1}`; answer.id ||= `faq-answer-${index + 1}`;
    button.setAttribute('aria-controls', answer.id); answer.setAttribute('role', 'region'); answer.setAttribute('aria-labelledby', button.id);
    answer.hidden = button.getAttribute('aria-expanded') !== 'true';
    button.addEventListener('click', () => {
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      item.parentElement.querySelectorAll('.faq-item').forEach((other) => {
        if (other === item) return;
        other.classList.remove('is-open'); other.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        const otherAnswer = other.querySelector('.faq-a'); if (otherAnswer) { otherAnswer.hidden = true; otherAnswer.style.maxHeight = null; }
      });
      item.classList.toggle('is-open', willOpen); button.setAttribute('aria-expanded', String(willOpen));
      answer.hidden = !willOpen; answer.style.maxHeight = willOpen ? `${answer.scrollHeight}px` : null;
    });
  });

  const tabList = document.querySelector('.audience-toggle');
  if (tabList) {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')], panels = [...document.querySelectorAll('[data-audience-panel]')];
    const activate = (tab, focus = false) => {
      tabs.forEach((candidate) => { const selected = candidate === tab; candidate.setAttribute('aria-selected', String(selected)); candidate.tabIndex = selected ? 0 : -1; });
      panels.forEach((panel) => { panel.hidden = panel.dataset.audiencePanel !== tab.dataset.audience; });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      const panel = panels.find((candidate) => candidate.dataset.audiencePanel === tab.dataset.audience);
      tab.id ||= `audience-tab-${index + 1}`;
      if (panel) { panel.id ||= `audience-panel-${tab.dataset.audience}`; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id); tab.setAttribute('aria-controls', panel.id); }
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        activate(tabs[next], true);
      });
    });
    activate(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  }
});
