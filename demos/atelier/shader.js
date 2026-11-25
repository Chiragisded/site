/* The light behind the hero — a hand-written WebGL fragment shader.
   No library, no texture: five octaves of value noise, domain-warped,
   tinted from ink to ice with a warm sand bloom. */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

const FRAG = [
  'precision highp float;',
  'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
  'float noise(vec2 p){',
  '  vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
  '  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);',
  '}',
  'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}',
  'void main(){',
  '  vec2 uv=gl_FragCoord.xy/uRes;',
  '  vec2 p=(uv-0.5)*vec2(uRes.x/uRes.y,1.0);',
  '  float t=uTime*0.055;',
  '  vec2 q=p*1.35+vec2(t*0.7,-t*0.32)+(uMouse-0.5)*0.22;',
  '  float f=fbm(q+fbm(q*1.8+vec2(t*0.4,-t*0.6)));',
  '  vec3 deep=vec3(0.031,0.038,0.051);',
  '  vec3 mid=vec3(0.095,0.165,0.300);',
  '  vec3 ice=vec3(0.487,0.780,0.910);',
  '  vec3 sand=vec3(0.847,0.765,0.647);',
  '  vec3 col=mix(deep,mid,smoothstep(0.06,0.92,f));',
  '  col=mix(col,ice,pow(smoothstep(0.26,1.0,f),1.6)*0.86);',
  '  float warm=fbm(q*2.2-vec2(t*0.8,t*0.3));',
  '  col=mix(col,sand,pow(smoothstep(0.46,1.0,warm),2.4)*0.38);',
  '  col*=1.0-0.42*length(p*0.86);',
  '  col+=(hash(uv*uRes+uTime)-0.5)*0.030;',
  '  gl_FragColor=vec4(col,1.0);',
  '}',
].join('\n');

/* A second, quieter shader: slow silk bands for the closing band, so the
   page has light at the top and a low glow at the bottom of the scroll. */
const FRAG_AURORA = [
  'precision highp float;',
  'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
  'float noise(vec2 p){',
  '  vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
  '  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);',
  '}',
  'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.07;a*=0.5;}return v;}',
  'void main(){',
  '  vec2 uv=gl_FragCoord.xy/uRes;',
  '  vec2 p=(uv-0.5)*vec2(uRes.x/uRes.y,1.0);',
  '  float t=uTime*0.05;',
  '  float warp=fbm(vec2(p.x*1.1+t*0.5,uMouse.x*0.6)+vec2(t*0.3,uMouse.y*0.8));',
  '  float band=sin(p.y*3.4+warp*2.4+t*1.1);',
  '  float glow=smoothstep(0.10,1.0,band);',
  '  vec3 col=vec3(0.024,0.031,0.042);',
  '  col=mix(col,vec3(0.24,0.46,0.66),glow*0.40);',
  '  col=mix(col,vec3(0.55,0.86,0.98),pow(glow,4.0)*0.28);',
  '  col=mix(col,vec3(0.72,0.62,0.50),pow(smoothstep(0.55,1.0,fbm(p*1.7-t)),3.0)*0.16);',
  '  col*=1.0-0.62*length(p*0.82);',
  '  col+=(hash(uv*uRes+uTime)-0.5)*0.018;',
  '  gl_FragColor=vec4(col,1.0);',
  '}',
].join('\n');

export function initShader(canvas, options) {
  const variant = (options && options.variant) || 'hero';
  const opts = { antialias: false, alpha: false, powerPreference: 'low-power' };
  const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  if (!gl) return;

  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, variant === 'aurora' ? FRAG_AURORA : FRAG);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uMouse = gl.getUniformLocation(program, 'uMouse');

  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, raf = 0, visible = true;
  const t0 = performance.now();

  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(time) {
    resize();
    mx = lerp(mx, tx, 0.045);
    my = lerp(my, ty, 0.045);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (time - t0) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(time) {
    draw(time);
    raf = requestAnimationFrame(loop);
  }
  const start = () => {
    if (raf || !visible || document.hidden || still) return;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  (canvas.parentElement || canvas).addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    tx = clamp((event.clientX - rect.left) / rect.width);
    ty = clamp(1 - (event.clientY - rect.top) / rect.height);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('resize', () => { resize(); if (still) draw(t0); });

  draw(t0);
  start();
}
