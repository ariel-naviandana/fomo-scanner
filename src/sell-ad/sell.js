// src/sell-ad/sell.js — alur SELL (method FomoScanner)
// Klik baris posisi -> detail coin -> Sell -> 100% -> konfirmasi "Sell <nama>"
// Log: fomo_sell_log.csv (waktu, nama, nominal, margin, hasil)
//   hasil: SOLD / DRY_RUN_STOP / SELL_MIN_ORDER / MISMATCH / CLICK_GAGAL / SELL_GAGAL
const { log, sleep, appendCsv } = require('../core/util');
const { actionMatch, minOrderText } = require('../core/order-form');

module.exports = {
    logSell(ts, name, nominal, pct, result) {
        appendCsv(this.out.dir, this.out.sellLogFile, [ts, name, nominal, pct, result]);
    },

    // ---------- SELL ----------
    async doSell(k, ts, name, nominal, pct, why) {
        const W = this.cfg.wait;
        log(`SELL: ${name} (${pct}%) | ${why}`, 'ok');
        this.needOpen = true;

        const href = await this.rowHref(k);
        if (!(await this.clickRowIcon(k, name))) {
            log(`COIN TIDAK BISA DIKLIK: ${name}. Dilewati`, 'err');
            this.markFail(name, false);
            this.logSell(ts, name, nominal, pct, 'CLICK_GAGAL');
            this.resumeK = k + 1;
            return;
        }
        this.markFail(name, true);

        let flowOk = await this.onDetailOf(href, name);
        let finalText = null;
        if (flowOk) try {
            await this.x(this.sel.sellButton).first().click({ timeout: W.elementTimeoutMs });
            await sleep(500);
            await this.x(this.sel.sell100).first().click({ timeout: W.elementTimeoutMs });
            await sleep(500);
            finalText = await this.text(this.x(this.sel.sellConfirm), W.elementTimeoutMs);
        } catch {
            flowOk = false;
        }

        if (flowOk && !finalText) {
            const minText = await minOrderText(this);
            if (minText) {
                log(`SELL DIBATALKAN: posisi ${name} ($${nominal}) di bawah minimum (${minText})`, 'warn');
                this.logSell(ts, name, nominal, pct, 'SELL_MIN_ORDER');
                this.resumeK = k + 1;
                return;
            }
        }
        if (!(flowOk && actionMatch(finalText, 'Sell', name))) {
            log(`Coin di halaman detail tidak cocok (${finalText}), sell dibatalkan`, 'err');
            this.logSell(ts, name, nominal, pct, 'MISMATCH');
            this.resumeK = k + 1;
            return;
        }

        if (this.cfg.dryRunSell) {
            log(`DRY RUN: berhenti sebelum klik '${finalText}'`, 'warn');
            this.logSell(ts, name, nominal, pct, 'DRY_RUN_STOP');
            this.resumeK = k + 1;
            return;
        }

        let clicked = true;
        try {
            await this.x(this.sel.sellConfirm).first().click({ timeout: W.elementTimeoutMs });
        } catch {
            clicked = false;
        }
        await sleep(W.afterActionMs);
        if (clicked) {
            log(`SOLD: ${name} (${pct}%)`, 'ok');
            this.logSell(ts, name, nominal, pct, 'SOLD');
            if (this.cfg.trail.enabled && this.curKey) this.setTrail(ts, this.curKey, name, null);
            this.resumeK = k; // coin terjual hilang dari list, coin berikutnya menempati nomor yang sama
        } else {
            log(`SELL GAGAL: ${name} (tombol konfirmasi tidak bisa diklik)`, 'err');
            this.logSell(ts, name, nominal, pct, 'SELL_GAGAL');
            this.resumeK = k + 1;
        }
    }
};
