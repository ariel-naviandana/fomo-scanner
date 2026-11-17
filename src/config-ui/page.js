// src/config-ui/page.js — HTML halaman pengaturan (satu file, tanpa library luar, dibundle ke exe)
// Catatan: isi di dalam String.raw tidak boleh memakai backtick atau ${ ... }.
module.exports = String.raw`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fomo Scanner - Pengaturan</title>
<style>
:root {
  --bg: #0f1115; --panel: #171a21; --panel2: #1e222b; --line: #2a2f3a; --text: #e6e8ee; --muted: #9aa1b1;
  --accent: #5b8cff; --ok: #2fbf71; --warn: #f0b429; --err: #ef5350;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
header { position: sticky; top: 0; z-index: 5; background: rgba(15,17,21,.95); border-bottom: 1px solid var(--line);
  display: flex; align-items: center; gap: 16px; padding: 12px 24px; flex-wrap: wrap; }
header h1 { font-size: 16px; margin: 0; font-weight: 600; }
nav { display: flex; gap: 4px; flex-wrap: wrap; }
nav button { background: none; border: 1px solid transparent; color: var(--muted); padding: 6px 12px; border-radius: 8px; cursor: pointer; font: inherit; }
nav button.active { color: var(--text); background: var(--panel2); border-color: var(--line); }
.spacer { flex: 1; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--line); color: var(--muted); }
.badge.live { color: #fff; background: var(--err); border-color: var(--err); }
.badge.dry { color: var(--warn); border-color: var(--warn); }
.badge.off { opacity: .6; }
button.primary { background: var(--accent); color: #fff; border: 0; padding: 8px 18px; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; }
button.primary:disabled { opacity: .5; cursor: default; }
main { max-width: 920px; margin: 0 auto; padding: 24px; }
section { display: none; }
section.active { display: block; }
.group { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 4px 20px; margin-bottom: 20px; }
.group h2 { font-size: 14px; margin: 16px 0 4px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.field { display: grid; grid-template-columns: 220px 1fr; gap: 6px 20px; padding: 14px 0; border-top: 1px solid var(--line); }
.group h2 + .field { border-top: 0; }
.field label.name { font-weight: 600; padding-top: 6px; }
.field .key { display: block; font-family: ui-monospace, Consolas, monospace; font-size: 11px; color: var(--muted); font-weight: 400; }
.help { grid-column: 2; color: var(--muted); font-size: 12.5px; }
input[type=text], input[type=number], select { width: 100%; max-width: 360px; background: var(--panel2); color: var(--text);
  border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; font: inherit; }
input:focus, select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
.switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; padding-top: 4px; user-select: none; }
.switch input { display: none; }
.switch .track { width: 40px; height: 22px; border-radius: 99px; background: var(--line); position: relative; transition: background .15s; }
.switch .track::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left .15s; }
.switch input:checked + .track { background: var(--accent); }
.switch input:checked + .track::after { left: 21px; }
.switch.danger input:not(:checked) + .track { background: var(--err); }
.switch .state { color: var(--muted); font-size: 12.5px; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: var(--muted); font-weight: 500; font-size: 12px; padding: 4px 6px; }
td { padding: 4px 6px; vertical-align: top; }
td input { max-width: none !important; }
td.preview { color: var(--muted); font-size: 12px; white-space: nowrap; padding-top: 10px; }
.rowbtn { background: none; border: 1px solid var(--line); color: var(--muted); border-radius: 8px; padding: 6px 10px; cursor: pointer; font: inherit; }
.rowbtn:hover { color: var(--text); }
.add { margin-top: 8px; }
.wide { grid-column: 1 / -1; }
.msg { position: fixed; right: 24px; bottom: 24px; max-width: 420px; background: var(--panel2); border: 1px solid var(--line);
  border-left: 4px solid var(--ok); border-radius: 10px; padding: 12px 16px; display: none; white-space: pre-line; z-index: 20; }
.msg.err { border-left-color: var(--err); }
.dialog-bg { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: none; align-items: center; justify-content: center; z-index: 30; padding: 16px; }
.dialog { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; max-width: 560px; width: 100%; padding: 20px 24px; }
.dialog h3 { margin: 0 0 8px; }
.dialog ul { padding-left: 18px; }
.dialog li { margin: 6px 0; }
.dialog li.err { color: var(--err); }
.dialog li.warn { color: var(--warn); }
.dialog li.live { color: #fff; }
.dialog .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.dialog .actions button { padding: 8px 16px; border-radius: 8px; font: inherit; cursor: pointer; }
.btn-cancel { background: none; border: 1px solid var(--line); color: var(--text); }
.btn-go { background: var(--accent); border: 0; color: #fff; font-weight: 600; }
.btn-go.danger { background: var(--err); }
.dirty { color: var(--warn); font-size: 12.5px; }
@media (max-width: 680px) {
  .field { grid-template-columns: 1fr; }
  .help { grid-column: 1; }
  header { padding: 10px 16px; }
  main { padding: 16px; }
}
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; appearance: textfield; }
</style>
</head>
<body>
<header>
  <h1>Fomo Scanner &middot; Pengaturan</h1>
  <nav id="tabs">
    <button data-tab="general" class="active">General</button>
    <button data-tab="sellAd">Sell &amp; AD</button>
    <button data-tab="buy">Buy</button>
  </nav>
  <div class="spacer"></div>
  <div class="badges" id="badges"></div>
  <span class="dirty" id="dirty"></span>
  <button class="primary" id="save" disabled>Simpan</button>
</header>
<main>
  <section id="general" class="active"></section>
  <section id="sellAd"></section>
  <section id="buy"></section>
</main>
<div class="msg" id="msg"></div>
<div class="dialog-bg" id="dialogBg"><div class="dialog" id="dialog"></div></div>

<script>
(function () {
  // ---------- skema form + penjelasan (guidance) ----------
  var SCHEMA = {
    general: [
      { title: 'Fitur yang dijalankan', fields: [
        { k: 'run.sell', t: 'bool', label: 'Sell', help: 'Nyalakan pengecekan sell (TP / trailing stop). Kalau mati, sell tidak dicek sama sekali. Beda dengan dry run yang tetap mengecek tapi tidak klik konfirmasi.' },
        { k: 'run.ad', t: 'bool', label: 'Average down (AD)', help: 'Nyalakan pengecekan AD. Kalau mati, halaman detail coin tidak dibuka untuk cek AD.' },
        { k: 'run.buy', t: 'bool', label: 'Buy (watchlist)', help: 'Nyalakan scanner buy. Kalau sell dan AD mati, buy memakai tab pertama saja (1 tab).' }
      ]},
      { title: 'Dry run (mode aman)', fields: [
        { k: 'dryRun.sell', t: 'bool', danger: true, label: 'Dry run sell', help: 'Nyala = alur sell dijalankan sampai tombol konfirmasi "Sell <nama>", tapi TIDAK diklik. Matikan hanya kalau mau jual beneran.' },
        { k: 'dryRun.ad', t: 'bool', danger: true, label: 'Dry run AD', help: 'Nyala = nominal AD diisi, tapi tombol Buy TIDAK diklik.' },
        { k: 'dryRun.buy', t: 'bool', danger: true, label: 'Dry run buy', help: 'Nyala = nominal buy diisi, tapi tombol Buy TIDAK diklik. Unstar saat dry run diatur di tab Buy (Unstar saat dry run).' }
      ]},
      { title: 'Jadwal restart', fields: [
        { k: 'restartMode', t: 'select', options: [['cron', 'cron (jadwal tetap)'], ['random', 'random (jeda acak)']], label: 'Mode restart', help: 'cron = run & Chrome di-restart sesuai Jadwal cron. random = restart setelah jeda acak antara menit minimal dan maksimal, diacak ulang setiap restart (lebih natural).' },
        { k: 'schedule', t: 'text', label: 'Jadwal cron', help: 'Dipakai kalau mode cron. Contoh "*/15 * * * *" = tiap 15 menit. Kosong = satu run jalan terus tanpa restart.' },
        { k: 'restartMinMin', t: 'number', label: 'Restart acak minimal (menit)', help: 'Dipakai kalau mode random. Contoh 8.' },
        { k: 'restartMaxMin', t: 'number', label: 'Restart acak maksimal (menit)', help: 'Dipakai kalau mode random. Contoh 15.' },
        { k: 'runOnStart', t: 'bool', label: 'Langsung jalan saat start', help: 'Nyala = bot langsung mulai run saat dijalankan, tidak menunggu jadwal pertama.' },
        { k: 'restartBrowser', t: 'bool', label: 'Restart Chrome tiap jadwal', help: 'Nyala = setiap restart run, Chrome ditutup lalu dibuka ulang.' }
      ]},
      { title: 'Akun fomo', fields: [
        { k: 'profileName', t: 'text', label: 'Nama profil fomo', help: 'Dipakai sebagai ?r= di URL. Contoh VagueCoralJay.' },
        { k: 'startTokenUrl', t: 'text', label: 'Halaman awal', help: 'Halaman detail coin apa saja (tanpa ?r=). Dipakai sebagai halaman awal kedua tab. Contoh https://fomo.family/tokens/base/0xcbada7...' }
      ]}
    ],
    sellAd: [
      { title: 'Sell', fields: [
        { k: 'minProfit', t: 'number', label: 'Min profit (%)', help: 'Trailing aktif: sell hanya kalau margin saat itu >= nilai ini. Trailing mati: dipakai sebagai TP (sell saat margin >= nilai ini). Coin di TP custom memakai nilainya sendiri.' },
        { k: 'tpCustom', t: 'map', label: 'TP custom per coin', keyLabel: 'Nama coin', valLabel: 'Min profit / TP (%)', help: 'Menggantikan min profit untuk coin tertentu, baik trailing mati maupun aktif. Nama tidak peka huruf besar/kecil. Contoh GATO = -50.' },
        { k: 'trail.enabled', t: 'bool', label: 'Trailing stop', help: 'Nyala = sell pakai trailing stop: tunggu margin mencapai puncak, sell kalau turun sekian poin dari puncak (dan masih >= min profit).' },
        { k: 'trail.start', t: 'number', label: 'Trailing mulai (%)', help: 'Puncak mulai dicatat saat margin >= nilai ini.' },
        { k: 'trail.drop', t: 'number', label: 'Turun dari puncak (poin)', help: 'Sell kalau margin turun >= sekian poin dari puncak. Contoh puncak 50, drop 10 = sell di <= 40.' },
        { k: 'cutLoss.enabled', t: 'bool', label: 'Cut loss', help: 'Nyala = coin dijual kalau margin turun sampai batas cut loss. Dicek sebelum TP / trailing, dan sebelum AD.' },
        { k: 'cutLoss.pct', t: 'number', label: 'Batas cut loss (%)', help: 'Sell kalau margin <= nilai ini. Contoh -40. Coin di cut loss custom memakai nilainya sendiri.' },
        { k: 'cutLossCustom', t: 'map', label: 'Cut loss custom per coin', keyLabel: 'Nama coin', valLabel: 'Cut loss (%)', help: 'Menggantikan batas cut loss untuk coin tertentu (hanya berlaku kalau cut loss nyala). Nama tidak peka huruf besar/kecil. Contoh FLOAT = -60.' },
        { k: 'showDust', t: 'bool', label: 'Scan posisi dust', help: 'Nyala = list "Show dust" dibuka supaya posisi kecil ikut di-scan.' },
        { k: 'exclude', t: 'list', label: 'Exclude', itemLabel: 'Nama coin', help: 'Coin yang dilewati total (tidak di-sell, tidak di-AD). Nama tidak peka huruf besar/kecil.' }
      ]},
      { title: 'Average down (AD)', fields: [
        { k: 'adCoins', t: 'adcoins', wide: true, label: 'Coin AD (rentang market cap)', help: 'Hanya coin di daftar ini yang di-AD. Satu coin boleh punya beberapa baris; yang dipakai baris PALING ATAS milik coin itu. AD jalan kalau MC sekarang di antara MC min dan MC max baris itu (plus syarat pemicu, umur, RSI). Setelah AD terbeli, baris itu otomatis dihapus dan baris berikutnya jadi patokan. Nominal AD = invested (1:1). MC ditulis seperti di fomo: 1.5M, 400K.' },
        { k: 'adTrigger', t: 'number', label: 'Pemicu AD (%)', help: 'Coin dicek AD kalau margin <= nilai ini. Contoh -25.' },
        { k: 'adMinAgeH', t: 'number', label: 'Umur coin minimal (jam)', help: 'AD hanya kalau umur coin >= nilai ini.' },
        { k: 'adUseRsi', t: 'bool', label: 'Pakai syarat RSI', help: 'Nyala = RSI di chart jadi syarat AD.' },
        { k: 'adRsiMax', t: 'number', label: 'RSI maksimal', help: 'AD hanya kalau RSI <= nilai ini. Contoh 30.' },
        { k: 'adMinOrderUsd', t: 'number', label: 'Minimum order (USD)', help: '0 = otomatis dibaca dari tombol "Minimum amount $X" di fomo. Isi angka untuk memakai nilai sendiri.' },
        { k: 'adRemoveOnDryRun', t: 'bool', label: 'Hapus baris saat dry run', help: 'Saat dry run AD (klik Buy dilewati): nyala = baris adCoins tetap dihapus seperti beli beneran, mati = baris dibiarkan (bisa dites berulang).' },
        { k: 'adBelowMin', t: 'select', options: [['skip', 'skip (lewati AD)'], ['min', 'min (beli sebesar minimum)']], label: 'Kalau di bawah minimum', help: 'Invested < minimum order: skip = AD dibatalkan (BUY_MIN_ORDER), min = nominal dinaikkan ke minimum lalu tetap beli.' }
      ]}
    ],
    buy: [
      { title: 'Coin yang dipantau', fields: [
        { k: 'coins', t: 'coins', wide: true, label: 'Daftar coin', help: 'Coin di watchlist fomo yang dibeli kalau market cap di antara MC min dan MC max. Nama sesuai watchlist (tidak peka huruf besar/kecil). MC boleh ditulis seperti di fomo: 40.7K, 2.32M, 1.5B. Jangan tulis 40 saja (dibaca $40). Coin di watchlist yang tidak ada di sini diabaikan.' }
      ]},
      { title: 'Perilaku buy', fields: [
        { k: 'unstarAfterBuy', t: 'bool', label: 'Unstar setelah beli', help: 'Nyala = setelah beli, coin di-unstar supaya hilang dari watchlist (tidak terbeli lagi).' },
        { k: 'unstarOnDryRun', t: 'bool', label: 'Unstar saat dry run', help: 'Saat dry run buy (klik Buy dilewati): nyala = coin tetap di-unstar, mati = coin dibiarkan di watchlist (bisa dites berulang).' },
        { k: 'standbyRandom', t: 'bool', label: 'Standby acak', help: 'Nyala = saat tidak ada yang dibeli, tab buy pindah ke detail coin watchlist yang dipilih acak (lebih natural).' }
      ]}
    ]
  };

  var data = null;      // config dari server
  var loaded = null;    // salinan awal untuk deteksi perubahan

  function get(obj, k) {
    return k.split('.').reduce(function (o, p) { return o == null ? undefined : o[p]; }, obj);
  }
  function set(obj, k, v) {
    var ps = k.split('.'), o = obj;
    for (var i = 0; i < ps.length - 1; i++) { if (typeof o[ps[i]] !== 'object' || o[ps[i]] === null) o[ps[i]] = {}; o = o[ps[i]]; }
    o[ps[ps.length - 1]] = v;
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (a) {
      if (a === 'text') e.textContent = attrs[a];
      else if (a === 'html') e.innerHTML = attrs[a];
      else if (a.slice(0, 2) === 'on') e.addEventListener(a.slice(2), attrs[a]);
      else e.setAttribute(a, attrs[a]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  // "40.7K" / "2.32M" / 40700 -> angka, NaN kalau tidak terbaca (sama dengan bot)
  function money(v) {
    var m = String(v == null ? '' : v).match(/\$?\s*([\d,.]+)\s*([KMBT]?)/i);
    if (!m) return NaN;
    var mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2].toUpperCase()] || 1;
    return parseFloat(m[1].replace(/,/g, '')) * mult;
  }
  function fmt(n) { return isFinite(n) ? '$' + Number(n).toLocaleString('id-ID') : 'tidak terbaca'; }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  function markDirty() {
    var dirty = JSON.stringify(data) !== JSON.stringify(loaded);
    document.getElementById('dirty').textContent = dirty ? 'Ada perubahan belum disimpan' : '';
    document.getElementById('save').disabled = !dirty;
    renderBadges();
  }

  function renderBadges() {
    var b = document.getElementById('badges'); b.innerHTML = '';
    [['sell', 'Sell'], ['ad', 'AD'], ['buy', 'Buy']].forEach(function (x) {
      var on = get(data.general, 'run.' + x[0]) !== false;
      var dry = get(data.general, 'dryRun.' + x[0]) !== false;
      var cls = !on ? 'badge off' : dry ? 'badge dry' : 'badge live';
      b.appendChild(el('span', { 'class': cls, text: x[1] + ': ' + (!on ? 'mati' : dry ? 'dry run' : 'BENERAN') }));
    });
  }

  // ---------- input per tipe ----------
  function inputFor(file, f) {
    var obj = data[file];
    var v = get(obj, f.k);
    if (f.t === 'bool') {
      var cb = el('input', { type: 'checkbox' });
      cb.checked = v === true || (v === undefined && false);
      var state = el('span', { 'class': 'state' });
      var upd = function () { state.textContent = cb.checked ? 'Nyala' : 'Mati'; };
      cb.addEventListener('change', function () { set(obj, f.k, cb.checked); upd(); markDirty(); });
      upd();
      return el('label', { 'class': 'switch' + (f.danger ? ' danger' : '') }, [cb, el('span', { 'class': 'track' }), state]);
    }
    if (f.t === 'number') {
      var n = el('input', { type: 'number', step: 'any' });
      n.value = v == null ? '' : v;
      n.addEventListener('input', function () { set(obj, f.k, n.value === '' ? 0 : Number(n.value)); markDirty(); });
      return n;
    }
    if (f.t === 'text') {
      var t = el('input', { type: 'text' });
      t.value = v == null ? '' : v;
      t.addEventListener('input', function () { set(obj, f.k, t.value); markDirty(); });
      return t;
    }
    if (f.t === 'select') {
      var s = el('select');
      f.options.forEach(function (o) { var op = el('option', { value: o[0], text: o[1] }); if (o[0] === v) op.selected = true; s.appendChild(op); });
      s.addEventListener('change', function () { set(obj, f.k, s.value); markDirty(); });
      return s;
    }
    if (f.t === 'list') return listEditor(obj, f);
    if (f.t === 'map') return mapEditor(obj, f);
    if (f.t === 'coins') return coinsEditor(obj, f);
    if (f.t === 'adcoins') return coinsEditor(obj, f, true);
    return el('span', { text: '?' });
  }

  function listEditor(obj, f) {
    var wrap = el('div');
    function draw() {
      wrap.innerHTML = '';
      var arr = get(obj, f.k) || [];
      var tb = el('tbody');
      arr.forEach(function (item, i) {
        var inp = el('input', { type: 'text', placeholder: f.itemLabel });
        inp.value = item;
        inp.addEventListener('input', function () { arr[i] = inp.value; markDirty(); });
        tb.appendChild(el('tr', null, [el('td', null, [inp]),
          el('td', null, [el('button', { 'class': 'rowbtn', type: 'button', text: 'Hapus', onclick: function () { arr.splice(i, 1); draw(); markDirty(); } })])]));
      });
      if (!arr.length) tb.appendChild(el('tr', null, [el('td', { 'class': 'preview', text: 'Kosong' })]));
      wrap.appendChild(el('table', null, [tb]));
      wrap.appendChild(el('button', { 'class': 'rowbtn add', type: 'button', text: '+ Tambah', onclick: function () { arr.push(''); set(obj, f.k, arr); draw(); markDirty(); } }));
      set(obj, f.k, arr);
    }
    draw();
    return wrap;
  }

  // map {nama: angka} diedit sebagai daftar baris supaya urutan & ketikan nama tidak hilang
  function mapEditor(obj, f) {
    var wrap = el('div');
    var rows = Object.keys(get(obj, f.k) || {}).map(function (key) { return [key, get(obj, f.k)[key]]; });
    function sync() {
      var m = {};
      rows.forEach(function (r) { if (String(r[0]).trim() !== '') m[String(r[0]).trim()] = num(r[1]); });
      set(obj, f.k, m);
      markDirty();
    }
    function draw() {
      wrap.innerHTML = '';
      var tb = el('tbody');
      rows.forEach(function (r, i) {
        var a = el('input', { type: 'text', placeholder: f.keyLabel }); a.value = r[0];
        var b = el('input', { type: 'number', step: 'any', placeholder: f.valLabel }); b.value = r[1];
        a.addEventListener('input', function () { r[0] = a.value; sync(); });
        b.addEventListener('input', function () { r[1] = b.value; sync(); });
        tb.appendChild(el('tr', null, [el('td', null, [a]), el('td', null, [b]),
          el('td', null, [el('button', { 'class': 'rowbtn', type: 'button', text: 'Hapus', onclick: function () { rows.splice(i, 1); draw(); sync(); } })])]));
      });
      var head = el('thead', null, [el('tr', null, [el('th', { text: f.keyLabel }), el('th', { text: f.valLabel }), el('th')])]);
      wrap.appendChild(el('table', null, rows.length ? [head, tb] : [el('tbody', null, [el('tr', null, [el('td', { 'class': 'preview', text: 'Kosong' })])])]));
      wrap.appendChild(el('button', { 'class': 'rowbtn add', type: 'button', text: '+ Tambah', onclick: function () { rows.push(['', 0]); draw(); } }));
    }
    draw();
    return wrap;
  }

  function coinsEditor(obj, f, noAmount) {
    var wrap = el('div');
    function draw() {
      wrap.innerHTML = '';
      var arr = get(obj, f.k) || [];
      set(obj, f.k, arr);
      var tb = el('tbody');
      arr.forEach(function (c, i) {
        var name = el('input', { type: 'text', placeholder: 'contoh FLOAT' }); name.value = c.name == null ? '' : c.name;
        var mn = el('input', { type: 'text', placeholder: 'contoh 2.1M' }); mn.value = c.mcapMin == null ? '' : c.mcapMin;
        var mx = el('input', { type: 'text', placeholder: 'contoh 2.9M' }); mx.value = c.mcapMax == null ? '' : c.mcapMax;
        var am = el('input', { type: 'number', step: 'any', placeholder: 'USD' }); am.value = c.amount == null ? '' : c.amount;
        var pv = el('td', { 'class': 'preview' });
        var upd = function () { pv.textContent = fmt(money(mn.value)) + ' - ' + fmt(money(mx.value)); };
        name.addEventListener('input', function () { c.name = name.value; markDirty(); });
        mn.addEventListener('input', function () { c.mcapMin = mn.value; upd(); markDirty(); });
        mx.addEventListener('input', function () { c.mcapMax = mx.value; upd(); markDirty(); });
        am.addEventListener('input', function () { c.amount = am.value === '' ? 0 : Number(am.value); markDirty(); });
        upd();
        var btns = [el('button', { 'class': 'rowbtn', type: 'button', text: 'Hapus', onclick: function () { arr.splice(i, 1); draw(); markDirty(); } })];
        if (noAmount) {
          // urutan = prioritas: baris bisa dipindah naik / turun
          btns.unshift(el('button', { 'class': 'rowbtn', type: 'button', text: '\u2193', title: 'Turunkan', onclick: function () { if (i < arr.length - 1) { var t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t; draw(); markDirty(); } } }));
          btns.unshift(el('button', { 'class': 'rowbtn', type: 'button', text: '\u2191', title: 'Naikkan', onclick: function () { if (i > 0) { var t = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = t; draw(); markDirty(); } } }));
        }
        var cells = [el('td', null, [name]), el('td', null, [mn]), el('td', null, [mx])];
        if (!noAmount) cells.push(el('td', null, [am]));
        tb.appendChild(el('tr', null, cells.concat([pv, el('td', { style: 'white-space:nowrap' }, btns)])));
      });
      var cols = noAmount ? ['Nama coin', 'MC min', 'MC max', 'Range terbaca', ''] : ['Nama coin', 'MC min', 'MC max', 'Nominal ($)', 'Range terbaca', ''];
      var head = el('thead', null, [el('tr', null, cols.map(function (h) { return el('th', { text: h }); }))]);
      wrap.appendChild(el('table', null, [head, tb]));
      wrap.appendChild(el('button', { 'class': 'rowbtn add', type: 'button', text: noAmount ? '+ Tambah baris' : '+ Tambah coin', onclick: function () { arr.push(noAmount ? { name: '', mcapMin: '', mcapMax: '' } : { name: '', mcapMin: '', mcapMax: '', amount: 0 }); draw(); markDirty(); } }));
    }
    draw();
    return wrap;
  }

  function render() {
    Object.keys(SCHEMA).forEach(function (file) {
      var sec = document.getElementById(file); sec.innerHTML = '';
      SCHEMA[file].forEach(function (g) {
        var box = el('div', { 'class': 'group' }, [el('h2', { text: g.title })]);
        g.fields.forEach(function (f) {
          var fieldCls = 'field' + (f.wide ? ' wide-field' : '');
          var name = el('label', { 'class': 'name' }, [document.createTextNode(f.label), el('span', { 'class': 'key', text: f.k })]);
          var input = inputFor(file, f);
          var row = f.wide
            ? el('div', { 'class': fieldCls }, [el('div', { 'class': 'wide' }, [name]), el('div', { 'class': 'wide help', text: f.help }), el('div', { 'class': 'wide' }, [input])])
            : el('div', { 'class': fieldCls }, [name, el('div', null, [input]), el('div', { 'class': 'help', text: f.help })]);
          box.appendChild(row);
        });
        sec.appendChild(box);
      });
    });
    markDirty();
  }

  // ---------- validasi & pengaman ----------
  function check() {
    var errs = [], warns = [], lives = [];
    var g = data.general, s = data.sellAd, b = data.buy;
    ['sell', 'ad', 'buy'].forEach(function (x) {
      var label = { sell: 'Sell', ad: 'AD', buy: 'Buy' }[x];
      var was = get(loaded.general, 'dryRun.' + x) !== false, now = get(g, 'dryRun.' + x) !== false;
      if (was && !now) lives.push('Dry run ' + label + ' DIMATIKAN: transaksi ' + label + ' akan dijalankan BENERAN' + (get(g, 'run.' + x) === false ? ' (fitur ' + label + ' sedang mati)' : '') + '.');
    });
    if (String(g.restartMode) === 'random' && num(g.restartMinMin) > num(g.restartMaxMin)) errs.push('Restart acak: menit minimal lebih besar dari maksimal.');
    if (String(g.restartMode) === 'random' && num(g.restartMinMin) < 1) errs.push('Restart acak: menit minimal harus >= 1.');
    if (String(g.restartMode) !== 'random' && !String(g.schedule || '').trim()) warns.push('Jadwal cron kosong: satu run jalan terus tanpa restart.');
    if (!String(g.profileName || '').trim()) errs.push('Nama profil fomo kosong.');
    if (!/^https:\/\/fomo\.family\/tokens\//.test(String(g.startTokenUrl || ''))) warns.push('Halaman awal bukan link detail coin fomo (https://fomo.family/tokens/...).');

    var sellLive = get(g, 'run.sell') !== false && get(g, 'dryRun.sell') === false;
    var adLive = get(g, 'run.ad') !== false && get(g, 'dryRun.ad') === false;
    if (sellLive && num(s.minProfit) < 0) warns.push('Min profit ' + s.minProfit + '% (negatif) saat sell BENERAN: coin bisa terjual rugi.');
    if (sellLive && get(s, 'trail.enabled') && num(get(s, 'trail.start')) < 0) warns.push('Trailing mulai ' + get(s, 'trail.start') + '% (negatif) saat sell BENERAN.');
    Object.keys(s.tpCustom || {}).forEach(function (k) {
      if (sellLive && num(s.tpCustom[k]) < 0) warns.push('TP custom ' + k + ' = ' + s.tpCustom[k] + '% (negatif) saat sell BENERAN.');
    });
    if (num(get(s, 'trail.drop')) <= 0 && get(s, 'trail.enabled')) errs.push('Turun dari puncak (trail.drop) harus > 0.');
    if (adLive && num(s.adTrigger) > 0) warns.push('Pemicu AD ' + s.adTrigger + '% (positif) saat AD BENERAN: coin yang sedang profit bisa di-AD.');
    if (num(s.adRsiMax) <= 0 && s.adUseRsi) warns.push('RSI maksimal <= 0: AD tidak akan pernah lolos.');
    if (get(s, 'cutLoss.enabled')) {
      var clg = num(get(s, 'cutLoss.pct'));
      var clCheck = function (label, v) {
        if (v >= 0) warns.push(label + ' ' + v + '% (tidak negatif): coin yang sedang profit bisa ikut terjual cut loss.');
        if (get(g, 'run.ad') !== false && v > num(s.adTrigger)) warns.push(label + ' ' + v + '% lebih tinggi dari pemicu AD ' + s.adTrigger + '%: coin terjual cut loss sebelum sempat di-AD.');
      };
      clCheck('Cut loss', clg);
      Object.keys(s.cutLossCustom || {}).forEach(function (k) { clCheck('Cut loss custom ' + k, num(s.cutLossCustom[k])); });
    }
    if (get(g, 'run.ad') !== false && !(s.adCoins || []).length) warns.push('AD nyala tapi daftar coin AD (adCoins) kosong: tidak ada coin yang di-AD.');
    (s.adCoins || []).forEach(function (c, i) {
      var label = 'Coin AD #' + (i + 1) + (c.name ? ' (' + c.name + ')' : '');
      if (!String(c.name || '').trim()) errs.push(label + ': nama kosong.');
      var mn = money(c.mcapMin), mx = money(c.mcapMax);
      if (!isFinite(mn) || !isFinite(mx)) errs.push(label + ': MC min/max tidak terbaca (pakai format 400K / 1.5M / angka).');
      else if (mn > mx) errs.push(label + ': MC min lebih besar dari MC max.');
      else if (mx < 1000) warns.push(label + ': MC max ' + fmt(mx) + ' sangat kecil. Lupa menulis K/M?');
    });

    var seen = {};
    (b.coins || []).forEach(function (c, i) {
      var label = 'Coin #' + (i + 1) + (c.name ? ' (' + c.name + ')' : '');
      var key = String(c.name || '').trim().toLowerCase();
      if (!key) errs.push(label + ': nama kosong.');
      else if (seen[key]) errs.push(label + ': nama dobel.');
      seen[key] = true;
      var mn = money(c.mcapMin), mx = money(c.mcapMax);
      if (!isFinite(mn) || !isFinite(mx)) errs.push(label + ': MC min/max tidak terbaca (pakai format 40.7K / 2.32M / angka).');
      else if (mn > mx) errs.push(label + ': MC min lebih besar dari MC max.');
      else if (mx < 1000) warns.push(label + ': MC max ' + fmt(mx) + ' sangat kecil. Lupa menulis K/M?');
      if (!(num(c.amount) > 0)) errs.push(label + ': nominal harus > 0.');
    });
    var dup = {};
    (s.exclude || []).forEach(function (x) { var k = String(x).trim().toLowerCase(); if (!k) errs.push('Exclude: ada baris kosong.'); else if (dup[k]) warns.push('Exclude: ' + x + ' dobel.'); dup[k] = true; });
    return { errs: errs, warns: warns, lives: lives };
  }

  function dialog(title, items, danger, okText, onOk) {
    var d = document.getElementById('dialog'); d.innerHTML = '';
    var ul = el('ul');
    items.forEach(function (it) { ul.appendChild(el('li', { 'class': it[0], text: it[1] })); });
    var actions = el('div', { 'class': 'actions' }, [el('button', { 'class': 'btn-cancel', text: onOk ? 'Batal' : 'Tutup', onclick: closeDialog })]);
    if (onOk) actions.appendChild(el('button', { 'class': 'btn-go' + (danger ? ' danger' : ''), text: okText, onclick: function () { closeDialog(); onOk(); } }));
    d.appendChild(el('h3', { text: title }));
    d.appendChild(ul);
    d.appendChild(actions);
    document.getElementById('dialogBg').style.display = 'flex';
  }
  function closeDialog() { document.getElementById('dialogBg').style.display = 'none'; }

  function toast(text, isErr) {
    var m = document.getElementById('msg');
    m.textContent = text; m.className = 'msg' + (isErr ? ' err' : ''); m.style.display = 'block';
    clearTimeout(toast.t); toast.t = setTimeout(function () { m.style.display = 'none'; }, 6000);
  }

  function doSave() {
    var btn = document.getElementById('save'); btn.disabled = true;
    fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'gagal');
        loaded = JSON.parse(JSON.stringify(data));
        markDirty();
        toast(res.changed.length
          ? 'Tersimpan: ' + res.changed.join(', ') + '\nBot yang sedang jalan akan me-restart run dengan config baru.\nBackup config lama ada di config/backup/.'
          : 'Tidak ada perubahan.');
      })
      .catch(function (e) { btn.disabled = false; toast('Gagal menyimpan: ' + e.message, true); });
  }

  function onSave() {
    var c = check();
    if (c.errs.length) {
      dialog('Belum bisa disimpan', c.errs.map(function (x) { return ['err', x]; }), false, '', null);
      return;
    }
    var items = c.lives.map(function (x) { return ['live', x]; }).concat(c.warns.map(function (x) { return ['warn', x]; }));
    if (items.length) {
      dialog(c.lives.length ? 'Konfirmasi: transaksi BENERAN' : 'Periksa dulu', items, c.lives.length > 0,
        c.lives.length ? 'Ya, simpan' : 'Tetap simpan', doSave);
      return;
    }
    doSave();
  }

  // ---------- init ----------
  // cegah input angka berubah karena scroll mouse: blur dulu, biar scroll jalan ke halaman
  document.addEventListener('wheel', function (e) { var a = document.activeElement; if (a && a.type === 'number' && e.target === a) a.blur(); }, { passive: true });
  document.getElementById('tabs').addEventListener('click', function (e) {
    var t = e.target.getAttribute('data-tab'); if (!t) return;
    Array.prototype.forEach.call(document.querySelectorAll('nav button'), function (b) { b.classList.toggle('active', b === e.target); });
    Array.prototype.forEach.call(document.querySelectorAll('section'), function (s) { s.classList.toggle('active', s.id === t); });
  });
  document.getElementById('save').addEventListener('click', onSave);
  document.getElementById('dialogBg').addEventListener('click', function (e) { if (e.target.id === 'dialogBg') closeDialog(); });
  window.addEventListener('beforeunload', function (e) {
    if (data && JSON.stringify(data) !== JSON.stringify(loaded)) { e.preventDefault(); e.returnValue = ''; }
  });

  fetch('/api/config').then(function (r) { return r.json(); }).then(function (cfg) {
    data = cfg;
    ['general', 'sellAd', 'buy'].forEach(function (k) { if (!data[k]) data[k] = {}; });
    loaded = JSON.parse(JSON.stringify(data));
    render();
  }).catch(function (e) { toast('Gagal membaca config: ' + e.message, true); });
})();
</script>
</body>
</html>
`;
