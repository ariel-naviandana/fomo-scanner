// src/sell-ad/ad.js — alur AD / average down (method FomoScanner)
// Cek di halaman detail: umur coin, RSI (opsional), MC sekarang < avg entry MC, invested.
// Kalau lolos: isi nominal = invested (atau minimum order), lalu Buy.
// Log: fomo_ad_log.csv (waktu, nama, umur, RSI, MC, avg MC, invested, hasil)
const { log, sleep, nowTs, money, ageHours, appendCsv } = require('../core/util');
const { actionMatch, fillBuyAmount, minOrderText, insufficientText } = require('../core/order-form');

module.exports = {
    // ---------- AD (average down) ----------
    async readRsi() {
        const W = this.cfg.wait;
        const xp = this.sel.rsiValue;
        // pastikan chart terlihat supaya TradingView merender legend
        await this.page.locator(this.sel.rsiFrame).first().scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        const deadline = Date.now() + W.rsiTimeoutMs * W.rsiTries;
        while (Date.now() < deadline) {
            for (const f of this.page.frames()) {
                const t = await f.evaluate((q) => {
                    const n = document.evaluate(q, document, null, 9, null).singleNodeValue;
                    return n ? n.textContent : null;
                }, xp).catch(() => null);
                const n = parseFloat(String(t ?? '').replace(/,/g, ''));
                if (Number.isFinite(n)) return n;
            }
            await sleep(1000);
        }
        // diagnosa: tampilkan legend yang ditemukan supaya selector bisa disesuaikan
        const found = [];
        for (const f of this.page.frames()) {
            const items = await f.evaluate(() => [...document.querySelectorAll('[data-qa-id="legend-source-item"]')]
                .map((i) => i.innerText.replace(/\s+/g, ' ').slice(0, 80))).catch(() => []);
            if (items.length) found.push(`[${f.url().slice(0, 50)}] ${items.join(' | ')}`);
        }
        log(`RSI tidak terbaca. Jumlah frame: ${this.page.frames().length}. Legend: ${found.join(' || ') || 'tidak ditemukan'}`, 'warn');
        return -1;
    },

    async doAd(k, ts, name, pct) {
        const W = this.cfg.wait;
        const d = { ageH: -1, mcNow: -1, avgMC: -1, invested: -1, rsi: -1, result: 'POPUP_MISMATCH' };
        log(`KANDIDAT AD: ${name} (${pct}%) -> cek detail coin`, 'warn');

        const href = await this.rowHref(k);
        if (!(await this.clickRowIcon(k, name))) {
            log(`COIN TIDAK BISA DIKLIK: ${name}. AD dibatalkan`, 'err');
            this.markFail(name, false);
            d.result = 'CLICK_GAGAL';
        } else {
            this.markFail(name, true);
            if (!(await this.onDetailOf(href, name))) {
                log(`AD ${name} dibatalkan (halaman detail tidak sesuai)`, 'err');
            } else {
                for (const s of [this.sel.detailMarketCap, this.sel.detailInvested, this.sel.detailAvgEntry]) {
                    await this.x(s).first().waitFor({ timeout: W.elementTimeoutMs }).catch(() => {});
                }

                d.ageH = ageHours(await this.text(this.x(this.sel.detailAge), 3000));
                d.mcNow = money(await this.text(this.x(this.sel.detailMarketCap), 3000));
                d.invested = money(await this.text(this.x(this.sel.detailInvested), 3000));
                d.avgMC = money(await this.text(this.x(this.sel.detailAvgEntry), 3000));
                if (this.cfg.adUseRsi) d.rsi = await this.readRsi();

                const fail = [];
                if (!(d.ageH >= this.cfg.adMinAgeH)) fail.push('UMUR');
                if (this.cfg.adUseRsi && !(d.rsi >= 0 && d.rsi <= this.cfg.adRsiMax)) fail.push('RSI');
                if (!(d.mcNow > 0 && d.avgMC > 0 && d.mcNow < d.avgMC)) fail.push('MC');
                if (!(d.invested > 0)) fail.push('INVESTED');
                d.result = fail.length ? `TIDAK_LOLOS:${fail.join('+')}` : 'LOLOS';

                log(`AD CEK ${name}: umur=${d.ageH}h (min ${this.cfg.adMinAgeH}) | RSI=${d.rsi} (maks ${this.cfg.adRsiMax}) | `
                    + `MC=${d.mcNow} vs avg=${d.avgMC} | invested=${d.invested} | hasil=${d.result}`, 'warn');

                if (d.result === 'LOLOS') {
                    await this.buyAd(name, d);
                } else {
                    log(`AD ${name} belum memenuhi syarat, dicek lagi di putaran berikutnya`, 'warn');
                }
            }
        }

        appendCsv(this.out.dir, this.out.adLogFile, [ts, name, d.ageH, d.rsi, d.mcNow, d.avgMC, d.invested, d.result]);

        // kembali ke halaman awal, lanjut dari coin berikutnya
        await this.openProfile().catch(() => { this.needOpen = true; });
        this.resumeK = k + 1;
    },

    async buyAd(name, d) {
        const W = this.cfg.wait;
        const minUsd = Number(this.cfg.adMinOrderUsd) || 0;

        // Nominal AD = invested (1:1). Di bawah minimum order: dilewati atau dinaikkan ke minimum
        let amount = d.invested;
        if (minUsd > 0 && amount < minUsd) {
            if (this.cfg.adBelowMin === 'min') {
                log(`Nominal AD ${name} $${amount} < minimum $${minUsd}, dinaikkan ke $${minUsd}`, 'warn');
                amount = minUsd;
            } else {
                log(`AD ${name} dilewati: nominal $${amount} di bawah minimum order $${minUsd}`, 'warn');
                d.result = 'BUY_MIN_ORDER';
                return;
            }
        }
        d.buyAmount = amount;

        let { buyText, ok: flowOk } = await fillBuyAmount(this, amount);

        if (!buyText) {
            const minText = await minOrderText(this);
            if (minText) {
                const minVal = money(minText); // "Minimum amount $2" -> 2
                if (this.cfg.adBelowMin === 'min' && minVal > amount) {
                    log(`Nominal AD ${name} $${amount} < minimum $${minVal} (dari tombol), dinaikkan ke $${minVal}`, 'warn');
                    amount = minVal;
                    d.buyAmount = amount;
                    ({ buyText, ok: flowOk } = await fillBuyAmount(this, amount));
                }
                if (!buyText) {
                    log(`AD ${name} dibatalkan: nominal $${amount} di bawah minimum (${minText})`, 'warn');
                    d.result = 'BUY_MIN_ORDER';
                    return;
                }
            }
        }

        if (!buyText) {
            const balText = await insufficientText(this);
            if (balText) {
                log(`AD ${name} dibatalkan: saldo tidak cukup untuk beli $${amount} (${balText})`, 'warn');
                d.result = 'BUY_SALDO_KURANG';
                return;
            }
        }

        if (!(flowOk && actionMatch(buyText, 'Buy', name))) {
            log(`Tombol buy tidak cocok (${buyText}), AD dibatalkan`, 'err');
            d.result = 'BUY_MISMATCH';
            return;
        }
        if (this.cfg.dryRunAd) {
            log(`DRY RUN: berhenti sebelum klik '${buyText}' (nominal ${amount})`, 'warn');
            d.result = 'DRY_RUN_STOP';
            return;
        }
        try {
            await this.x(this.sel.buyButton).first().click({ timeout: W.elementTimeoutMs });
            await sleep(W.afterActionMs);
            log(`AD BUY: ${name} senilai $${amount}`, 'ok');
            d.result = 'BOUGHT';
            // avg entry berubah setelah AD, puncak trailing lama tidak berlaku lagi
            if (this.cfg.trail.enabled && this.curKey && this.trailMap[this.curKey] !== undefined) this.setTrail(nowTs(), this.curKey, name, null);
            this.adDone.add(name);
        } catch {
            await sleep(W.afterActionMs);
            log(`BUY GAGAL: ${name} (tombol Buy tidak bisa diklik)`, 'err');
            d.result = 'BUY_GAGAL';
        }
    }
};
