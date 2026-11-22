/* Scroll engine — one progress value drives everything cheap enough to
   keep on the main thread: the 3D deck of project planes, the pinned
   horizontal rail, the timeline beam and a little image parallax. */

const narrowMQ = window.matchMedia('(max-width: 860px)');
const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const state = {
  stage: null, cards: [], stageTop: 0, stageSpan: 1, index: null, dots: [],
  rail: null, track: null, railTop: 0, travel: 0,
  beams: [], parallax: [],
};

function headerState() {
  const header = $('.site-header');
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
}

function measure() {
  state.stage = $('#deckStage');
  if (state.stage) {
    state.cards = $$('.plane', state.stage);
    state.stageTop = state.stage.getBoundingClientRect().top + window.scrollY;
    state.stageSpan = Math.max(1, state.stage.offsetHeight - window.innerHeight);
    state.index = $('#deckIndex');
    state.dots = $$('[data-deck-dot]');
  }

  state.rail = $('#rail');
  state.track = $('#railTrack');
  if (state.rail && state.track) {
    const flat = reduceMQ.matches || narrowMQ.matches;
    state.rail.classList.toggle('is-flat', flat);
    if (flat) {
      state.rail.style.height = '';
      state.travel = 0;
      state.track.style.transform = '';
    } else {
      state.travel = Math.max(0, state.track.scrollWidth - window.innerWidth);
      state.rail.style.height = Math.round(state.travel + window.innerHeight) + 'px';
      state.railTop = state.rail.getBoundingClientRect().top + window.scrollY;
    }
  }

  state.beams = $$('[data-beam]');
  state.parallax = $$('[data-parallax]').map((el) => ({
    el, amount: Number(el.dataset.parallax) || 42,
  }));
}

function update() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  headerState();

  if (state.stage && state.cards.length) {
    const progress = clamp((y - state.stageTop) / state.stageSpan);
    const position = progress * (state.cards.length - 1);
    const small = narrowMQ.matches;
    const rowGap = small ? 20 : 42;

    state.cards.forEach((card, i) => {
      const d = i - position;
      const near = Math.abs(d);
      let z, ty, rx, opacity;

      if (d >= 0) {
        // waiting behind the front card: a shallow stack in depth
        z = -d * (small ? 150 : 265);
        ty = d * rowGap;
        rx = d * (small ? 6 : 9);
        opacity = 1 - Math.min(d, 2) * 0.28;
      } else {
        // just stepped back: lifts away and clears out fast, so two
        // captions are never legible on top of each other
        const out = Math.min(1, -d);
        z = -out * (small ? 40 : 70);
        ty = -out * rowGap * 3.2;
        rx = -out * 5;
        opacity = Math.max(0, 1 - out * 3.2);
      }

      const scale = 1 - Math.min(near, 2) * 0.015;

      card.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,' + z.toFixed(1) +
        'px) rotateX(' + rx.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      card.style.opacity = opacity.toFixed(3);
      card.style.visibility = opacity < 0.03 ? 'hidden' : 'visible';
      card.style.zIndex = String(100 - Math.round(near * 10));
    });

    if (state.index) {
      const active = Math.round(position);
      state.index.textContent = String(active + 1).padStart(2, '0') + ' / ' +
        String(state.cards.length).padStart(2, '0');
      state.dots.forEach((dot, i) => dot.classList.toggle('is-on', i === active));
    }
  }

  if (state.rail && state.travel > 0 && state.track) {
    const progress = clamp((y - state.railTop) / state.travel);
    state.track.style.transform = 'translate3d(' + (-progress * state.travel).toFixed(1) + 'px,0,0)';
  }

  state.beams.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const progress = clamp((vh * 0.82 - rect.top) / (rect.height * 0.85));
    el.style.setProperty('--p', progress.toFixed(3));
  });

  state.parallax.forEach((item) => {
    const rect = item.el.getBoundingClientRect();
    if (rect.bottom < -320 || rect.top > vh + 320) return;
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    item.el.style.transform = 'translate3d(0,' + (-progress * item.amount).toFixed(1) + 'px,0)';
  });
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    update();
  });
}

export function startScrollEngine() {
  measure();
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { measure(); update(); }, 140);
  });
  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', () => { measure(); update(); });
  }
}
