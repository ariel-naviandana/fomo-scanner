// src/core/page-helper.js — dasar bersama untuk scanner sell/AD dan scanner buy
// Menyimpan page + config, dan helper kecil yang dipakai keduanya: x(), text(), wait().
const { sleep } = require('./util');

class PageBot {
    constructor(page, cfg) {
        this.page = page;
        this.cfg = cfg;
        this.sel = cfg.selectors;
        this.out = cfg.output;
        this.stopped = false;
    }

    // sleep yang berhenti lebih awal kalau run dihentikan (jadwal berikutnya / Ctrl+C)
    async wait(ms) {
        const end = Date.now() + ms;
        while (!this.stopped && Date.now() < end) await sleep(Math.min(500, end - Date.now()));
    }

    x(q) {
        return this.page.locator(`xpath=${q}`);
    }

    // Teks elemen pertama (spasi dirapikan), null kalau tidak ada / timeout
    async text(locator, timeout) {
        try {
            return ((await locator.first().textContent({ timeout })) || '').replace(/\s+/g, ' ').trim();
        } catch {
            return null;
        }
    }
}

module.exports = { PageBot };
