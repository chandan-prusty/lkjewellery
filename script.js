// Mobile navigation
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', open);
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

// Dropdown menus (click, hover on pointer devices, Escape to close)
const menuItems = document.querySelectorAll('.nav__item--has-menu');
const desktop = window.matchMedia('(min-width: 901px) and (hover: hover)');

function setMenu(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector('button').setAttribute('aria-expanded', open);
}

menuItems.forEach((item) => {
  item.querySelector('button').addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    menuItems.forEach((other) => setMenu(other, false));
    setMenu(item, open);
  });
  item.addEventListener('mouseenter', () => desktop.matches && setMenu(item, true));
  item.addEventListener('mouseleave', () => desktop.matches && setMenu(item, false));
  item.addEventListener('focusout', (e) => {
    if (desktop.matches && !item.contains(e.relatedTarget)) setMenu(item, false);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') menuItems.forEach((item) => setMenu(item, false));
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav__item--has-menu')) menuItems.forEach((item) => setMenu(item, false));
});

// Carousels (categories, testimonials) — arrows live in the same <section> as the track
document.querySelectorAll('[data-carousel]').forEach((track) => {
  const section = track.closest('section');
  const prev = section.querySelector('[data-carousel-prev]');
  const next = section.querySelector('[data-carousel-next]');

  function step() {
    const first = track.firstElementChild;
    return first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
  }
  function updateArrows() {
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  }
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();
});

// Wishlist
const wishlistCount = document.querySelector('[data-wishlist-count]');

document.querySelectorAll('.wish').forEach((btn) => {
  btn.addEventListener('click', () => {
    const active = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', active);
    wishlistCount.textContent = document.querySelectorAll('.wish[aria-pressed="true"]').length;
  });
});

// Newsletter
const form = document.querySelector('.subscribe');
const email = form.querySelector('input');
const msg = form.querySelector('.subscribe__msg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const valid = email.value.trim() !== '' && email.checkValidity();
  email.setAttribute('aria-invalid', !valid);
  msg.classList.toggle('is-error', !valid);
  if (!valid) {
    msg.textContent = 'Please enter a valid email address.';
    email.focus();
    return;
  }
  msg.textContent = 'Thank you for subscribing!';
  form.reset();
});
email.addEventListener('input', () => {
  email.removeAttribute('aria-invalid');
  msg.textContent = '';
});

// Offer code — copy to clipboard
document.querySelectorAll('[data-copy-code]').forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copyCode);
      btn.textContent = 'Code copied!';
    } catch {
      btn.textContent = `Code: ${btn.dataset.copyCode}`;
    }
    setTimeout(() => { btn.textContent = label; }, 2000);
  });
});

// Hero image slider
const slides = [...document.querySelectorAll('.hero__image')];
const dots = [...document.querySelectorAll('.hero__dots button')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;
let timer;

function showSlide(index) {
  if (index === current) return;
  const leaving = slides[current];
  slides.forEach((slide) => slide.classList.remove('is-leaving'));
  leaving.classList.replace('is-active', 'is-leaving');
  leaving.addEventListener('transitionend', () => leaving.classList.remove('is-leaving'), { once: true });
  slides[index].classList.add('is-active');
  dots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index);
    dot.setAttribute('aria-pressed', i === index);
  });
  current = index;
}
function startAutoplay() {
  clearInterval(timer);
  if (slides.length < 2 || reduceMotion.matches) return;
  timer = setInterval(() => showSlide((current + 1) % slides.length), 5000);
}
dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startAutoplay(); }));
document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : startAutoplay()));
startAutoplay();

// Jewellery page — category filter (also driven by ?cat= in the URL)
const catalogue = document.querySelector('[data-catalogue]');

if (catalogue) {
  const chips = [...document.querySelectorAll('[data-filter]')];
  const pieces = [...catalogue.children];
  const count = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  const emptyName = document.querySelector('[data-empty-name]');

  function applyFilter(cat, updateUrl) {
    let shown = 0;
    pieces.forEach((piece) => {
      const match = cat === 'all' || piece.dataset.cat === cat;
      piece.hidden = !match;
      if (match) shown += 1;
    });
    chips.forEach((chip) => {
      const on = chip.dataset.filter === cat;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', on);
    });
    count.textContent = `${shown} ${shown === 1 ? 'piece' : 'pieces'}`;
    empty.hidden = shown > 0;
    if (!shown) emptyName.textContent = cat;
    if (updateUrl) {
      const url = new URL(window.location);
      if (cat === 'all') url.searchParams.delete('cat');
      else url.searchParams.set('cat', cat);
      history.replaceState(null, '', url);
    }
  }

  chips.forEach((chip) => chip.addEventListener('click', () => applyFilter(chip.dataset.filter, true)));
  const requested = (new URLSearchParams(window.location.search).get('cat') || 'all').toLowerCase();
  applyFilter(/^[a-z-]+$/.test(requested) ? requested : 'all', false);
}

// Scroll reveal — elements fade and rise into place as they enter the viewport
const revealTargets = document.querySelectorAll(
  '.section__head, .cat-track > li, .product, .promo, .values li, .story__grid > *, .review, ' +
  '.gallery li, .offer, .about, .assure__list li, .newsletter__inner > *, .footer__grid > *, ' +
  '.catalogue__head, .instore__list li, .bespoke__inner > *, .collection__media, .collection__body, ' +
  '.plan__inner > *, .store__inner > *'
);

if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      revealObserver.unobserve(el);
      el.classList.add('is-visible');
      // Hand the element back to its own hover transitions once it has settled
      setTimeout(() => {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
      }, 1400);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach((el) => {
    // Stagger siblings so rows of cards open one after another
    const index = [...el.parentElement.children].indexOf(el);
    el.style.transitionDelay = `${Math.min(index, 5) * 90}ms`;
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}
