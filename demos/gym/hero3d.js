/* hero3d.js — the Iron Yard hero dumbbell, built as real geometry in three.js.

   Same rule the rest of this site runs on: three.js is fetched from a CDN at
   runtime, nothing is bundled and there is no build step. If the import, WebGL
   or the network fails, the photo that used to fill this slot stays on screen,
   so the hero never ends up with a hole in it.

   One loaded dumbbell: knurled steel handle, rubber bumper plates, chrome
   collars and a blue stripe around each plate. A small studio environment is
   rendered once and used as the reflection map, so the metal has something to
   reflect instead of reading as flat black. It turns slowly on its own and
   leans a little towards the pointer. */

const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const ACCENT = 0x9fb8ff;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------- knurling */

/* the diamond cut on a bar's grip, drawn once into a canvas and used as a
   bump map — one texture instead of a hundred rings of geometry */
function knurl(THREE) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, size, size);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 3;
  for (let i = -size; i < size * 2; i += 13) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + size, size);
    g.stroke();
    g.beginPath();
    g.moveTo(i, size);
    g.lineTo(i + size, 0);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 4);
  tex.anisotropy = 4;
  return tex;
}

/* ------------------------------------------------------------- environment */

/* a handful of lit panels in a room the colour of the page: white overhead,
   pale steel from the left, blue from behind. Rendered to a cubemap once. */
function studio(THREE, renderer) {
  const scene = new THREE.Scene();
  const panel = (color, w, h, pos, rotY, rotX = 0) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.rotation.set(rotX, rotY, 0);
    scene.add(m);
  };

  panel(0x0b2569, 18, 18, [0, -6.5, 0], 0, -Math.PI / 2);      // floor
  panel(0x14327d, 16, 16, [0, 7.5, 0], 0, Math.PI / 2);         // ceiling
  panel(0xffffff, 5.5, 3.2, [0, 4.2, 1.6], 0, Math.PI / 2.35);  // overhead key
  panel(0xd9e6ff, 4.5, 5, [-6.2, 1.4, 1.2], Math.PI / 2);       // steel fill
  panel(0x5f8dff, 4, 4.5, [6.2, 1.1, -0.6], -Math.PI / 2);      // blue kicker
  panel(0x2a4fa8, 6.5, 4, [0, 1.2, -6.2], 0);                   // back wall
  panel(0x9fb8ff, 1.1, 6, [-2.4, 2.4, -5.4], Math.PI / 6);      // a bright edge hit

  const pmrem = new THREE.PMREMGenerator(renderer);
  const map = pmrem.fromScene(scene, 0.05).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  return map;
}

/* ---------------------------------------------------------------- the piece */

function bar(THREE, mats) {
  const g = new THREE.Group();
  const HALF = 0.132;   // where the plates start
  const GRIP = 0.019;   // handle radius
  const R = 0.125;      // plate radius
  const T = 0.047;      // plate thickness

  /* handle, turned to lie along X */
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(GRIP, GRIP, HALF * 2, 48, 1), mats.steel);
  handle.rotation.z = Math.PI / 2;
  g.add(handle);

  /* the knurled middle and the smooth shoulders either side of it */
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(GRIP + 0.001, GRIP + 0.001, 0.2, 48, 1), mats.knurl);
  grip.rotation.z = Math.PI / 2;
  g.add(grip);

  const shoulder = (x) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(GRIP + 0.003, GRIP + 0.003, 0.006, 40, 1), mats.chrome);
    m.rotation.z = Math.PI / 2;
    m.position.x = x;
    g.add(m);
  };
  shoulder(-0.103);
  shoulder(0.103);

  /* one side of the bar: collar, two plates, outer collar */
  const side = (dir) => {
    const s = new THREE.Group();
    const face = dir; // plates grow away from the middle

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.02, 40, 1), mats.chrome);
    collar.rotation.z = Math.PI / 2;
    collar.position.x = face * (HALF - 0.006);
    s.add(collar);

    /* the plate profile, revolved: rounded rubber edge, flat face, bore */
    const profile = [
      [0.034, 0], [R - 0.007, 0.001], [R, 0.009], [R, T - 0.009], [R - 0.007, T - 0.001], [0.034, T],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    for (let i = 0; i < 2; i += 1) {
      const x0 = HALF + i * (T + 0.006);
      const plate = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), mats.rubber);
      plate.rotation.z = -face * Math.PI / 2;
      plate.position.x = face > 0 ? x0 : -x0 - T;
      s.add(plate);

      /* steel hub on the outward face, so the plate has a centre */
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.056, 0.012, 48, 1), mats.chrome);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = (face > 0 ? x0 : -x0 - T) + (face > 0 ? T + 0.004 : -0.004);
      s.add(hub);

      /* the one blue line, sitting on the plate's outer edge */
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(R - 0.002, 0.0042, 10, 96), mats.stripe);
      stripe.rotation.y = Math.PI / 2;
      stripe.position.x = (face > 0 ? x0 : -x0 - T) + (face > 0 ? T - 0.004 : -(T - 0.004));
      s.add(stripe);
    }

    const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.027, 0.018, 40, 1), mats.chrome);
    outer.rotation.z = Math.PI / 2;
    outer.position.x = face * (HALF + T * 2 + 0.03);
    s.add(outer);

    return s;
  };

  g.add(side(1));
  g.add(side(-1));

  /* the whole thing sits slightly nose-down, like it is resting in the air */
  g.rotation.z = -0.09;
  return g;
}

/* ------------------------------------------------------------------- boot */

async function boot() {
  const host = document.querySelector('.stage-obj');
  if (!host) return;
  const canvas = host.querySelector('canvas');
  if (!canvas) return;

  let THREE = null;
  try {
    THREE = await import(URL3);
  } catch (err) {
    return; // the photo stays
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    return; // no WebGL: the photo stays
  }

  renderer.setPixelRatio(Math.min(window.innerWidth < 700 ? 1.75 : 2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const env = studio(THREE, renderer);

  const mats = {
    steel: new THREE.MeshStandardMaterial({
      color: 0xc9d3e6, metalness: 1, roughness: 0.3, envMap: env, envMapIntensity: 1.15,
    }),
    knurl: new THREE.MeshStandardMaterial({
      color: 0xb9c4da, metalness: 1, roughness: 0.42, envMap: env, envMapIntensity: 1.1,
      bumpMap: knurl(THREE), bumpScale: 0.0016,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xe6ecf8, metalness: 1, roughness: 0.16, envMap: env, envMapIntensity: 1.35,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x1d2536, metalness: 0.3, roughness: 0.48, envMap: env, envMapIntensity: 1.7,
    }),
    stripe: new THREE.MeshStandardMaterial({
      color: ACCENT, metalness: 0.9, roughness: 0.28, envMap: env, envMapIntensity: 1.2,
    }),
  };

  const piece = bar(THREE, mats);
  const pivot = new THREE.Group();
  pivot.add(piece);
  scene.add(pivot);

  /* two lights on top of the environment: a hard key that draws the plate
     edges and a blue rim from behind, so the silhouette separates from the
     blue field instead of dissolving into it */
  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(0.9, 1.3, 1.1);
  scene.add(key);

  /* a low fill from the left so the near plate's face is not a black hole */
  const fill = new THREE.DirectionalLight(0xdce8ff, 1.5);
  fill.position.set(-1.3, 0.5, 0.8);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x8fb0ff, 2.6);
  rim.position.set(-1.2, 0.4, -1.1);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x9fb8ff, 0.42));

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  camera.position.set(0.62, 0.4, 0.62);
  camera.lookAt(0, 0, 0);

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* keep the bar filling the box on tall, narrow phones */
    camera.position.set(0.62, 0.4, camera.aspect < 1.1 ? 0.82 : 0.62);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  /* pointer lean, only where there is a real pointer */
  const fine = window.matchMedia('(pointer:fine)').matches;
  let leanX = 0;
  let leanY = 0;
  let targetX = 0;
  let targetY = 0;
  if (fine) {
    window.addEventListener('pointermove', (e) => {
      targetY = (e.clientX / window.innerWidth - 0.5) * 0.55;
      targetX = (e.clientY / window.innerHeight - 0.5) * 0.3;
    }, { passive: true });
  }

  let spin = 0.55;
  let clock = 0;
  let running = false;
  let last = 0;
  let raf = 0;

  const still = reduceMotion();

  const draw = () => {
    pivot.rotation.y = spin + leanY;
    pivot.rotation.x = leanX;
    pivot.position.y = Math.sin(clock * 0.9) * 0.012;
    renderer.render(scene, camera);
  };

  const loop = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    clock += dt;
    spin += dt * 0.34;
    leanX += (targetX - leanX) * 0.06;
    leanY += (targetY - leanY) * 0.06;
    draw();
  };

  const start = () => {
    if (running || still) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  resize();

  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !document.hidden) start();
      else stop();
    }, { rootMargin: '140px' }).observe(host);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && onScreen) start();
    else stop();
  });

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  /* first frame is on screen before the canvas is allowed to fade in, so a
     failed context never leaves a blank rectangle over the hero */
  draw();
  host.classList.add('is-3d');
  if (!still) start();
}

boot();
