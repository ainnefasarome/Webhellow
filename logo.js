/* Logo BS: ditulis pulpen 1 putaran, lalu terisi putih dan terus terang-redup */
(function () {
  var DATA = [[2000,752,1998,758,1931,659,1861,573,1808,517,1749,462,1660,392,1553,325,1459,280,1350,240,1239,213,1311,211,1392,221,1460,236,1534,261,1608,296,1692,345,1752,390,1830,461,1833,459,1832,455,1788,392,1753,351,1694,294,1648,257,1609,230,1548,195,1496,171,1415,142,1376,132,1328,122,1257,112,1182,112,1141,117,1092,127,1018,152,953,187,897,230,845,287,805,348,786,388,776,416,771,440,770,469,771,507,776,531,791,574,821,619,851,649,870,663,908,684,945,699,977,708,1038,719,1119,718,1176,708,1220,694,1263,674,1305,645,1328,623,1348,596,1368,556,1378,523,1382,483,1378,440,1358,379,1332,329,1310,296,1308,292,1311,289,1342,296,1425,325,1500,360,1578,404,1682,477,1685,483,1684,493,1678,517,1668,548,1653,582,1620,633,1578,677,1540,708,1475,747,1415,773,1358,792,1340,795,1335,801,1376,804,1445,814,1490,825,1549,844,1591,864,1633,890,1663,919,1698,963,1727,1016,1742,1056,1753,1101,1755,1146,1753,1196,1738,1255,1713,1314,1693,1350,1663,1389,1615,1439,1575,1469,1536,1493,1461,1529,1403,1548,1342,1563,1287,1573,1188,1584,1066,1584,876,1560,720,1545,507,1531,432,1530,329,1540,240,1555,116,1584,2,1620,0,1618,3,1614,71,1565,110,1541,158,1516,239,1481,337,1452,418,1436,462,1431,513,1430,679,1431,772,1436,827,1435,866,1430,914,1420,989,1395,1029,1375,1078,1346,1124,1310,1159,1277,1186,1245,1220,1197,1240,1163,1271,1092,1278,1121,1283,1162,1284,1210,1274,1275,1259,1320,1229,1374,1214,1395,1190,1419,1169,1440,1145,1457,1093,1488,1099,1493,1163,1485,1218,1469,1244,1458,1303,1424,1336,1395,1364,1363,1398,1307,1411,1274,1421,1241,1431,1180,1433,1121,1427,1075,1411,1028,1387,985,1354,946,1324,921,1295,903,1255,883,1216,869,1178,858,1095,851,991,837,868,812,748,778,667,743,603,702,578,683,539,643,509,604,490,570,475,531,465,493,459,454,460,400,465,365,480,315,500,276,531,231,551,206,584,172,614,147,663,113,709,88,807,48,880,29,961,14,1050,4,1110,1,1176,0,1265,4,1376,19,1494,49,1534,63,1608,98,1658,128,1717,173,1767,217,1816,271,1850,315,1881,361,1906,404,1935,463,1959,529,1980,604,1995,690],[1135,183,1133,176,1122,177,1056,196,1020,212,985,232,945,261,904,302,871,345,847,388,831,426,825,450,826,499,837,538,851,566,873,594,905,619,945,640,987,654,1005,656,1012,653],[948,886,945,883,866,867,789,847,686,813,683,817,544,1314,529,1368,531,1374,809,1382,817,1377,824,1354,942,916]];
  var ASPECT = 1.2348, SKALA = 2000;
  var WRITE = 2600, FILL = 600, PERIOD = 1900, DIM = 0.28;

  var cv = document.getElementById('bslogo');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  var cssW = parseFloat(cv.getAttribute('data-w')) || 44;
  var cssH = parseFloat(cv.getAttribute('data-h')) || 36;
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';

  var LW = 1.5;                       // tebal garis (px)
  var pad = LW * 2;
  var areaW = cssW - pad * 2, areaH = cssH - pad * 2, logoW, logoH;
  if (areaW / areaH > ASPECT) { logoH = areaH; logoW = areaH * ASPECT; }
  else { logoW = areaW; logoH = areaW / ASPECT; }
  var left = (cssW - logoW) / 2, top = (cssH - logoH) / 2;
  var sx = logoW / SKALA, sy = logoH / (SKALA / ASPECT);

  var paths = [], lens = [], total = 0, fillPath = new Path2D();
  DATA.forEach(function (flat) {
    var pts = [];
    for (var i = 0; i < flat.length; i += 2) pts.push([left + flat[i] * sx, top + flat[i + 1] * sy]);
    var segs = [], len = 0;
    for (var j = 0; j < pts.length; j++) {
      var a = pts[j], b = pts[(j + 1) % pts.length];
      var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push(d); len += d;
    }
    paths.push({ pts: pts, segs: segs });
    lens.push(len); total += len;
    pts.forEach(function (p, k) { if (k === 0) fillPath.moveTo(p[0], p[1]); else fillPath.lineTo(p[0], p[1]); });
    fillPath.closePath();
  });

  // gambar bagian garis dari awal sampai panjang "upto"; kembalikan titik ujung pena
  function strokePart(P, upto) {
    ctx.beginPath();
    var pts = P.pts, acc = 0, tip = pts[0];
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var j = 0; j < pts.length; j++) {
      var a = pts[j], b = pts[(j + 1) % pts.length], d = P.segs[j];
      if (acc + d <= upto) { ctx.lineTo(b[0], b[1]); acc += d; tip = b; }
      else {
        var f = d > 0 ? (upto - acc) / d : 0;
        tip = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        ctx.lineTo(tip[0], tip[1]);
        break;
      }
    }
    ctx.stroke();
    return tip;
  }

  function frame(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var jumlah = Math.min(1, t / WRITE);
    var isiA = t > WRITE ? Math.min(1, (t - WRITE) / FILL) : 0;
    var pulse = 1;
    if (t > WRITE + FILL) {
      var ph = ((t - WRITE - FILL) % PERIOD) / PERIOD;          // 0..1
      pulse = DIM + (1 - DIM) * (0.5 + 0.5 * Math.cos(ph * Math.PI * 2));
    }

    // isi putih
    if (isiA > 0) {
      ctx.globalAlpha = isiA * pulse;
      ctx.fillStyle = '#fff';
      ctx.fill(fillPath, 'evenodd');
    }
    // garis tepi + pena (garis memudar saat isi sudah muncul)
    var pudar = Math.max(0, (isiA - 0.5) * 2);
    var aG = 1 - pudar;
    if (aG > 0) {
      ctx.globalAlpha = aG;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = LW;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      var sisa = jumlah * total;
      for (var i = 0; i < paths.length && sisa > 0; i++) {
        var part = Math.min(sisa, lens[i]);
        var tip = strokePart(paths[i], part);
        if (jumlah < 1 && part < lens[i]) {
          ctx.beginPath();
          ctx.fillStyle = '#fff';
          ctx.arc(tip[0], tip[1], LW * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        sisa -= lens[i];
      }
    }
    ctx.globalAlpha = 1;
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { frame(WRITE + FILL); return; }
    var t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      frame(ts - t0);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.BSLogo = { start: start };
  // kalau tidak ada animasi pembangun web, atau terlambat dipanggil, mulai sendiri
  if (!document.documentElement.classList.contains('anim-on')) start();
  else setTimeout(start, 14000);
})();

