<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KknStatementAgreement;
use App\Models\KKN\Periode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class KknStatementController extends Controller
{
    use ApiResponse;

    private const VERSION = '2026-05-v1';

    private const PARTS = [
        ['key' => 'part_1', 'title' => 'Kepatuhan & Kesiapan', 'items' => ['Saya siap menaati seluruh tata tertib, ketentuan, dan kebijakan pelaksanaan KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto.', 'Saya siap mengikuti seluruh rangkaian pembekalan, orientasi, dan kegiatan persiapan KKN yang ditetapkan oleh panitia.']],
        ['key' => 'part_2', 'title' => 'Komitmen Peserta', 'items' => ['Saya tidak akan mengundurkan diri sebagai peserta KKN setelah dinyatakan lolos/ditetapkan, kecuali karena alasan khusus yang dapat dipertanggungjawabkan sesuai ketentuan lembaga.', 'Saya tidak sedang dan tidak akan mengikuti kegiatan PPL, PKL, KKL, magang, atau kegiatan akademik lain yang waktunya bersamaan dengan pelaksanaan KKN.']],
        ['key' => 'part_3', 'title' => 'Etika, Penempatan, dan Kelompok', 'items' => ['Saya siap menjaga nama baik almamater, kelompok KKN, serta menjunjung tinggi etika akademik, sosial, dan keagamaan selama pelaksanaan KKN.', 'Saya bersedia ditempatkan di lokasi KKN sesuai ketentuan dan keputusan panitia/LPPM.', 'Saya siap bekerja sama, aktif berpartisipasi, dan menjaga kekompakan kelompok selama kegiatan KKN berlangsung.', 'Saya bersedia mengikuti seluruh program dan target kegiatan KKN sampai selesai sesuai jadwal yang telah ditentukan.']],
        ['key' => 'part_4', 'title' => 'Sanksi, Validasi Data, dan TTD Digital', 'items' => ['Saya memahami bahwa pelanggaran terhadap tata tertib dan ketentuan KKN dapat dikenakan sanksi akademik maupun administratif sesuai aturan yang berlaku.', 'Saya memastikan data dan dokumen yang saya unggah dalam sistem pendaftaran KKN adalah benar dan dapat dipertanggungjawabkan.', 'Dengan mencentang pernyataan ini, saya dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan pelaksanaan KKN UIN SAIZU.']],
    ];

    public function show(Request $request, Periode $periode): JsonResponse
    {
        $m = $request->user()?->mahasiswa;
        if (! $m) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }

        return $this->success(['version' => self::VERSION, 'student' => ['nama' => $m->nama, 'nim' => $m->nim], 'periode' => ['id' => $periode->id, 'name' => $periode->name], 'parts' => self::PARTS]);
    }

    public function agree(Request $request, Periode $periode): JsonResponse
    {
        $m = $request->user()?->mahasiswa;
        if (! $m) {
            return $this->forbidden('Profil mahasiswa tidak ditemukan.');
        }
        $v = $request->validate(['checklist' => ['required', 'array'], 'signature_nim' => ['required', 'string'], 'signature_name' => ['required', 'string']]);
        if (trim((string) $v['signature_nim']) !== (string) $m->nim) {
            throw ValidationException::withMessages(['signature_nim' => 'NIM tanda tangan tidak sesuai akun.']);
        }
        $required = collect(self::PARTS)->sum(fn ($p) => count($p['items']));
        $checked = array_filter($v['checklist'], fn ($value) => $value === true || $value === 1 || $value === '1' || $value === 'true');
        for ($i = 0; $i < $required; $i++) {
            if (empty($checked['item_'.$i])) {
                throw ValidationException::withMessages(['checklist' => 'Semua pernyataan wajib dicentang.']);
            }
        }
        $a = KknStatementAgreement::create(['mahasiswa_id' => $m->id, 'periode_id' => $periode->id, 'jenis_kkn_id' => $periode->jenis_kkn_id, 'statement_version' => self::VERSION, 'checklist' => $v['checklist'], 'signature_name' => trim((string) $v['signature_name']), 'signature_nim' => trim((string) $v['signature_nim']), 'agreed_at' => now(), 'ip_address' => $request->ip(), 'user_agent' => substr((string) $request->userAgent(), 0, 1000)]);

        return $this->created(['agreement_id' => $a->id], 'Surat pernyataan disetujui.');
    }
}
