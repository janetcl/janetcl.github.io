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
