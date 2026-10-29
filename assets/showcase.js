(function () {
  var root = document.querySelector('.showcase');
  if (!root) return;
  var tabs = [].slice.call(root.querySelectorAll('.showcase-tab'));
  var shots = [].slice.call(root.querySelectorAll('.showcase-shot'));
  var dotsWrap = root.querySelector('.showcase-dots');
  var tabList = root.querySelector('.showcase-tabs');
  var stage = root.querySelector('.showcase-stage');
  var n = shots.length, cur = 0, timer = null, userTouched = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = shots.map(function (_, i) {
    var d = document.createElement('i');
    if (i === 0) d.className = 'active';
    dotsWrap.appendChild(d);
    return d;
  });

  function show(i, fromUser) {
    cur = (i + n) % n;
    shots.forEach(function (s, k) { s.classList.toggle('active', k === cur); });
    tabs.forEach(function (t, k) {
      t.classList.toggle('active', k === cur);
      t.setAttribute('aria-selected', k === cur ? 'true' : 'false');
    });
    dots.forEach(function (d, k) { d.classList.toggle('active', k === cur); });
    // keep the active tab in view on small screens (horizontal strip) without moving the page
    var t = tabs[cur];
    if (tabList.scrollWidth > tabList.clientWidth) {
      tabList.scrollTo({ left: t.offsetLeft - (tabList.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    }
    if (fromUser) { userTouched = true; stop(); }
  }
  function start() { if (reduce || userTouched || timer) return; timer = setInterval(function () { show(cur + 1); }, 4500); }
  function stop() { clearInterval(timer); timer = null; }

  tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i, true); }); });
  stage.addEventListener('click', function () { show(cur + 1, true); });

  // swipe on the phone
  var x0 = null;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  // arrow keys on the tab list
  tabList.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); tabs[cur].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); tabs[cur].focus(); }
  });

  // autoplay only while visible; pause on hover
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.35 }).observe(root);
  } else { start(); }
})();
