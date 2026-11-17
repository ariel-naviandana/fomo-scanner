# Fomo Scanner: Guidance (versi Playwright, folder config/ + scanner buy)

Versi Playwright fomo scanner. Dua tab dalam satu Chrome:
- **Tab 1 - sell & AD**: scan panel "Your positions" (port dari macro UI.Vision `fomo_scanner_v4`).
- **Tab 2 - buy**: scan watchlist di sidebar, beli coin yang market cap-nya masuk range, lalu unstar.

Fitur yang dijalankan diatur di `config/general.json` -> `run`.

## Menjalankan
```
npm install          sekali (memasang playwright-core, tanpa download browser)
npm run login        sekali: login ke fomo.family di jendela yang terbuka, lalu tutup jendelanya
npm start            jalankan scanner sesuai jadwal (berhenti dengan Ctrl+C)
npm run config           halaman pengaturan config di browser
```
Atau pakai exe (cara build ada di `docs/build-exe.md`): `fomo-scanner.exe` untuk jalan, `fomo-scanner-login.bat` untuk login, `fomo-scanner-config.bat` untuk pengaturan.
Exe butuh folder `config\` dan `node_modules\playwright-core` di folder yang sama.


## Halaman pengaturan (UI)
Double-click `fomo-scanner-config.bat` (atau `npm run config`): server lokal jalan di `http://127.0.0.1:3939` dan browser terbuka otomatis.
Hanya bisa dibuka dari laptop ini. Port diatur lewat `uiPort` di `config/general.json` (tidak tampil di UI).
- Isi: tab **General** (fitur, dry run, jadwal restart, akun), **Sell & AD**, **Buy**. Setiap field ada penjelasannya.
  `timing.json`, `paths.json`, `browser`, `output`, `uiPort` tidak ditampilkan dan tetap dipertahankan saat simpan.
- **Simpan**: ada konfirmasi kalau dry run dimatikan, peringatan untuk nilai yang mencurigakan (min profit negatif saat
  transaksi beneran, MC min > max, format MC tidak terbaca, nominal 0, nama coin dobel, dll).
  Config lama di-backup ke `config/backup/<waktu>/` sebelum ditulis.
- Bot yang sedang jalan memantau folder `config/`: begitu ada file yang berubah (dari UI atau edit manual), config dibaca
  ulang dan run di-restart (proses yang sedang jalan diselesaikan dulu).

## Jadwal
Sama seperti scheduler lama: tiap `schedule` (default tiap 15 menit) run dimulai ulang dengan state baru
(hitungan gagal-klik di-reset). Bedanya, run lama dihentikan dengan rapi:
transaksi yang sedang berjalan diselesaikan dulu, tidak dipotong di tengah seperti kill Chrome.

## Pengaturan: folder `config/`
Dibaca dari folder project (atau folder exe). Kalau folder `config/` tidak ada, `pw.config.json` lama (satu file) masih dibaca.

### `config/general.json`: jadwal, fitur yang dijalankan, dry run, profil, browser, folder log
| Key | Arti | Contoh |
|---|---|---|
| `timezone` | Zona waktu jadwal & log | `"Asia/Jakarta"` |
| `schedule` | Cron untuk memulai ulang run. `""` = jalan terus tanpa jadwal | `"*/15 * * * *"` |
| `restartMode` | `"cron"` = run & Chrome di-restart sesuai `schedule`. `"random"` = restart setelah jeda acak antara `restartMinMin` dan `restartMaxMin` menit (diacak ulang tiap restart) | `"random"` |
| `uiPort` | Port halaman pengaturan (hanya 127.0.0.1). Tidak tampil di UI | `3939` |
| `restartMinMin` / `restartMaxMin` | Rentang jeda restart acak (menit), dipakai kalau `restartMode` = `"random"` | `8` / `15` |
| `runOnStart` | Langsung jalan saat start, tidak menunggu jadwal pertama | `true` |
| `restartBrowser` | Tutup & buka ulang Chrome tiap jadwal | `true` |
| `restartWaitMs` | Jeda (ms) setelah Chrome ditutup | `3000` |
| `run.sell` | `false` = sell (TP / trailing) tidak dicek sama sekali. Beda dengan `dryRun.sell` | `true` |
| `run.ad` | `false` = AD tidak dicek sama sekali (halaman detail tidak dibuka). Beda dengan `dryRun.ad` | `true` |
| `run.buy` | `true` = tab kedua dibuka untuk scanner buy (watchlist) | `false` |
| `dryRun.sell` | `true` = sell berhenti sebelum klik konfirmasi Sell | `true` |
| `dryRun.ad` | `true` = AD isi nominal tapi tidak klik Buy | `true` |
| `dryRun.buy` | `true` = scanner buy isi nominal tapi tidak klik Buy (unstar diatur `unstarOnDryRun` di buy.json) | `true` |
| `profileName` | Nama profil fomo, dipakai sebagai `?r=` di URL | `"VagueCoralJay"` |
| `startTokenUrl` | Halaman awal: detail coin apa saja (tanpa `?r=`). Dipakai kedua tab | `"https://fomo.family/tokens/base/0xcbada7..."` |
| `browser.chromePath` | Lokasi chrome.exe | `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"` |
| `browser.userDataDir` | Folder profil Chrome khusus bot (sesi login fomo) | `"C:\\chrome-profiles\\fomo-playwright"` |
| `browser.headless` | `true` = Chrome tanpa jendela | `false` |
| `browser.viewport` | `null` = halaman ikut ukuran jendela (maximize). Isi ukuran untuk ukuran tetap | `null` atau `{ "width": 1600, "height": 1000 }` |
| `output.dir` | Folder log CSV | `"C:\\uivision\\datasources"` |
| `output.positionsFile` / `adLogFile` / `sellLogFile` / `trailFile` / `buyLogFile` | Nama file log posisi / AD / sell / puncak trailing / buy | `"fomo_buy_log.csv"` |

### `config/sell-ad.json`: sell dan AD (tab 1)
| Key | Arti | Contoh |
|---|---|---|
| `minProfit` | Trailing aktif: sell hanya kalau margin saat itu >= nilai ini. Trailing mati: dipakai sebagai TP (%). Coin di `tpCustom` pakai nilainya sendiri | `20` |
| `tpCustom` | `minProfit` khusus per coin, menggantikan `minProfit` untuk coin itu. Trailing mati: jadi TP coin itu. Trailing aktif: jadi batas profit minimal trailing coin itu. Nama tidak peka huruf besar/kecil. Kosong = `{}` | `{ "E/ACC": 10, "COLLECTOOOR": 30 }` |
| `trail.enabled` | `true` = sell pakai trailing stop (batas min profit dari `minProfit` / `tpCustom`). `false` = sell saat margin >= `minProfit` / `tpCustom` | `false` |
| `trail.start` | Trailing mulai dihitung saat margin >= nilai ini (%) | `30` |
| `trail.drop` | Sell kalau margin turun >= sekian POIN dari puncak (puncak 50, drop 10 -> sell di <= 40) | `10` |
| `showDust` | `true` = buka list dust supaya posisi kecil ikut di-scan, `false` = dust ditutup / tidak di-scan | `true` |
| `cutLoss.enabled` | `true` = cut loss nyala: coin dijual kalau margin <= batas cut loss. Dicek sebelum TP / trailing dan sebelum AD | `false` |
| `cutLoss.pct` | Batas cut loss (%) | `-50` |
| `cutLossCustom` | Batas cut loss khusus per coin (menggantikan `cutLoss.pct`, hanya kalau cut loss nyala). Nama tidak peka huruf besar/kecil | `{ "FLOAT": -60 }` |
| `exclude` | Coin yang dilewati total (tidak di-sell/AD). Nama tidak peka huruf besar/kecil. Kosong = `[]` | `["E/ACC", "GATO"]` |
| `adCoins` | Coin yang boleh di-AD + rentang market cap, urutan = prioritas. Coin yang tidak ada di sini tidak di-AD. Lihat bagian AD di bawah | `[{ "name": "FLOAT", "mcapMin": "1.5M", "mcapMax": "2M" }, { "name": "FLOAT", "mcapMin": "1M", "mcapMax": "1.4M" }]` |
| `adRemoveOnDryRun` | Dry run AD (klik Buy dilewati): `true` = baris `adCoins` tetap dihapus, `false` = dibiarkan (bisa dites berulang) | `false` |
| `adTrigger` | Margin (%) yang memicu cek AD (margin <= nilai ini) | `-25` |
| `adMinAgeH` | Umur coin minimal (jam) untuk AD | `6` |
| `adUseRsi` | `true` = RSI jadi syarat AD | `true` |
| `adRsiMax` | RSI maksimal supaya AD lolos | `30` |
| `adMinOrderUsd` | Minimum order manual (USD). `0` = otomatis dibaca dari tombol "Minimum amount $X" | `0` |
| `adBelowMin` | Invested < minimum order: `"skip"` = AD dilewati (BUY_MIN_ORDER), `"min"` = beli sebesar minimum | `"skip"` |

### `config/buy.json`: scanner buy (tab 2)
| Key | Arti | Contoh |
|---|---|---|
| `unstarAfterBuy` | `true` = coin di-unstar (hilang dari watchlist) setelah berhasil beli | `true` |
| `unstarOnDryRun` | Saat `dryRun.buy: true` (klik Buy dilewati): `true` = coin tetap di-unstar, `false` = coin dibiarkan di watchlist | `true` |
| `standbyRandom` | `true` = saat tidak ada yang dibeli, tab pindah ke detail coin watchlist yang dipilih acak (lebih natural) | `true` |
| `coins` | Coin yang dipantau. `name` = nama di watchlist (tidak peka huruf besar/kecil), beli `amount` (USD) kalau market cap di antara `mcapMin` dan `mcapMax`. MC boleh ditulis seperti di fomo (`"40.7K"`, `"2.32M"`, `"1.5B"`) atau angka penuh (`40700`), jangan `40` saja (dibaca $40). Coin di watchlist yang tidak ada di sini diabaikan | `[{ "name": "COINA", "mcapMin": "40.7K", "mcapMax": "2.32M", "amount": 5 }]` |

### `config/paths.json`: selector
| Key | Arti | Contoh |
|---|---|---|
| `selectors.*` | XPath elemen fomo untuk sell & AD (ubah di sini kalau tampilan fomo berubah) | `"row": "(//a[...])"` |
| `selectors.watchlistTab` | Buy: tombol/tab untuk membuka watchlist di sidebar. Kosong = tidak diklik | `"//button[...]"` |
| `selectors.watchScroll` | Buy: panel sidebar yang bisa di-scroll. Watchlist hanya merender coin yang terlihat, jadi panel di-scroll dari atas ke bawah. Kosong = tidak di-scroll | `"//*[@id='discovery-panels']//div[contains(@class,'overflow-y-auto')][...]"` |
| `selectors.watchRow` | Buy (wajib): semua baris coin di watchlist, dalam kurung supaya bisa diberi nomor `[k]` | `"(//div[...]//a[...])"` |
| `selectors.watchRowName` | Buy (wajib): nama coin, relatif ke baris | `".//div[...]"` |
| `selectors.watchRowMcap` | Buy (wajib): teks market cap, relatif ke baris | `".//div[contains(.,'MC')]"` |
| `selectors.watchRowClick` | Buy: yang diklik untuk membuka detail coin, relatif ke baris | `".//img"` |
| `selectors.unstarButton` | Buy: tombol bintang di halaman detail untuk unstar | `"//button[...]"` |
| `selectors.buyTab` | Tab Buy di form trade (supaya bukan tab Sell yang aktif) | `"(//div[...]/button[normalize-space(.)='Buy'])[1]"` |

### `config/timing.json`: wait, retry, interval
| Key | Arti | Contoh |
|---|---|---|
| `maxLoop` | Batas jumlah siklus per run. `0` = terus | `0` |
| `scanIntervalMs` | Jeda (ms) antar scan sell/AD kalau tidak ada aksi | `6000` |
| `buyScanIntervalMs` | Jeda (ms) antar scan watchlist (scanner buy), diberi variasi acak +-30% | `10000` |
| `buyMismatchCooldownMs` | Buy: MC di halaman detail tidak masuk range (sidebar glitch) -> coin dilewati selama ini (ms) | `120000` |
| `buyRetryCooldownMs` | Buy: saldo kurang / di bawah minimum order / tombol Buy tidak cocok -> coin dicoba lagi setelah ini (ms) | `60000` |
| `reloadEvery` | Reload halaman paksa tiap N scan | `4` |
| `clickTries` | Percobaan klik icon coin | `3` |
| `clickFailMax` | Coin di-skip otomatis kalau gagal diklik sebanyak ini (selama satu run) | `3` |
| `errPauseMs` | Jeda (ms) setelah halaman fomo bermasalah | `60000` |
| `wait.*` | Waktu tunggu (ms) halaman awal, detail coin, klik, RSI, navigasi | `"detailMs": 5000` |

Sebelum scan, tombol "Show dust (N)" diklik kalau list dust masih tertutup (`selectors.dustButton`).

Urutan keputusan per coin: cut loss (kalau nyala) -> TP / trailing stop -> AD. Satu siklus maksimal satu aksi
(sell atau AD); coin berikutnya dan coin yang sama dicek lagi di siklus berikutnya.

AD hanya untuk coin di `adCoins`. Untuk satu coin yang dipakai baris **paling atas** milik coin itu. Syarat AD:
margin <= `adTrigger`, umur >= `adMinAgeH`, RSI <= `adRsiMax` (kalau dipakai), market cap sekarang (halaman detail)
di antara `mcapMin` dan `mcapMax` baris itu, invested > 0. Nominal buy = invested (1:1).
Setelah AD terbeli (BOUGHT), baris itu otomatis dihapus dari `config/sell-ad.json` (run tidak di-restart) dan
baris berikutnya untuk coin yang sama jadi patokan. Contoh: baris FLOAT 1.5M-2M dipakai dulu; setelah AD terbeli,
patokan pindah ke FLOAT 1M-1.4M. Kalau halaman pengaturan sedang terbuka, muat ulang (refresh) dulu sebelum
mengedit supaya baris yang sudah dihapus bot tidak tersimpan lagi.
Kalau tombol Buy berubah jadi "Insufficient balance" (saldo tidak cukup), AD dibatalkan dan dicatat BUY_SALDO_KURANG.

## Scanner buy (tab 2)
1. Buka halaman awal, klik tab watchlist (`selectors.watchlistTab`), baca semua baris watchlist.
2. Coin yang ada di `config/buy.json -> coins`: market cap dibaca dari sidebar. Kalau di antara `mcapMin` dan `mcapMax`, buka detail coin.
3. Cek ulang market cap di kotak Market cap halaman detail (MC di sidebar kadang glitch). Tidak masuk range -> batal (MCAP_TIDAK_COCOK), coin dilewati selama `buyMismatchCooldownMs` (timing.json).
4. Pilih tab Buy, isi `amount`, cek tombol "Buy <nama>" (minimum order / saldo kurang dicatat dan dilewati).
5. Klik Buy, lalu unstar coin supaya hilang dari watchlist. `dryRun.buy: true` (di `general.json`) hanya melewati klik Buy. Unstar saat dry run diatur `unstarOnDryRun`.
6. Coin yang sudah dibeli (atau dry run) diproses maksimal 1x per run, jadi tidak terbeli dua kali walau unstar gagal. Saldo kurang / minimum order / tombol tidak cocok tidak dikunci: dicoba lagi setelah `buyRetryCooldownMs`.
7. Kalau tidak ada yang dibeli, tab standby di detail coin watchlist yang dipilih acak (`standbyRandom`), lalu menunggu `buyScanIntervalMs` (timing.json) +-30%.

## Log (format sama dengan macro)
- `fomo_positions.csv`: waktu, nama, nominal, margin
- `fomo_sell_log.csv`: waktu, nama, nominal, margin, hasil (DRY_RUN_STOP / SOLD / SELL_GAGAL / MISMATCH / CLICK_GAGAL / SELL_MIN_ORDER)
- `fomo_ad_log.csv`: waktu, nama, umur(jam), rsi, mc sekarang, mc avg entry, invested, hasil (LOLOS / TIDAK_LOLOS:... / DRY_RUN_STOP / BOUGHT / BUY_GAGAL / BUY_MISMATCH / BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / POPUP_MISMATCH), rentang MC baris `adCoins` yang dipakai
- `fomo_buy_log.csv`: waktu, nama, mcap sidebar, mcap detail, mcapMin, mcapMax, nominal, hasil (MCAP_TIDAK_COCOK / DRY_RUN_STOP / DRY_RUN_STOP_UNSTAR_GAGAL / BOUGHT / BOUGHT_UNSTAR_GAGAL / BUY_GAGAL / BUY_MISMATCH / BUY_MIN_ORDER / BUY_SALDO_KURANG / CLICK_GAGAL / DETAIL_MISMATCH)
- `fomo_trail.csv`: waktu, link coin, nama, puncak margin (`RESET` setelah SOLD atau AD BOUGHT). Dipakai trailing stop supaya puncak tetap tersimpan walau run/Chrome di-restart. Hapus file ini untuk reset semua puncak.
