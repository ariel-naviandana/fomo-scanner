// src/buy/buy-config.js — hapus coin dari config/buy.json -> coins setelah dibeli
// (dry run: hanya kalau unstarOnDryRun nyala, sama seperti aturan unstar). Ditulis tanpa me-restart run.
const fs = require('fs');
const path = require('path');
const { CONFIG_DIR } = require('../core/config');
const { acceptConfigChange } = require('../runner/watch-config');
const { log, money } = require('../core/util');

const FILE = path.join(CONFIG_DIR, 'buy.json');
const lower = (v) => String(v ?? '').trim().toLowerCase();

// Hapus coin dari memori (buyMap) dan dari buy.json. Return true kalau baris di file terhapus.
function removeBuyCoin(cfg, key, c) {
    cfg.buyMap.delete(key);
    try {
        const json = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        const list = Array.isArray(json.coins) ? json.coins : [];
        // cocokkan nama + rentang MC + nominal; kalau tidak ketemu (config diubah), cukup cocok nama
        let idx = list.findIndex((x) => x && lower(x.name) === key
            && money(x.mcapMin) === c.mcapMin && money(x.mcapMax) === c.mcapMax && Number(x.amount) === c.amount);
        if (idx < 0) idx = list.findIndex((x) => x && lower(x.name) === key);
        if (idx < 0) {
            log(`[BUY] ${c.name} tidak ditemukan di buy.json (mungkin sudah dihapus), hanya dihapus dari memori`, 'warn');
            return false;
        }
        list.splice(idx, 1);
        json.coins = list;
        fs.writeFileSync(FILE, JSON.stringify(json, null, 2) + '\n');
        acceptConfigChange(); // tulisan bot sendiri: jangan restart run
        log(`[BUY] ${c.name} dihapus dari buy.json (sisa ${list.length} coin)`, 'ok');
        return true;
    } catch (e) {
        log(`[BUY] ${c.name}: gagal menghapus dari buy.json (${e.message})`, 'err');
        return false;
    }
}

module.exports = { removeBuyCoin };
