// src/runner/schedule.js — jadwal restart run
//   restartMode "cron"   : restart sesuai schedule (cron). schedule kosong = tanpa jadwal (jalan terus)
//   restartMode "random" : restart setelah jeda acak restartMinMin - restartMaxMin menit, diacak lagi tiap restart
// getCfg() dipanggil tiap kali supaya selalu memakai config terbaru.
// onRestart(reason) dipanggil saat jadwal tiba ('JADWAL' / 'JADWAL ACAK').
const cron = require('node-cron');
const { log, nowTs } = require('../core/util');

function createScheduler(getCfg, onRestart) {
    let cronTask = null;
    let randomTimer = null;

    const isRandom = () => String(getCfg().restartMode).toLowerCase() === 'random';
    const hasSchedule = () => isRandom() || !!getCfg().schedule;

    function clear() {
        if (cronTask) { cronTask.stop(); cronTask = null; }
        if (randomTimer) { clearTimeout(randomTimer); randomTimer = null; }
    }

    function scheduleRandomRestart() {
        const cfg = getCfg();
        const min = Math.max(1, Number(cfg.restartMinMin) || 8);
        const max = Math.max(min, Number(cfg.restartMaxMin) || 15);
        const ms = Math.round((min + Math.random() * (max - min)) * 60000);
        const at = new Date(Date.now() + ms);
        log(`Restart berikutnya dalam ${(ms / 60000).toFixed(1)} menit (acak ${min}-${max} menit), sekitar ${nowTs(at).slice(11)}`);
        randomTimer = setTimeout(async () => {
            randomTimer = null;
            await onRestart('JADWAL ACAK');
            scheduleRandomRestart();
        }, ms);
    }

    // Pasang jadwal sesuai config (dipanggil saat start dan setelah config berubah)
    function setup() {
        clear();
        const cfg = getCfg();
        if (isRandom()) {
            scheduleRandomRestart();
        } else if (cfg.schedule) {
            if (!cron.validate(cfg.schedule)) {
                log(`Format cron tidak valid: "${cfg.schedule}", jadwal tidak dipasang`, 'err');
                return;
            }
            cronTask = cron.schedule(cfg.schedule, () => onRestart('JADWAL'), { timezone: cfg.timezone });
        }
    }

    return { setup, clear, isRandom, hasSchedule };
}

module.exports = { createScheduler };
