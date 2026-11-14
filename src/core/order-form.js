// src/core/order-form.js — form order di halaman detail coin (dipakai AD dan scanner buy)
// Isi nominal -> baca tombol Buy. Kalau tombol Buy tidak muncul, fomo menampilkan tombol lain:
//   "Minimum amount $X"     nominal di bawah minimum (nilai minimum dibaca dari tombol)
//   "Insufficient balance"  saldo tidak cukup
const { sleep } = require('./util');

// Tombol aksi cocok kalau diawali kata kerja (Buy/Sell) dan mengandung nama coin,
// contoh "Buy GATO", "Buy 1 GATO", "Sell Gato"
function actionMatch(text, verb, name) {
    const t = String(text ?? '').trim().toLowerCase();
    return t.startsWith(verb.toLowerCase() + ' ') && t.includes(String(name).trim().toLowerCase());
}

// Isi nominal lalu baca teks tombol Buy. Return { buyText, ok } (ok = false kalau input / tombol gagal)
async function fillBuyAmount(bot, amount) {
    const W = bot.cfg.wait;
    try {
        await bot.x(bot.sel.buyInput).first().fill(String(amount), { timeout: W.elementTimeoutMs });
        await sleep(1000);
        const buyText = await bot.text(bot.x(bot.sel.buyButton), W.elementTimeoutMs);
        return { buyText, ok: true };
    } catch {
        return { buyText: null, ok: false };
    }
}

// Teks tombol "Minimum amount $X", null kalau tidak ada
const minOrderText = (bot) => bot.text(bot.x(bot.sel.minOrderButton), 1500);

// Teks tombol "Insufficient balance", null kalau tidak ada
const insufficientText = (bot) => bot.text(bot.x(bot.sel.insufficientButton), 1500);

module.exports = { actionMatch, fillBuyAmount, minOrderText, insufficientText };
