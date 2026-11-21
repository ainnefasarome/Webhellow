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
  var SEL = '.card,.avatar-wrap,.stats,.skillgif,.settings';
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
    Array.from(s).forEach(function (ch) {
      var sp = document.createElement('span');
      sp.className = 'c' + (ch === '\uD83D\uDC4B' ? ' wave' : '');
      sp.textContent = ch;
      el.appendChild(sp);
    });
  }
  function prep() {
    qa('.info h1,.info p,.stats .label,.stats .num,.skills h2,.settings').forEach(splitChars);
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

  function defer() {
    var d = {};
    d.p = new Promise(function (r) { d.res = r; });
    return d;
  }

  // kursor muncul dari tepi layar terdekat dengan targetnya
  function spawn(el) {
    var r = el.getBoundingClientRect();
    var tx = r.left, ty = r.top;
    var dl = tx, dr = W - tx, dt = ty, db = H - ty;
    var m = Math.min(dl, dr, dt, db), x = tx, y = ty;
    if (m === dl) x = -40; else if (m === dr) x = W + 40;
    else if (m === dt) y = -40; else y = H + 40;
    var d = document.createElement('div');
    d.className = 'cur';
    d.innerHTML = CUR_SVG;
    d.style.transition = 'none';
    d.style.transform = 'translate(' + (x - 1) + 'px,' + (y - 1) + 'px)';
    fx.appendChild(d);
    d.getBoundingClientRect();
    d.style.transition = 'opacity .3s ease';
    d.style.opacity = 1;
    return { el: d, svg: d.firstChild, x: x, y: y };
  }
  // (x, y) = ujung panah
  function moveTo(c, x, y, ms) {
    c.el.style.transition = 'transform ' + ms + 'ms ' + EASE + ', opacity .3s ease';
    c.el.style.transform = 'translate(' + (x - 1) + 'px,' + (y - 1) + 'px)';
    c.x = x; c.y = y;
    return sleep(ms);
  }
  function travel(c, x, y, fast) {
    var d = Math.hypot(c.x - x, c.y - y);
    return moveTo(c, x, y, clamp((fast ? 150 : 260) + d * 0.75, fast ? 200 : 300, 750));
  }
  function click(c) {
    c.svg.style.transform = 'scale(.8)';
    return sleep(100).then(function () {
      c.svg.style.transform = '';
      return sleep(70);
    });
  }
  // setelah tugas selesai, kursor langsung pamit lewat tepi layar terdekat
  async function leave(c) {
    var dl = c.x, dr = W - c.x, dt = c.y, db = H - c.y;
    var m = Math.min(dl, dr, dt, db), x = c.x, y = c.y;
    if (m === dl) x = -50; else if (m === dr) x = W + 50;
    else if (m === dt) y = -50; else y = H + 50;
    c.el.style.opacity = 0;
    await moveTo(c, x, y, 650);
    c.el.remove();
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
  async function shell(c, el, fast) {
    var r = el.getBoundingClientRect();
    var L = r.left, T = r.top, w = r.width, h = r.height;
    await travel(c, L, T, fast);
    var b = mkBox();
    b.style.transition = 'none';
    b.style.left = L + 'px'; b.style.top = T + 'px';
    b.style.width = '0px'; b.style.height = '0px';
    b.getBoundingClientRect();
    var grow = clamp(300 + (w + h) * 0.8, fast ? 300 : 380, 800);
    b.style.transition = 'opacity .2s ease, width ' + grow + 'ms ' + EASE + ', height ' + grow + 'ms ' + EASE;
    b.style.opacity = 1;
    b.style.width = w + 'px';
    b.style.height = h + 'px';
    await moveTo(c, L + w, T + h, grow);
    await sleep(fast ? 50 : 110);
    el.classList.add('shown');
    await sleep(fast ? 90 : 150);
    b.style.opacity = 0;
    setTimeout(function () { b.remove(); }, 300);
  }

  // kursor klik di teks, lalu mengetik huruf demi huruf dengan garis ketik
  // dep (opsional): kursor sudah standby di posisi, menunggu bagian sebelumnya selesai
  async function typeEl(c, el, ms, dep) {
    var chars = el.querySelectorAll('.c');
    if (!chars.length) return;
    var r = chars[0].getBoundingClientRect();
    await travel(c, r.left + 1, r.top + r.height * 0.6, true);
    if (dep) await dep;
    await click(c);
    var caret = document.createElement('span');
    caret.className = 'caret typing';
    chars[0].parentNode.insertBefore(caret, chars[0]);
    // kursor menyingkir sedikit supaya tidak menutupi teks
    moveTo(c, r.left + rand(14, 36), r.top + r.height + rand(8, 18), 450);
    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.add('on');
      chars[i].parentNode.insertBefore(caret, chars[i].nextSibling);
      await sleep(ms * rand(0.7, 1.3));
    }
    caret.className = 'caret';
    await sleep(260);
    caret.remove();
  }

  // satu pekerja: menunggu bahannya siap, muncul, bekerja, lalu pergi
  async function worker(dep, firstEl, fn) {
    if (dep) await dep;
    var c = spawn(firstEl);
    await fn(c);
    await leave(c);
  }

  /* ================= PEMBAGIAN TUGAS (4 KURSOR) ================= */
  async function run() {
    prep();
    var cardD = defer(), statsD = defer(), btnD = defer();
    var tasks = [];

    // 1. Pembuat kotak: kartu -> statistik -> kotak GIF -> tombol
    tasks.push(worker(null, q('.card'), async function (c) {
      await shell(c, q('.card'));         cardD.res();
      await shell(c, q('.stats'));        statsD.res();
      await shell(c, q('.skillgif'));
      await shell(c, q('.settings'));     btnD.res();
    }));

    // 2. Pembuat foto profil: tarik lingkaran, lalu logo menulis dirinya sendiri
    tasks.push(worker(cardD.p, q('.avatar-wrap'), async function (c) {
      await shell(c, q('.avatar-wrap'));
      if (window.BSLogo) window.BSLogo.start();
    }));

    // 3. Penulis teks atas: nama -> lokasi -> judul
    tasks.push(worker(cardD.p, q('.info h1'), async function (c) {
      await typeEl(c, q('.info h1'), 110);
      await typeEl(c, q('.info p'), 40);
      await typeEl(c, q('.skills h2'), 90);
    }));

    // 4. Penulis teks bawah: Following/Followers + tulisan tombol
    tasks.push(worker(statsD.p, q('.stats .label'), async function (c) {
      var lb = qa('.stats .label'), nm = qa('.stats .num');
      await typeEl(c, lb[0], 55);
      await typeEl(c, nm[0], 140);
      await typeEl(c, lb[1], 55);
      await typeEl(c, nm[1], 140);
      await btnD.p;
      await typeEl(c, q('.settings'), 50);
    }));

    await Promise.all(tasks);
    await sleep(250);
    showAll();
  }

  run().catch(showAll);
})();

