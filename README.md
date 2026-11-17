# fomo-scanner

Bot fomo.family berbasis Playwright, dua tab dalam satu Chrome:
- **Sell & AD**: scan panel "Your positions", sell saat TP / trailing stop, average down (AD).
- **Buy**: scan watchlist, beli coin yang market cap-nya masuk range, lalu unstar.

Panduan lengkap (config, alur, format log): `docs/guidance.md`.

## Menjalankan
| | npm | exe |
|---|---|---|
| Jalankan bot | `npm start` | `fomo-scanner.exe` |
| Login fomo (sekali) | `npm run login` | `fomo-scanner-login.bat` |
| Halaman pengaturan config | `npm run config` | `fomo-scanner-config.bat` |

Config yang disimpan dari halaman pengaturan langsung dipakai bot (run di-restart).

## Struktur
```
fomo-scanner/
├─ src/
│  ├─ index.js          titik masuk: start | login | config
│  ├─ login.js          login fomo (Chrome biasa, sekali saja)
│  ├─ core/             config, util, browser, page-helper (x/text/wait), order-form (isi nominal + cek tombol Buy)
│  ├─ sell-ad/          scanner (panel Your positions), sell, ad (+RSI), trail (trailing stop)
│  ├─ buy/              buyer (watchlist, standby, beli, unstar)
│  ├─ runner/           run (start/stop run, tab), schedule (cron / acak), watch-config (pantau config/)
│  └─ config-ui/        server + page (halaman pengaturan)
├─ config/              general (jadwal, run, dryRun, output), sell-ad, buy, paths (selector), timing
├─ docs/
│  ├─ guidance.md       panduan versi sekarang: config, scanner buy, format log
│  ├─ playwright.md     dokumentasi versi lama (pw.config.json, tanpa buy)
│  └─ build-exe.md      cara build fomo-scanner.exe (atau double-click build-exe.bat)
├─ build/sea.json       config build exe (Node SEA)
├─ fomo-scanner-login.bat, fomo-scanner-config.bat, build-exe.bat
├─ fomo-scanner.exe     (hasil build, tidak di-commit)
└─ package.json
```

## Catatan
- Exe membaca folder `config/` dari folder exe, jadi `config/` dan `node_modules` (playwright-core) tetap di samping exe.
- Versi UI.Vision (macro + scheduler) sudah dihapus dari repo ini. Macro-nya tetap ada di `C:\uivision\macros`
  dan di riwayat git.
