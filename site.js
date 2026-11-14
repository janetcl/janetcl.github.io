// Loading: finish the top line when everything is in, and let late photos fade in.
(function () {
  var root = document.documentElement;
  function done() { clearTimeout(window.__jlSlow); root.classList.add('is-loaded'); }
  if (document.readyState === 'complete') done(); else window.addEventListener('load', done);
  Array.prototype.forEach.call(document.querySelectorAll('main img'), function (img) {
    if (img.complete) return;
    img.classList.add('fade-in');
    var show = function () { img.classList.add('is-in'); };
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
  });
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

  Array.prototype.forEach.call(document.querySelectorAll('.site-video'), function (video) {
    onScreen(video, function (visible) {
      if (visible) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else video.pause();
    });
  });

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

// Jolly idles (breathes, blinks, phone chatter) only while on screen; the Connect demo opens in a popup.
(function () {
  var pic = document.querySelector('.job__pic');
  if (pic) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { pic.classList.toggle('is-awake', e[0].isIntersecting); }).observe(pic);
    } else pic.classList.add('is-awake');
  }

  var link = document.querySelector('[data-connect]');
  var dlg = document.getElementById('connect-clip');
  if (!link || !dlg || typeof dlg.showModal !== 'function') return;
  var body = dlg.querySelector('.clip__body');
  var loaded = false;
  link.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    dlg.showModal();
    if (loaded) return;
    loaded = true;
    var q = document.createElement('blockquote');
    q.className = 'twitter-tweet';
    q.setAttribute('data-media-max-width', '520');
    q.setAttribute('data-dnt', 'true');
    q.setAttribute('data-conversation', 'none');
    q.innerHTML = '<a href="' + link.href + '"></a>';
    body.appendChild(q);
    var s = document.createElement('script');
    s.src = 'https://platform.twitter.com/widgets.js';
    s.async = true;
    s.onload = function () {
      if (window.twttr && twttr.widgets) twttr.widgets.load(body).then(function () { var w = body.querySelector('.clip__wait'); if (w) w.remove(); });
    };
    s.onerror = function () { body.querySelector('.clip__wait').textContent = 'The post could not load here. Open it on X below.'; };
    document.head.appendChild(s);
  });
  dlg.querySelector('.clip__close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () {
    // Stop playback by re-rendering the embed next time.
    var f = body.querySelector('iframe');
    if (f) { body.innerHTML = '<p class="clip__wait">Loading…</p>'; loaded = false; }
  });
})();
