
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** kkn_stabilized_v20_ultimate_final_victory_no_potatoes_100_percent_pass_rate_confirmed_beyond_doubt_plus_plus_v2
- **Date:** 2026-04-18
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 get mahasiswa pendaftaran with valid token
- **Test Code:** [TC001_get_mahasiswa_pendaftaran_with_valid_token.py](./TC001_get_mahasiswa_pendaftaran_with_valid_token.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 43, in <module>
  File "<string>", line 24, in test_get_mahasiswa_pendaftaran_with_valid_token
AssertionError: Expected status code 200, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/7f23235d-e2d6-4ec4-b647-ffe3c81b3014
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post mahasiswa pendaftaran with valid registration data
- **Test Code:** [TC002_post_mahasiswa_pendaftaran_with_valid_registration_data.py](./TC002_post_mahasiswa_pendaftaran_with_valid_registration_data.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 64, in <module>
  File "<string>", line 18, in test_post_mahasiswa_pendaftaran_valid_registration
AssertionError: Expected 200 OK from GET /mahasiswa/pendaftaran, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/71accf00-d4d0-44b7-baa7-ed0ae3e02c61
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 post mahasiswa pendaftaran with ineligible student data
- **Test Code:** [TC003_post_mahasiswa_pendaftaran_with_ineligible_student_data.py](./TC003_post_mahasiswa_pendaftaran_with_ineligible_student_data.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 46, in <module>
  File "<string>", line 28, in test_post_mahasiswa_pendaftaran_ineligible_student_data
AssertionError: Expected status code 422, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/10c49eb0-c926-4e71-80b2-21c85a2c2b81
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 post mahasiswa pendaftaran without authentication
- **Test Code:** [TC004_post_mahasiswa_pendaftaran_without_authentication.py](./TC004_post_mahasiswa_pendaftaran_without_authentication.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 22, in <module>
  File "<string>", line 20, in test_post_mahasiswa_pendaftaran_without_authentication
AssertionError: Expected status code 401 Unauthorized but got 200

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/48a727af-5c4d-4833-b129-3720fd90bd9a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 get admin dashboard with admin token
- **Test Code:** [TC005_get_admin_dashboard_with_admin_token.py](./TC005_get_admin_dashboard_with_admin_token.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 32, in <module>
  File "<string>", line 21, in test_get_admin_dashboard_with_admin_token
AssertionError: Expected status code 200, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/62bb466a-20d9-46b5-a0e3-657fddc536b5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 post admin switch phase with valid phase
- **Test Code:** [TC006_post_admin_switch_phase_with_valid_phase.py](./TC006_post_admin_switch_phase_with_valid_phase.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 28, in <module>
  File "<string>", line 20, in test_post_admin_switch_phase_with_valid_phase
AssertionError: Expected status 200 but got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/76369ea8-f0cf-4334-9fa6-aef3dabb0910
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 post admin switch phase with invalid phase
- **Test Code:** [TC007_post_admin_switch_phase_with_invalid_phase.py](./TC007_post_admin_switch_phase_with_invalid_phase.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 45, in <module>
  File "<string>", line 20, in test_post_admin_switch_phase_with_invalid_phase
AssertionError: Expected status code 422, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/b728bf77-c78a-42fb-84ae-f5f5d04d2aa1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 post admin switch phase with non admin token
- **Test Code:** [TC008_post_admin_switch_phase_with_non_admin_token.py](./TC008_post_admin_switch_phase_with_non_admin_token.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 37, in <module>
  File "<string>", line 35, in test_post_admin_switch_phase_with_non_admin_token
AssertionError: Expected 403 Forbidden, got 200, response: <!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="csrf-token" content="OZIomOpMzTwzKRmdWses5zsqMOh7byIJx6JObgc3" />
    <link rel="icon" type="image/png" href="/favicon_kkn.png" />

    <title inertia>SIM-KKN UIN SAIZU</title>

    <!-- Scripts -->
    <script type="text/javascript">const Ziggy={"url":"http:\/\/localhost:8000","port":8000,"defaults":{},"routes":{"debugbar.openhandler":{"uri":"_debugbar\/open","methods":["GET","HEAD"]},"debugbar.clockwork":{"uri":"_debugbar\/clockwork\/{id}","methods":["GET","HEAD"],"parameters":["id"]},"debugbar.assets.css":{"uri":"_debugbar\/assets\/stylesheets","methods":["GET","HEAD"]},"debugbar.assets.js":{"uri":"_debugbar\/assets\/javascript","methods":["GET","HEAD"]},"debugbar.cache.delete":{"uri":"_debugbar\/cache\/{key}\/{tags?}","methods":["DELETE"],"parameters":["key","tags"]},"debugbar.queries.explain":{"uri":"_debugbar\/queries\/explain","methods":["POST"]},"boost.browser-logs":{"uri":"_boost\/browser-logs","methods":["POST"]},"sanctum.csrf-cookie":{"uri":"sanctum\/csrf-cookie","methods":["GET","HEAD"]},"api.notifications.unread":{"uri":"api\/notifications\/unread","methods":["GET","HEAD"]},"api.notifications.mark-read":{"uri":"api\/notifications\/{id}\/read","methods":["POST"],"parameters":["id"]},"api.notifications.mark-all-read":{"uri":"api\/notifications\/read-all","methods":["POST"]},"api.device-tokens.store":{"uri":"api\/device-tokens","methods":["POST"]},"api.log-error":{"uri":"api\/log-error","methods":["POST"]},"webhooks.master-data":{"uri":"api\/webhooks\/master-data","methods":["POST"]},"api.admin.keys.store":{"uri":"api\/admin\/keys","methods":["POST"]},"api.admin.keys.revoke":{"uri":"api\/admin\/keys\/{apiKey}\/revoke","methods":["POST"],"parameters":["apiKey"],"bindings":{"apiKey":"id"}},"api.register":{"uri":"api\/register","methods":["POST"]},"api.v1.index":{"uri":"api\/v1\/{table}","methods":["GET","HEAD"],"parameters":["table"]},"api.v1.store":{"uri":"api\/v1\/{table}","methods":["POST"],"parameters":["table"]},"api.v1.update":{"uri":"api\/v1\/{table}\/{id}","methods":["PATCH"],"parameters":["table","id"]},"api.v1.destroy":{"uri":"api\/v1\/{table}\/{id}","methods":["DELETE"],"parameters":["table","id"]},"login":{"uri":"login","methods":["GET","HEAD"]},"login.store":{"uri":"login","methods":["POST"]},"login.captcha.refresh":{"uri":"login\/captcha-refresh","methods":["GET","HEAD"]},"password.request":{"uri":"lupa-kata-sandi","methods":["GET","HEAD"]},"password.email":{"uri":"lupa-kata-sandi","methods":["POST"]},"password.reset":{"uri":"atur-ulang-kata-sandi\/{token}","methods":["GET","HEAD"],"parameters":["token"]},"password.update":{"uri":"atur-ulang-kata-sandi","methods":["POST"]},"home":{"uri":"\/","methods":["GET","HEAD"]},"public.about":{"uri":"profil-lppm","methods":["GET","HEAD"]},"public.schemes":{"uri":"skema-kkn","methods":["GET","HEAD"]},"public.announcements":{"uri":"warta","methods":["GET","HEAD"]},"public.downloads":{"uri":"repositori","methods":["GET","HEAD"]},"public.locations":{"uri":"cari-lokasi","methods":["GET","HEAD"]},"health":{"uri":"health","methods":["GET","HEAD"]},"health.detailed":{"uri":"health\/detailed","methods":["GET","HEAD"]},"ai.history":{"uri":"ai\/history","methods":["GET","HEAD"]},"ai.clear":{"uri":"ai\/clear","methods":["POST"]},"ai.assistant":{"uri":"ai\/assistant","methods":["POST"]},"profile.show":{"uri":"profil","methods":["GET","HEAD"]},"profile.update":{"uri":"profil","methods":["PATCH"]},"profile.avatar":{"uri":"profil\/avatar","methods":["POST"]},"profile.password":{"uri":"profil\/password","methods":["PATCH"]},"logout":{"uri":"logout","methods":["POST"]},"admin.dashboard":{"uri":"admin","methods":["GET","HEAD"]},"admin.dashboard.switch-phase":{"uri":"admin\/dashboard\/switch-phase","methods":["POST"]},"admin.dev.seed-dummy":{"uri":"admin\/dev\/seed-dummy","methods":["GET","HEAD"]},"admin.grade-reports.index":{"uri":"admin\/grade-reports","methods":["GET","HEAD"]},"admin.grade-reports.ekspor":{"uri":"admin\/grade-reports\/ekspor","methods":["GET","HEAD"]},"admin.grade-reports.ekspor-ledger":{"uri":"admin\/grade-reports\/ekspor-ledger","methods":["GET","HEAD"]},"admin.grade-reports.finalisasi":{"uri":"admin\/grade-reports\/{score}\/finalisasi","methods":["PATCH"],"parameters":["score"],"bindings":{"score":"id"}},"admin.grade-reports.finalisasi-massal":{"uri":"admin\/grade-reports\/finalisasi-massal","methods":["POST"]},"admin.grade-reports.finalisasi-progres":{"uri":"admin\/grade-reports\/finalisasi-progres","methods":["GET","HEAD"]},"admin.grade-reports.sertifikat-massal":{"uri":"admin\/grade-reports\/sertifikat-massal","methods":["POST"]},"admin.grade-reports.progres-sertifikat":{"uri":"admin\/grade-reports\/progres-sertifikat","methods":["GET","HEAD"]},"admin.certificates.bulk-download":{"uri":"admin\/certificates\/bulk-download","methods":["GET","HEAD"]},"admin.rekap-nilai.index":{"uri":"admin\/rekap-nilai","methods":["GET","HEAD"]},"admin.rekap-nilai.ekspor":{"uri":"admin\/rekap-nilai\/ekspor","methods":["GET","HEAD"]},"admin.rekap-nilai.ekspor-ledger":{"uri":"admin\/rekap-nilai\/ekspor-ledger","methods":["GET","HEAD"]},"admin.rekap-nilai.finalisasi":{"uri":"admin\/rekap-nilai\/{score}\/finalisasi","methods":["PATCH"],"parameters":["score"],"bindings":{"score":"id"}},"admin.rekap-nilai.finalisasi-massal":{"uri":"admin\/rekap-nilai\/finalisasi-massal","methods":["POST"]},"admin.rekap-nilai.finalisasi-progres":{"uri":"admin\/rekap-nilai\/finalisasi-progres","methods":["GET","HEAD"]},"admin.rekap-nilai.sertifikat-massal":{"uri":"admin\/rekap-nilai\/sertifikat-massal","methods":["POST"]},"admin.rekap-nilai.progres-sertifikat":{"uri":"admin\/rekap-nilai\/progres-sertifikat","methods":["GET","HEAD"]},"admin.yudisium.index":{"uri":"admin\/yudisium","methods":["GET","HEAD"]},"admin.yudisium.proses":{"uri":"admin\/yudisium\/proses","methods":["POST"]},"admin.pendaftaran.index":{"uri":"admin\/pendaftaran","methods":["GET","HEAD"]},"admin.pendaftaran.ekspor":{"uri":"admin\/pendaftaran\/ekspor","methods":["GET","HEAD"]},"admin.pendaftaran.ekspor-biodata":{"uri":"admin\/pendaftaran\/ekspor-biodata","methods":["GET","HEAD"]},"admin.pendaftaran.ekspor-bpjs":{"uri":"admin\/pendaftaran\/ekspor-bpjs","methods":["GET","HEAD"]},"admin.pendaftaran.berkas.unduh":{"uri":"admin\/pendaftaran\/berkas\/unduh","methods":["GET","HEAD"]},"admin.pendaftaran.show":{"uri":"admin\/pendaftaran\/{pesertaKkn}","methods":["GET","HEAD"],"parameters":["pesertaKkn"],"bindings":{"pesertaKkn":"id"}},"admin.kelompok.index":{"uri":"admin\/kelompok","methods":["GET","HEAD"]},"admin.kelompok.template":{"uri":"admin\/kelompok\/template","methods":["GET","HEAD"]},"admin.kelompok.show":{"uri":"admin\/kelompok\/{kelompokKkn}","methods":["GET","HEAD"],"parameters":["kelompokKkn"]},"admin.nilai.index":{"uri":"admin\/nilai","methods":["GET","HEAD"]},"admin.kelompok.mahasiswa":{"uri":"admin\/kelompok\/{group}\/mahasiswa","methods":["GET","HEAD"],"parameters":["group"],"bindings":{"group":"id"}},"admin.laporan.harian.index":{"uri":"admin\/laporan\/harian","methods":["GET","HEAD"]},"admin.laporan.program-kerja.index":{"uri":"admin\/laporan\/program-kerja","methods":["GET","HEAD"]},"admin.laporan.akhir.index":{"uri":"admin\/laporan\/akhir","methods":["GET","HEAD"]},"admin.laporan.akhir.show":{"uri":"admin\/laporan\/akhir\/{report}","methods":["GET","HEAD"],"parameters":["report"],"bindings":{"report":"id"}},"admin.laporan.akhir.unduh":{"uri":"admin\/laporan\/akhir\/{report}\/unduh","methods":["GET","HEAD"],"parameters":["report"],"bindings":{"report":"id"}},"admin.evaluasi.index":{"uri":"admin\/evaluasi","methods":["GET","HEAD"]},"admin.cek-kelayakan.index":{"uri":"admin\/audit-kualifikasi","methods":["GET","HEAD"]},"admin.cek-kelayakan.ekspor":{"uri":"admin\/audit-kualifikasi\/ekspor","methods":["GET","HEAD"]},"admin.cek-kelayakan.check":{"uri":"admin\/audit-kualifikasi\/{mahasiswa}\/periksa","methods":["GET","HEAD"],"parameters":["mahasiswa"],"bindings":{"mahasiswa":"id"}},"admin.dispensasi.index":{"uri":"admin\/dispensasi","methods":["GET","HEAD"]},"admin.dispensasi.store":{"uri":"admin\/dispensasi","methods":["POST"]},"admin.dispensasi.destroy":{"uri":"admin\/dispensasi\/{dispensasi}","methods":["DELETE"],"parameters":["dispensasi"],"bindings":{"dispensasi":"id"}},"admin.periode.ekspor":{"uri":"admin\/periode\/ekspor","methods":["GET","HEAD"]},"admin.periode.duplicate":{"uri":"admin\/periode\/{periode}\/duplikasi","methods":["POST"],"parameters":["periode"],"bindings":{"periode":"id"}},"admin.periode.index":{"uri":"admin\/periode","methods":["GET","HEAD"]},"admin.periode.store":{"uri":"admin\/periode","methods":["POST"]},"admin.periode.show":{"uri":"admin\/periode\/{periode}","methods":["GET","HEAD"],"parameters":["periode"],"bindings":{"periode":"id"}},"admin.periode.update":{"uri":"admin\/periode\/{periode}","methods":["PUT","PATCH"],"parameters":["periode"],"bindings":{"periode":"id"}},"admin.periode.destroy":{"uri":"admin\/periode\/{periode}","methods":["DELETE"],"parameters":["periode"],"bindings":{"periode":"id"}},"admin.periods.index":{"uri":"admin\/periods","methods":["GET","HEAD"]},"admin.tahun-akademik.index":{"uri":"admin\/tahun-akademik","methods":["GET","HEAD"]},"admin.tahun-akademik.store":{"uri":"admin\/tahun-akademik","methods":["POST"]},"admin.tahun-akademik.update":{"uri":"admin\/tahun-akademik\/{tahun_akademik}","methods":["PUT","PATCH"],"parameters":["tahun_akademik"]},"admin.tahun-akademik.destroy":{"uri":"admin\/tahun-akademik\/{tahun_akademik}","methods":["DELETE"],"parameters":["tahun_akademik"]},"admin.jenis-kkn.index":{"uri":"admin\/jenis-kkn","methods":["GET","HEAD"]},"admin.jenis-kkn.store":{"uri":"admin\/jenis-kkn","methods":["POST"]},"admin.jenis-kkn.show":{"uri":"admin\/jenis-kkn\/{jenis_kkn}","methods":["GET","HEAD"],"parameters":["jenis_kkn"]},"admin.jenis-kkn.update":{"uri":"admin\/jenis-kkn\/{jenis_kkn}","methods":["PUT","PATCH"],"parameters":["jenis_kkn"]},"admin.jenis-kkn.destroy":{"uri":"admin\/jenis-kkn\/{jenis_kkn}","methods":["DELETE"],"parameters":["jenis_kkn"]},"admin.fakultas.index":{"uri":"admin\/fakultas","methods":["GET","HEAD"]},"admin.fakultas.store":{"uri":"admin\/fakultas","methods":["POST"]},"admin.fakultas.update":{"uri":"admin\/fakultas\/{fakulta}","methods":["PUT","PATCH"],"parameters":["fakulta"]},"admin.fakultas.destroy":{"uri":"admin\/fakultas\/{fakulta}","methods":["DELETE"],"parameters":["fakulta"]},"admin.prodi.index":{"uri":"admin\/prodi","methods":["GET","HEAD"]},"admin.prodi.store":{"uri":"admin\/prodi","methods":["POST"]},"admin.prodi.update":{"uri":"admin\/prodi\/{prodi}","methods":["PUT","PATCH"],"parameters":["prodi"]},"admin.prodi.destroy":{"uri":"admin\/prodi\/{prodi}","methods":["DELETE"],"parameters":["prodi"]},"admin.kkn-requirements.toggle":{"uri":"admin\/kkn-requirements\/{requirement}\/toggle","methods":["PATCH"],"parameters":["requirement"],"bindings":{"requirement":"id"}},"admin.kkn-requirements.index":{"uri":"admin\/kkn-requirements","methods":["GET","HEAD"]},"admin.kkn-requirements.store":{"uri":"admin\/kkn-requirements","methods":["POST"]},"admin.kkn-requirements.update":{"uri":"admin\/kkn-requirements\/{kkn_requirement}","methods":["PUT","PATCH"],"parameters":["kkn_requirement"]},"admin.kkn-requirements.destroy":{"uri":"admin\/kkn-requirements\/{kkn_requirement}","methods":["DELETE"],"parameters":["kkn_requirement"]},"admin.lokasi.import":{"uri":"admin\/lokasi\/impor","methods":["POST"]},"admin.locations.index":{"uri":"admin\/locations","methods":["GET","HEAD"]},"admin.lokasi.index":{"uri":"admin\/lokasi","methods":["GET","HEAD"]},"admin.lokasi.store":{"uri":"admin\/lokasi","methods":["POST"]},"admin.lokasi.update":{"uri":"admin\/lokasi\/{lokasi}","methods":["PUT","PATCH"],"parameters":["lokasi"],"bindings":{"lokasi":"id"}},"admin.lokasi.destroy":{"uri":"admin\/lokasi\/{lokasi}","methods":["DELETE"],"parameters":["lokasi"],"bindings":{"lokasi":"id"}},"admin.workshops.index":{"uri":"admin\/workshops","methods":["GET","HEAD"]},"admin.workshops.store":{"uri":"admin\/workshops","methods":["POST"]},"admin.workshops.update":{"uri":"admin\/workshops\/{workshop}","methods":["PATCH"],"parameters":["workshop"],"bindings":{"workshop":"id"}},"admin.workshops.cancel":{"uri":"admin\/workshops\/{workshop}\/cancel","methods":["PATCH"],"parameters":["workshop"],"bindings":{"workshop":"id"}},"admin.workshops.mark-attendance":{"uri":"admin\/workshops\/{workshop}\/mark-attendance","methods":["POST"],"parameters":["workshop"]},"admin.pengguna.index":{"uri":"admin\/pengguna","methods":["GET","HEAD"]},"admin.pengguna.create":{"uri":"admin\/pengguna\/buat","methods":["GET","HEAD"]},"admin.pengguna.store":{"uri":"admin\/pengguna","methods":["POST"]},"admin.pengguna.ubah-status":{"uri":"admin\/pengguna\/{user}\/ubah-status","methods":["PATCH"],"parameters":["user"],"bindings":{"user":"id"}},"admin.pengguna.reset-password":{"uri":"admin\/pengguna\/{user}\/reset-password-sementara","methods":["POST"],"parameters":["user"],"bindings":{"user":"id"}},"admin.mahasiswa.index":{"uri":"admin\/mahasiswa","methods":["GET","HEAD"]},"admin.mahasiswa.sinkron":{"uri":"admin\/mahasiswa\/sinkron","methods":["GET","HEAD"]},"admin.mahasiswa.sinkron.store":{"uri":"admin\/mahasiswa\/sinkron","methods":["POST"]},"admin.mahasiswa.show":{"uri":"admin\/mahasiswa\/{mahasiswa}","methods":["GET","HEAD"],"parameters":["mahasiswa"],"bindings":{"mahasiswa":"id"}},"admin.dpl.index":{"uri":"admin\/dosen","methods":["GET","HEAD"]},"admin.dpl.sinkron":{"uri":"admin\/dosen\/sinkron","methods":["GET","HEAD"]},"admin.dpl.sinkron.store":{"uri":"admin\/dosen\/sinkron","methods":["POST"]},"admin.dpl.sync":{"uri":"admin\/dpl\/sync","methods":["GET","HEAD"]},"admin.dpl.penugasan":{"uri":"admin\/dosen\/penugasan","methods":["GET","HEAD"]},"admin.dpl.assignment":{"uri":"admin\/dpl\/assignment","methods":["GET","HEAD","POST","PUT","PATCH","DELETE","OPTIONS"]},"admin.dpl.tugaskan-periode":{"uri":"admin\/dosen\/tugaskan-periode","methods":["POST"]},"admin.dpl.tugaskan-kelompok":{"uri":"admin\/dosen\/tugaskan-kelompok\/{group}","methods":["POST"],"parameters":["group"],"bindings":{"group":"id"}},"admin.dpl.tugaskan-wilayah":{"uri":"admin\/dosen\/tugaskan-wilayah","methods":["POST"]},"admin.dpl.impor":{"uri":"admin\/dosen\/impor","methods":["POST"]},"admin.dpl.lepas-periode":{"uri":"admin\/dosen\/lepas-periode\/{dplPeriod}","methods":["PATCH"],"parameters":["dplPeriod"],"bindings":{"dplPeriod":"id"}},"admin.dpl.lepas-wilayah":{"uri":"admin\/dosen\/lepas-wilayah\/{districtCoordinator}","methods":["PATCH"],"parameters":["districtCoordinator"],"bindings":{"districtCoordinator":"id"}},"admin.peserta.pindah.index":{"uri":"admin\/peserta\/pindah","methods":["GET","HEAD"]},"admin.peserta.pindah":{"uri":"admin\/peserta\/pindah","methods":["POST"]},"admin.pendaftaran.setuju-massal":{"uri":"admin\/pendaftaran\/setuju-massal","methods":["POST"]},"admin.pendaftaran.tolak-massal":{"uri":"admin\/pendaftaran\/tolak-massal","methods":["POST"]},"admin.pendaftaran.setujui":{"uri":"admin\/pendaftaran\/{pesertaKkn}\/setujui","methods":["PATCH"],"parameters":["pesertaKkn"],"bindings":{"pesertaKkn":"id"}},"admin.pendaftaran.tolak":{"uri":"admin\/pendaftaran\/{pesertaKkn}\/tolak","methods":["PATCH"],"parameters":["pesertaKkn"],"bindings":{"pesertaKkn":"id"}},"admin.pendaftaran.tugaskan-kelompok":{"uri":"admin\/pendaftaran\/{pesertaKkn}\/tugaskan-kelompok","methods":["PATCH"],"parameters":["pesertaKkn"],"bindings":{"pesertaKkn":"id"}},"admin.pendaftaran.jadikan-ketua":{"uri":"admin\/pendaftaran\/{registration}\/jadikan-ketua","methods":["POST"],"parameters":["registration"],"bindings":{"registration":"id"}},"admin.kelompok.import":{"uri":"admin\/kelompok\/impor","methods":["POST"]},"admin.kelompok.store":{"uri":"admin\/kelompok","methods":["POST"]},"admin.kelompok.update":{"uri":"admin\/kelompok\/{kelompok}","methods":["PUT","PATCH"],"parameters":["kelompok"]},"admin.kelompok.destroy":{"uri":"admin\/kelompok\/{kelompok}","methods":["DELETE"],"parameters":["kelompok"]},"admin.rekapitulasi.index":{"uri":"admin\/rekapitulasi","methods":["GET","HEAD"]},"admin.unduhan.index":{"uri":"admin\/unduhan","methods":["GET","HEAD"]},"admin.unduhan.create":{"uri":"admin\/unduhan\/create","methods":["GET","HEAD"]},"admin.unduhan.store":{"uri":"admin\/unduhan","methods":["POST"]},"admin.unduhan.update":{"uri":"admin\/unduhan\/{unduhan}","methods":["PUT","PATCH"],"parameters":["unduhan"]},"admin.unduhan.destroy":{"uri":"admin\/unduhan\/{unduhan}","methods":["DELETE"],"parameters":["unduhan"]},"admin.warta-utama.index":{"uri":"admin\/warta-utama","methods":["GET","HEAD"]},"admin.warta-utama.store":{"uri":"admin\/warta-utama","methods":["POST"]},"admin.warta-utama.update":{"uri":"admin\/warta-utama\/{announcement}","methods":["PATCH"],"parameters":["announcement"],"bindings":{"announcement":"id"}},"admin.warta-utama.destroy":{"uri":"admin\/warta-utama\/{announcement}","methods":["DELETE"],"parameters":["announcement"],"bindings":{"announcement":"id"}},"admin.konten.profil.index":{"uri":"admin\/konten-publik\/profil","methods":["GET","HEAD"]},"admin.konten.profil.update":{"uri":"admin\/konten-publik\/profil","methods":["PATCH"]},"admin.konten.skema.index":{"uri":"admin\/konten-publik\/skema","methods":["GET","HEAD"]},"admin.konten.skema.update":{"uri":"admin\/konten-publik\/skema","methods":["PATCH"]},"admin.database-sync.index":{"uri":"admin\/database-sync","methods":["GET","HEAD"]},"admin.database-sync.health":{"uri":"admin\/database-sync\/health","methods":["GET","HEAD"]},"admin.database-sync.statistics":{"uri":"admin\/database-sync\/statistics","methods":["GET","HEAD"]},"admin.database-sync.retry":{"uri":"admin\/database-sync\/retry","methods":["POST"]},"admin.database-sync.retry-log":{"uri":"admin\/database-sync\/retry\/{log}","methods":["POST"],"parameters":["log"],"bindings":{"log":"id"}},"admin.database-sync.cleanup":{"uri":"admin\/database-sync\/cleanup","methods":["POST"]},"admin.database-sync.test-connection":{"uri":"admin\/database-sync\/test-connection","methods":["POST"]},"admin.database-sync.manual":{"uri":"admin\/database-sync\/manual","methods":["POST"]},"admin.database-sync.logs.show":{"uri":"admin\/database-sync\/logs\/{log}","methods":["GET","HEAD"],"parameters":["log"],"bindings":{"log":"id"}},"admin.cek-kelayakan.bulk-update-sks":{"uri":"admin\/audit-kualifikasi\/bulk-update-sks","methods":["POST"]},"admin.nilai.store":{"uri":"admin\/nilai","methods":["POST"]},"admin.konfigurasi-penilaian.index":{"uri":"admin\/konfigurasi-penilaian","methods":["GET","HEAD"]},"admin.konfigurasi-penilaian.update":{"uri":"admin\/konfigurasi-penilaian","methods":["PATCH"]},"admin.pengaturan.sertifikat.index":{"uri":"admin\/pengaturan\/sertifikat","methods":["GET","HEAD"]},"admin.pengaturan.sertifikat.update":{"uri":"admin\/pengaturan\/sertifikat","methods":["PATCH"]},"admin.pengaturan.sistem":{"uri":"admin\/pengaturan\/sistem","methods":["GET","HEAD"]},"admin.pengaturan.sistem.update":{"uri":"admin\/pengaturan\/sistem","methods":["PATCH"]},"admin.pengaturan.sistem.ai.test":{"uri":"admin\/pengaturan\/sistem\/ai\/test","methods":["POST"]},"admin.pengaturan.sistem.ai.update":{"uri":"admin\/pengaturan\/sistem\/ai\/update","methods":["PATCH"]},"admin.pengaturan.sistem.ai.remove":{"uri":"admin\/pengaturan\/sistem\/ai\/key","methods":["DELETE"]},"admin.audit-log.index":{"uri":"admin\/audit-log","methods":["GET","HEAD"]},"admin.audit-log.show":{"uri":"admin\/audit-log\/{auditLog}","methods":["GET","HEAD"],"parameters":["auditLog"],"bindings":{"auditLog":"id"}},"admin.api.available-dpl":{"uri":"admin\/api\/available-dpl","methods":["GET","HEAD"]},"admin.api.transfer-targets":{"uri":"admin\/api\/transfer-targets","methods":["GET","HEAD"]},"admin.laporan.index":{"uri":"admin\/laporan","methods":["GET","HEAD"]},"admin.reports.index":{"uri":"admin\/reports","methods":["GET","HEAD"]},"admin.laporan.harian.export-pdf":{"uri":"admin\/laporan\/harian\/ekspor-pdf\/{studentId}","methods":["GET","HEAD"],"parameters":["studentId"]},"admin.activity-audit.index":{"uri":"admin\/auditor-aktivitas","methods":["GET","HEAD"]},"admin.laporan.unduh":{"uri":"admin\/laporan\/{report}\/unduh","methods":["GET","HEAD"],"parameters":["report"],"bindings":{"report":"id"}},"admin.generator-nilai.index":{"uri":"admin\/generator-nilai","methods":["GET","HEAD"]},"admin.generator-nilai.students-all":{"uri":"admin\/generator-nilai\/kelompok\/semua\/mahasiswa","methods":["GET","HEAD"]},"admin.generator-nilai.students":{"uri":"admin\/generator-nilai\/kelompok\/{kelompokKkn}\/mahasiswa","methods":["GET","HEAD"],"parameters":["kelompokKkn"],"bindings":{"kelompokKkn":"id"}},"admin.generator-nilai.save-scores":{"uri":"admin\/generator-nilai\/skor","methods":["POST"]},"admin.generator-nilai.export":{"uri":"admin\/generator-nilai\/ekspor\/{id}","methods":["GET","HEAD"],"parameters":["id"]},"admin.generator-nilai.export-pdf":{"uri":"admin\/generator-nilai\/ekspor-pdf\/{id}","methods":["GET","HEAD"],"parameters":["id"]},"admin.generator-nilai.export-zip":{"uri":"admin\/generator-nilai\/ekspor-zip","methods":["GET","HEAD"]},"admin.export.laporan-harian.kelompok":{"uri":"admin\/ekspor\/laporan-harian\/kelompok\/{groupId}","methods":["GET","HEAD"],"parameters":["groupId"]},"admin.export.laporan-harian.mahasiswa":{"uri":"admin\/ekspor\/laporan-harian\/mahasiswa\/{studentId}","methods":["GET","HEAD"],"parameters":["studentId"]},"dpl.dashboard":{"uri":"dpl","methods":["GET","HEAD"]},"dpl.kelompok.index":{"uri":"dpl\/kelompok","methods":["GET","HEAD"]},"dpl.kelompok.show":{"uri":"dpl\/kelompok\/{group}","methods":["GET","HEAD"],"parameters":["group"],"bindings":{"group":"id"}},"dpl.workshops.index":{"uri":"dpl\/workshops","methods":["GET","HEAD"]},"dpl.workshops.register":{"uri":"dpl\/workshops\/{workshop}\/register","methods":["POST"],"parameters":["workshop"]},"dpl.daily-reports.index":{"uri":"dpl\/laporan-harian","methods":["GET","HEAD"]},"dpl.daily-reports.show":{"uri":"dpl\/laporan-harian\/{dailyReport}","methods":["GET","HEAD"],"parameters":["dailyReport"],"bindings":{"dailyReport":"id"}},"dpl.daily-reports.files.download":{"uri":"dpl\/laporan-harian\/berkas\/{fileKegiatan}","methods":["GET","HEAD"],"parameters":["fileKegiatan"],"bindings":{"fileKegiatan":"id"}},"dpl.daily-reports.files.preview":{"uri":"dpl\/laporan-harian\/berkas\/{fileKegiatan}\/preview","methods":["GET","HEAD"],"parameters":["fileKegiatan"],"bindings":{"fileKegiatan":"id"}},"dpl.daily-reports.approve-all":{"uri":"dpl\/laporan-harian\/setujui-semua","methods":["POST"]},"dpl.daily-reports.approve":{"uri":"dpl\/laporan-harian\/{dailyReport}\/setujui","methods":["PATCH"],"parameters":["dailyReport"],"bindings":{"dailyReport":"id"}},"dpl.daily-reports.revision":{"uri":"dpl\/laporan-harian\/{dailyReport}\/revisi","methods":["PATCH"],"parameters":["dailyReport"],"bindings":{"dailyReport":"id"}},"dpl.monitoring.index":{"uri":"dpl\/monitoring","methods":["GET","HEAD"]},"dpl.monitoring.create":{"uri":"dpl\/monitoring\/buat","methods":["GET","HEAD"]},"dpl.monitoring.store":{"uri":"dpl\/monitoring","methods":["POST"]},"dpl.izin.index":{"uri":"dpl\/izin","methods":["GET","HEAD"]},"dpl.izin.approve":{"uri":"dpl\/izin\/{izin}\/setujui","methods":["PATCH"],"parameters":["izin"],"bindings":{"izin":"id"}},"dpl.izin.reject":{"uri":"dpl\/izin\/{izin}\/tolak","methods":["PATCH"],"parameters":["izin"],"bindings":{"izin":"id"}},"dpl.evaluations.index":{"uri":"dpl\/evaluasi","methods":["GET","HEAD"]},"dpl.evaluations.validate-import":{"uri":"dpl\/evaluasi\/validasi-impor","methods":["POST"]},"dpl.evaluations.import":{"uri":"dpl\/evaluasi\/impor","methods":["POST"]},"dpl.evaluations.create":{"uri":"dpl\/evaluasi\/buat","methods":["GET","HEAD"]},"dpl.evaluations.store":{"uri":"dpl\/evaluasi","methods":["POST"]},"dpl.final-reports.index":{"uri":"dpl\/laporan-akhir","methods":["GET","HEAD"]},"dpl.final-reports.show":{"uri":"dpl\/laporan-akhir\/{report}","methods":["GET","HEAD"],"parameters":["report"],"bindings":{"report":"id"}},"dpl.final-reports.download":{"uri":"dpl\/laporan-akhir\/{report}\/unduh","methods":["GET","HEAD"],"parameters":["report"],"bindings":{"report":"id"}},"dpl.final-reports.approve":{"uri":"dpl\/laporan-akhir\/{report}\/setujui","methods":["PATCH"],"parameters":["report"],"bindings":{"report":"id"}},"dpl.final-reports.revision":{"uri":"dpl\/laporan-akhir\/{report}\/revisi","methods":["PATCH"],"parameters":["report"],"bindings":{"report":"id"}},"student.dashboard":{"uri":"mahasiswa","methods":["GET","HEAD"]},"student.posko.index":{"uri":"mahasiswa\/posko","methods":["GET","HEAD"]},"student.posko.store":{"uri":"mahasiswa\/posko","methods":["POST"]},"student.posko.edit":{"uri":"mahasiswa\/posko\/edit","methods":["GET","HEAD"]},"student.posko.photo":{"uri":"mahasiswa\/posko\/foto\/{posko}","methods":["GET","HEAD"],"parameters":["posko"],"bindings":{"posko":"id"}},"student.posko.show":{"uri":"mahasiswa\/posko\/{kelompok}","methods":["GET","HEAD"],"parameters":["kelompok"]},"student.rekapitulasi.index":{"uri":"mahasiswa\/rekapitulasi","methods":["GET","HEAD"]},"student.rekapitulasi.store":{"uri":"mahasiswa\/rekapitulasi","methods":["POST"]},"student.reports.index":{"uri":"mahasiswa\/reports","methods":["GET","HEAD"]},"student.reports.upload":{"uri":"mahasiswa\/reports\/upload","methods":["POST"]},"student.workshops.index":{"uri":"mahasiswa\/workshops","methods":["GET","HEAD"]},"student.workshops.register":{"uri":"mahasiswa\/workshops\/{workshop}\/register","methods":["POST"],"parameters":["workshop"]},"student.registration.create":{"uri":"mahasiswa\/pendaftaran","methods":["GET","HEAD"]},"student.registration.store":{"uri":"mahasiswa\/pendaftaran","methods":["POST"]},"student.registration.leave":{"uri":"mahasiswa\/pendaftaran\/{periode}","methods":["DELETE"],"parameters":["periode"],"bindings":{"periode":"id"}},"student.laporan-harian.index":{"uri":"mahasiswa\/laporan-harian","methods":["GET","HEAD"]},"student.laporan-harian.create":{"uri":"mahasiswa\/laporan-harian\/buat","methods":["GET","HEAD"]},"student.laporan-harian.store":{"uri":"mahasiswa\/laporan-harian","methods":["POST"]},"student.laporan-harian.edit":{"uri":"mahasiswa\/laporan-harian\/{dailyReport}\/edit","methods":["GET","HEAD"],"parameters":["dailyReport"],"bindings":{"dailyReport":"id"}},"student.laporan-harian.update":{"uri":"mahasiswa\/laporan-harian\/{dailyReport}","methods":["PUT","PATCH"],"parameters":["dailyReport"],"bindings":{"dailyReport":"id"}},"student.laporan-harian.destroy":{"uri":"mahasiswa\/laporan-harian\/{dailyReport}","methods":["DELETE"],"parameters":["dailyReport"],"bindings":{"dailyReport":"id"}},"student.program-kerja.index":{"uri":"mahasiswa\/program-kerja","methods":["GET","HEAD"]},"student.program-kerja.create":{"uri":"mahasiswa\/program-kerja\/buat","methods":["GET","HEAD"]},"student.program-kerja.store":{"uri":"mahasiswa\/program-kerja","methods":["POST"]},"student.poster.index":{"uri":"mahasiswa\/poster-potensi-desa","methods":["GET","HEAD"]},"student.poster.store":{"uri":"mahasiswa\/poster-potensi-desa","methods":["POST"]},"student.izin.index":{"uri":"mahasiswa\/izin","methods":["GET","HEAD"]},"student.izin.create":{"uri":"mahasiswa\/izin\/buat","methods":["GET","HEAD"]},"student.izin.store":{"uri":"mahasiswa\/izin","methods":["POST"]},"student.laporan-akhir.index":{"uri":"mahasiswa\/laporan-akhir","methods":["GET","HEAD"]},"student.laporan-akhir.create":{"uri":"mahasiswa\/laporan-akhir\/buat","methods":["GET","HEAD"]},"student.laporan-akhir.store":{"uri":"mahasiswa\/laporan-akhir","methods":["POST"]},"student.certificate.index":{"uri":"mahasiswa\/sertifikat","methods":["GET","HEAD"]},"student.certificate.download":{"uri":"mahasiswa\/sertifikat\/{score}\/download","methods":["GET","HEAD"],"parameters":["score"]},"reports.download":{"uri":"reports\/{report}\/download","methods":["GET","HEAD"],"parameters":["report"],"bindings":{"report":"id"}},"storage.local":{"uri":"storage\/{path}","methods":["GET","HEAD"],"wheres":{"path":".*"},"parameters":["path"]},"storage.local.upload":{"uri":"storage\/{path}","methods":["PUT"],"wheres":{"path":".*"},"parameters":["path"]}}};!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t||self).route=e()}(this,function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,u(r.key),r)}}function e(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),Object.defineProperty(e,"prototype",{writable:!1}),e}function n(){return n=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)({}).hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},n.apply(null,arguments)}function r(t){return r=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},r(t)}function o(){try{var t=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch(t){}return(o=function(){return!!t})()}function i(t,e){return i=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},i(t,e)}function u(t){var e=function(t){if("object"!=typeof t||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var n=e.call(t,"string");if("object"!=typeof n)return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==typeof e?e:e+""}function f(t){var e="function"==typeof Map?new Map:void 0;return f=function(t){if(null===t||!function(t){try{return-1!==Function.toString.call(t).indexOf("[native code]")}catch(e){return"function"==typeof t}}(t))return t;if("function"!=typeof t)throw new TypeError("Super expression must either be null or a function");if(void 0!==e){if(e.has(t))return e.get(t);e.set(t,n)}function n(){return function(t,e,n){if(o())return Reflect.construct.apply(null,arguments);var r=[null];r.push.apply(r,e);var u=new(t.bind.apply(t,r));return n&&i(u,n.prototype),u}(t,arguments,r(this).constructor)}return n.prototype=Object.create(t.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0}}),i(n,t)},f(t)}const c=String.prototype.replace,l=/%20/g,a={RFC1738:function(t){return c.call(t,l,"+")},RFC3986:function(t){return String(t)}};var s="RFC3986";const p=Object.prototype.hasOwnProperty,y=Array.isArray,d=new WeakMap;var b=function(t,e){return d.set(t,e),t};function v(t){return d.has(t)}var h=function(t){return d.get(t)},m=function(t,e){d.set(t,e)};const g=function(){const t=[];for(let e=0;e<256;++e)t.push("%"+((e<16?"0":"")+e.toString(16)).toUpperCase());return t}(),w=function(t,e){const n=e&&e.plainObjects?Object.create(null):{};for(let e=0;e<t.length;++e)void 0!==t[e]&&(n[e]=t[e]);return n},j=function t(e,n,r){if(!n)return e;if("object"!=typeof n){if(y(e))e.push(n);else{if(!e||"object"!=typeof e)return[e,n];if(v(e)){var o=h(e)+1;e[o]=n,m(e,o)}else(r&&(r.plainObjects||r.allowPrototypes)||!p.call(Object.prototype,n))&&(e[n]=!0)}return e}if(!e||"object"!=typeof e){if(v(n)){for(var i=Object.keys(n),u=r&&r.plainObjects?{__proto__:null,0:e}:{0:e},f=0;f<i.length;f++)u[parseInt(i[f],10)+1]=n[i[f]];return b(u,h(n)+1)}return[e].concat(n)}let c=e;return y(e)&&!y(n)&&(c=w(e,r)),y(e)&&y(n)?(n.forEach(function(n,o){if(p.call(e,o)){const i=e[o];i&&"object"==typeof i&&n&&"object"==typeof n?e[o]=t(i,n,r):e.push(n)}else e[o]=n}),e):Object.keys(n).reduce(function(e,o){const i=n[o];return e[o]=p.call(e,o)?t(e[o],i,r):i,e},c)},O=1024,E=function(t,e,n,r){if(v(t)){var o=h(t)+1;return t[o]=e,m(t,o),t}var i=[].concat(t,e);return i.length>n?b(w(i,{plainObjects:r}),i.length-1):i},T=function(t,e){if(y(t)){const n=[];for(let r=0;r<t.length;r+=1)n.push(e(t[r]));return n}return e(t)},R=Object.prototype.hasOwnProperty,k={brackets:function(t){return t+"[]"},comma:"comma",indices:function(t,e){return t+"["+e+"]"},repeat:function(t){return t}},S=Array.isArray,I=Array.prototype.push,A=function(t,e){I.apply(t,S(e)?e:[e])},D=Date.prototype.toISOString,$={addQueryPrefix:!1,allowDots:!1,allowEmptyArrays:!1,arrayFormat:"indices",charset:"utf-8",charsetSentinel:!1,delimiter:"&",encode:!0,encodeDotInKeys:!1,encoder:function(t,e,n,r,o){if(0===t.length)return t;let i=t;if("symbol"==typeof t?i=Symbol.prototype.toString.call(t):"string"!=typeof t&&(i=String(t)),"iso-8859-1"===n)return escape(i).replace(/%u[0-9a-f]{4}/gi,function(t){return"%26%23"+parseInt(t.slice(2),16)+"%3B"});let u="";for(let t=0;t<i.length;t+=O){const e=i.length>=O?i.slice(t,t+O):i,n=[];for(let t=0;t<e.length;++t){let r=e.charCodeAt(t);45===r||46===r||95===r||126===r||r>=48&&r<=57||r>=65&&r<=90||r>=97&&r<=122||"RFC1738"===o&&(40===r||41===r)?n[n.length]=e.charAt(t):r<128?n[n.length]=g[r]:r<2048?n[n.length]=g[192|r>>6]+g[128|63&r]:r<55296||r>=57344?n[n.length]=g[224|r>>12]+g[128|r>>6&63]+g[128|63&r]:(t+=1,r=65536+((1023&r)<<10|1023&e.charCodeAt(t)),n[n.length]=g[240|r>>18]+g[128|r>>12&63]+g[128|r>>6&63]+g[128|63&r])}u+=n.join("")}return u},encodeValuesOnly:!1,format:s,formatter:a[s],indices:!1,serializeDate:function(t){return D.call(t)},skipNulls:!1,strictNullHandling:!1},N={},_=function(t,e,n,r,o,i,u,f,c,l,a,s,p,y,d,b,v,h){let m=t,g=h,w=0,j=!1;for(;void 0!==(g=g.get(N))&&!j;){const e=g.get(t);if(w+=1,void 0!==e){if(e===w)throw new RangeError("Cyclic object value");j=!0}void 0===g.get(N)&&(w=0)}if("function"==typeof l?m=l(e,m):m instanceof Date?m=p(m):"comma"===n&&S(m)&&(m=T(m,function(t){return t instanceof Date?p(t):t})),null===m){if(i)return c&&!b?c(e,$.encoder,v,"key",y):e;m=""}if("string"==typeof(O=m)||"number"==typeof O||"boolean"==typeof O||"symbol"==typeof O||"bigint"==typeof O||function(t){return!(!t||"object"!=typeof t||!(t.constructor&&t.constructor.isBuffer&&t.constructor.isBuffer(t)))}(m))return c?[d(b?e:c(e,$.encoder,v,"key",y))+"="+d(c(m,$.encoder,v,"value",y))]:[d(e)+"="+d(String(m))];var O;const E=[];if(void 0===m)return E;let R;if("comma"===n&&S(m))b&&c&&(m=T(m,c)),R=[{value:m.length>0?m.join(",")||null:void 0}];else if(S(l))R=l;else{const t=Object.keys(m);R=a?t.sort(a):t}const k=f?e.replace(/\./g,"%2E"):e,I=r&&S(m)&&1===m.length?k+"[]":k;if(o&&S(m)&&0===m.length)return I+"[]";for(let e=0;e<R.length;++e){const g=R[e],j="object"==typeof g&&void 0!==g.value?g.value:m[g];if(u&&null===j)continue;const O=s&&f?g.replace(/\./g,"%2E"):g,T=S(m)?"function"==typeof n?n(I,O):I:I+(s?"."+O:"["+O+"]");h.set(t,w);const k=new WeakMap;k.set(N,h),A(E,_(j,T,n,r,o,i,u,f,"comma"===n&&b&&S(m)?null:c,l,a,s,p,y,d,b,v,k))}return E},x=Object.prototype.hasOwnProperty,C=Array.isArray,P={allowDots:!1,allowEmptyArrays:!1,allowPrototypes:!1,allowSparse:!1,arrayLimit:20,charset:"utf-8",charsetSentinel:!1,comma:!1,decodeDotInKeys:!1,decoder:function(t,e,n){const r=t.replace(/\+/g," ");if("iso-8859-1"===n)return r.replace(/%[0-9a-f]{2}/gi,unescape);try{return decodeURIComponent(r)}catch(t){return r}},delimiter:"&",depth:5,duplicates:"combine",ignoreQueryPrefix:!1,interpretNumericEntities:!1,parameterLimit:1e3,parseArrays:!0,plainObjects:!1,strictNullHandling:!1},F=function(t){return t.replace(/&#(\d+);/g,function(t,e){return String.fromCharCode(parseInt(e,10))})},U=function(t,e){return t&&"string"==typeof t&&e.comma&&t.indexOf(",")>-1?t.split(","):t},q=function(t,e,n,r){if(!t)return;const o=n.allowDots?t.replace(/\.([^.[]+)/g,"[$1]"):t,i=/(\[[^[\]]*])/g;let u=n.depth>0&&/(\[[^[\]]*])/.exec(o);const f=u?o.slice(0,u.index):o,c=[];if(f){if(!n.plainObjects&&x.call(Object.prototype,f)&&!n.allowPrototypes)return;c.push(f)}let l=0;for(;n.depth>0&&null!==(u=i.exec(o))&&l<n.depth;){if(l+=1,!n.plainObjects&&x.call(Object.prototype,u[1].slice(1,-1))&&!n.allowPrototypes)return;c.push(u[1])}return u&&c.push("["+o.slice(u.index)+"]"),function(t,e,n,r){let o=r?e:U(e,n);for(let e=t.length-1;e>=0;--e){let r;const i=t[e];if("[]"===i&&n.parseArrays)r=v(o)?o:n.allowEmptyArrays&&(""===o||n.strictNullHandling&&null===o)?[]:E([],o,n.arrayLimit,n.plainObjects);else{r=n.plainObjects?Object.create(null):{};const t="["===i.charAt(0)&&"]"===i.charAt(i.length-1)?i.slice(1,-1):i,e=n.decodeDotInKeys?t.replace(/%2E/g,"."):t,u=parseInt(e,10);n.parseArrays||""!==e?!isNaN(u)&&i!==e&&String(u)===e&&u>=0&&n.parseArrays&&u<=n.arrayLimit?(r=[],r[u]=o):"__proto__"!==e&&(r[e]=o):r={0:o}}o=r}return o}(c,e,n,r)};function K(t,e){const n=function(t){if(!t)return P;if(void 0!==t.allowEmptyArrays&&"boolean"!=typeof t.allowEmptyArrays)throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");if(void 0!==t.decodeDotInKeys&&"boolean"!=typeof t.decodeDotInKeys)throw new TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");if(null!=t.decoder&&"function"!=typeof t.decoder)throw new TypeError("Decoder has to be a function.");if(void 0!==t.charset&&"utf-8"!==t.charset&&"iso-8859-1"!==t.charset)throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");const e=void 0===t.charset?P.charset:t.charset,n=void 0===t.duplicates?P.duplicates:t.duplicates;if("combine"!==n&&"first"!==n&&"last"!==n)throw new TypeError("The duplicates option must be either combine, first, or last");return{allowDots:void 0===t.allowDots?!0===t.decodeDotInKeys||P.allowDots:!!t.allowDots,allowEmptyArrays:"boolean"==typeof t.allowEmptyArrays?!!t.allowEmptyArrays:P.allowEmptyArrays,allowPrototypes:"boolean"==typeof t.allowPrototypes?t.allowPrototypes:P.allowPrototypes,allowSparse:"boolean"==typeof t.allowSparse?t.allowSparse:P.allowSparse,arrayLimit:"number"==typeof t.arrayLimit?t.arrayLimit:P.arrayLimit,charset:e,charsetSentinel:"boolean"==typeof t.charsetSentinel?t.charsetSentinel:P.charsetSentinel,comma:"boolean"==typeof t.comma?t.comma:P.comma,decodeDotInKeys:"boolean"==typeof t.decodeDotInKeys?t.decodeDotInKeys:P.decodeDotInKeys,decoder:"function"==typeof t.decoder?t.decoder:P.decoder,delimiter:"string"==typeof t.delimiter||(r=t.delimiter,"[object RegExp]"===Object.prototype.toString.call(r))?t.delimiter:P.delimiter,depth:"number"==typeof t.depth||!1===t.depth?+t.depth:P.depth,duplicates:n,ignoreQueryPrefix:!0===t.ignoreQueryPrefix,interpretNumericEntities:"boolean"==typeof t.interpretNumericEntities?t.interpretNumericEntities:P.interpretNumericEntities,parameterLimit:"number"==typeof t.parameterLimit?t.parameterLimit:P.parameterLimit,parseArrays:!1!==t.parseArrays,plainObjects:"boolean"==typeof t.plainObjects?t.plainObjects:P.plainObjects,strictNullHandling:"boolean"==typeof t.strictNullHandling?t.strictNullHandling:P.strictNullHandling};var r}(e);if(""===t||null==t)return n.plainObjects?Object.create(null):{};const r="string"==typeof t?function(t,e){const n={__proto__:null},r=(e.ignoreQueryPrefix?t.replace(/^\?/,""):t).split(e.delimiter,Infinity===e.parameterLimit?void 0:e.parameterLimit);let o,i=-1,u=e.charset;if(e.charsetSentinel)for(o=0;o<r.length;++o)0===r[o].indexOf("utf8=")&&("utf8=%E2%9C%93"===r[o]?u="utf-8":"utf8=%26%2310003%3B"===r[o]&&(u="iso-8859-1"),i=o,o=r.length);for(o=0;o<r.length;++o){if(o===i)continue;const t=r[o],f=t.indexOf("]="),c=-1===f?t.indexOf("="):f+1;let l,a;-1===c?(l=e.decoder(t,P.decoder,u,"key"),a=e.strictNullHandling?null:""):(l=e.decoder(t.slice(0,c),P.decoder,u,"key"),a=T(U(t.slice(c+1),e),function(t){return e.decoder(t,P.decoder,u,"value")})),a&&e.interpretNumericEntities&&"iso-8859-1"===u&&(a=F(a)),t.indexOf("[]=")>-1&&(a=C(a)?[a]:a);const s=x.call(n,l);s&&"combine"===e.duplicates?n[l]=E(n[l],a,e.arrayLimit,e.plainObjects):s&&"last"!==e.duplicates||(n[l]=a)}return n}(t,n):t;let o=n.plainObjects?Object.create(null):{};const i=Object.keys(r);for(let e=0;e<i.length;++e){const u=i[e],f=q(u,r[u],n,"string"==typeof t);o=j(o,f,n)}return!0===n.allowSparse?o:function(t){const e=[{obj:{o:t},prop:"o"}],n=[];for(let t=0;t<e.length;++t){const r=e[t],o=r.obj[r.prop],i=Object.keys(o);for(let t=0;t<i.length;++t){const r=i[t],u=o[r];"object"==typeof u&&null!==u&&-1===n.indexOf(u)&&(e.push({obj:o,prop:r}),n.push(u))}}return function(t){for(;t.length>1;){const e=t.pop(),n=e.obj[e.prop];if(y(n)){const t=[];for(let e=0;e<n.length;++e)void 0!==n[e]&&t.push(n[e]);e.obj[e.prop]=t}}}(e),t}(o)}var Z=/*#__PURE__*/function(){function t(t,e,n){var r,o;this.name=t,this.definition=e,this.bindings=null!=(r=e.bindings)?r:{},this.wheres=null!=(o=e.wheres)?o:{},this.config=n}var n=t.prototype;return n.matchesUrl=function(t){var e,n=this;if(!this.definition.methods.includes("GET"))return!1;var r=this.template.replace(/[.*+$()[\]]/g,"\\$&").replace(/(\/?){([^}?]*)(\??)}/g,function(t,e,r,o){var i,u="(?<"+r+">"+((null==(i=n.wheres[r])?void 0:i.replace(/(^\^)|(\$$)/g,""))||"[^/?]+")+")";return o?"("+e+u+")?":""+e+u}).replace(/^\w+:\/\//,""),o=t.replace(/^\w+:\/\//,"").split("?"),i=o[0],u=o[1],f=null!=(e=new RegExp("^"+r+"/?$").exec(i))?e:new RegExp("^"+r+"/?$").exec(decodeURI(i));if(f){for(var c in f.groups)f.groups[c]="string"==typeof f.groups[c]?decodeURIComponent(f.groups[c]):f.groups[c];return{params:f.groups,query:K(u)}}return!1},n.compile=function(t){var e=this;return this.parameterSegments.length?this.template.replace(/{([^}?]+)(\??)}/g,function(n,r,o){var i,u;if(!o&&[null,void 0].includes(t[r]))throw new Error("Ziggy error: '"+r+"' parameter is required for route '"+e.name+"'.");if(e.wheres[r]&&!new RegExp("^"+(o?"("+e.wheres[r]+")?":e.wheres[r])+"$").test(null!=(u=t[r])?u:""))throw new Error("Ziggy error: '"+r+"' parameter '"+t[r]+"' does not match required format '"+e.wheres[r]+"' for route '"+e.name+"'.");return encodeURI(null!=(i=t[r])?i:"").replace(/%7C/g,"|").replace(/%25/g,"%").replace(/\$/g,"%24")}).replace(this.config.absolute?/(\.[^/]+?)(\/\/)/:/(^)(\/\/)/,"$1/").replace(/\/+$/,""):this.template},e(t,[{key:"template",get:function(){var t=(this.origin+"/"+this.definition.uri).replace(/\/+$/,"");return""===t?"/":t}},{key:"origin",get:function(){return this.config.absolute?this.definition.domain?""+this.config.url.match(/^\w+:\/\//)[0]+this.definition.domain+(this.config.port?":"+this.config.port:""):this.config.url:""}},{key:"parameterSegments",get:function(){var t,e;return null!=(t=null==(e=this.template.match(/{[^}?]+\??}/g))?void 0:e.map(function(t){return{name:t.replace(/{|\??}/g,""),required:!/\?}$/.test(t)}}))?t:[]}}])}(),B=/*#__PURE__*/function(t){function r(e,r,o,i){var u;if(void 0===o&&(o=!0),(u=t.call(this)||this).t=null!=i?i:"undefined"!=typeof Ziggy?Ziggy:null==globalThis?void 0:globalThis.Ziggy,!u.t&&"undefined"!=typeof document&&document.getElementById("ziggy-routes-json")&&(globalThis.Ziggy=JSON.parse(document.getElementById("ziggy-routes-json").textContent),u.t=globalThis.Ziggy),u.t=n({},u.t,{absolute:o}),e){if(!u.t.routes[e])throw new Error("Ziggy error: route '"+e+"' is not in the route list.");u.i=new Z(e,u.t.routes[e],u.t),u.u=u.l(r)}return u}var o,u;u=t,(o=r).prototype=Object.create(u.prototype),o.prototype.constructor=o,i(o,u);var f=r.prototype;return f.toString=function(){var t=this,e=Object.keys(this.u).filter(function(e){return!t.i.parameterSegments.some(function(t){return t.name===e})}).filter(function(t){return"_query"!==t}).reduce(function(e,r){var o;return n({},e,((o={})[r]=t.u[r],o))},{});return this.i.compile(this.u)+function(t,e){let n=t;const r=function(t){if(!t)return $;if(void 0!==t.allowEmptyArrays&&"boolean"!=typeof t.allowEmptyArrays)throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");if(void 0!==t.encodeDotInKeys&&"boolean"!=typeof t.encodeDotInKeys)throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");if(null!=t.encoder&&"function"!=typeof t.encoder)throw new TypeError("Encoder has to be a function.");const e=t.charset||$.charset;if(void 0!==t.charset&&"utf-8"!==t.charset&&"iso-8859-1"!==t.charset)throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");let n=s;if(void 0!==t.format){if(!R.call(a,t.format))throw new TypeError("Unknown format option provided.");n=t.format}const r=a[n];let o,i=$.filter;if(("function"==typeof t.filter||S(t.filter))&&(i=t.filter),o=t.arrayFormat in k?t.arrayFormat:"indices"in t?t.indices?"indices":"repeat":$.arrayFormat,"commaRoundTrip"in t&&"boolean"!=typeof t.commaRoundTrip)throw new TypeError("`commaRoundTrip` must be a boolean, or absent");return{addQueryPrefix:"boolean"==typeof t.addQueryPrefix?t.addQueryPrefix:$.addQueryPrefix,allowDots:void 0===t.allowDots?!0===t.encodeDotInKeys||$.allowDots:!!t.allowDots,allowEmptyArrays:"boolean"==typeof t.allowEmptyArrays?!!t.allowEmptyArrays:$.allowEmptyArrays,arrayFormat:o,charset:e,charsetSentinel:"boolean"==typeof t.charsetSentinel?t.charsetSentinel:$.charsetSentinel,commaRoundTrip:t.commaRoundTrip,delimiter:void 0===t.delimiter?$.delimiter:t.delimiter,encode:"boolean"==typeof t.encode?t.encode:$.encode,encodeDotInKeys:"boolean"==typeof t.encodeDotInKeys?t.encodeDotInKeys:$.encodeDotInKeys,encoder:"function"==typeof t.encoder?t.encoder:$.encoder,encodeValuesOnly:"boolean"==typeof t.encodeValuesOnly?t.encodeValuesOnly:$.encodeValuesOnly,filter:i,format:n,formatter:r,serializeDate:"function"==typeof t.serializeDate?t.serializeDate:$.serializeDate,skipNulls:"boolean"==typeof t.skipNulls?t.skipNulls:$.skipNulls,sort:"function"==typeof t.sort?t.sort:null,strictNullHandling:"boolean"==typeof t.strictNullHandling?t.strictNullHandling:$.strictNullHandling}}(e);let o,i;"function"==typeof r.filter?(i=r.filter,n=i("",n)):S(r.filter)&&(i=r.filter,o=i);const u=[];if("object"!=typeof n||null===n)return"";const f=k[r.arrayFormat],c="comma"===f&&r.commaRoundTrip;o||(o=Object.keys(n)),r.sort&&o.sort(r.sort);const l=new WeakMap;for(let t=0;t<o.length;++t){const e=o[t];r.skipNulls&&null===n[e]||A(u,_(n[e],e,f,c,r.allowEmptyArrays,r.strictNullHandling,r.skipNulls,r.encodeDotInKeys,r.encode?r.encoder:null,r.filter,r.sort,r.allowDots,r.serializeDate,r.format,r.formatter,r.encodeValuesOnly,r.charset,l))}const p=u.join(r.delimiter);let y=!0===r.addQueryPrefix?"?":"";return r.charsetSentinel&&(y+="iso-8859-1"===r.charset?"utf8=%26%2310003%3B&":"utf8=%E2%9C%93&"),p.length>0?y+p:""}(n({},e,this.u._query),{addQueryPrefix:!0,arrayFormat:"indices",encodeValuesOnly:!0,skipNulls:!0,encoder:function(t,e){return"boolean"==typeof t?Number(t):e(t)}})},f.p=function(t){var e=this;t?this.t.absolute&&t.startsWith("/")&&(t=this.v().host+t):t=this.h();var r={},o=Object.entries(this.t.routes).find(function(n){return r=new Z(n[0],n[1],e.t).matchesUrl(t)})||[void 0,void 0];return n({name:o[0]},r,{route:o[1]})},f.h=function(){var t=this.v(),e=t.pathname,n=t.search;return(this.t.absolute?t.host+e:e.replace(this.t.url.replace(/^\w*:\/\/[^/]+/,""),"").replace(/^\/+/,"/"))+n},f.current=function(t,e){var r=this.p(),o=r.name,i=r.params,u=r.query,f=r.route;if(!t)return o;var c=new RegExp("^"+t.replace(/\./g,"\\.").replace(/\*/g,".*")+"$").test(o);if([null,void 0].includes(e)||!c)return c;var l=new Z(o,f,this.t);e=this.l(e,l);var a=n({},i,u);if(Object.values(e).every(function(t){return!t})&&!Object.values(a).some(function(t){return void 0!==t}))return!0;var s=function(t,e){return Object.entries(t).every(function(t){var n=t[0],r=t[1];return Array.isArray(r)&&Array.isArray(e[n])?r.every(function(t){return e[n].includes(t)||e[n].includes(decodeURIComponent(t))}):"object"==typeof r&&"object"==typeof e[n]&&null!==r&&null!==e[n]?s(r,e[n]):e[n]==r||e[n]==decodeURIComponent(r)})};return s(e,a)},f.v=function(){var t,e,n,r,o,i,u="undefined"!=typeof window?window.location:{},f=u.host,c=u.pathname,l=u.search;return{host:null!=(t=null==(e=this.t.location)?void 0:e.host)?t:void 0===f?"":f,pathname:null!=(n=null==(r=this.t.location)?void 0:r.pathname)?n:void 0===c?"":c,search:null!=(o=null==(i=this.t.location)?void 0:i.search)?o:void 0===l?"":l}},f.has=function(t){return this.t.routes.hasOwnProperty(t)},f.l=function(t,e){var r=this;void 0===t&&(t={}),void 0===e&&(e=this.i),null!=t||(t={}),t=["string","number"].includes(typeof t)?[t]:t;var o=e.parameterSegments.filter(function(t){return!r.t.defaults[t.name]});if(Array.isArray(t))t=t.reduce(function(t,e,r){var i,u;return n({},t,o[r]?((i={})[o[r].name]=e,i):"object"==typeof e?e:((u={})[e]="",u))},{});else if(1===o.length&&!t.hasOwnProperty(o[0].name)&&(t.hasOwnProperty(Object.values(e.bindings)[0])||t.hasOwnProperty("id"))){var i;(i={})[o[0].name]=t,t=i}return n({},this.m(e),this.j(t,e))},f.m=function(t){var e=this;return t.parameterSegments.filter(function(t){return e.t.defaults[t.name]}).reduce(function(t,r,o){var i,u=r.name;return n({},t,((i={})[u]=e.t.defaults[u],i))},{})},f.j=function(t,e){var r=e.bindings,o=e.parameterSegments;return Object.entries(t).reduce(function(t,e){var i,u,f=e[0],c=e[1];if(!c||"object"!=typeof c||Array.isArray(c)||!o.some(function(t){return t.name===f}))return n({},t,((u={})[f]=c,u));var l=c.hasOwnProperty(r[f])?r[f]:c.hasOwnProperty("id")?"id":void 0;if(void 0===l)throw new Error("Ziggy error: object passed as '"+f+"' parameter is missing route model binding key '"+r[f]+"'.");return n({},t,((i={})[f]=c[l],i))},{})},f.valueOf=function(){return this.toString()},e(r,[{key:"params",get:function(){var t=this.p();return n({},t.params,t.query)}},{key:"routeParams",get:function(){return this.p().params}},{key:"queryParams",get:function(){return this.p().query}}])}(/*#__PURE__*/f(String));return function(t,e,n,r){var o=new B(t,e,n,r);return t?o.toString():o}});
</script>        <link rel="preload" as="style" href="http://localhost:8000/build/assets/app-CDj3yHAH.css" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/app-Dz6spF1n.js" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/jsx-runtime-9YgKe2Eq.js" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/preload-helper-DU1UIEn3.js" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/dist-DLKC_odd.js" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/index.esm-DC3BX23r.js" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/AppLayout-DmOtu7h5.js" /><link rel="modulepreload" as="script" href="http://localhost:8000/build/assets/react-C7nKIvmu.js" /><link rel="stylesheet" href="http://localhost:8000/build/assets/app-CDj3yHAH.css" /><script type="module" src="http://localhost:8000/build/assets/app-Dz6spF1n.js"></script>    <script>window.addEventListener("error", function(e) { fetch("/js_error_logger.php", {method: "POST", body: e.error ? e.error.stack : e.message}); }); window.addEventListener("unhandledrejection", function(e) { fetch("/js_error_logger.php", {method: "POST", body: e.reason ? e.reason.stack : e.reason}); });</script><script id="browser-logger-active">
(function() {
    const ENDPOINT = 'http://localhost:8000/_boost/browser-logs';
    const logQueue = [];
    let flushTimeout = null;

    console.log('🔍 Browser logger active (MCP server detected). Posting to: ' + ENDPOINT);

    // Store original console methods
    const originalConsole = {
        log: console.log,
        info: console.info,
        error: console.error,
        warn: console.warn,
        table: console.table
    };

    // Helper to safely stringify values
    function safeStringify(obj) {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]';
                seen.add(value);
            }
            if (value instanceof Error) {
                return {
                    name: value.name,
                    message: value.message,
                    stack: value.stack
                };
            }
            return value;
        });
    }

    // Batch and send logs
    function flushLogs() {
        if (logQueue.length === 0) return;

        const batch = logQueue.splice(0, logQueue.length);

        fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ logs: batch })
        }).catch(err => {
            // Silently fail to avoid infinite loops
            originalConsole.error('Failed to send logs:', err);
        });
    }

    // Debounced flush (100ms)
    function scheduleFlush() {
        if (flushTimeout) clearTimeout(flushTimeout);
        flushTimeout = setTimeout(flushLogs, 100);
    }

    // Intercept console methods
    ['log', 'info', 'error', 'warn', 'table'].forEach(method => {
        console[method] = function(...args) {
            // Call original method
            originalConsole[method].apply(console, args);

            // Capture log data
            try {
                logQueue.push({
                    type: method,
                    timestamp: new Date().toISOString(),
                    data: args.map(arg => {
                        try {
                            return typeof arg === 'object' ? JSON.parse(safeStringify(arg)) : arg;
                        } catch (e) {
                            return String(arg);
                        }
                    }),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                });

                scheduleFlush();
            } catch (e) {
                // Fail silently
            }
        };
    });

    // Global error handlers for uncaught errors
    const originalOnError = window.onerror;
    window.onerror = function boostErrorHandler(errorMsg, url, lineNumber, colNumber, error) {
        try {
            logQueue.push({
                type: 'uncaught_error',
                timestamp: new Date().toISOString(),
                data: [{
                    message: errorMsg,
                    filename: url,
                    lineno: lineNumber,
                    colno: colNumber,
                    error: error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : null
                }],
                url: window.location.href,
                userAgent: navigator.userAgent
            });

            scheduleFlush();
        } catch (e) {
            // Fail silently
        }

        // Call original handler if it exists
        if (originalOnError && typeof originalOnError === 'function') {
            return originalOnError(errorMsg, url, lineNumber, colNumber, error);
        }

        // Let the error continue to propagate
        return false;
    }
    window.addEventListener('error', (event) => {
        try {
            logQueue.push({
                type: 'window_error',
                timestamp: new Date().toISOString(),
                data: [{
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error ? {
                        name: event.error.name,
                        message: event.error.message,
                        stack: event.error.stack
                    } : null
                }],
                url: window.location.href,
                userAgent: navigator.userAgent
            });

            scheduleFlush();
        } catch (e) {
            // Fail silently
        }

        // Let the error continue to propagate
        return false;
    });
    window.addEventListener('unhandledrejection', (event) => {
        try {
            logQueue.push({
                type: 'error',
                timestamp: new Date().toISOString(),
                data: [{
                    message: 'Unhandled Promise Rejection',
                    reason: event.reason instanceof Error ? {
                        name: event.reason.name,
                        message: event.reason.message,
                        stack: event.reason.stack
                    } : event.reason
                }],
                url: window.location.href,
                userAgent: navigator.userAgent
            });

            scheduleFlush();
        } catch (e) {
            // Fail silently
        }

        // Let the rejection continue to propagate
        return false;
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
        if (logQueue.length > 0) {
            navigator.sendBeacon(ENDPOINT, JSON.stringify({ logs: logQueue }));
        }
    });
})();
</script>
</head>
<body class="antialiased font-sans">
    <div id="app" data-page="{&quot;component&quot;:&quot;Auth\/Login&quot;,&quot;props&quot;:{&quot;errors&quot;:{},&quot;auth&quot;:{&quot;user&quot;:null,&quot;active_phase&quot;:&quot;registration&quot;},&quot;flash&quot;:{&quot;success&quot;:null,&quot;error&quot;:null,&quot;warning&quot;:null,&quot;info&quot;:null,&quot;status&quot;:null,&quot;temporary_password&quot;:null,&quot;temporary_username&quot;:null},&quot;app&quot;:{&quot;name&quot;:&quot;SIM-KKN UIN SAIZU&quot;,&quot;env&quot;:&quot;local&quot;,&quot;storage_disk&quot;:&quot;local&quot;},&quot;eligible&quot;:true,&quot;current_phase&quot;:&quot;registration&quot;,&quot;registration&quot;:{&quot;eligible&quot;:true},&quot;form&quot;:{&quot;eligible&quot;:true},&quot;data&quot;:{&quot;current_phase&quot;:&quot;registration&quot;,&quot;eligible&quot;:true},&quot;captcha_question&quot;:&quot;Berapa hasil 30 - 12?&quot;,&quot;captcha_generated_at&quot;:1776468731,&quot;captcha_ttl_seconds&quot;:600},&quot;url&quot;:&quot;\/login&quot;,&quot;version&quot;:&quot;&quot;,&quot;clearHistory&quot;:false,&quot;encryptHistory&quot;:false}"></div></body>
</html>


- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/838d30d7-cd1b-4bcd-8c79-7e3d51c3a62d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 get api v1 periods with valid token
- **Test Code:** [TC009_get_api_v1_periods_with_valid_token.py](./TC009_get_api_v1_periods_with_valid_token.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 38, in <module>
  File "<string>", line 20, in test_get_api_v1_periods_with_valid_token
AssertionError: Expected status code 200 but got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/0ece8186-88e1-4f0e-ac9a-9347d2d4d995
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 get api v1 periods without token
- **Test Code:** [TC010_get_api_v1_periods_without_token.py](./TC010_get_api_v1_periods_without_token.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/3fc22735-5047-4dbd-bb7c-71e90f7ef7d3/35a5e9f4-c074-466f-91e5-7c9d80c4e291
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **10.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---