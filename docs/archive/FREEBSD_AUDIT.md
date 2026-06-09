# Audit Deploy FreeBSD SIBERMAS

Tanggal audit: 14 Mei 2026

## Kesimpulan

Repo siap diarahkan ke deploy FreeBSD native yang jauh lebih sederhana. Masalah utama bukan di stack aplikasinya, melainkan di operasional: terlalu banyak jalur deploy, path default tidak konsisten, dan beberapa asumsi FreeBSD belum dibuat otomatis.

Perbaikan yang sudah dibuat:

- menambahkan `deploy-freebsd-simple.sh` sebagai satu perintah deploy/redeploy
- menambahkan `conf/php-fpm.sibermas.conf` untuk memastikan Nginx memakai PHP-FPM socket yang benar
- menyederhanakan `docs/DEPLOY_FREEBSD.md`
- merapikan instruksi `install-freebsd.sh`
- memperjelas komentar env queue: Supervisor memakai Laravel `queue:work`, bukan Horizon

## Temuan

### 1. Path deploy tidak konsisten

Severity: High

Beberapa file memakai `/usr/local/www/apache24/data/Sibermas2026`, sementara jalur atomic dan mode jails memakai `/usr/local/www/sibermas`. Untuk operator, ini rawan deploy ke direktori yang salah jika jalurnya dicampur.

Status: jalur simple sekarang memakai path repo aktual saat script dijalankan. Supervisor dirender dari template dengan mengganti path ke `APP_DIR`.

### 2. Terlalu banyak pilihan untuk deploy pertama

Severity: High

README sebelumnya menonjolkan multi-jails, atomic deploy, remote deploy, dan single-server sekaligus. Itu bagus untuk scale-out, tapi buruk untuk first deploy.

Status: `docs/DEPLOY_FREEBSD.md` sekarang menjadikan single-server native sebagai jalur utama. Jails dan scaling tetap disebut sebagai fase lanjut.

### 3. Nginx mengasumsikan PHP-FPM socket, tapi installer belum memasang pool socket

Severity: High

`nginx-freebsd.conf` memakai `fastcgi_pass unix:/var/run/php-fpm.sock`. Tanpa pool PHP-FPM yang eksplisit, server bisa berakhir memakai default TCP pool dan API menghasilkan 502.

Status: ditambahkan `conf/php-fpm.sibermas.conf`; `deploy-freebsd-simple.sh` memasangnya ke `/usr/local/etc/php-fpm.d/sibermas.conf`.

### 4. Step build Next.js standalone masih manual

Severity: Medium

Next standalone butuh copy `.next/static` dan `public` ke folder standalone. Ini sebelumnya ada di dokumen dan postbuild, tetapi deploy manual tetap mudah lupa.

Status: `deploy-freebsd-simple.sh` membuat folder tujuan dan copy asset secara eksplisit setelah `pnpm build:web`.

### 5. Bootstrap `.env` masih terlalu manual

Severity: Medium

Deploy pertama butuh `APP_KEY`, DB password, blind-index key, admin secret, dan webhook secret. Kalau operator melewatkan satu, app bisa gagal saat migrate atau runtime.

Status: script simple mengisi DB password dari `.db_password.initial`, lalu generate secret lokal yang kosong. Secret eksternal seperti `MASTER_API_TOKEN`, mail, AI, dan Telegram tetap harus diisi operator.

### 6. Dokumentasi `DB_SSLMODE=require` tidak cocok untuk database lokal default

Severity: Medium

Single-server PostgreSQL lokal biasanya belum dikonfigurasi TLS. Memaksa `require` dapat mematahkan koneksi.

Status: template `.env.production.example` memakai `DB_SSLMODE=prefer`. Checklist deploy simple tidak lagi memaksa `require` untuk mode lokal.

### 7. Remote deploy otomatis commit/push ke `main`

Severity: Medium

`remote-deploy.sh` melakukan `git add -A`, commit, dan push ke `main`. Ini praktis, tapi berisiko untuk maintenance produksi karena bisa membawa perubahan lokal yang belum diaudit.

Status: tidak dijadikan jalur utama. Untuk deploy harian, gunakan `git pull` lalu `bash deploy-freebsd-simple.sh` di server.

### 8. Native dependency Node di FreeBSD perlu dibatasi

Severity: Medium

`sharp` dan `canvas` punya native binary yang sering lebih rumit di FreeBSD. Konfigurasi Next sudah mengurangi risiko dengan `images.unoptimized=true`, hoisted pnpm, dan external package handling.

Status: dipertahankan. Deploy simple memakai `TURBO_INSTALL_SKIP_DOWNLOAD=1` dan build langsung via pnpm, bukan binary turbo native.

### 9. Atomic deploy belum selaras dengan config single-server

Severity: Medium

`deploy-atomic.sh` memakai layout `releases/current`, sedangkan config Nginx/Supervisor single-server menunjuk langsung ke app root. Tanpa render config khusus `current`, atomic deploy bisa sukses membangun release tapi service tetap membaca path lain.

Status: atomic deploy tidak dipakai sebagai jalur simple. Kalau nanti ingin zero-downtime, buat profile atomic terpisah yang merender Nginx/Supervisor ke `${APP_DIR}/current`.

### 10. Operational guard sudah cukup membantu

Severity: Low

`scripts/preflight-freebsd.sh` dan `scripts/diagnose-freebsd.sh` sudah bernilai tinggi: cek OS, paket, port, disk, service, build output, DB, Redis, Nginx, Supervisor, dan health endpoint.

Status: tetap dipakai di dokumen deploy utama.

## Jalur Operasional Yang Disarankan

Deploy pertama:

```sh
sh scripts/preflight-freebsd.sh
sh install-freebsd.sh
KKN_SUPERADMIN_PASSWORD='<strong-password-from-secret-manager>' bash deploy-freebsd-simple.sh
```

Redeploy:

```sh
git pull origin main
bash deploy-freebsd-simple.sh
```

Debug:

```sh
sh scripts/diagnose-freebsd.sh
```
