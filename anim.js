(function () {
  var root = document.documentElement;

  /* ================= MUSIK ================= */
  var bgm = document.getElementById('bgm');
  if (bgm) {
    bgm.volume = 0.85;
    var evs = ['click', 'touchend', 'pointerup', 'keydown'];
    var onGesture = function () {
      bgm.muted = false;
      var p = bgm.play();
      if (p && p.then) {
        p.then(function () { evs.forEach(rmEv); }).catch(function () {});
      } else {
        evs.forEach(rmEv);
      }
    };
    var rmEv = function (e) { document.removeEventListener(e, onGesture, true); };

    bgm.muted = false;
    var first = bgm.play();
    if (first && first.catch) {
      first.catch(function () {
        // Browser menahan suara otomatis: jalan dulu tanpa suara,
        // begitu pengunjung menyentuh layar langsung berbunyi.
        bgm.muted = true;
        var q = bgm.play();
        if (q && q.catch) q.catch(function () {});
        evs.forEach(function (e) { document.addEventListener(e, onGesture, true); });
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) bgm.pause();
      else { var r = bgm.play(); if (r && r.catch) r.catch(function () {}); }
    });
  }

  /* ================= ANIMASI ================= */
  var SEL = '.card,.avatar-wrap,.badge,.info h1,.info p,.stats,.skills h2,.chip,.settings';
  function qa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function q(s) { return document.querySelector(s); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function showAll() {
    qa(SEL).forEach(function (e) { e.classList.add('shown'); });
    root.classList.remove('anim-on');
    var f = document.getElementById('fx');
    if (f) f.remove();
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { showAll(); return; }

  var EASE = 'cubic-bezier(.45,0,.2,1)';
  var USERS = [
    { n: 'Tommy', c: '#f24822' },
    { n: 'Rina',  c: '#0d99ff' },
    { n: 'Dev',   c: '#14ae5c' },
    { n: 'Kai',   c: '#a259ff' }
  ];

  var fx = document.createElement('div');
  fx.id = 'fx';
  document.body.appendChild(fx);

  function mkCursor(u, x, y) {
    var el = document.createElement('div');
    el.className = 'cur';
    el.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 1.5v13.2l3.5-3.1 2.4 5.2 2.2-1-2.4-5.1H13z" fill="' +
      u.c + '" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg><span style="background:' +
      u.c + '">' + u.n + '</span>';
    el.style.transition = 'none';
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    fx.appendChild(el);
    el.getBoundingClientRect();
    el.style.opacity = 1;
    return { el: el, x: x, y: y };
  }

  function moveTo(c, x, y, ms) {
    c.el.style.transition = 'transform ' + ms + 'ms ' + EASE + ', opacity .3s ease';
    c.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    c.x = x; c.y = y;
    return sleep(ms);
  }

  function mkBox(w, h) {
    var b = document.createElement('div');
    b.className = 'sel';
    b.innerHTML = '<i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i><b class="dim">' +
      Math.round(w) + ' \u00d7 ' + Math.round(h) + '</b>';
    fx.appendChild(b);
    return b;
  }

  async function build(c, el) {
    var r = el.getBoundingClientRect();
    var L = r.left, T = r.top, W = r.width, H = r.height;

    // 1. panah terbang ke sudut kiri-atas elemen
    var dist = Math.hypot(c.x - L, c.y - T);
    await moveTo(c, L - 2, T - 2, clamp(250 + dist * 0.8, 300, 700));

    // 2. tarik kotak seleksi sampai ukuran elemen
    var b = mkBox(W, H);
    b.style.transition = 'none';
    b.style.left = L + 'px'; b.style.top = T + 'px';
    b.style.width = '0px'; b.style.height = '0px';
    b.getBoundingClientRect();
    var grow = clamp(300 + (W + H) * 0.8, 380, 800);
    b.style.transition = 'opacity .2s ease, width ' + grow + 'ms ' + EASE + ', height ' + grow + 'ms ' + EASE;
    b.style.opacity = 1;
    b.style.width = W + 'px';
    b.style.height = H + 'px';
    await moveTo(c, L + W - 2, T + H - 2, grow);

    // 3. elemen muncul, seleksi hilang
    await sleep(130);
    el.classList.add('shown');
    await sleep(170);
    b.style.opacity = 0;
    setTimeout(function () { b.remove(); }, 300);
  }

  async function lane(c, els, delay) {
    await sleep(delay);
    for (var i = 0; i < els.length; i++) await build(c, els[i]);
  }

  async function run() {
    var W = window.innerWidth, H = window.innerHeight;
    var cs = [
      mkCursor(USERS[0], -50, H * 0.2),
      mkCursor(USERS[1], W + 50, H * 0.1),
      mkCursor(USERS[2], -50, H + 50),
      mkCursor(USERS[3], W + 50, H * 0.85)
    ];
    await sleep(300);

    // kotak kartu dibuat dulu
    await build(cs[0], q('.card'));

    var chips = qa('.chip');
    await Promise.all([
      lane(cs[0], [q('.avatar-wrap'), q('.badge'), q('.stats'), chips[3]], 0),
      lane(cs[1], [q('.info h1'), q('.skills h2'), chips[0], chips[4]], 150),
      lane(cs[2], [q('.info p'), chips[1], chips[5]], 300),
      lane(cs[3], [chips[2], chips[6], q('.settings')], 450)
    ]);

    // semua panah pergi
    await Promise.all(cs.map(function (c, i) {
      c.el.style.opacity = 0;
      return moveTo(c, i % 2 ? W + 60 : -60, H * (0.1 + i * 0.25), 700);
    }));
    showAll();
  }

  run().catch(showAll);
})();
