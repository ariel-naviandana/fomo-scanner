BUILD EXE (Windows PowerShell, jalankan di ROOT folder project, bukan di build/)
==========================================================
fomo-scanner.exe dibuat dengan Node SEA: isinya node.exe + kode pw/ yang di-bundle esbuild.
File perantara (bundle .js, .blob) ada di folder build/, exe hasilnya di root.
Node yang dipakai untuk build harus versi yang sama dengan yang ingin dipakai exe-nya.


PERSIAPAN (sekali saja)
-----------------------
node --version
npm install
npm install -g esbuild

Config SEA (build/sea.json) sudah ada di repo. Kalau hilang / clone baru tanpa folder build/,
buat dulu (sekali saja):
New-Item -ItemType Directory build -Force
Set-Content build/sea.json '{ "main": "build/bundle.js", "output": "build/sea.blob", "disableExperimentalSEAWarning": true }'

Setelah itu, build pertama kali dan build ulang pakai perintah yang sama di bawah
(Remove-Item cuma menghapus hasil build lama; kalau belum ada, dilewati tanpa error).


BUILD fomo-scanner.exe
----------------------
Remove-Item fomo-scanner.exe, build\bundle.js, build\sea.blob -ErrorAction SilentlyContinue
esbuild pw/index.js --bundle --platform=node --external:playwright-core --outfile=build/bundle.js
node --experimental-sea-config build/sea.json
node -e "require('fs').copyFileSync(process.execPath, 'fomo-scanner.exe')"
npx postject fomo-scanner.exe NODE_SEA_BLOB build/sea.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

Kebutuhan saat dijalankan (taruh di folder yang sama dengan exe):
  - folder config\ (general.json, sell-ad.json, buy.json, paths.json, timing.json)
  - node_modules\playwright-core   (tidak bisa dimasukkan ke exe, hasil "npm install")
  - Google Chrome terpasang (path di config\general.json -> browser.chromePath)
  - fomo-scanner-login.bat dan fomo-scanner-ui.bat (opsional, untuk double-click)

Pemakaian:
  fomo-scanner.exe          jalankan scanner (sell/AD/buy) sesuai config\general.json
  fomo-scanner.exe login    login ke fomo.family (sekali saja), lalu tutup jendela Chrome
  fomo-scanner.exe ui       buka halaman pengaturan config di browser (127.0.0.1)
  fomo-scanner-login.bat    sama dengan "fomo-scanner.exe login", tinggal double-click
  fomo-scanner-ui.bat       sama dengan "fomo-scanner.exe ui", tinggal double-click


Catatan
-------
- Peringatan "The signature seems corrupted" dari postject normal, exe tetap bisa dipakai.
- Config yang disimpan dari UI langsung dipakai bot: run yang sedang jalan di-restart.
