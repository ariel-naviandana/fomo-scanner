// src/index.js — titik masuk fomo scanner (juga dipakai untuk build fomo-scanner.exe)
//   node src/index.js        / fomo-scanner.exe        -> jalankan scanner (sell/AD/buy) sesuai config
//   node src/index.js login  / fomo-scanner.exe login  -> login ke fomo.family (sekali saja)
//   node src/index.js config / fomo-scanner.exe config -> halaman pengaturan config di browser (127.0.0.1)
const args = process.argv.slice(2);
const isBot = !args.includes('login') && !args.includes('config') && !args.includes('ui');
// log terminal scanner ikut disimpan ke CSV harian (fomo_log_YYYY-MM-DD.csv di folder output)
if (isBot) require('./core/file-log').installFileLog('fomo_log');
if (args.includes('login')) {
    require('./login');
} else if (args.includes('config') || args.includes('ui')) {
    require('./config-ui/server');
} else {
    require('./runner/run');
}
