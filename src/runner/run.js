// src/runner/run.js — Fomo scanner (sell / AD / buy): start/stop run, tab browser, shutdown
//   restartMode : "cron" = mulai ulang run sesuai schedule, "random" = jeda acak restartMinMin-restartMaxMin menit
//   schedule    : cron untuk memulai ulang run.
//                 Kosong ("") = satu run jalan terus tanpa jadwal.
//   runOnStart  : langsung jalan saat start.
// Jadwal ada di schedule.js. Folder config/ dipantau (watch-config.js): kalau ada file yang berubah
// (disimpan dari halaman pengaturan / edit manual), config dibaca ulang dan run di-restart.
//   restartBrowser : tiap jadwal Chrome ditutup & dibuka ulang (padanan "killChrome").
// Setiap run baru dimulai dengan state baru (daftar coin yang sudah di-AD & hitungan gagal-klik
// di-reset), sama seperti macro yang dijalankan ulang oleh scheduler lama.
// Run lama dihentikan dengan rapi: transaksi yang sedang berjalan diselesaikan dulu, tidak dipotong.
// Dua tab: tab 1 = sell & AD (panel Your positions), tab 2 = buy (watchlist). Fitur yang jalan diatur
// di config/general.json -> run { sell, ad, buy }.
const { loadPwConfig } = require('../core/config');
const { openBrowser } = require('../core/browser');
const { log, sleep } = require('../core/util');
const { FomoScanner } = require('../sell-ad/scanner');
const { BuyScanner } = require('../buy/buyer');
const { createScheduler } = require('./schedule');
const { watchConfig } = require('./watch-config');

let cfg = loadPwConfig();
const sellAdEnabled = () => cfg.sellEnabled !== false || cfg.adEnabled !== false;

// startRun dideklarasikan di bawah (function hoisting), dipanggil saat jadwal tiba
const scheduler = createScheduler(() => cfg, (reason) => startRun(reason));
const { isRandom, hasSchedule } = scheduler;

let context = null;
let page = null;
let buyPage = null;
let scanner = null;
let buyer = null;
let runPromise = null;
let closing = false;   // true saat browser sengaja ditutup (restart / berhenti)
let busy = false;      // true saat proses ganti run sedang berlangsung

async function ensureBrowser() {
    if (context) return;
    context = await openBrowser(cfg);
    page = context.pages()[0] || await context.newPage();
    // Tab buy: tab baru kalau sell/AD juga jalan; kalau sell & AD mati, pakai tab pertama saja (1 tab)
    if (cfg.buyEnabled) buyPage = sellAdEnabled() ? await context.newPage() : page;
    context.on('close', () => {
        context = null;
        page = null;
        buyPage = null;
        if (closing) return;
        log('Browser tertutup tanpa diminta. Dibuka ulang di jadwal berikutnya'
            + (hasSchedule() ? '' : ' (tanpa jadwal: bot berhenti, jalankan ulang npm start)'), 'err');
        if (scanner) scanner.stopped = true;
        if (buyer) buyer.stopped = true;
        if (!hasSchedule()) process.exit(1);
    });
}

async function closeBrowser() {
    if (!context) return;
    closing = true;
    await context.close().catch(() => {});
    context = null;
    page = null;
    buyPage = null;
    closing = false;
}

async function stopRun() {
    if (!scanner && !buyer) return;
    if (scanner) scanner.stopped = true;
    if (buyer) buyer.stopped = true;
    if (runPromise) {
        log('Menunggu siklus yang sedang berjalan selesai...');
        await runPromise.catch(() => {});
    }
    scanner = null;
    buyer = null;
    runPromise = null;
}

async function startRun(reason) {
    if (busy) {
        log(`[${reason}] Pergantian run sebelumnya belum selesai, jadwal ini dilewati`, 'warn');
        return;
    }
    busy = true;
    try {
        log(`[${reason}] >>> MULAI RUN FOMO SCANNER <<<`, 'ok');
        await stopRun();
        if (cfg.restartBrowser && context) {
            await closeBrowser();
            log('Chrome lama ditutup');
            await sleep(cfg.restartWaitMs);
        }
        if (!sellAdEnabled() && !cfg.buyEnabled) {
            log('Semua fitur (sell, ad, buy) dimatikan di config/general.json -> run, Chrome tidak dibuka', 'warn');
            await closeBrowser();
            return;
        }
        await ensureBrowser();
        const jobs = [];
        if (sellAdEnabled()) {
            scanner = new FomoScanner(page, cfg);
            jobs.push(scanner.run().catch((e) => log(`Run sell/AD berhenti karena error: ${e.message}`, 'err')));
        }
        if (cfg.buyEnabled) {
            if (!buyPage) buyPage = sellAdEnabled() ? await context.newPage() : page;
            buyer = new BuyScanner(buyPage, cfg);
            jobs.push(buyer.run().catch((e) => log(`Run buy berhenti karena error: ${e.message}`, 'err')));
        }
        runPromise = Promise.all(jobs);
    } catch (e) {
        log(`Gagal memulai run: ${e.message}`, 'err');
    } finally {
        busy = false;
    }
}

async function shutdown() {
    log('Menghentikan bot...');
    if (scanner) scanner.stopped = true;
    if (buyer) buyer.stopped = true;
    await closeBrowser();
    process.exit(0);
}

function printSummary() {
    console.log('='.repeat(56));
    console.log('✅ FOMO SCANNER (Playwright) AKTIF');
    console.log(`   Halaman awal: ${cfg.startUrl}`);
    console.log(`   Jadwal      : ${isRandom() ? `restart acak tiap ${cfg.restartMinMin}-${cfg.restartMaxMin} menit` : (cfg.schedule || 'tanpa jadwal (jalan terus)')} | zona ${cfg.timezone}`);
    console.log(`   Run saat start: ${cfg.runOnStart ? 'ya' : 'tidak'} | restart Chrome tiap jadwal: ${cfg.restartBrowser ? 'ya' : 'tidak'}`);
    console.log(`   Chrome      : ${cfg.browser.userDataDir} (headless: ${cfg.browser.headless ? 'ya' : 'tidak'})`);
    const t = cfg.trail;
    console.log(`   Sell        : ${t.enabled ? `trailing mulai ${t.start}% | turun ${t.drop} poin | min profit ${cfg.minProfit}%` : `TP ${cfg.minProfit}% (minProfit)${Object.keys(cfg.tpMap).length ? ` | custom ${JSON.stringify(cfg.tpCustom)}` : ''}`} | ${cfg.sellEnabled === false ? 'NONAKTIF' : cfg.dryRunSell ? 'DRY RUN' : 'JUAL BENERAN'}`);
    const cl = cfg.cutLoss || {};
    console.log(`   Cut loss    : ${cl.enabled ? `margin <= ${cl.pct}%${Object.keys(cfg.cutMap).length ? ` | custom ${JSON.stringify(cfg.cutLossCustom)}` : ''}` : 'mati'}`);
    console.log(`   AD          : margin <= ${cfg.adTrigger}% | umur >= ${cfg.adMinAgeH}h | RSI ${cfg.adUseRsi ? `<= ${cfg.adRsiMax}` : 'tidak dipakai'} | ${cfg.adRules.length} baris adCoins | ${cfg.adEnabled === false ? 'NONAKTIF' : cfg.dryRunAd ? 'DRY RUN' : 'BELI BENERAN'}`);
    console.log(`   Buy         : ${cfg.buyEnabled ? `${cfg.buyMap.size} coin dipantau | ${cfg.buy.dryRunBuy ? 'DRY RUN' : 'BELI BENERAN'}` : 'NONAKTIF'}`);
    console.log(`   Exclude     : ${cfg.exclude.length ? cfg.exclude.join(', ') : '-'}`);
    console.log(`   Output      : ${cfg.output.dir}`);
    console.log('='.repeat(56));
}

// Config berubah: baca ulang, pasang ulang jadwal, restart run
async function onConfigChange() {
    log('Config berubah, membaca ulang config dan me-restart run...', 'warn');
    let next;
    try {
        next = loadPwConfig();
    } catch (e) {
        log(`Config baru gagal dibaca (${e.message}), tetap pakai config lama`, 'err');
        return;
    }
    cfg = next;
    printSummary();
    scheduler.setup();
    while (busy) await sleep(1000); // tunggu pergantian run lain selesai
    await startRun('CONFIG BERUBAH');
}

(async () => {
    printSummary();
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    watchConfig(onConfigChange);
    scheduler.setup();
    if (hasSchedule()) {
        if (cfg.runOnStart) await startRun('STARTUP');
        else log(`Menunggu jadwal pertama (${isRandom() ? 'restart acak' : cfg.schedule})`);
    } else {
        // Tanpa jadwal: satu run jalan terus sampai maxLoop / Ctrl+C.
        // Kalau run diganti karena config berubah, tunggu run yang baru.
        await startRun('STARTUP');
        for (;;) {
            const p = runPromise;
            await p;
            await sleep(500);
            if (runPromise === p && !busy) break;
        }
        await closeBrowser();
        process.exit(0);
    }
})().catch((e) => {
    console.error('Gagal start:', e);
    process.exit(1);
});
