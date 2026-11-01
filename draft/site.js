// Hides the first-visit loader after the page has loaded and it has shown for at least ~1.2s.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('is-loading')) return;

  var loader = document.getElementById('loader');
  var MIN_MS = 3000;
  var MAX_MS = 5000;
  var start = (window.performance && performance.now) ? performance.now() : Date.now();
  var finished = false;

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (!loader) { root.classList.remove('is-loading'); return; }
    loader.classList.add('is-done');
    setTimeout(function () { root.classList.remove('is-loading'); }, 450);
  }

  function whenLoaded() {
    setTimeout(finish, Math.max(0, MIN_MS - (now() - start)));
  }

  if (document.readyState === 'complete') whenLoaded();
  else window.addEventListener('load', whenLoaded);

  // A tap or key press skips it.
  if (loader) loader.addEventListener('click', finish);
  window.addEventListener('keydown', finish, { once: true });

  // Never trap the visitor if something stalls.
  setTimeout(finish, MAX_MS);
})();
