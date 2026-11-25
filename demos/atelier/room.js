/* room.js — the hero cutaway is a turntable, not a poster.
   The drawing is a flat axonometric, so there is no 3D scene to rebuild: a
   drag swings the whole sheet in CSS 3D — left/right spins it, up/down tips
   it — and it drifts on its own whenever nobody is holding it. */

export function initRoom(host) {
  const svg = host && host.querySelector('.room-draw');
  if (!svg) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SPIN = 40;        // yaw at the far end of a drag
  const TIP = 14;         // pitch at the far end of a drag
  const PER_PX = 0.24;    // degrees per pixel dragged

  let tx = 0;
  let ty = 0;             // where the drawing wants to be
  let cx = 0;
  let cy = 0;             // where it is
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;
  let dragging = false;
  let pointerId = null;
  let raf = 0;
  let visible = true;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function draw() {
    svg.style.transform =
      'rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;

    if (!dragging) {
      // slow breathing sway, so the sheet reads as an object rather than a png
      tx = reduce.matches ? 0 : Math.sin(now / 4200) * 9;
      ty = reduce.matches ? 0 : Math.cos(now / 5300) * 2.4;
    }

    const nx = cx + (tx - cx) * 0.085;
    const ny = cy + (ty - cy) * 0.085;
    if (Math.abs(nx - cx) + Math.abs(ny - cy) < 0.004) {
      cx = tx;
      cy = ty;
      return;
    }
    cx = nx;
    cy = ny;
    draw();
  }

  function down(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    baseX = cx;
    baseY = cy;
    host.classList.add('is-grabbing');
    if (host.setPointerCapture) {
      try { host.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
    }
    event.preventDefault();
  }

  function move(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    tx = clamp(baseX + (event.clientX - startX) * PER_PX, -SPIN, SPIN);
    ty = clamp(baseY - (event.clientY - startY) * PER_PX * 0.45, -TIP, TIP);
    cx += (tx - cx) * 0.4;
    cy += (ty - cy) * 0.4;
    draw();
  }

  function up(event) {
    if (!dragging || (event && event.pointerId !== pointerId)) return;
    dragging = false;
    host.classList.remove('is-grabbing');
    if (host.releasePointerCapture && pointerId !== null) {
      try { host.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
    }
    pointerId = null;
  }

  host.addEventListener('pointerdown', down);
  host.addEventListener('pointermove', move, { passive: true });
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', up);
  host.addEventListener('dragstart', (event) => event.preventDefault());

  // the sway is pointless off screen; stop drawing when the hero is gone
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible = entry.isIntersecting; });
    }, { threshold: 0 }).observe(host);
  }

  draw();
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
