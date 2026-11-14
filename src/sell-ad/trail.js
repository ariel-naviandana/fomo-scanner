// src/sell-ad/trail.js — trailing stop (method FomoScanner)
// fomo_trail.csv: waktu, link coin, nama, puncak margin (atau RESET). Baris terakhir per coin yang berlaku.
// Puncak tetap tersimpan antar run / restart.
const fs = require('fs');
const path = require('path');
const { log, appendCsv } = require('../core/util');

module.exports = {
    loadTrail() {
        const map = {};
        if (!this.cfg.trail.enabled) return map;
        const file = path.join(this.out.dir, this.out.trailFile);
        try {
            for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
                const c = line.split(',');
                if (c.length < 4) continue;
                const key = c[1].replace(/^"|"$/g, '');
                const v = c[c.length - 1].replace(/^"|"$/g, '').trim();
                if (v === 'RESET') delete map[key];
                else if (Number.isFinite(parseFloat(v))) map[key] = parseFloat(v);
            }
        } catch { /* file belum ada */ }
        const t = this.cfg.trail;
        log(`Trailing stop aktif: mulai ${t.start}% | turun ${t.drop} poin | min profit ${this.cfg.minProfit}% | ${Object.keys(map).length} coin sudah punya puncak`);
        return map;
    },

    // peak null = hapus puncak (RESET), misalnya setelah terjual atau setelah AD
    setTrail(ts, key, name, peak) {
        if (peak === null) delete this.trailMap[key];
        else this.trailMap[key] = peak;
        appendCsv(this.out.dir, this.out.trailFile, [ts, key, name, peak === null ? 'RESET' : peak]);
    },

    // Return alasan sell (string) kalau trailing stop kena, null kalau belum
    checkTrail(ts, key, name, pct) {
        const t = this.cfg.trail;
        const old = this.trailMap[key];
        let peak = old;
        if (pct >= t.start && (peak === undefined || pct > peak)) {
            peak = pct;
            this.setTrail(ts, key, name, peak);
        }
        if (peak === undefined) return null;
        const stop = +(peak - t.drop).toFixed(2);
        // min profit per coin: tpCustom kalau ada, kalau tidak pakai minProfit global
        const minP = this.tpFor(name);
        const custom = this.cfg.tpMap[name.toLowerCase()] !== undefined;
        log(`TRAIL ${name}: margin ${pct}% | puncak ${peak}% | sell di <= ${stop}% (min profit ${minP}%${custom ? ' dari tpCustom' : ''})`);
        if (pct <= stop && pct >= minP) return `trailing stop: puncak ${peak}%, turun ke ${pct}%`;
        return null;
    },
};
