/* Shared dot field: the crest and the cursor halo. Used by the homepage and the sample hub. */
/* Dot field: a slow crest travelling top-left to bottom-right, plus a halo that
   fattens the dots around the cursor or finger. Falls back to the CSS grain when
   the visitor prefers reduced motion, or when this script does not run. */
(function(){
  var cv = document.getElementById('dotfield');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!cv || !cv.getContext || (reduce && reduce.matches)) return;

  var ctx = cv.getContext('2d');
  var GAP = 24, SPEED = 0.9, REACH = 160, MAXR = 4.2, FREQ = 0.0121;
  var w = 0, h = 0, dpr = 1, pts = [];
  var px = -1e4, py = -1e4, tx = -1e4, ty = -1e4;
  var start = 0, last = 0, live = false;

  function build(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    pts.length = 0;
    for (var y = 0; y <= h + GAP; y += GAP)
      for (var x = 0; x <= w + GAP; x += GAP) pts.push(x, y);
  }

  function paint(now){
    requestAnimationFrame(paint);
    if (document.hidden || now - last < 24) return;   /* ~40fps is plenty for this */
    last = now;
    if (!start) start = now;
    var t = (now - start) / 1000;

    px += (tx - px) * 0.14; py += (ty - py) * 0.14;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    /* group dots into six alpha steps, so this is six fills per frame, not thousands */
    var buckets = [[], [], [], [], [], [], [], []], reach2 = REACH * REACH;
    for (var i = 0; i < pts.length; i += 2){
      var x = pts[i], y = pts[i + 1];
      var wave = Math.sin((x + y) * FREQ - t * SPEED);
      var k = wave * 0.5 + 0.5;
      var r = 1.8 + 1.3 * k;
      var infl = 0;
      var dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
      if (d2 < reach2){
        infl = 1 - Math.sqrt(d2) / REACH;
        infl *= infl;
        r += MAXR * infl;
      }
      var a = 0.05 + 0.07 * k + 0.2 * infl;
      buckets[Math.min(7, (a * 24) | 0)].push(x, y, r);
    }
    for (var b = 0; b < 8; b++){
      var arr = buckets[b];
      if (!arr.length) continue;
      ctx.fillStyle = 'rgba(255,255,255,' + ((b + 1) / 24).toFixed(3) + ')';
      ctx.beginPath();
      for (var j = 0; j < arr.length; j += 3){
        ctx.moveTo(arr[j] + arr[j + 2], arr[j + 1]);
        ctx.arc(arr[j], arr[j + 1], arr[j + 2], 0, 6.2832);
      }
      ctx.fill();
    }

    if (!live){ live = true; document.documentElement.classList.add('dots-live'); }
  }

  function aim(e){
    var p = e.touches ? e.touches[0] : e;
    if (!p) return;
    tx = p.clientX; ty = p.clientY;
  }
  function away(){ tx = -1e4; ty = -1e4; }

  window.addEventListener('pointermove', aim, {passive: true});
  window.addEventListener('pointerdown', aim, {passive: true});
  window.addEventListener('touchmove', aim, {passive: true});
  window.addEventListener('blur', away);
  window.addEventListener('mouseout', function(e){ if (!e.relatedTarget) away(); });

  var rz;
  window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(build, 150); });

  build();
  requestAnimationFrame(paint);
})();
