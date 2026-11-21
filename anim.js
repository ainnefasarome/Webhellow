(function () {
  var root = document.documentElement;

  /* ================= MUSIK ================= */
  var bgm = document.getElementById('bgm');
  if (bgm) {
    bgm.volume = 0.85;
    var evs = ['click', 'touchend', 'pointerup', 'keydown'];
    var rmEv = function (e) { document.removeEventListener(e, onGesture, true); };
    var onGesture = function () {
      bgm.muted = false;
      var p = bgm.play();
      if (p && p.then) {
        p.then(function () { evs.forEach(rmEv); }).catch(function () {});
      } else {
        evs.forEach(rmEv);
      }
    };
    bgm.muted = false;
    var first = bgm.play();
    if (first && first.catch) {
      first.catch(function () {
        // Browser menahan suara otomatis: jalan dulu tanpa suara,
        // begitu pengunjung menyentuh layar langsung berbunyi.
        bgm.muted = true;
        var q2 = bgm.play();
        if (q2 && q2.catch) q2.catch(function () {});
        evs.forEach(function (e) { document.addEventListener(e, onGesture, true); });
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) bgm.pause();
      else { var r = bgm.play(); if (r && r.catch) r.catch(function () {}); }
    });
  }

  /* ================= UTIL ================= */
  var SEL = '.card,.avatar-wrap,.badge,.stats,.chip,.ic,.settings';
  function qa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function q(s) { return document.querySelector(s); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function showAll() {
    qa(SEL).forEach(function (e) { e.classList.add('shown'); });
    root.classList.remove('anim-on');
    var f = document.getElementById('fx');
    if (f) f.remove();
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { showAll(); return; }

  /* ================= PERSIAPAN TEKS (dipecah per huruf) ================= */
  function splitChars(el) {
    var s = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    for (var i = 0; i < s.length; i++) {
      var sp = document.createElement('span');
      sp.className = 'c';
      sp.textContent = s.charAt(i);
      el.appendChild(sp);
    }
  }
  function prep() {
    qa('.info h1,.info p,.stats .label,.stats .num,.skills h2,.settings').forEach(splitChars);
    qa('.chip').forEach(function (chip) {
      var nodes = chip.childNodes, tn = null;
      for (var i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].nodeType === 3 && nodes[i].nodeValue.trim()) { tn = nodes[i]; break; }
      }
      if (!tn) return;
      var holder = document.createElement('span');
      holder.className = 't';
      holder.textContent = tn.nodeValue.trim();
      chip.replaceChild(holder, tn);
      splitChars(holder);
    });
  }

  /* ================= KURSOR ================= */
  var EASE = 'cubic-bezier(.45,0,.2,1)';
  var W = window.innerWidth, H = window.innerHeight;
  var fx = document.createElement('div');
  fx.id = 'fx';
  document.body.appendChild(fx);

  var CUR_SVG =
    '<svg width="16" height="23" viewBox="0 0 14 20">' +
    '<path d="M1 1v15.2l3.6-3.4 2.5 6 2.4-1-2.4-5.8h5z" fill="#fff" stroke="#000" ' +
    'stroke-width="1.1" stroke-linejoin="round"/></svg>';

  var all = [];
  var roaming = true;

  function newCursor() {
    var side = Math.floor(Math.random() * 4), x, y;
    if (side === 0) { x = rand(0, W); y = -40; }
    else if (side === 1) { x = W + 40; y = rand(0, H); }
    else if (side === 2) { x = rand(0, W); y = H + 40; }
    else { x = -40; y = rand(0, H); }
    var el = document.createElement('div');
    el.className = 'cur';
    el.innerHTML = CUR_SVG;
    el.style.transition = 'none';
    el.style.transform = 'translate(' + (x - 1) + 'px,' + (y - 1) + 'px)';
    fx.appendChild(el);
    var c = { el: el, svg: el.firstChild, x: x, y: y };
    all.push(c);
    return c;
  }
  function launch(c) {
    c.el.getBoundingClientRect();
    c.el.style.transition = 'opacity .3s ease';
    c.el.style.opacity = 1;
  }
  // (x, y) = ujung panah
  function moveTo(c, x, y, ms) {
    c.el.style.transition = 'transform ' + ms + 'ms ' + EASE + ', opacity .3s ease';
    c.el.style.transform = 'translate(' + (x - 1) + 'px,' + (y - 1) + 'px)';
    c.x = x; c.y = y;
    return sleep(ms);
  }
  function travel(c, x, y) {
    var d = Math.hypot(c.x - x, c.y - y);
    return moveTo(c, x, y, clamp(260 + d * 0.75, 300, 750));
  }
  function click(c) {
    c.svg.style.transform = 'scale(.8)';
    return sleep(110).then(function () {
      c.svg.style.transform = '';
      return sleep(90);
    });
  }

  /* ================= AKSI ================= */
  function mkBox() {
    var b = document.createElement('div');
    b.className = 'sel';
    b.innerHTML = '<i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i>';
    fx.appendChild(b);
    return b;
  }

  // kursor menarik kotak seleksi, lalu elemennya jadi
  async function shell(c, el) {
    var r = el.getBoundingClientRect();
    var L = r.left, T = r.top, w = r.width, h = r.height;
    await travel(c, L, T);
    var b = mkBox();
    b.style.transition = 'none';
    b.style.left = L + 'px'; b.style.top = T + 'px';
    b.style.width = '0px'; b.style.height = '0px';
    b.getBoundingClientRect();
    var grow = clamp(300 + (w + h) * 0.8, 380, 800);
    b.style.transition = 'opacity .2s ease, width ' + grow + 'ms ' + EASE + ', height ' + grow + 'ms ' + EASE;
    b.style.opacity = 1;
    b.style.width = w + 'px';
    b.style.height = h + 'px';
    await moveTo(c, L + w, T + h, grow);
    await sleep(120);
    el.classList.add('shown');
    await sleep(160);
    b.style.opacity = 0;
    setTimeout(function () { b.remove(); }, 300);
  }

  // kursor klik di teks, lalu mengetik huruf demi huruf dengan garis ketik
  async function typeEl(c, el, ms) {
    var chars = el.querySelectorAll('.c');
    if (!chars.length) return;
    var r = chars[0].getBoundingClientRect();
    await travel(c, r.left + 1, r.top + r.height * 0.6);
    await click(c);
    var caret = document.createElement('span');
    caret.className = 'caret typing';
    chars[0].parentNode.insertBefore(caret, chars[0]);
    // kursor menyingkir sedikit supaya tidak menutupi teks
    moveTo(c, r.left + rand(14, 40), r.top + r.height + rand(8, 22), 500);
    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.add('on');
      chars[i].parentNode.insertBefore(caret, chars[i].nextSibling);
      await sleep(ms * rand(0.6, 1.4));
    }
    caret.className = 'caret';
    await sleep(380);
    caret.remove();
  }

  // satu chip skill: tarik pil -> ikon membal -> ketik nama skill
  async function chipBuild(c, chip) {
    await shell(c, chip);
    var ic = chip.querySelector('.ic');
    if (ic) {
      var r = ic.getBoundingClientRect();
      await travel(c, r.left + r.width / 2, r.top + r.height / 2);
      await click(c);
      ic.classList.add('shown');
      await sleep(260);
    }
    var t = chip.querySelector('.t');
    if (t) await typeEl(c, t, 70);
  }

  // kursor yang sudah selesai tetap berkeliaran pelan
  function idle(c) {
    (async function () {
      await moveTo(c, rand(W * 0.05, W * 0.95), rand(H * 0.06, H * 0.94), rand(700, 1300));
      while (roaming) {
        await sleep(rand(400, 900));
        if (!roaming) break;
        await moveTo(c, clamp(c.x + rand(-40, 40), 10, W - 10), clamp(c.y + rand(-40, 40), 10, H - 10), 500);
        if (roaming && Math.random() < 0.3) await click(c);
      }
    })();
  }

  // kursor tambahan yang keliling layar dari awal
  function roam(c, delay) {
    (async function () {
      await sleep(delay);
      launch(c);
      while (roaming) {
        await moveTo(c, rand(W * 0.05, W * 0.95), rand(H * 0.06, H * 0.94), rand(700, 1500));
        if (roaming && Math.random() < 0.35) await click(c);
        await sleep(rand(80, 350));
      }
    })();
  }

  function job(dep, delay, fn) {
    var c = newCursor();
    return (dep || Promise.resolve())
      .then(function () { return sleep(delay); })
      .then(function () { launch(c); return fn(c); })
      .then(function () { idle(c); });
  }

  /* ================= SUSUNAN PEMBUATAN ================= */
  async function run() {
    prep();

    // 6 kursor tambahan yang terus keliling
    for (var k = 0; k < 6; k++) roam(newCursor(), 150 + k * 450);

    await sleep(350);
    var jobs = [];
    var card = job(null, 0, function (c) { return shell(c, q('.card')); });
    jobs.push(card);

    // foto profil + badge
    var avatar = job(card, 100, function (c) { return shell(c, q('.avatar-wrap')); });
    var badge  = job(avatar, 0, function (c) { return shell(c, q('.badge')); });
    jobs.push(avatar, badge);

    // nama dan lokasi diketik
    jobs.push(job(card, 500,  function (c) { return typeEl(c, q('.info h1'), 120); }));
    jobs.push(job(card, 1000, function (c) { return typeEl(c, q('.info p'), 45); }));

    // Following / Followers
    var stats = job(card, 1500, function (c) { return shell(c, q('.stats')); });
    jobs.push(stats);
    var labels = qa('.stats .label'), nums = qa('.stats .num');
    for (var s = 0; s < 2; s++) {
      (function (i) {
        var l = job(stats, i * 200, function (c) { return typeEl(c, labels[i], 70); });
        var n = job(l, 0, function (c) { return typeEl(c, nums[i], 160); });
        jobs.push(l, n);
      })(s);
    }

    // judul Skills
    jobs.push(job(card, 2300, function (c) { return typeEl(c, q('.skills h2'), 90); }));

    // 7 chip skill, masing-masing punya kursor sendiri
    qa('.chip').forEach(function (chip, i) {
      jobs.push(job(card, 2800 + i * 380, function (c) { return chipBuild(c, chip); }));
    });

    // tombol Account Settings
    jobs.push(job(card, 3800, async function (c) {
      var b = q('.settings');
      await shell(c, b);
      await typeEl(c, b, 55);
    }));

    await Promise.all(jobs);
    await sleep(900);

    // semua kursor pergi keluar layar
    roaming = false;
    await Promise.all(all.map(function (c) {
      var left = c.x, right = W - c.x, top = c.y, bottom = H - c.y;
      var m = Math.min(left, right, top, bottom), x = c.x, y = c.y;
      if (m === left) x = -50; else if (m === right) x = W + 50;
      else if (m === top) y = -50; else y = H + 50;
      c.el.style.opacity = 0;
      return moveTo(c, x, y, 800);
    }));
    showAll();
  }

  run().catch(showAll);
})();
