@echo off
rem Build / rebuild fomo-scanner.exe (Node SEA). Double-click atau jalankan dari folder project.
rem Langkah sama dengan docs\build-exe.md. Exe hasilnya di folder ini, file perantara di build\.
setlocal
cd /d "%~dp0"

echo ========================================================
echo  BUILD fomo-scanner.exe
echo ========================================================

where node >nul 2>nul || (echo [GAGAL] Node.js tidak ditemukan. Install Node dulu. & goto :fail)
for /f "delims=" %%v in ('node --version') do echo Node %%v

rem exe yang sedang jalan tidak bisa ditimpa
tasklist /fi "imagename eq fomo-scanner.exe" 2>nul | find /i "fomo-scanner.exe" >nul
if not errorlevel 1 (echo [GAGAL] fomo-scanner.exe sedang jalan. Tutup dulu, lalu build ulang. & goto :fail)

if not exist node_modules\playwright-core (
    echo [1/6] npm install...
    call npm install || goto :fail
) else (
    echo [1/6] node_modules sudah ada
)

if not exist build mkdir build
if not exist build\sea.json (
    echo {"main": "build/bundle.js", "output": "build/sea.blob", "disableExperimentalSEAWarning": true}> build\sea.json
    echo [2/6] build\sea.json dibuat
) else (
    echo [2/6] build\sea.json sudah ada
)

echo [3/6] Hapus hasil build lama
del /q fomo-scanner.exe build\bundle.js build\sea.blob 2>nul

echo [4/6] Bundle kode (esbuild)
where esbuild >nul 2>nul
if errorlevel 1 (
    call npx --yes esbuild src/index.js --bundle --platform=node --external:playwright-core --outfile=build/bundle.js || goto :fail
) else (
    call esbuild src/index.js --bundle --platform=node --external:playwright-core --outfile=build/bundle.js || goto :fail
)

echo [5/6] Buat SEA blob
node --experimental-sea-config build/sea.json || goto :fail

echo [6/6] Buat exe
node -e "require('fs').copyFileSync(process.execPath, 'fomo-scanner.exe')" || goto :fail
call npx --yes postject fomo-scanner.exe NODE_SEA_BLOB build/sea.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 || goto :fail

echo.
echo ========================================================
echo  SELESAI: fomo-scanner.exe
echo  (peringatan "The signature seems corrupted" normal)
echo ========================================================
pause
exit /b 0

:fail
echo.
echo ========================================================
echo  BUILD GAGAL, lihat pesan di atas
echo ========================================================
pause
exit /b 1
