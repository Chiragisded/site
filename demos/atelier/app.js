/* Sable & Stone — page behaviour.
   Split into three files so the shop window stays small:
     shader.js  the WebGL light behind the hero
     scroll.js  the 3D deck, the pinned rail, the timeline beam
     room.js    the hero cutaway, turned by hand
     app.js     reveals, split-text, pointer FX, boot
   Every enhancement falls back to readable content if a CDN import fails. */

import { initShader } from './shader.js';
import { startScrollEngine } from './scroll.js';
import { initObjects } from './objects.js';
import { initRoom } from './room.js';

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrowMQ = window.matchMedia('(max-width: 860px)');
const reduce = reduceMQ.matches;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

document.documentElement.classList.add('has-js');

// safety net: nothing may stay invisible if an import or an animation fails
setTimeout(() => {
  $$('.reveal').forEach((el) => el.classList.add('is-in'));
  $$('[data-split]').forEach((el) => el.classList.add('is-in'));
}, 3000);

/* ---------------------------------------------------------------- reveals */
async function initReveals() {
  let motion = null;
  try {
    motion = await import('https://cdn.jsdelivr.net/npm/motion@12/+esm');
  } catch (err) {
    motion = null;
  }

  if (motion && motion.inView && motion.animate && !reduce) {
    motion.inView('.reveal', (el) => {
      el.classList.add('is-in');
      motion.animate(el, { opacity: [0, 1], y: [30, 0] }, {
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
        delay: Number(el.dataset.delay || 0),
      });
    }, { amount: 0.12 });
    return;
  }

  const show = (el) => el.classList.add('is-in');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach(show);
  }
}

/* ------------------------------------------------- hero type, anime.js */
async function initSplitText() {
  const target = $('[data-split]');
  const rows = $$('.hero-meta > div, .hero-lede, .hero-cta, .hero-sub');
  if (!target) return;

  let anime = null;
  if (!reduce) {
    try {
      anime = await import('https://cdn.jsdelivr.net/npm/animejs@4/+esm');
    } catch (err) {
      anime = null;
    }
  }

  let split = null;
  if (anime && anime.splitText && anime.animate) {
    try {
      split = anime.splitText(target, { words: { wrap: 'clip' }, chars: true });
      // the clip wrapper is the line box, and Fraunces' descenders hang below
      // it, so the g and p tails were sliced at the baseline
      if (split && split.words) {
        split.words.forEach((word) => {
          if (word.parentElement) word.parentElement.classList.add('clipword');
        });
      }
      anime.animate(split.chars, {
        y: ['110%', '0%'],
        rotate: [5, 0],
        opacity: [0, 1],
        duration: 1150,
        ease: 'out(3)',
        delay: anime.stagger(18),
      });
    } catch (err) {
      split = null;
    }
  }
  target.classList.add('is-in');

  // the hero rows ease in behind the headline
  rows.forEach((el) => el.classList.add('reveal'));
  if (anime && anime.animate && split) {
    rows.forEach((el, i) => {
      anime.animate(el, {
        opacity: [0, 1],
        y: [18, 0],
        duration: 900,
        delay: 380 + i * 90,
        ease: 'out(3)',
      });
    });
  } else {
    rows.forEach((el) => el.classList.add('is-in'));
  }
}

/* --------------------------------------------------------- pointer FX */
function initPointer() {
  if (reduce) return;

  $$('.spotlight').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
      el.style.setProperty('--my', (event.clientY - rect.top) + 'px');
    }, { passive: true });
  });

  $$('[data-tilt]').forEach((el) => {
    const inner = $('.project-3d', el) || el;
    el.addEventListener('pointermove', (event) => {
      if (narrowMQ.matches) return;
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      el.classList.add('is-live');
      inner.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
      inner.style.setProperty('--rx', (-py * 9).toFixed(2) + 'deg');
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-live');
      inner.style.setProperty('--ry', '0deg');
      inner.style.setProperty('--rx', '0deg');
    });
  });

  $$('[data-magnet]').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      if (narrowMQ.matches) return;
      const rect = el.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.16;
      const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.26;
      el.classList.add('is-live');
      el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-live');
      el.style.transform = '';
    });
  });

  // the deck leans a few degrees toward the pointer
  const deck = $('.deck-3d');
  const pin = $('.deck-pin');
  if (deck && pin) {
    pin.addEventListener('pointermove', (event) => {
      if (narrowMQ.matches) return;
      const rect = pin.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      deck.style.transform = 'rotateY(' + (px * 5).toFixed(2) + 'deg) rotateX(' +
        (-py * 4).toFixed(2) + 'deg)';
    }, { passive: true });
    pin.addEventListener('pointerleave', () => { deck.style.transform = ''; });
  }
}

/* ------------------------------------------- headline, word by word */
function initWords() {
  const targets = $$('[data-words]');
  if (!targets.length) return;

  targets.forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const mask = document.createElement('span');
      mask.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.style.setProperty('--i', String(i));
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
}

/* ----------------------------------------------- sparks on the table */
function initSparks() {
  const host = $('#objects');
  if (!host || reduce || !Element.prototype.animate) return;

  host.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const deg = (angle * 180) / Math.PI;
      const spark = document.createElement('i');
      spark.className = 'spark';
      host.appendChild(spark);
      const anim = spark.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + deg + 'deg)', opacity: 1 },
        {
          transform: 'translate(' + (x + Math.cos(angle) * 26).toFixed(1) + 'px,' +
            (y + Math.sin(angle) * 26).toFixed(1) + 'px) rotate(' + deg + 'deg) translateY(-14px)',
          opacity: 0,
        },
      ], { duration: 540, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
      anim.onfinish = () => spark.remove();
    }
  }, { passive: true });
}

/* ------------------------------------------------------ marquee repeat */
function fillMarquees() {
  $$('.marquee-track').forEach((track) => {
    // the markup already ships two groups; only top up if one is missing
    if ($$('.marquee-group', track).length > 1) return;
    const group = $('.marquee-group', track);
    if (!group) return;
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
}

/* ----------------------------------------------------------------- boot */
try {
  const canvas = $('#shader');
  if (canvas) initShader(canvas);
} catch (err) {
  /* the CSS gradient under the canvas stays as the fallback */
}


try { initRoom($('.hero-room')); } catch (err) {}

if ($('#objects')) {
  try { initObjects($('#objects')).catch(() => {}); } catch (err) {}
}

try { initWords(); } catch (err) {}
try { initSparks(); } catch (err) {}
try { fillMarquees(); } catch (err) {}
try { initPointer(); } catch (err) {}
try { startScrollEngine(); } catch (err) {}

(async () => {
  try { await initReveals(); } catch (err) {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
  }
  try { await initSplitText(); } catch (err) {
    $$('[data-split]').forEach((el) => el.classList.add('is-in'));
  }
})();
