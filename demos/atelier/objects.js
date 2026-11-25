/* The object table — the studio's own pieces, drawn in three.js.

   three.js is fetched from a CDN at runtime and never bundled, so the site
   still runs from a folder with no install and no build step. If the import,
   WebGL or the network fails, the line drawings in .obj-fallback stay on
   screen and the section reads normally.

   Scroll turns the table; a drag spins it further and it keeps momentum. */

const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- pieces */

function vessel(THREE) {
  const g = new THREE.Group();
  // [radius, height] up one side of the pot; the lathe spins it round
  const profile = [
    [0.001, 0], [0.235, 0.004], [0.300, 0.030], [0.345, 0.090], [0.360, 0.170],
    [0.335, 0.270], [0.280, 0.380], [0.245, 0.480], [0.253, 0.575], [0.278, 0.655],
    [0.285, 0.735], [0.268, 0.800], [0.235, 0.855], [0.223, 0.895], [0.236, 0.918],
  ];
  const curve = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(curve.getPoints(96), 96),
    new THREE.MeshStandardMaterial({
      color: 0xd8c3a5, roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide,
    })
  );
  g.add(body);

  // a single ice-blue glaze line at the lip
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.236, 0.007, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0x7cc7e8, roughness: 0.32, metalness: 0.25 })
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.918;
  g.add(lip);
  return g;
}

function pendant(THREE) {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc9a86a, metalness: 1, roughness: 0.24, side: THREE.DoubleSide,
  });

  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.500, 0.400, 96, 1, true), brass);
  shade.position.y = 1.160;
  g.add(shade);

  const roll = new THREE.Mesh(new THREE.TorusGeometry(0.500, 0.010, 8, 96), brass);
  roll.rotation.x = Math.PI / 2;
  roll.position.y = 0.960;
  g.add(roll);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.052, 48, 1, true), brass);
  collar.position.y = 1.366;
  g.add(collar);

  const cordMat = new THREE.MeshStandardMaterial({ color: 0x1a1917, roughness: 0.9 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.620, 8), cordMat);
  cord.position.y = 1.700;
  g.add(cord);
  // the top of this cord and its material, so the table can carry it on up
  // past the top of the canvas instead of leaving it hanging in mid-air
  g.userData.cord = { top: 2.010, radius: 0.007, material: cordMat };

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.060, 28, 20),
    new THREE.MeshStandardMaterial({
      color: 0xfff4e4, emissive: 0xffd9a4, emissiveIntensity: 2.4, roughness: 0.34,
    })
  );
  bulb.position.y = 1.010;
  g.add(bulb);

  // the light the shade is actually throwing on the table
  const glow = new THREE.PointLight(0xffcf9a, 2.6, 3.4, 2);
  glow.position.set(0, 1.010, 0);
  g.add(glow);

  // a pendant hangs: lift it off the table so the cord leaves the frame
  g.userData.lift = 0.30;
  return g;
}

function stool(THREE) {
  const g = new THREE.Group();
  // teak sits against a black stage, so it needs a warm mid-tone or it reads
  // as a black silhouette rather than wood
  const teak = new THREE.MeshStandardMaterial({ color: 0xb37a48, roughness: 0.54, metalness: 0.04 });

  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.500, 0.500, 0.105, 96), teak);
  seat.position.y = 0.860;
  g.add(seat);

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(0.500, 0.014, 10, 96),
    new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.5, metalness: 0.06 })
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.860;
  g.add(edge);

  for (let i = 0; i < 3; i += 1) {
    const a = (i * Math.PI * 2) / 3 + 0.35;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.046, 0.840, 24), teak);
    leg.position.set(Math.sin(a) * 0.300, 0.420, Math.cos(a) * 0.300);
    // splay outwards: +Y leans away from the centre axis
    leg.rotation.set(-Math.cos(a) * 0.185, 0, Math.sin(a) * 0.185);
    g.add(leg);
  }

  const brace = new THREE.Mesh(
    new THREE.TorusGeometry(0.256, 0.011, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.55, metalness: 0.05 })
  );
  brace.rotation.x = Math.PI / 2;
  brace.position.y = 0.300;
  g.add(brace);
  return g;
}

/* --------------------------------------------------------- studio light */

function studioEnv(THREE, renderer) {
  // a small painted room instead of an HDR file: two soft boxes and a floor
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#20262f');
  base.addColorStop(0.52, '#12161c');
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
  blob(140, 52, 120, 'rgba(255,246,232,0.95)');
  blob(372, 74, 104, 'rgba(124,199,232,0.72)');
  blob(256, 232, 190, 'rgba(216,195,165,0.30)');

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/* -------------------------------------------------------------- shadows */

function floorShadow(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 8, 128, 128, 126);
  rg.addColorStop(0, 'rgba(0,0,0,0.72)');
  rg.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  return mesh;
}

/* ------------------------------------------------------------------ init */

export async function initObjects(section) {
  if (!section) return;

  const canvas = section.querySelector('#objCanvas');
  const stage = section.querySelector('#objStage');
  if (!canvas || !stage) return;

  let THREE;
  try {
    THREE = await import(URL3);
  } catch (err) {
    return; // the line drawings stay
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
    });
  } catch (err) {
    return;
  }

  const reduce = reduceMotion();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = studioEnv(THREE, renderer);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 1.30, 6.05);
  camera.lookAt(0, 0.70, 0);

  // on a tall phone the same lens fills the width, so the camera sits back
  let baseZ = 6.05;
  let baseY = 1.30;
  let aimY = 0.70;

  scene.add(new THREE.DirectionalLight(0xfff6e8, 1.35).translateY(5).translateX(2.6));
  const fill = new THREE.DirectionalLight(0x7cc7e8, 0.62);
  fill.position.set(-3.2, 1.6, -2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(0, 2.2, -4.5);
  scene.add(rim);

  const turntable = new THREE.Group();
  scene.add(turntable);

  scene.add(floorShadow(THREE));

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.675, 128),
    new THREE.MeshBasicMaterial({
      color: 0x7cc7e8, transparent: true, opacity: 0.26, side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  scene.add(ring);

  // each piece is normalised to one height so the three sit at the same scale
  const builders = [vessel, pendant, stool];
  const nodes = builders.map((build) => {
    const outer = new THREE.Group();
    const piece = build(THREE);
    const box = new THREE.Box3().setFromObject(piece);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);
    const k = 1.10 / Math.max(0.001, size.y);
    piece.scale.setScalar(k);
    piece.position.x = -centre.x * k;
    piece.position.z = -centre.z * k;
    piece.position.y = -box.min.y * k + (piece.userData.lift || 0);
    outer.add(piece);

    // a pendant hangs from a ceiling outside the frame: run its cord off the
    // top of the canvas rather than stopping it inside the picture
    const cord = piece.userData.cord;
    if (cord) {
      const from = piece.position.y + cord.top * k;
      const reach = 8;
      const length = Math.max(0.5, reach - from);
      const extension = new THREE.Mesh(
        new THREE.CylinderGeometry(cord.radius * k, cord.radius * k, length, 8),
        cord.material
      );
      extension.position.y = from + length / 2;
      outer.add(extension);
    }

    turntable.add(outer);
    return outer;
  });

  const pops = nodes.map(() => 1);
  let active = 0;
  nodes.forEach((node, i) => { node.visible = i === 0; });

  /* ------------------------------------------------------------- resize */
  let needsRender = true;
  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const tall = camera.aspect < 0.62;
    baseZ = tall ? 7.2 : 6.05;
    baseY = tall ? 1.10 : 1.30;
    aimY = tall ? 0.50 : 0.70;
    camera.position.set(0, baseY, baseZ);
    camera.lookAt(0, aimY, 0);
    needsRender = true;
    if (reduce) render();
  }

  /* ------------------------------------------------------------- scroll */
  function progress() {
    const top = stage.getBoundingClientRect().top + window.scrollY;
    const span = Math.max(1, stage.offsetHeight - window.innerHeight);
    return clamp((window.scrollY - top) / span);
  }

  /* --------------------------------------------------------- drag to spin */
  let manual = 0;
  let vel = 0;
  let dragging = false;
  let lastX = 0;

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    vel = 0;
    canvas.classList.add('is-grabbing');
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    manual += dx * 0.012;
    vel = dx * 0.012;
    needsRender = true;
    if (reduce) render();
  }, { passive: true });
  const release = () => {
    dragging = false;
    canvas.classList.remove('is-grabbing');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', release);

  /* ------------------------------------------------------ choose a piece */
  const tabs = Array.from(section.querySelectorAll('[data-obj]'));
  const nameEl = section.querySelector('#objName');
  const metaEl = section.querySelector('#objMeta');
  const capEl = section.querySelector('#objCap');
  const copy = [
    ['Vessel 01', 'Stoneware, 240 mm — thrown in Vasai, one glaze line at the lip.'],
    ['Pendant 04', 'Brass, 900 mm drop — spun shade, the bulb sits below the rim so it never glares.'],
    ['Stool 02', 'Teak, 460 mm — three splayed legs, a 12° rake, one brace. Built to be sat on hard.'],
  ];

  function activate(index) {
    active = index;
    nodes.forEach((node, i) => {
      node.visible = i === index;
      if (i === index) pops[i] = 0.9;
    });
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (nameEl && metaEl) {
      nameEl.textContent = copy[index][0];
      metaEl.textContent = copy[index][1];
    }
    if (capEl) {
      capEl.classList.add('is-swap');
      window.setTimeout(() => capEl.classList.remove('is-swap'), 200);
    }
    needsRender = true;
    if (reduce) render();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i));
  });

  /* ---------------------------------------------------------------- draw */
  function render() {
    renderer.render(scene, camera);
    needsRender = false;
  }

  let pSmooth = progress();
  let raf = 0;
  let visible = true;

  function frame() {
    raf = requestAnimationFrame(frame);

    if (!dragging) {
      manual += vel;
      vel *= 0.94;
      if (Math.abs(vel) < 0.0005) vel = 0;
    }

    const p = progress();
    pSmooth = lerp(pSmooth, p, 0.14);

    turntable.rotation.y = -0.55 + pSmooth * 2.85 + manual;
    camera.position.y = baseY + pSmooth * 0.14;
    camera.position.z = baseZ - pSmooth * 0.42;
    camera.lookAt(0, aimY, 0);

    nodes.forEach((node, i) => {
      if (!node.visible) return;
      pops[i] = lerp(pops[i], 1, 0.16);
      node.scale.setScalar(pops[i]);
    });

    renderer.render(scene, camera);
  }

  function paintStill() {
    turntable.rotation.y = 0.42 + manual;
    nodes.forEach((node, i) => { node.scale.setScalar(1); pops[i] = 1; });
    render();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }, { threshold: 0 }).observe(stage);
  }

  document.addEventListener('visibilitychange', () => {
    if (reduce) return;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (visible && !raf) {
      raf = requestAnimationFrame(frame);
    }
  });

  window.addEventListener('resize', () => {
    window.clearTimeout(resize.t);
    resize.t = window.setTimeout(resize, 120);
  });

  resize();
  if (reduce) paintStill();
  else {
    render();
    raf = requestAnimationFrame(frame);
  }

  // only now take the line drawings away, once something is actually painted
  section.classList.add('is-3d');
}
