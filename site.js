// Hides the loader as soon as the page has loaded. It only ever appeared if loading was slow.
(function () {
  var root = document.documentElement;
  var loader = document.getElementById('loader');
  var MIN_VISIBLE_MS = 500; // once shown, stay long enough not to flicker
  var finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(window.__jlLoaderTimer);
    if (!root.classList.contains('is-loading')) return;
    var shownFor = Date.now() - (window.__jlLoaderShownAt || 0);
    setTimeout(function () {
      if (loader) loader.classList.add('is-done');
      setTimeout(function () { root.classList.remove('is-loading'); }, 450);
    }, Math.max(0, MIN_VISIBLE_MS - shownFor));
  }

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish);

  // A tap or key press skips it.
  if (loader) loader.addEventListener('click', function () { finished = false; window.__jlLoaderShownAt = 0; finish(); });
  window.addEventListener('keydown', function () { window.__jlLoaderShownAt = 0; finish(); }, { once: true });
})();

// Project media: Passage lines arrive in real time; the alabaster.org clip plays while on screen.
(function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return;

  function onScreen(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }, { threshold: 0.25 }).observe(el);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var video = document.querySelector('.site-video');
  if (video) {
    onScreen(video, function (visible) {
      if (visible) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else video.pause();
    });
  }

  var demo = document.querySelector('.pdemo');
  if (!demo || !window.Promise) return;
  var panels = Array.prototype.slice.call(demo.querySelectorAll('.pdemo__panel'));
  var lines = panels.map(function (panel) { return Array.prototype.slice.call(panel.querySelectorAll('p')); });
  var status = demo.querySelector('.pdemo__status');
  var visible = false;

  lines[0].forEach(function (p) {
    p.innerHTML = p.textContent.split(' ').map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
  });
  demo.classList.add('is-live');
  onScreen(demo, function (v) { visible = v; });

  function whileHidden() {
    return visible ? Promise.resolve() : wait(300).then(whileHidden);
  }
  function show(col, k) {
    lines[col].forEach(function (p) { p.classList.remove('is-current'); });
    var p = lines[col][k];
    p.classList.add('is-shown', 'is-current', 'is-entering');
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.remove('is-entering'); }); });
    return p;
  }

  async function run() {
    for (;;) {
      demo.classList.remove('is-fading');
      lines.forEach(function (col) { col.forEach(function (p) { p.classList.remove('is-shown', 'is-current'); }); });
      demo.querySelectorAll('.w').forEach(function (w) { w.classList.remove('is-on'); });
      for (var k = 0; k < 3; k++) {
        await whileHidden();
        status.textContent = 'listening';
        var src = show(0, k);
        var words = src.querySelectorAll('.w');
        for (var i = 0; i < words.length; i++) { words[i].classList.add('is-on'); await wait(120); }
        await wait(300);
        demo.classList.add('is-translating');
        status.textContent = 'translating…';
        await wait(500);
        show(1, k);
        await wait(140);
        show(2, k);
        demo.classList.remove('is-translating');
        status.textContent = 'listening';
        await wait(1500);
      }
      await wait(1600);
      demo.classList.add('is-fading');
      await wait(500);
    }
  }
  run();
})();

// Colour themes: click the palette to step through them; remembered for next time.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.palette');
  if (!btn) return;
  var order = ['', 'cherry', 'magenta', 'neon'];
  var names = { '': 'blue and peach', cherry: 'cherry and pink', magenta: 'magenta and lime', neon: 'orange and neon yellow' };
  var dabs = Array.prototype.slice.call(btn.querySelectorAll('.dab'));
  var meta = document.querySelector('meta[name="theme-color"]');
  function sync() {
    var cur = root.dataset.theme || '';
    dabs.forEach(function (d) { d.classList.toggle('is-on', d.getAttribute('data-for') === cur); });
    btn.setAttribute('aria-label', 'Change colors (now: ' + names[cur] + ')');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim() || '#FAFAF7');
  }
  btn.addEventListener('click', function () {
    var cur = root.dataset.theme || '';
    var next = order[(order.indexOf(cur) + 1) % order.length];
    if (next) root.dataset.theme = next; else delete root.dataset.theme;
    try { if (next) localStorage.setItem('jl-theme', next); else localStorage.removeItem('jl-theme'); } catch (e) {}
    btn.classList.remove('is-dabbing'); void btn.offsetWidth; btn.classList.add('is-dabbing');
    sync();
  });
  sync();
})();

// Church app: slide through the real screens while the phone is on screen.
(function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var track = document.querySelector('.phone__track');
  if (!track || reduce) return;
  var count = track.children.length, i = 0, timer = null;
  function next() {
    i = (i + 1) % count;
    Array.prototype.forEach.call(track.children, function (s) { s.style.transform = 'translateX(' + (-100 * i) + '%)'; });
  }
  function start() { if (!timer) timer = setInterval(next, 2800); }
  function stop() { clearInterval(timer); timer = null; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.3 }).observe(track);
  } else start();
})();
