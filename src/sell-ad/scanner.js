// src/sell-ad/scanner.js — scanner sell & AD (tab 1)
// Halaman awal = detail coin apa saja (startUrl), posisi dibaca dari panel "Your positions".
// Klik baris posisi langsung membuka detail coin itu.
// Alur per siklus: buka halaman awal (kalau perlu) -> scroll muat semua posisi -> scan tiap coin:
//   - margin <= cut loss / margin >= TP coin / trailing stop kena -> SELL (sell.js)
//   - margin <= adTrigger, coin ada di adCoins -> cek & AD (ad.js, ad-rules.js)
// Trailing stop ada di trail.js. Log: fomo_positions.csv, fomo_sell_log.csv, fomo_ad_log.csv, fomo_trail.csv
const { log, sleep, nowTs, money, margin, appendCsv } = require('../core/util');
const { PageBot } = require('../core/page-helper');
const { activeRule } = require('./ad-rules');

class FomoScanner extends PageBot {
    constructor(page, cfg) {
        super(page, cfg);
        this.needOpen = true;
        this.sinceOpen = 0;
        this.resumeK = 1;
        this.failMap = {};         // hitungan gagal-klik per coin
        this.pageFail = 0;
        this.total = 0;
        this.iter = 0;
        this.trailMap = this.loadTrail(); // puncak margin per coin (key = link coin), tetap tersimpan antar run
    }

    rowLoc(k) {
        return this.x(`${this.sel.row}[${k}]`);
    }

    // Batas cut loss coin ini (%), null kalau cut loss mati
    cutLossFor(name) {
        if (!this.cfg.cutLoss || !this.cfg.cutLoss.enabled) return null;
        const v = this.cfg.cutMap[name.toLowerCase()];
        if (Number.isFinite(v)) return v;
        const g = Number(this.cfg.cutLoss.pct);
        return Number.isFinite(g) ? g : null;
    }

    tpFor(name) {
        const v = this.cfg.tpMap[name.toLowerCase()];
        return Number.isFinite(v) ? v : Number(this.cfg.minProfit);
    }

    async openProfile() {
        await this.page.goto(this.cfg.startUrl, { waitUntil: 'domcontentloaded' });
        await sleep(this.cfg.wait.startLoadMs);
        this.needOpen = false;
        this.sinceOpen = 0;
    }

    // showDust true : klik "Show dust (N)" kalau list dust masih tertutup (posisi kecil ikut di-scan)
    // showDust false: klik "Hide dust" kalau list dust sedang terbuka (dust tidak di-scan)
    async openDust() {
        const show = this.cfg.showDust !== false;
        const btn = this.x(show ? this.sel.dustButton : this.sel.hideDustButton).first();
        if (await btn.count().catch(() => 0)) {
            await btn.click({ timeout: this.cfg.wait.clickTimeoutMs }).catch(() => log(`Klik ${show ? 'Show' : 'Hide'} dust gagal`, 'warn'));
            await sleep(1500);
        }
    }

    // Scroll sampai jumlah baris tidak bertambah (maks 8 kali). Return null kalau halaman bermasalah.
    async loadAllRows() {
        const rows = this.x(this.sel.row);
        // tunggu baris pertama muncul (list fomo kadang masih re-render)
        await rows.first().waitFor({ state: 'attached', timeout: this.cfg.wait.elementTimeoutMs }).catch(() => {});
        let cnt;
        try {
            cnt = await rows.count();
        } catch {
            return null;
        }
        let last = -1;
        for (let sc = 0; sc < 8 && cnt !== last; sc++) {
            last = cnt;
            if (cnt > 0) {
                await this.rowLoc(cnt).scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
                await this.page.keyboard.press('End').catch(() => {});
            }
            await sleep(1500);
            cnt = await rows.count().catch(() => cnt);
        }
        return cnt;
    }

    // Klik icon coin di baris k, dicoba clickTries kali
    async clickRowIcon(k, name) {
        for (let t = 1; t <= this.cfg.clickTries; t++) {
            try {
                await this.rowLoc(k).locator('xpath=.//img').first().click({ timeout: this.cfg.wait.clickTimeoutMs });
                return true;
            } catch {
                log(`Klik icon ${name} gagal, coba lagi... (${t}/${this.cfg.clickTries})`, 'warn');
                await sleep(1500);
            }
        }
        return false;
    }

    // Link detail coin dari baris k, contoh /tokens/solana/<CA>
    async rowHref(k) {
        return this.rowLoc(k).getAttribute('href', { timeout: 3000 }).catch(() => null);
    }

    // Setelah klik baris: tunggu halaman detail coin terbuka dan URL-nya sesuai link baris
    async onDetailOf(href, name) {
        const path = String(href || '').split('?')[0];
        if (!path) {
            log(`Link baris ${name} tidak terbaca`, 'err');
            return false;
        }
        await this.page.waitForURL((u) => u.toString().includes(path), { timeout: this.cfg.wait.elementTimeoutMs }).catch(() => {});
        await sleep(this.cfg.wait.detailMs);
        if (this.page.url().includes(path)) return true;
        log(`Halaman detail ${name} tidak terbuka (url: ${this.page.url()})`, 'err');
        return false;
    }

    markFail(name, ok) {
        const key = name.toLowerCase();
        this.failMap[key] = ok ? 0 : (this.failMap[key] || 0) + 1;
    }

    // ---------- Satu siklus ----------
    async cycle() {
        this.total++;
        log(`=== Siklus #${this.total} | ${this.iter}/${this.cfg.maxLoop || '∞'} ===`);

        if (this.sinceOpen >= this.cfg.reloadEvery) this.needOpen = true;
        try {
            if (this.needOpen) {
                await this.openProfile();
            } else {
                log('Tidak pindah halaman, scan ulang di halaman yang sama');
                this.sinceOpen++;
            }
        } catch (e) {
            log(`Gagal membuka halaman awal: ${e.message}`, 'err');
        }

        await this.openDust();
        const n = await this.loadAllRows();
        if (n === null) {
            this.pageFail++;
            log(`HALAMAN FOMO BERMASALAH. Kegagalan berturut-turut: ${this.pageFail}. `
                + `Menunggu ${this.cfg.errPauseMs} ms lalu memuat ulang halaman awal`, 'err');
            this.needOpen = true;
            await this.wait(this.cfg.errPauseMs);
            return;
        }
        this.pageFail = 0;
        log(`${n} posisi terbaca`);
        if (n === 0) {
            log('0 posisi terbaca, halaman awal dimuat ulang di siklus berikutnya', 'warn');
            this.needOpen = true;
        }

        log(`Scan mulai dari coin ke-${this.resumeK}`);
        let acted = false;

        for (let k = this.resumeK; k <= n && !acted && !this.stopped; k++) {
            const row = this.rowLoc(k);
            const name = await this.text(row.locator(`xpath=${this.sel.rowName}`), 3000);
            if (!name) {
                log(`Gagal membaca nama coin ke-${k}. Profil dimuat ulang, scan lanjut ke coin berikutnya`, 'err');
                this.needOpen = true;
                acted = true;
                this.resumeK = k + 1;
                break;
            }

            const key = name.toLowerCase();
            if (this.cfg.excludeSet.has(key) || (this.failMap[key] || 0) >= this.cfg.clickFailMax) {
                log(`SKIP: ${name} (ada di exclude atau gagal diklik >= ${this.cfg.clickFailMax} kali)`);
                continue;
            }

            const colText = await this.text(row.locator(`xpath=${this.sel.rowValue}`), 3000);
            if (colText === null) {
                log(`Gagal membaca margin coin ke-${k}. Profil dimuat ulang, scan lanjut ke coin berikutnya`, 'err');
                this.needOpen = true;
                acted = true;
                this.resumeK = k + 1;
                break;
            }

            const nominal = money(colText);
            const pct = margin(colText);
            const tp = this.tpFor(name);
            const cl = this.cutLossFor(name);
            const ts = nowTs();
            log(`${name} | $${nominal} | ${pct}% | ${this.cfg.trail.enabled ? `trailing (min profit ${tp}%)` : `TP ${tp}%`}`
                + (cl !== null ? ` | cut loss ${cl}%` : ''), 'ok');
            appendCsv(this.out.dir, this.out.positionsFile, [ts, name, nominal, pct]);

            // keputusan sell: cut loss dulu, lalu trailing stop (kalau aktif, TP tidak dipakai) atau TP biasa
            let why = null;
            this.curKey = null;
            // link coin = key trailing; dipakai juga untuk reset puncak setelah sell / AD
            if (this.cfg.trail.enabled) {
                this.curKey = String((await row.getAttribute('href', { timeout: 3000 }).catch(() => null)) || name).split('?')[0];
            }
            if (this.cfg.sellEnabled === false) {
                // sell dimatikan: cut loss / TP / trailing tidak dicek
            } else if (cl !== null && pct <= cl) {
                why = `cut loss ${cl}%`;
            } else if (this.cfg.trail.enabled) {
                why = this.checkTrail(ts, this.curKey, name, pct);
            } else if (pct >= tp) {
                why = `TP ${tp}%`;
            }

            // satu aksi per siklus (sell atau AD); coin yang sama dicek lagi di siklus berikutnya
            if (why) {
                acted = true;
                await this.doSell(k, ts, name, nominal, pct, why);
            } else if (this.cfg.adEnabled !== false && pct <= this.cfg.adTrigger) {
                // AD hanya untuk coin di adCoins, patokan = baris paling atas coin itu
                const rule = activeRule(this.cfg, name);
                if (rule) {
                    acted = true;
                    await this.doAd(k, ts, name, pct, rule);
                }
            }
        }

        if (!acted) {
            log('Tidak ada aksi di scan ini', 'ok');
            this.resumeK = 1;
            await this.wait(this.cfg.scanIntervalMs);
        }
        this.iter++;
    }

    async run() {
        while (!this.stopped && (this.cfg.maxLoop === 0 || this.iter < this.cfg.maxLoop)) {
            try {
                await this.cycle();
            } catch (e) {
                log(`Error siklus: ${e.message}`, 'err');
                this.needOpen = true;
                await this.wait(5000);
            }
        }
        log(`Run selesai (${this.total} siklus)`, 'ok');
    }
}
// method sell, AD, dan trailing stop ada di file masing-masing
Object.assign(FomoScanner.prototype, require('./trail'), require('./sell'), require('./ad'));

module.exports = { FomoScanner };
