// src/sell-ad/ad-rules.js — aturan AD per coin (config sell-ad.json -> adCoins)
// adCoins: [{ name, mcapMin, mcapMax }], urutan = prioritas. Untuk satu coin yang dipakai baris paling atas.
// Setelah AD terbeli, baris itu dihapus dari config/sell-ad.json (tanpa me-restart run), baris berikutnya
// untuk coin yang sama jadi patokan. Coin yang tidak ada di adCoins tidak di-AD.
const fs = require('fs');
const path = require('path');
const { CONFIG_DIR } = require('../core/config');
const { acceptConfigChange } = require('../runner/watch-config');
const { log } = require('../core/util');

const FILE = path.join(CONFIG_DIR, 'sell-ad.json');
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

// Baris aktif untuk coin ini (paling atas), null kalau coin tidak ada di adCoins
function activeRule(cfg, name) {
    const key = String(name).trim().toLowerCase();
    return (cfg.adRules || []).find((r) => r.key === key) || null;
}

const rangeText = (r) => `${r.mcapMinText || r.min} - ${r.mcapMaxText || r.max}`;

// Hapus baris aturan dari config (file + memori). Return true kalau berhasil.
function removeRule(cfg, rule) {
    // memori: hapus dulu supaya siklus berikutnya langsung memakai baris berikutnya
    const i = (cfg.adRules || []).indexOf(rule);
    if (i >= 0) cfg.adRules.splice(i, 1);
    try {
        const json = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        const list = Array.isArray(json.adCoins) ? json.adCoins : [];
        const idx = list.findIndex((c) => c && same(c.name, rule.name)
            && String(c.mcapMin ?? '') === rule.mcapMinText && String(c.mcapMax ?? '') === rule.mcapMaxText);
        if (idx < 0) {
            log(`AD ${rule.name}: baris ${rangeText(rule)} tidak ditemukan di sell-ad.json (mungkin sudah diubah), hanya dihapus dari memori`, 'warn');
            return false;
        }
        list.splice(idx, 1);
        json.adCoins = list;
        fs.writeFileSync(FILE, JSON.stringify(json, null, 2) + '\n');
        acceptConfigChange(); // tulisan bot sendiri: jangan restart run
        const next = activeRule(cfg, rule.name);
        log(`AD ${rule.name}: baris ${rangeText(rule)} dihapus dari adCoins`
            + (next ? `, patokan berikutnya ${rangeText(next)}` : ', tidak ada baris lagi untuk coin ini'), 'ok');
        return true;
    } catch (e) {
        log(`AD ${rule.name}: gagal menghapus baris dari sell-ad.json (${e.message})`, 'err');
        return false;
    }
}

module.exports = { activeRule, removeRule, rangeText };
