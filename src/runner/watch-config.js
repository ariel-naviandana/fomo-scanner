// src/runner/watch-config.js — pantau folder config/
// Polling waktu ubah file (lebih andal di Windows daripada fs.watch). Kalau berubah: tunggu sebentar
// (file bisa ditulis beberapa kali saat simpan), lalu panggil onChange(). Selama onChange berjalan,
// perubahan berikutnya ditunda sampai selesai.
const fs = require('fs');
const path = require('path');
const { CONFIG_DIR, CONFIG_FILES } = require('../core/config');
const { sleep } = require('../core/util');

function configSignature() {
    return CONFIG_FILES.map((f) => {
        try {
            const st = fs.statSync(path.join(CONFIG_DIR, f));
            return `${f}:${st.mtimeMs}:${st.size}`;
        } catch {
            return `${f}:-`;
        }
    }).join('|');
}

function watchConfig(onChange) {
    if (!fs.existsSync(CONFIG_DIR)) return;
    let last = configSignature();
    let applying = false;
    setInterval(async () => {
        if (applying) return;
        if (configSignature() === last) return;
        applying = true;
        try {
            await sleep(1500);
            last = configSignature();
            await onChange();
        } finally {
            applying = false;
        }
    }, 2000);
}

module.exports = { watchConfig };
