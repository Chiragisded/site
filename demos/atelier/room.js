/* room.js — the hero cutaway, built as a real room in three.js.

   Same rules as the object table: three.js comes from a CDN at runtime, no
   bundle and no build step, and the drawn SVG stays on the page as the
   fallback if the import, WebGL or the network fails.

   One room, cut open at the front: floor slab, two sectioned walls with a
   window, a sofa, a table on a rug, a console, a pendant that actually lights
   the place. Drag to orbit it; it turns slowly on its own when idle. */

const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the room, in metres: the same 4.2 × 3.4 the caption promises */
const W = 4.2;
const D = 3.4;
const H = 2.7;
const T = 0.12; // wall thickness

/* ----------------------------------------------------------- materials */

function palette(THREE) {
  return {
    plaster: new THREE.MeshStandardMaterial({ color: 0x39434f, roughness: 0.96, metalness: 0 }),
    plasterDim: new THREE.MeshStandardMaterial({ color: 0x2c3540, roughness: 0.96 }),
    section: new THREE.MeshStandardMaterial({ color: 0xa08a6b, roughness: 0.8 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x1b2430, roughness: 0.82, metalness: 0.04 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x11171f, roughness: 0.9 }),
    teak: new THREE.MeshStandardMaterial({ color: 0xb37a48, roughness: 0.55, metalness: 0.05 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xcbbda6, roughness: 0.94 }),
    fabricDark: new THREE.MeshStandardMaterial({ color: 0x9d907d, roughness: 0.94 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: 1, roughness: 0.3, side: THREE.DoubleSide }),
    stone: new THREE.MeshStandardMaterial({ color: 0x3f4a56, roughness: 0.85 }),
    rug: new THREE.MeshStandardMaterial({ color: 0x2c4a5a, roughness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x7cc7e8, transparent: true, opacity: 0.13, roughness: 0.12, metalness: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    }),
    plant: new THREE.MeshStandardMaterial({ color: 0x4f6b4a, roughness: 0.9, side: THREE.DoubleSide }),
    art: new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.9 }),
  };
}

/* -------------------------------------------------------------- pieces */

function box(THREE, mat, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function room(THREE, mats) {
  const g = new THREE.Group();

  /* floor slab and the two walls that are left standing */
  g.add(box(THREE, mats.slab, W + T * 2, 0.13, D + T * 2, 0, -0.065, 0));
  g.add(box(THREE, mats.floor, W + T, 0.02, D + T, 0, 0.01, 0));

  // back wall (solid), with its section cap along the cut
  g.add(box(THREE, mats.plaster, W + T, H, T, 0, H / 2, -D / 2 - T / 2));
  g.add(box(THREE, mats.section, W + T, 0.05, T + 0.02, 0, H + 0.025, -D / 2 - T / 2));

  /* left wall, with a window cut through it: four pieces around the opening */
  const x = -W / 2 - T / 2;
  const winW = 1.5;      // along z
  const sill = 0.82;
  const head = 2.28;
  const z0 = -0.25 - winW / 2;
  const z1 = z0 + winW;

  g.add(box(THREE, mats.plaster, T, sill, D + T, x, sill / 2, 0));
  g.add(box(THREE, mats.plaster, T, H - head, D + T, x, (H + head) / 2, 0));
  const frontLen = D / 2 + T / 2 - z1;
  if (frontLen > 0) {
    g.add(box(THREE, mats.plaster, T, head - sill, frontLen, x, (sill + head) / 2, z1 + frontLen / 2));
  }
  const backLen = z0 + D / 2 + T / 2;
  if (backLen > 0) {
    g.add(box(THREE, mats.plaster, T, head - sill, backLen, x, (sill + head) / 2, z0 - backLen / 2));
  }
  // its section cap, and the vertical cut edge facing the camera
  g.add(box(THREE, mats.section, T + 0.02, 0.05, D + T, x, H + 0.025, 0));
  g.add(box(THREE, mats.section, T + 0.02, H, 0.03, x, H / 2, D / 2 + T / 2));

  // the glazing itself, and a mullion, sitting in the opening
  g.add(box(THREE, mats.glass, 0.02, head - sill, winW, x, (sill + head) / 2, (z0 + z1) / 2));
  g.add(box(THREE, mats.brass, 0.04, head - sill, 0.025, x, (sill + head) / 2, (z0 + z1) / 2));
  g.add(box(THREE, mats.brass, 0.04, 0.025, winW, x, (sill + head) / 2, (z0 + z1) / 2));

  // the sky the window is looking at, so the opening is not a black hole
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(winW + 0.4, head - sill + 0.4),
    new THREE.MeshBasicMaterial({ color: 0x9fd3ea, transparent: true, opacity: 0.34 })
  );
  sky.position.set(x - 0.55, (sill + head) / 2, (z0 + z1) / 2);
  sky.rotation.y = Math.PI / 2;
  g.add(sky);

  /* a framed drawing on the back wall */
  g.add(box(THREE, mats.section, 0.74, 0.94, 0.03, 0.95, 1.62, -D / 2 + 0.03));
  g.add(box(THREE, mats.art, 0.68, 0.88, 0.02, 0.95, 1.62, -D / 2 + 0.05));

  /* rug */
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.7), mats.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.1, 0.025, 0.35);
  g.add(rug);

  /* sofa, along the back wall */
  const sx = 0.15;
  const sz = -1.02;
  g.add(box(THREE, mats.fabricDark, 2.3, 0.30, 0.86, sx, 0.21, sz));
  for (let i = -1; i <= 1; i += 1) {
    g.add(box(THREE, mats.fabric, 0.72, 0.16, 0.78, sx + i * 0.745, 0.44, sz + 0.02));
  }
  g.add(box(THREE, mats.fabric, 2.3, 0.62, 0.2, sx, 0.67, sz - 0.33));
  g.add(box(THREE, mats.fabric, 0.2, 0.28, 0.86, sx - 1.05, 0.5, sz));
  g.add(box(THREE, mats.fabric, 0.2, 0.28, 0.86, sx + 1.05, 0.5, sz));
  // two loose cushions, so the sofa is not a stack of boxes
  const cushion = (cx, rot) => {
    const m = box(THREE, mats.fabric, 0.34, 0.34, 0.12, cx, 0.62, sz - 0.14);
    m.rotation.z = rot;
    return m;
  };
  g.add(cushion(sx - 0.72, 0.18));
  g.add(cushion(sx + 0.7, -0.14));

  /* coffee table on the rug */
  g.add(box(THREE, mats.teak, 1.15, 0.055, 0.6, 0.1, 0.37, 0.35));
  [[-0.5, -0.24], [0.7, -0.24], [-0.5, 0.24], [0.7, 0.24]].forEach(([lx, lz]) => {
    g.add(box(THREE, mats.teak, 0.045, 0.35, 0.045, lx, 0.175, 0.35 + lz));
  });
  // a bowl and a book on the table
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.075, 0.06, 32), mats.stone);
  bowl.position.set(-0.1, 0.43, 0.35);
  g.add(bowl);
  g.add(box(THREE, mats.section, 0.28, 0.025, 0.2, 0.45, 0.415, 0.32));

  /* console against the left wall, under the window */
  g.add(box(THREE, mats.teak, 0.42, 0.58, 1.35, -1.78, 0.29, 0.35));
  g.add(box(THREE, mats.plasterDim, 0.44, 0.02, 1.37, -1.78, 0.59, 0.35));
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.22, 28), mats.stone);
  jar.position.set(-1.78, 0.7, -0.05);
  g.add(jar);

  /* pendant over the table, with the light it throws */
  const cordTop = 4.2;
  const cordBottom = 1.78;
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, cordTop - cordBottom, 8),
    new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 0.9 })
  );
  cord.position.set(0.1, (cordTop + cordBottom) / 2, 0.35);
  g.add(cord);

  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.24, 0.22, 48, 1, true), mats.brass);
  shade.position.set(0.1, 1.7, 0.35);
  g.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0xfff4e4, emissive: 0xffd9a4, emissiveIntensity: 2.6, roughness: 0.4 })
  );
  bulb.position.set(0.1, 1.6, 0.35);
  g.add(bulb);

  const glow = new THREE.PointLight(0xffcf9a, 2.4, 5.5, 2);
  glow.position.set(0.1, 1.6, 0.35);
  g.add(glow);

  /* a plant in the open corner */
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 32), mats.stone);
  pot.position.set(1.6, 0.15, 1.1);
  g.add(pot);
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.62, 8, 1, true), mats.plant);
    leaf.position.set(1.6 + Math.cos(a) * 0.09, 0.58, 1.1 + Math.sin(a) * 0.09);
    leaf.rotation.set(Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4);
    g.add(leaf);
  }

  return g;
}

/* --------------------------------------------------------- studio light */

function studioEnv(THREE, renderer) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#232b35');
  base.addColorStop(0.55, '#12161c');
  base.addColorStop(1, '#07080a');
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 256);

  const blob = (x, y, r, colour) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, colour);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 256);
  };
  blob(150, 54, 120, 'rgba(255,246,232,0.95)');
  blob(366, 80, 100, 'rgba(124,199,232,0.70)');
  blob(256, 236, 180, 'rgba(216,195,165,0.26)');

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

function floorShadow(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 10, 128, 128, 126);
  rg.addColorStop(0, 'rgba(0,0,0,0.62)');
  rg.addColorStop(0.5, 'rgba(0,0,0,0.24)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0.1, 0.035, 0.1);
  return mesh;
}

/* ------------------------------------------------------------------ init */

export async function initRoom(host) {
  const svg = host && host.querySelector('.room-draw');
  if (!svg) return;

  // the room only exists on a wide screen; on a phone there is nothing to
  // show, so do not download three.js for it — wait until the window is wide
  const wide = window.matchMedia('(min-width: 1280px)');
  if (!wide.matches) {
    if (wide.addEventListener) {
      const retry = (event) => {
        if (!event.matches) return;
        wide.removeEventListener('change', retry);
        initRoom(host);
      };
      wide.addEventListener('change', retry);
    }
    return;
  }

  let THREE;
  try {
    THREE = await import(URL3);
  } catch (err) {
    return; // the drawing stays, and it is still the same room
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'room-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  svg.after(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    canvas.remove();
    return;
  }

  const reduce = reduceMotion();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = studioEnv(THREE, renderer);

  const camera = new THREE.PerspectiveCamera(32, 1.4, 0.1, 60);

  scene.add(new THREE.AmbientLight(0x9fb3c8, 0.28));

  const key = new THREE.DirectionalLight(0xfff1dc, 1.9);
  key.position.set(-3.2, 5.4, 3.4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x7cc7e8, 0.55);
  fill.position.set(4.2, 1.8, 1.6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.22);
  rim.position.set(0.5, 2.4, -5.2);
  scene.add(rim);

  const mats = palette(THREE);
  const model = room(THREE, mats);
  scene.add(model);
  scene.add(floorShadow(THREE));

  /* ------------------------------------------------------------- camera */
  const aim = new THREE.Vector3(0, 0.95, 0.05);
  let radius = 8.0;
  // the camera stays in the open quadrant: past these angles it would look at
  // the back of the two walls and the cutaway would read as a sealed box
  const AZ_MIN = 0.16;
  const AZ_MAX = 1.46;
  let az = 0.72;
  let el = 0.52;
  let azT = az;
  let elT = el;
  let dir = 1;
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let needsRender = true;

  function place() {
    camera.position.set(
      aim.x + Math.sin(az) * Math.cos(el) * radius,
      aim.y + Math.sin(el) * radius,
      aim.z + Math.cos(az) * Math.cos(el) * radius
    );
    camera.lookAt(aim);
  }

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsRender = true;
    if (reduce) render();
  }

  function render() {
    place();
    renderer.render(scene, camera);
    needsRender = false;
  }

  /* --------------------------------------------------------- drag to turn */
  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    vel = 0;
    host.classList.add('is-grabbing');
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    azT = clamp(azT - dx * 0.008, AZ_MIN, AZ_MAX);
    elT = clamp(elT - dy * 0.005, 0.08, 1.02);
    vel = -dx * 0.008;
    needsRender = true;
    if (reduce) render();
  }, { passive: true });

  function release(event) {
    if (!dragging) return;
    dragging = false;
    host.classList.remove('is-grabbing');
    if (canvas.releasePointerCapture && event && event.pointerId !== undefined) {
      try { canvas.releasePointerCapture(event.pointerId); } catch (err) { /* ignore */ }
    }
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  /* ------------------------------------------------------------- frame */
  let raf = 0;
  let visible = true;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;

    if (!dragging) {
      if (Math.abs(vel) > 0.0002) {
        azT = clamp(azT + vel, AZ_MIN, AZ_MAX);
        vel *= 0.94;
      } else if (!reduce && performance.now() - lastMove > 2600) {
        // left alone: it turns by itself, slowly, and turns back at the edges
        azT += 0.0016 * dir;
        if (azT > AZ_MAX) { azT = AZ_MAX; dir = -1; }
        if (azT < AZ_MIN) { azT = AZ_MIN; dir = 1; }
      }
    }

    az = lerp(az, azT, 0.09);
    el = lerp(el, elT, 0.09);
    place();
    renderer.render(scene, camera);
    needsRender = false;
  }

  function start() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(host);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(resize, 120);
  });

  // the canvas has no size until it is displayed, so show it first
  host.classList.add('is-3d');
  try {
    resize();
    render();
  } catch (err) {
    host.classList.remove('is-3d');
    canvas.remove();
    return;
  }

  if (reduce) {
    canvas.addEventListener('pointerup', () => { render(); });
  } else {
    start();
  }
}
