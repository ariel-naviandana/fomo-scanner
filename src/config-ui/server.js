// src/config-ui/server.js — halaman pengaturan config (fomo-scanner.exe config / npm run config)
// Server lokal di 127.0.0.1:<uiPort> (config/general.json, bawaan 3939), hanya bisa dibuka dari laptop ini.
// Yang bisa diatur: general (sebagian), sell-ad, buy. timing.json, paths.json, browser, output, uiPort
// tidak ditampilkan dan tetap dipertahankan apa adanya saat simpan.
// Setiap simpan: config lama di-backup ke config/backup/<waktu>/, lalu file ditulis.
// Bot yang sedang jalan memantau folder config/ dan otomatis me-restart run.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { CONFIG_DIR } = require('../core/config');
const PAGE = require('./page');

const FILES = { general: 'general.json', sellAd: 'sell-ad.json', buy: 'buy.json' };

// key yang boleh diubah dari UI (selain ini dipertahankan dari file)
const EDITABLE = {
    general: ['schedule', 'restartMode', 'restartMinMin', 'restartMaxMin', 'runOnStart', 'restartBrowser',
        'run', 'dryRun', 'profileName', 'startTokenUrl'],
    sellAd: ['minProfit', 'tpCustom', 'trail', 'showDust', 'exclude', 'adTrigger', 'adMinAgeH', 'adUseRsi',
        'adRsiMax', 'adMinOrderUsd', 'adBelowMin'],
    buy: ['unstarAfterBuy', 'unstarOnDryRun', 'standbyRandom', 'coins'],
};

const readJson = (f) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, f), 'utf8'));
    } catch {
        return {};
    }
};

function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function loadAll() {
    return Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, readJson(f)]));
}

function saveAll(body) {
    const changed = [];
    const backupDir = path.join(CONFIG_DIR, 'backup', stamp());
    for (const [k, f] of Object.entries(FILES)) {
        if (!body[k] || typeof body[k] !== 'object') continue;
        const current = readJson(f);
        const next = { ...current };
        for (const key of EDITABLE[k]) {
            if (body[k][key] !== undefined) next[key] = body[k][key];
        }
        const text = JSON.stringify(next, null, 2) + '\n';
        const file = path.join(CONFIG_DIR, f);
        const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
        if (old !== null && JSON.stringify(JSON.parse(old)) === JSON.stringify(next)) continue;
        if (old !== null) {
            fs.mkdirSync(backupDir, { recursive: true });
            fs.writeFileSync(path.join(backupDir, f), old);
        }
        fs.writeFileSync(file, text);
        changed.push(f);
    }
    return { changed, backup: changed.length ? backupDir : null };
}

function send(res, code, type, body) {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
}

function openBrowser(url) {
    const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    try {
        spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref();
    } catch { /* buka manual */ }
}

const general = readJson(FILES.general);
const PORT = Number(general.uiPort) || 3939;
const URL_UI = `http://127.0.0.1:${PORT}/`;

const server = http.createServer((req, res) => {
    // hanya dari laptop ini
    const ip = req.socket.remoteAddress || '';
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) return send(res, 403, 'text/plain', 'Forbidden');

    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
        return send(res, 200, 'text/html; charset=utf-8', PAGE);
    }
    if (req.method === 'GET' && req.url === '/api/config') {
        return send(res, 200, 'application/json', JSON.stringify(loadAll()));
    }
    if (req.method === 'POST' && req.url === '/api/config') {
        let data = '';
        req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
        req.on('end', () => {
            try {
                const result = saveAll(JSON.parse(data));
                console.log(`[UI] Disimpan: ${result.changed.join(', ') || '(tidak ada perubahan)'}`
                    + (result.backup ? ` | backup: ${result.backup}` : ''));
                send(res, 200, 'application/json', JSON.stringify({ ok: true, ...result }));
            } catch (e) {
                send(res, 400, 'application/json', JSON.stringify({ ok: false, error: e.message }));
            }
        });
        return undefined;
    }
    return send(res, 404, 'text/plain', 'Not found');
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} sudah dipakai (halaman pengaturan mungkin sudah terbuka). Membuka ${URL_UI}`);
        openBrowser(URL_UI);
        setTimeout(() => process.exit(0), 1000);
    } else {
        console.error('Gagal menjalankan halaman pengaturan:', e.message);
        process.exit(1);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('='.repeat(56));
    console.log('⚙️  FOMO SCANNER - HALAMAN PENGATURAN');
    console.log(`   Buka: ${URL_UI}`);
    console.log(`   Config: ${CONFIG_DIR}`);
    console.log('   Tutup jendela ini (atau Ctrl+C) untuk mematikan halaman pengaturan.');
    console.log('='.repeat(56));
    if (!process.argv.includes('--no-open')) openBrowser(URL_UI);
});
