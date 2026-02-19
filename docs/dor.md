Kita perlu menjawab pertanyaan arsitektur untuk aplikasi KKN dengan Laravel 12 + Inertia.js React/TypeScript + Tailwind. Fokus pada analisis skema dan rekomendasi.

Saya akan menjawab poin per poin dengan bahasa Indonesia, memberikan penjelasan dan kode yang diperlukan.

Pertama, analisis apakah skema saat ini cukup untuk multi-angkatan + multi-jenis KKN. Skema sudah memiliki periods yang mencakup angkatan (integer) dan jenis (string). Itu sudah mencakup konsep angkatan dan jenis. Namun, perlu dipastikan bahwa setiap periode adalah unik berdasarkan kombinasi angkatan dan jenis. Mungkin perlu unique constraint (academic_year_id, angkatan, jenis) atau sejenisnya.

Apakah schema saat ini sudah cukup?

Sudah cukup karena setiap periode mewakili satu angkatan + satu jenis KKN. Namun, ada beberapa potensi perbaikan:

Pastikan tabel periods memiliki kolom angkatan (tahun) dan jenis yang membedakan. Bisa juga menambahkan kolom code unik.

Perlu indeks untuk pencarian berdasarkan angkatan dan jenis.

Pastikan relasi antara periods dan academic_years sudah benar: satu academic year bisa punya banyak periode dengan angkatan berbeda? Mungkin academic year adalah tahun akademik, sedangkan angkatan adalah tahun masuk mahasiswa. Ini bisa jadi berbeda. Contoh: tahun akademik 2025/2026 bisa memiliki angkatan 58 (mahasiswa masuk 2022?) sebaiknya dipisahkan. Tapi untuk KKN, periode KKN biasanya ditentukan oleh tahun pelaksanaan. Jadi angkatan di sini mungkin adalah nomor angkatan KKN (misal 58). Bisa jadi itu tidak perlu dihubungkan dengan academic year, tapi lebih baik tetap pakai academic year sebagai tahun pelaksanaan, dan angkatan sebagai properti independen. Schema saat ini menggunakan academic_year_id di periods, sehingga periode terikat ke tahun akademik, dan juga punya angkatan sendiri. Itu bisa saja, asalkan pengertiannya jelas: angkatan KKN (nomor urut) vs tahun akademik pelaksanaan. Mungkin lebih baik ganti nama angkatan menjadi batch atau generation untuk menghindari kebingungan. Tapi secara fungsional sudah mencukupi.

Perubahan yang diperlukan:

Tambahkan unique constraint di periods untuk kombinasi academic_year_id, angkatan, jenis? Atau mungkin cukup angkatan dan jenis unik? Karena dalam satu tahun akademik bisa ada beberapa angkatan? Tidak lazim. Biasanya satu tahun akademik hanya untuk satu angkatan KKN. Tapi bisa saja jika ada KKN di semester ganjil dan genap. Jadi mungkin lebih baik unique constraint (academic_year_id, jenis) jika setiap tahun hanya satu jenis? Tapi ada banyak jenis per angkatan. Maka uniknya adalah (angkatan, jenis) atau (academic_year_id, jenis)? Angkatan adalah nomor, misal 58, yang mungkin digunakan di beberapa tahun akademik? Tidak, angkatan KKN biasanya unik per universitas. Jadi lebih baik (angkatan, jenis) unique. Tapi jika ada dua periode dengan angkatan sama tapi jenis beda, itu ok. Jika ada dua periode dengan angkatan dan jenis sama, tidak boleh. Jadi tambahkan unique constraint: unique('angkatan', 'jenis').

Migration: $table->unique(['angkatan', 'jenis']);

Pastikan kolom angkatan adalah integer, dan jenis string.

Tambahkan indeks pada angkatan dan jenis untuk query cepat.

Migration script:

php
// database/migrations/xxxx_add_unique_to_periods.php
public function up()
{
    Schema::table('periods', function (Blueprint $table) {
        $table->unique(['angkatan', 'jenis'], 'periods_angkatan_jenis_unique');
        $table->index('angkatan');
        $table->index('jenis');
    });
}
public function down()
{
    Schema::table('periods', function (Blueprint $table) {
        $table->dropUnique('periods_angkatan_jenis_unique');
        $table->dropIndex(['angkatan']);
        $table->dropIndex(['jenis']);
    });
}
Implementasi "Active Period Selector"

Admin perlu memilih angkatan dan jenis KKN, dan semua halaman terfilter sesuai konteks.

Pendekatan:

Gunakan URL parameter: ?period_id=123 atau ?angkatan=58&jenis=Reguler. Lebih baik menggunakan period_id karena sudah unik dan memudahkan query. Tapi untuk user experience, mungkin menampilkan pilihan angkatan + jenis di dropdown, lalu setelah dipilih, URL berubah (misal /admin/dashboard?period=58&type=Reguler). Di sisi server, kita bisa terima parameter dan filter data berdasarkan itu.

Simpan di session? Bisa juga, tapi kurang cocok untuk multi-tab, dan tidak shareable. Lebih baik simpan di URL agar setiap halaman bisa di-bookmark sesuai konteks.

State management di frontend: Kita bisa simpan di React context/Redux, tapi harus sinkron dengan URL. Inertia.js mendukung penggunaan URL sebagai sumber kebenaran. Jadi kita bisa menggunakan Inertia's usePage untuk membaca parameter, lalu mengirimkannya ke server melalui request berikutnya.

Rekomendasi: gunakan query parameters period (ID periode) atau kombinasi angkatan dan jenis. Tapi karena periode sudah unik, lebih simpan period_id di URL. Jika admin ingin mengganti periode, kita redirect ke halaman yang sama dengan period_id baru. Di server side, kita bisa mendefinisikan middleware atau base controller untuk mengambil data periode aktif berdasarkan input, lalu menyediakannya ke view.

Contoh implementasi:

Buat service ActivePeriod yang mengambil dari request parameter period_id, validasi, dan menyimpannya di cache request.

Di controller, panggil service untuk mendapatkan periode aktif, lalu gunakan untuk filter query.

Pada layout, tampilkan dropdown yang diisi dengan daftar periode (angkatan+jenis). Saat berubah, lakukan Inertia visit dengan query params baru.

Untuk menjaga konsistensi, semua link ke halaman lain harus membawa parameter period_id yang sama. Bisa gunakan helper untuk generate URL dengan tambahan query params.

Contoh kode:

php
// app/Services/ActivePeriodService.php
class ActivePeriodService
{
    public function getActivePeriod(Request $request): ?Period
    {
        $periodId = $request->query('period');
        if ($periodId && $period = Period::find($periodId)) {
            return $period;
        }
        // Default ke periode aktif terbaru? Atau null?
        return Period::where('is_active', true)->latest()->first();
    }
}
Di controller:

php
public function index(Request $request, ActivePeriodService $activePeriod)
{
    $period = $activePeriod->getActivePeriod($request);
    if (!$period) {
        return redirect()->route('admin.periods.index')->with('error', 'Pilih periode terlebih dahulu');
    }
    $students = Student::whereHas('registrations', function($q) use ($period) {
        $q->where('period_id', $period->id);
    })->paginate();
    return Inertia::render('Students/Index', [
        'students' => $students,
        'activePeriod' => $period,
        'periods' => Period::select('id', 'angkatan', 'jenis')->get(),
    ]);
}
Frontend: dropdown dengan opsi, saat berubah panggil router.get(route('students.index'), { period: e.target.value }).

Query optimal untuk dashboard per-angkatan

Statistik: total mahasiswa per jenis KKN, total DPL per jenis, progress laporan harian, program kerja, nilai.

Asumsikan kita ingin menampilkan untuk satu angkatan tertentu (misal angkatan 58), maka kita perlu filter berdasarkan angkatan di tabel periods. Bisa juga langsung filter period_id dari active period.

Query:

Total mahasiswa per jenis: Period::withCount('registrations')->where('angkatan', $angkatan)->get()
Tapi registrasi hanya yang status approved? Mungkin perlu filter status.

Total DPL per jenis: Period::withCount(['kelompok as dpl_count' => fn($q) => $q->distinct('dpl_id')])->where('angkatan', $angkatan)->get()

Progress laporan harian: misal total laporan yang sudah di-submit vs total mahasiswa.
Bisa join dengan kelompok, registrasi, dll. Tapi lebih baik dibuat query terpisah.

Untuk efisiensi, kita bisa menggunakan query dengan join dan group by, atau menggunakan Eloquent dengan subquery.

Contoh:

php
$angkatan = 58;
$stats = Period::where('angkatan', $angkatan)
    ->withCount([
        'registrations as total_mahasiswa' => fn($q) => $q->where('status', 'approved'),
        'kelompok as total_dpl' => fn($q) => $q->distinct('dpl_id'),
    ])
    ->with([
        'kelompok' => function ($q) {
            $q->withCount([
                'dailyReports as submitted_laporan' => fn($q) => $q->where('status', 'submitted'),
                'workPrograms as program_kerja_count',
                'nilai as finalized_nilai_count' => fn($q) => $q->where('is_finalized', true),
            ]);
        }
    ])
    ->get();
Namun ini bisa berat. Alternatif: buat query terpisah untuk masing-masing indikator, lalu gabungkan di collection.

Untuk dashboard, mungkin lebih baik buat service class yang mengumpulkan data dari beberapa query, lalu menyusunnya.

Untuk performa, pastikan indeks pada kolom yang sering di-join: period_id di registrations, kelompok_id di daily_reports, dpl_id di kelompok, dll.

Gunakan chunk atau pagination jika perlu menampilkan data besar.

Contoh implementasi di controller:

php
public function dashboard(ActivePeriodService $activePeriod)
{
    $period = $activePeriod->getActivePeriod(request());
    $angkatan = $period->angkatan;

    $stats = DB::table('periods')
        ->leftJoin('registrations', 'periods.id', '=', 'registrations.period_id')
        ->leftJoin('kelompok_kkn', 'periods.id', '=', 'kelompok_kkn.period_id')
        ->where('periods.angkatan', $angkatan)
        ->groupBy('periods.id', 'periods.jenis')
        ->select(
            'periods.id',
            'periods.jenis',
            DB::raw('COUNT(DISTINCT registrations.mahasiswa_id) as total_mahasiswa'),
            DB::raw('COUNT(DISTINCT kelompok_kkn.dpl_id) as total_dpl'),
        )
        ->get();
    return Inertia::render('Dashboard', ['stats' => $stats]);
}
Untuk progress laporan, bisa query lain.

Skenario 1 dosen jadi DPL di beberapa jenis KKN berbeda

Saat ini, tabel kelompok_kkn memiliki dpl_id (FK ke dosen). Seorang dosen dapat menjadi DPL di beberapa kelompok, asalkan kelompok tersebut berbeda periode/jenis. Ini sudah bisa karena tidak ada unique constraint yang melarang.

Namun, perlu dipastikan di level aplikasi bahwa dalam satu periode yang sama, seorang dosen bisa jadi DPL di beberapa kelompok? Tergantung aturan. Mungkin diperbolehkan atau tidak. Jika tidak boleh, maka perlu validasi saat assign DPL ke kelompok, cek apakah dosen sudah menjadi DPL di kelompok lain dalam periode yang sama. Bisa dilakukan di controller atau form request.

Contoh validasi:

php
// rules untuk store kelompok
'dpl_id' => [
    'required',
    Rule::unique('kelompok_kkn')->where(function ($query) use ($request) {
        return $query->where('period_id', $request->period_id);
    }),
];
Ini akan mencegah dosen menjadi DPL di dua kelompok dalam periode yang sama. Tapi jika diperbolehkan, tidak perlu.

Menangani mahasiswa pindah jenis KKN

Mahasiswa terdaftar di suatu periode melalui tabel registrations (ada period_id). Untuk pindah jenis, kita bisa:

Hapus registrasi lama dan buat baru? Namun akan menghilangkan histori.

Tambahkan kolom status untuk merekam perpindahan, atau buat tabel registration_changes.

Cara paling sederhana: buat registrasi baru dengan status baru, dan set status registrasi lama menjadi moved atau cancelled. Tapi perlu dipastikan tidak ada duplikasi data mahasiswa aktif di dua periode sekaligus.

Alternatif: update period_id di registrasi jika perpindahan diperbolehkan. Namun ini akan menghilangkan jejak.

Rekomendasi: tambahkan kolom previous_registration_id nullable di tabel registrations untuk mencatat asal perpindahan. Atau buat log di tabel tersendiri.

Dalam implementasi, saat admin memindahkan mahasiswa, buat registrasi baru dengan status pending/approved, dan set status registrasi lama menjadi moved. Lalu catat siapa yang memindah dan kapan.

Contoh migration:

php
Schema::table('registrations', function (Blueprint $table) {
    $table->unsignedBigInteger('moved_from_id')->nullable()->after('notes');
    $table->foreign('moved_from_id')->references('id')->on('registrations');
    $table->timestamp('moved_at')->nullable();
    $table->unsignedBigInteger('moved_by')->nullable();
    $table->foreign('moved_by')->references('id')->on('users');
});
Saat pindah, kita set moved_from_id ke registrasi lama, moved_at dan moved_by. Kemudian registrasi lama di-set status moved.

Best practice untuk pagination dan performa

Gunakan Laravel pagination secara default, sudah optimal.

Pastikan query menggunakan with untuk eager loading relasi yang diperlukan, hindari N+1.

Gunakan indeks pada kolom yang digunakan untuk filter dan join: period_id, kelompok_id, mahasiswa_id, status, angkatan, jenis.

Untuk dashboard dengan agregasi besar, pertimbangkan materialized view atau tabel ringkasan yang diperbarui secara periodik (event/listener). Atau gunakan query dengan subquery yang efisien.

Gunakan chunked query untuk proses background.

Pertimbangkan caching untuk data yang jarang berubah (misal total mahasiswa per periode).

Di frontend, gunakan infinite scroll atau pagination dengan tombol "load more" jika perlu.

Contoh implementasi pagination dengan filter:

php
$students = Student::with(['faculty', 'program'])
    ->whereHas('registrations', fn($q) => $q->where('period_id', $period->id))
    ->orderBy('name')
    ->paginate(20)
    ->withQueryString(); // mempertahankan query params
Contoh implementasi Laravel (Controller + Service) untuk menampilkan daftar mahasiswa yang difilter berdasarkan angkatan + jenis KKN

Buat controller StudentController dengan method index.

Gunakan ActivePeriodService untuk mendapatkan periode aktif.

Filter mahasiswa yang memiliki registrasi pada periode tersebut.

Tampilkan dengan pagination.

Sertakan data periode aktif dan daftar periode untuk dropdown.

Implementasi service untuk mengambil mahasiswa dengan filter.

Contoh:

php
// app/Http/Controllers/StudentController.php
namespace App\Http\Controllers;

use App\Services\ActivePeriodService;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index(Request $request, ActivePeriodService $activePeriod)
    {
        $period = $activePeriod->getActivePeriod($request);
        
        if (!$period) {
            return redirect()->route('periods.index')
                ->with('error', 'Silakan pilih periode KKN terlebih dahulu.');
        }

        $students = Student::with(['faculty', 'program'])
            ->whereHas('registrations', function ($query) use ($period) {
                $query->where('period_id', $period->id)
                      ->whereIn('status', ['approved', 'completed']); // sesuai kebutuhan
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $allPeriods = Period::select('id', 'angkatan', 'jenis', 'name')
            ->orderBy('angkatan', 'desc')
            ->orderBy('jenis')
            ->get();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'activePeriod' => $period,
            'periods' => $allPeriods,
            'filters' => $request->only(['search', 'faculty']), // filter tambahan
        ]);
    }
}
Buat service ActivePeriodService seperti di atas.

Di route, pastan menggunakan middleware auth dan role admin.

Di frontend React, komponen akan menerima props dan menampilkan tabel dengan pagination.

Sekarang kita akan merangkum jawaban dalam bahasa Indonesia, dengan kode yang sesuai.

Kita perlu memberikan jawaban yang jelas dan terstruktur.

Analisis dan Rekomendasi Arsitektur Sistem Informasi KKN
1. Evaluasi Skema Database untuk Multi-Angkatan dan Multi-Jenis KKN
Kesimpulan: Skema saat ini sudah cukup karena tabel periods merepresentasikan setiap kombinasi angkatan + jenis KKN. Setiap periode memiliki data mahasiswa, DPL, kelompok, dan laporan masing-masing melalui relasi ke tabel registrations, kelompok_kkn, dll.

Namun, ada beberapa penyempurnaan yang direkomendasikan:

Unique constraint pada kombinasi angkatan dan jenis di tabel periods untuk mencegah duplikasi periode.

Indeks pada kolom yang sering digunakan dalam filter (angkatan, jenis, period_id di tabel terkait) untuk optimasi query.

Migration script:

php
<?php
// database/migrations/2025_01_01_000001_add_unique_and_index_to_periods.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('periods', function (Blueprint $table) {
            $table->unique(['angkatan', 'jenis'], 'periods_angkatan_jenis_unique');
            $table->index('angkatan');
            $table->index('jenis');
        });

        // Indeks pada foreign key yang sering digunakan
        Schema::table('registrations', function (Blueprint $table) {
            $table->index('period_id');
            $table->index('status');
        });

        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->index('period_id');
            $table->index('dpl_id');
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->index('kelompok_id');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::table('periods', function (Blueprint $table) {
            $table->dropUnique('periods_angkatan_jenis_unique');
            $table->dropIndex(['angkatan']);
            $table->dropIndex(['jenis']);
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex(['period_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->dropIndex(['period_id']);
            $table->dropIndex(['dpl_id']);
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropIndex(['kelompok_id']);
            $table->dropIndex(['status']);
        });
    }
};
2. Implementasi Active Period Selector (Pemilih Periode Aktif)
Rekomendasi: Gunakan URL query parameter (?period_id=123) sebagai sumber kebenaran utama. Simpan periode aktif di sisi server berdasarkan request, bukan session, agar mendukung multi-tab dan bookmark.

Langkah implementasi:

Buat service untuk mengambil periode aktif dari request.

php
// app/Services/ActivePeriodService.php
namespace App\Services;

use App\Models\Period;
use Illuminate\Http\Request;

class ActivePeriodService
{
    public function getActivePeriod(Request $request): ?Period
    {
        $periodId = $request->query('period');
        
        if ($periodId) {
            return Period::find($periodId);
        }
        
        // Fallback: periode aktif terbaru (bisa diatur sesuai kebutuhan)
        return Period::where('is_active', true)->latest('id')->first();
    }
}
Gunakan di controller untuk memfilter data dan mengirim daftar periode ke view.

php
use App\Services\ActivePeriodService;

public function index(Request $request, ActivePeriodService $activePeriod)
{
    $period = $activePeriod->getActivePeriod($request);
    
    if (!$period) {
        return redirect()->route('admin.periods.index')
            ->with('error', 'Silakan pilih periode KKN terlebih dahulu.');
    }

    $data = Model::whereHas('registrations', fn($q) => $q->where('period_id', $period->id))->get();

    return Inertia::render('Page', [
        'data' => $data,
        'activePeriod' => $period,
        'periods' => Period::select('id', 'angkatan', 'jenis', 'name')->get(),
    ]);
}
Frontend (React): Dropdown untuk memilih periode, saat berubah lakukan Inertia visit dengan parameter baru.

tsx
import { router } from '@inertiajs/react';

const PeriodSelector = ({ periods, activePeriod }: { periods: any[]; activePeriod: any }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.get(route('current.path'), { period: e.target.value }, { preserveState: true });
  };

  return (
    <select value={activePeriod?.id} onChange={handleChange}>
      {periods.map(p => (
        <option key={p.id} value={p.id}>
          Angkatan {p.angkatan} - {p.jenis}
        </option>
      ))}
    </select>
  );
};
Keuntungan: URL selalu membawa konteks periode, mudah di‑share, dan state tersimpan di server.

3. Query Optimal untuk Dashboard per Angkatan
Contoh dashboard menampilkan statistik per jenis KKN dalam satu angkatan. Kita akan buat query yang efisien dengan menggunakan leftJoin dan groupBy untuk menghindari N+1.

Controller:

php
use Illuminate\Support\Facades\DB;

public function dashboard(Request $request, ActivePeriodService $activePeriod)
{
    $period = $activePeriod->getActivePeriod($request);
    $angkatan = $period->angkatan;

    // Statistik dasar per jenis
    $stats = DB::table('periods')
        ->leftJoin('registrations', 'periods.id', '=', 'registrations.period_id')
        ->leftJoin('kelompok_kkn', 'periods.id', '=', 'kelompok_kkn.period_id')
        ->leftJoin('daily_reports', 'kelompok_kkn.id', '=', 'daily_reports.kelompok_id')
        ->where('periods.angkatan', $angkatan)
        ->groupBy('periods.id', 'periods.jenis')
        ->select(
            'periods.id',
            'periods.jenis',
            DB::raw('COUNT(DISTINCT registrations.mahasiswa_id) as total_mahasiswa'),
            DB::raw('COUNT(DISTINCT kelompok_kkn.dpl_id) as total_dpl'),
            DB::raw('COUNT(DISTINCT daily_reports.id) as total_laporan'),
            DB::raw('SUM(CASE WHEN daily_reports.status = "approved" THEN 1 ELSE 0 END) as laporan_disetujui')
        )
        ->get();

    return Inertia::render('Dashboard', [
        'stats' => $stats,
        'activePeriod' => $period,
    ]);
}
Optimasi:

Indeks pada period_id, angkatan, status sudah ditambahkan.

Jika data sangat besar, pertimbangkan untuk membuat tabel agregat atau menggunakan materialized view yang di‑refresh secara berkala via queue.

4. Skenario Satu Dosen Menjadi DPL di Beberapa Jenis KKN Berbeda
Skema saat ini mengizinkan karena kelompok_kkn.dpl_id tidak memiliki unique constraint. Untuk menjaga konsistensi bisnis (misal: satu dosen tidak boleh jadi DPL di dua kelompok dalam periode yang sama), tambahkan validasi saat membuat/mengupdate kelompok.

Validasi di Form Request:

php
// app/Http/Requests/KelompokRequest.php
public function rules()
{
    return [
        'dpl_id' => [
            'required',
            'exists:lecturers,id',
            Rule::unique('kelompok_kkn')->where(function ($query) {
                return $query->where('period_id', $this->period_id);
            }),
        ],
        // ... aturan lain
    ];
}
Jika aturan mengizinkan dosen menjadi DPL di beberapa kelompok dalam periode yang sama, cukup hapus validasi unique tersebut.

5. Menangani Mahasiswa Pindah Jenis KKN
Rekomendasi: Buat registrasi baru dan tandai registrasi lama sebagai moved. Dengan cara ini, histori tetap terjaga dan tidak ada duplikasi data aktif.

Migration untuk mencatat perpindahan:

php
Schema::table('registrations', function (Blueprint $table) {
    $table->unsignedBigInteger('moved_from_id')->nullable()->after('notes');
    $table->foreign('moved_from_id')->references('id')->on('registrations')->nullOnDelete();
    $table->timestamp('moved_at')->nullable();
    $table->unsignedBigInteger('moved_by')->nullable();
    $table->foreign('moved_by')->references('id')->on('users')->nullOnDelete();
});
Proses pindah di controller:

php
public function moveStudent(Request $request, Registration $oldRegistration)
{
    $request->validate(['new_period_id' => 'required|exists:periods,id']);

    DB::transaction(function () use ($oldRegistration, $request) {
        // Buat registrasi baru
        $newRegistration = $oldRegistration->replicate()->fill([
            'period_id' => $request->new_period_id,
            'status' => 'pending', // atau 'approved' jika langsung
            'kelompok_id' => null,
            'registration_date' => now(),
            'approved_at' => null,
            'approved_by' => null,
        ]);
        $newRegistration->save();

        // Tandai registrasi lama
        $oldRegistration->update([
            'status' => 'moved',
            'moved_from_id' => $newRegistration->id,
            'moved_at' => now(),
            'moved_by' => auth()->id(),
        ]);
    });

    return redirect()->back()->with('success', 'Mahasiswa berhasil dipindahkan.');
}
6. Best Practice Pagination dan Performa untuk Ribuan Record
Gunakan pagination bawaan Laravel (paginate()) dengan withQueryString().

Eager loading relasi yang diperlukan dengan with() untuk menghindari N+1.

Indeks pada kolom yang sering digunakan dalam WHERE, JOIN, dan ORDER BY.

Gunakan query builder untuk agregasi besar, bukan Eloquent, agar lebih ringan.

Cache data statis (misal: jumlah mahasiswa per periode) dengan Laravel Cache, di‑invalidate saat ada perubahan.

Pertimbangkan chunked processing untuk laporan/export data besar.

Contoh pagination dengan filter:

php
$students = Student::with(['faculty', 'program'])
    ->whereHas('registrations', fn($q) => $q->where('period_id', $period->id))
    ->when($request->search, fn($q, $search) => $q->where('name', 'like', "%{$search}%"))
    ->orderBy('name')
    ->paginate(20)
    ->withQueryString();
7. Contoh Implementasi Controller + Service untuk Daftar Mahasiswa Berdasarkan Angkatan & Jenis
Service (opsional) untuk memisahkan logika pengambilan mahasiswa:

php
// app/Services/StudentService.php
namespace App\Services;

use App\Models\Period;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentService
{
    public function getStudentsByPeriod(Period $period, Request $request)
    {
        return Student::with(['faculty', 'program'])
            ->whereHas('registrations', function ($query) use ($period) {
                $query->where('period_id', $period->id)
                      ->whereIn('status', ['approved', 'completed']); // sesuai kebutuhan
            })
            ->when($request->search, fn($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->faculty, fn($q, $faculty) => $q->where('faculty_id', $faculty))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();
    }
}
Controller:

php
// app/Http/Controllers/StudentController.php
namespace App\Http\Controllers;

use App\Services\ActivePeriodService;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index(
        Request $request,
        ActivePeriodService $activePeriod,
        StudentService $studentService
    ) {
        $period = $activePeriod->getActivePeriod($request);
        
        if (!$period) {
            return redirect()->route('admin.periods.index')
                ->with('error', 'Pilih periode KKN terlebih dahulu.');
        }

        $students = $studentService->getStudentsByPeriod($period, $request);
        $allPeriods = Period::select('id', 'angkatan', 'jenis', 'name')->get();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'activePeriod' => $period,
            'periods' => $allPeriods,
            'filters' => $request->only(['search', 'faculty']),
        ]);
    }
}
Route:

php
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
});
Dengan pendekatan ini, kode bersih, mudah diuji, dan siap untuk production.

Dengan implementasi di atas, sistem KKN Anda akan mampu menangani kompleksitas multi‑angkatan dan multi‑jenis dengan performa baik serta kemudahan penggunaan.

----------

Saya akan menganalisis schema database Anda dan memberikan rekomendasi arsitektur yang production-ready untuk sistem KKN multi-angkatan dan multi-jenis.
1. Analisis Schema & Rekomendasi Perubahan
Schema saat ini SUDAH CUKUP BAIK, tetapi ada beberapa optimisasi yang disarankan:
Perubahan yang Disarankan:
A. Tambah Index untuk Performa Query
php// database/migrations/2025_02_15_add_indexes_for_kkn_filtering.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Index untuk filtering berdasarkan periode
        Schema::table('periods', function (Blueprint $table) {
            $table->index(['angkatan', 'jenis', 'is_active'], 'idx_period_filter');
            $table->index(['academic_year_id', 'is_active'], 'idx_period_academic');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->index(['period_id', 'status'], 'idx_registration_period_status');
            $table->index(['mahasiswa_id', 'period_id'], 'idx_registration_student');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->index(['period_id', 'status'], 'idx_group_period_status');
            $table->index(['dpl_id', 'period_id'], 'idx_group_dpl');
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->index(['kelompok_id', 'status', 'date'], 'idx_report_group');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->index(['kelompok_id', 'is_finalized'], 'idx_nilai_group');
        });
    }

    public function down(): void
    {
        Schema::table('periods', function (Blueprint $table) {
            $table->dropIndex('idx_period_filter');
            $table->dropIndex('idx_period_academic');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex('idx_registration_period_status');
            $table->dropIndex('idx_registration_student');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropIndex('idx_group_period_status');
            $table->dropIndex('idx_group_dpl');
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropIndex('idx_report_group');
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex('idx_nilai_group');
        });
    }
};
B. Tambah Tabel untuk Track Perubahan Jenis KKN
php// database/migrations/2025_02_15_create_period_transfers_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('period_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('students');
            $table->foreignId('from_period_id')->constrained('periods');
            $table->foreignId('to_period_id')->constrained('periods');
            $table->foreignId('from_kelompok_id')->nullable()->constrained('groups');
            $table->foreignId('to_kelompok_id')->nullable()->constrained('groups');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('reason');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index(['mahasiswa_id', 'status'], 'idx_transfer_student');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('period_transfers');
    }
};
C. Tambah Kolom untuk Cache Statistik (Optional - untuk performa)
php// database/migrations/2025_02_15_add_cache_columns_to_periods.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periods', function (Blueprint $table) {
            $table->integer('cached_students_count')->default(0);
            $table->integer('cached_groups_count')->default(0);
            $table->integer('cached_dpl_count')->default(0);
            $table->timestamp('stats_cached_at')->nullable();
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->integer('cached_members_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('periods', function (Blueprint $table) {
            $table->dropColumn([
                'cached_students_count',
                'cached_groups_count',
                'cached_dpl_count',
                'stats_cached_at'
            ]);
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('cached_members_count');
        });
    }
};
2. Implementasi Active Period Selector
Rekomendasi: Gunakan kombinasi Session + Middleware
A. Middleware untuk Period Context
php// app/Http/Middleware/SetActivePeriodContext.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Period;
use Symfony\Component\HttpFoundation\Response;

class SetActivePeriodContext
{
    public function handle(Request $request, Closure $next): Response
    {
        // Cek apakah user sudah login
        if (!auth()->check()) {
            return $next($request);
        }

        // Ambil period_id dari request (untuk switch period)
        if ($request->has('switch_period')) {
            $periodId = $request->input('switch_period');
            $period = Period::find($periodId);
            
            if ($period) {
                session(['active_period_id' => $periodId]);
            }
        }

        // Jika belum ada active period di session, set default
        if (!session()->has('active_period_id')) {
            $defaultPeriod = Period::where('is_active', true)
                ->latest('created_at')
                ->first();
            
            if ($defaultPeriod) {
                session(['active_period_id' => $defaultPeriod->id]);
            }
        }

        // Share active period ke semua views/Inertia
        if (session()->has('active_period_id')) {
            $activePeriod = Period::with(['academicYear'])
                ->find(session('active_period_id'));
            
            // Share via Inertia (untuk React)
            if (class_exists(\Inertia\Inertia::class)) {
                \Inertia\Inertia::share('activePeriod', function () use ($activePeriod) {
                    return $activePeriod ? [
                        'id' => $activePeriod->id,
                        'angkatan' => $activePeriod->angkatan,
                        'jenis' => $activePeriod->jenis,
                        'name' => $activePeriod->name,
                        'academic_year' => $activePeriod->academicYear->year ?? null,
                    ] : null;
                });
            }

            // Simpan di request untuk mudah diakses
            $request->merge(['active_period' => $activePeriod]);
        }

        return $next($request);
    }
}
B. Helper Function
php// app/Helpers/PeriodHelper.php
<?php

namespace App\Helpers;

use App\Models\Period;
use Illuminate\Support\Facades\Cache;

class PeriodHelper
{
    /**
     * Get active period from session
     */
    public static function getActivePeriod(): ?Period
    {
        $periodId = session('active_period_id');
        
        if (!$periodId) {
            return null;
        }

        return Cache::remember("period_{$periodId}", 3600, function () use ($periodId) {
            return Period::with('academicYear')->find($periodId);
        });
    }

    /**
     * Get active period ID
     */
    public static function getActivePeriodId(): ?int
    {
        return session('active_period_id');
    }

    /**
     * Set active period
     */
    public static function setActivePeriod(int $periodId): void
    {
        session(['active_period_id' => $periodId]);
    }

    /**
     * Get all available periods for selector
     */
    public static function getAvailablePeriods(): array
    {
        return Cache::remember('available_periods', 3600, function () {
            return Period::with('academicYear')
                ->orderBy('angkatan', 'desc')
                ->orderBy('jenis')
                ->get()
                ->groupBy('angkatan')
                ->map(function ($periods) {
                    return $periods->map(function ($period) {
                        return [
                            'id' => $period->id,
                            'label' => $period->name,
                            'jenis' => $period->jenis,
                            'academic_year' => $period->academicYear->year ?? null,
                        ];
                    });
                })
                ->toArray();
        });
    }
}
C. React Component untuk Period Selector
typescript// resources/js/Components/PeriodSelector.tsx
import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';

interface Period {
  id: number;
  angkatan: number;
  jenis: string;
  name: string;
  academic_year: string;
}

interface Props {
  availablePeriods: Record<number, Period[]>;
}

export default function PeriodSelector({ availablePeriods }: Props) {
  const { activePeriod } = usePage().props as { activePeriod: Period };
  const [isOpen, setIsOpen] = useState(false);

  const handlePeriodChange = (periodId: number) => {
    router.get(route(route().current()!), 
      { switch_period: periodId },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => setIsOpen(false),
      }
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
      >
        <div className="text-left">
          <div className="text-xs text-gray-500">Periode Aktif</div>
          <div className="font-semibold text-sm">
            {activePeriod?.name || 'Pilih Periode'}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-lg border">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Pilih Periode KKN</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(availablePeriods).map(([angkatan, periods]) => (
                <div key={angkatan} className="border-b last:border-b-0">
                  <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600">
                    Angkatan {angkatan}
                  </div>
                  {periods.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => handlePeriodChange(period.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${
                        activePeriod?.id === period.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{period.jenis}</div>
                      <div className="text-xs text-gray-500">{period.academic_year}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
D. Register Middleware
php// app/Http/Kernel.php atau bootstrap/app.php (Laravel 11+)
protected $middlewareGroups = [
    'web' => [
        // ... middleware lainnya
        \App\Http\Middleware\SetActivePeriodContext::class,
    ],
];
3. Query Optimal untuk Dashboard Statistik
php// app/Services/DashboardService.php
<?php

namespace App\Services;

use App\Models\Period;
use App\Models\Registration;
use App\Models\Group;
use App\Models\DailyReport;
use App\Models\WorkProgram;
use App\Models\FinalReport;
use App\Models\NilaiKkn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    /**
     * Get comprehensive statistics for a specific period
     */
    public function getPeriodStatistics(int $periodId): array
    {
        $cacheKey = "dashboard_stats_period_{$periodId}";
        
        return Cache::remember($cacheKey, 300, function () use ($periodId) {
            return [
                'students' => $this->getStudentStatistics($periodId),
                'dpl' => $this->getDplStatistics($periodId),
                'groups' => $this->getGroupStatistics($periodId),
                'reports' => $this->getReportStatistics($periodId),
                'scores' => $this->getScoreStatistics($periodId),
            ];
        });
    }

    /**
     * Get statistics by batch (angkatan)
     */
    public function getBatchStatistics(int $angkatan): array
    {
        $cacheKey = "dashboard_stats_batch_{$angkatan}";
        
        return Cache::remember($cacheKey, 300, function () use ($angkatan) {
            $periods = Period::where('angkatan', $angkatan)->pluck('id');
            
            return Period::where('angkatan', $angkatan)
                ->with(['academicYear'])
                ->get()
                ->map(function ($period) {
                    return [
                        'period' => [
                            'id' => $period->id,
                            'jenis' => $period->jenis,
                            'name' => $period->name,
                        ],
                        'stats' => $this->getPeriodStatistics($period->id),
                    ];
                })
                ->toArray();
        });
    }

    private function getStudentStatistics(int $periodId): array
    {
        return DB::table('registrations as r')
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN r.status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN r.status = "document_submitted" THEN 1 ELSE 0 END) as document_submitted'),
                DB::raw('SUM(CASE WHEN r.status = "approved" THEN 1 ELSE 0 END) as approved'),
                DB::raw('SUM(CASE WHEN r.status = "rejected" THEN 1 ELSE 0 END) as rejected'),
                DB::raw('SUM(CASE WHEN r.status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN r.kelompok_id IS NOT NULL THEN 1 ELSE 0 END) as assigned_to_group'),
                DB::raw('SUM(CASE WHEN r.kelompok_id IS NULL THEN 1 ELSE 0 END) as not_assigned'),
            ])
            ->where('r.period_id', $periodId)
            ->first();
    }

    private function getDplStatistics(int $periodId): array
    {
        $stats = DB::table('groups as g')
            ->select([
                DB::raw('COUNT(DISTINCT g.dpl_id) as total_dpl'),
                DB::raw('COUNT(*) as total_groups'),
                DB::raw('AVG(group_members.member_count) as avg_students_per_dpl'),
            ])
            ->leftJoin(
                DB::raw('(SELECT kelompok_id, COUNT(*) as member_count 
                         FROM registrations 
                         WHERE kelompok_id IS NOT NULL 
                         GROUP BY kelompok_id) as group_members'),
                'g.id', '=', 'group_members.kelompok_id'
            )
            ->where('g.period_id', $periodId)
            ->first();

        // Get DPL with most groups
        $topDpl = DB::table('groups as g')
            ->select([
                'd.name',
                'd.nip',
                DB::raw('COUNT(*) as group_count'),
            ])
            ->join('lecturers as d', 'g.dpl_id', '=', 'd.id')
            ->where('g.period_id', $periodId)
            ->groupBy('d.id', 'd.name', 'd.nip')
            ->orderByDesc('group_count')
            ->limit(5)
            ->get();

        return [
            'total_dpl' => $stats->total_dpl ?? 0,
            'total_groups' => $stats->total_groups ?? 0,
            'avg_students_per_dpl' => round($stats->avg_students_per_dpl ?? 0, 2),
            'top_dpl' => $topDpl,
        ];
    }

    private function getGroupStatistics(int $periodId): array
    {
        return DB::table('groups')
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "draft" THEN 1 ELSE 0 END) as draft'),
                DB::raw('SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active'),
                DB::raw('SUM(CASE WHEN status = "closed" THEN 1 ELSE 0 END) as closed'),
                DB::raw('SUM(CASE WHEN location_id IS NOT NULL THEN 1 ELSE 0 END) as with_location'),
                DB::raw('SUM(CASE WHEN location_id IS NULL THEN 1 ELSE 0 END) as without_location'),
            ])
            ->where('period_id', $periodId)
            ->first();
    }

    private function getReportStatistics(int $periodId): array
    {
        // Daily Reports
        $dailyReports = DB::table('daily_reports as dr')
            ->join('groups as g', 'dr.kelompok_id', '=', 'g.id')
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN dr.status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN dr.status = "approved" THEN 1 ELSE 0 END) as approved'),
                DB::raw('SUM(CASE WHEN dr.status = "rejected" THEN 1 ELSE 0 END) as rejected'),
            ])
            ->where('g.period_id', $periodId)
            ->first();

        // Work Programs
        $workPrograms = DB::table('work_programs as wp')
            ->join('groups as g', 'wp.kelompok_id', '=', 'g.id')
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN wp.status = "draft" THEN 1 ELSE 0 END) as draft'),
                DB::raw('SUM(CASE WHEN wp.status = "submitted" THEN 1 ELSE 0 END) as submitted'),
                DB::raw('SUM(CASE WHEN wp.status = "approved" THEN 1 ELSE 0 END) as approved'),
            ])
            ->where('g.period_id', $periodId)
            ->first();

        // Final Reports
        $finalReports = DB::table('final_reports as fr')
            ->join('groups as g', 'fr.kelompok_id', '=', 'g.id')
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN fr.status = "draft" THEN 1 ELSE 0 END) as draft'),
                DB::raw('SUM(CASE WHEN fr.status = "submitted" THEN 1 ELSE 0 END) as submitted'),
                DB::raw('SUM(CASE WHEN fr.status = "approved" THEN 1 ELSE 0 END) as approved'),
            ])
            ->where('g.period_id', $periodId)
            ->first();

        return [
            'daily_reports' => $dailyReports,
            'work_programs' => $workPrograms,
            'final_reports' => $finalReports,
        ];
    }

    private function getScoreStatistics(int $periodId): array
    {
        return DB::table('nilai_kkn as n')
            ->join('groups as g', 'n.kelompok_id', '=', 'g.id')
            ->select([
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN n.is_finalized = 1 THEN 1 ELSE 0 END) as finalized'),
                DB::raw('SUM(CASE WHEN n.is_finalized = 0 THEN 1 ELSE 0 END) as not_finalized'),
                DB::raw('AVG(n.total_score) as avg_score'),
                DB::raw('SUM(CASE WHEN n.letter_grade = "A" THEN 1 ELSE 0 END) as grade_a'),
                DB::raw('SUM(CASE WHEN n.letter_grade = "B" THEN 1 ELSE 0 END) as grade_b'),
                DB::raw('SUM(CASE WHEN n.letter_grade = "C" THEN 1 ELSE 0 END) as grade_c'),
                DB::raw('SUM(CASE WHEN n.letter_grade = "D" THEN 1 ELSE 0 END) as grade_d'),
                DB::raw('SUM(CASE WHEN n.letter_grade = "E" THEN 1 ELSE 0 END) as grade_e'),
            ])
            ->where('g.period_id', $periodId)
            ->first();
    }

    /**
     * Clear cache for a specific period
     */
    public function clearPeriodCache(int $periodId): void
    {
        Cache::forget("dashboard_stats_period_{$periodId}");
        
        $period = Period::find($periodId);
        if ($period) {
            Cache::forget("dashboard_stats_batch_{$period->angkatan}");
        }
    }
}
4. Handling Dosen sebagai DPL di Beberapa Jenis KKN
Solusi: Schema saat ini SUDAH MENDUKUNG, karena relasi groups.dpl_id → lecturers.id dan groups.period_id yang berbeda.
php// app/Services/LecturerService.php
<?php

namespace App\Services;

use App\Models\Lecturer;
use App\Models\Group;
use Illuminate\Support\Facades\DB;

class LecturerService
{
    /**
     * Get lecturer assignments across different KKN types
     */
    public function getLecturerAssignments(int $lecturerId, ?int $angkatan = null): array
    {
        $query = Group::with(['period.academicYear', 'location'])
            ->where('dpl_id', $lecturerId)
            ->whereHas('period', function ($q) use ($angkatan) {
                if ($angkatan) {
                    $q->where('angkatan', $angkatan);
                }
            });

        $groups = $query->get()->groupBy('period.jenis');

        return [
            'lecturer' => Lecturer::with('faculty')->find($lecturerId),
            'assignments' => $groups->map(function ($groupsByType, $jenisKkn) {
                return [
                    'jenis_kkn' => $jenisKkn,
                    'total_groups' => $groupsByType->count(),
                    'total_students' => DB::table('registrations')
                        ->whereIn('kelompok_id', $groupsByType->pluck('id'))
                        ->count(),
                    'groups' => $groupsByType->map(function ($group) {
                        return [
                            'id' => $group->id,
                            'code' => $group->code,
                            'nama_kelompok' => $group->nama_kelompok,
                            'location' => $group->location?->village_name,
                            'member_count' => $group->registrations()->count(),
                        ];
                    }),
                ];
            })->toArray(),
        ];
    }

    /**
     * Check if lecturer can be assigned to a new group
     */
    public function canAssignToGroup(int $lecturerId, int $periodId): array
    {
        $currentGroups = Group::where('dpl_id', $lecturerId)
            ->where('period_id', $periodId)
            ->count();

        // Aturan: maksimal 5 kelompok per jenis KKN
        $maxGroupsPerType = 5;
        $canAssign = $currentGroups < $maxGroupsPerType;

        return [
            'can_assign' => $canAssign,
            'current_groups' => $currentGroups,
            'max_groups' => $maxGroupsPerType,
            'remaining_slots' => max(0, $maxGroupsPerType - $currentGroups),
        ];
    }

    /**
     * Get lecturer workload summary across all batches
     */
    public function getLecturerWorkload(int $lecturerId): array
    {
        return DB::table('groups as g')
            ->join('periods as p', 'g.period_id', '=', 'p.id')
            ->leftJoin(
                DB::raw('(SELECT kelompok_id, COUNT(*) as student_count 
                         FROM registrations 
                         GROUP BY kelompok_id) as r'),
                'g.id', '=', 'r.kelompok_id'
            )
            ->select([
                'p.angkatan',
                'p.jenis',
                'p.name as period_name',
                DB::raw('COUNT(g.id) as total_groups'),
                DB::raw('COALESCE(SUM(r.student_count), 0) as total_students'),
            ])
            ->where('g.dpl_id', $lecturerId)
            ->groupBy('p.id', 'p.angkatan', 'p.jenis', 'p.name')
            ->orderBy('p.angkatan', 'desc')
            ->orderBy('p.jenis')
            ->get()
            ->toArray();
    }
}
5. Handling Perpindahan Mahasiswa antar Jenis KKN
php// app/Services/StudentTransferService.php
<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Registration;
use App\Models\PeriodTransfer;
use App\Models\Period;
use Illuminate\Support\Facades\DB;
use Exception;

class StudentTransferService
{
    /**
     * Request transfer to different KKN type
     */
    public function requestTransfer(
        int $studentId,
        int $fromPeriodId,
        int $toPeriodId,
        string $reason
    ): PeriodTransfer {
        // Validasi
        $this->validateTransfer($studentId, $fromPeriodId, $toPeriodId);

        DB::beginTransaction();
        try {
            $fromRegistration = Registration::where('mahasiswa_id', $studentId)
                ->where('period_id', $fromPeriodId)
                ->firstOrFail();

            // Create transfer request
            $transfer = PeriodTransfer::create([
                'mahasiswa_id' => $studentId,
                'from_period_id' => $fromPeriodId,
                'to_period_id' => $toPeriodId,
                'from_kelompok_id' => $fromRegistration->kelompok_id,
                'to_kelompok_id' => null,
                'status' => 'pending',
                'reason' => $reason,
            ]);

            DB::commit();
            return $transfer;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Approve transfer
     */
    public function approveTransfer(int $transferId, int $approvedBy, ?string $notes = null): void
    {
        DB::beginTransaction();
        try {
            $transfer = PeriodTransfer::findOrFail($transferId);
            
            if ($transfer->status !== 'pending') {
                throw new Exception('Transfer sudah diproses sebelumnya');
            }

            // Update status di periode lama menjadi 'transferred'
            Registration::where('mahasiswa_id', $transfer->mahasiswa_id)
                ->where('period_id', $transfer->from_period_id)
                ->update([
                    'status' => 'transferred',
                    'notes' => 'Dipindahkan ke ' . $transfer->toPeriod->name,
                ]);

            // Buat registrasi baru di periode tujuan
            $newRegistration = Registration::create([
                'mahasiswa_id' => $transfer->mahasiswa_id,
                'period_id' => $transfer->to_period_id,
                'kelompok_id' => null, // Belum di-assign kelompok
                'status' => 'approved', // Langsung approved karena transfer
                'registration_date' => now(),
                'approved_at' => now(),
                'approved_by' => $approvedBy,
                'notes' => 'Transfer dari ' . $transfer->fromPeriod->name,
            ]);

            // Update transfer record
            $transfer->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
                'notes' => $notes,
            ]);

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reject transfer
     */
    public function rejectTransfer(int $transferId, int $rejectedBy, string $notes): void
    {
        $transfer = PeriodTransfer::findOrFail($transferId);
        
        if ($transfer->status !== 'pending') {
            throw new Exception('Transfer sudah diproses sebelumnya');
        }

        $transfer->update([
            'status' => 'rejected',
            'approved_by' => $rejectedBy,
            'approved_at' => now(),
            'notes' => $notes,
        ]);
    }

    /**
     * Validate transfer request
     */
    private function validateTransfer(
        int $studentId,
        int $fromPeriodId,
        int $toPeriodId
    ): void {
        // Cek periode dari dan tujuan harus dalam angkatan yang sama
        $fromPeriod = Period::findOrFail($fromPeriodId);
        $toPeriod = Period::findOrFail($toPeriodId);

        if ($fromPeriod->angkatan !== $toPeriod->angkatan) {
            throw new Exception('Transfer hanya bisa dilakukan dalam satu angkatan yang sama');
        }

        // Cek mahasiswa sudah terdaftar di periode asal
        $existingRegistration = Registration::where('mahasiswa_id', $studentId)
            ->where('period_id', $fromPeriodId)
            ->exists();

        if (!$existingRegistration) {
            throw new Exception('Mahasiswa tidak terdaftar di periode asal');
        }

        // Cek mahasiswa belum terdaftar di periode tujuan
        $alreadyInTarget = Registration::where('mahasiswa_id', $studentId)
            ->where('period_id', $toPeriodId)
            ->exists();

        if ($alreadyInTarget) {
            throw new Exception('Mahasiswa sudah terdaftar di periode tujuan');
        }

        // Cek ada pending transfer
        $pendingTransfer = PeriodTransfer::where('mahasiswa_id', $studentId)
            ->where('status', 'pending')
            ->exists();

        if ($pendingTransfer) {
            throw new Exception('Masih ada pengajuan transfer yang pending');
        }

        // Cek kuota periode tujuan
        $registeredCount = Registration::where('period_id', $toPeriodId)->count();
        if ($registeredCount >= $toPeriod->kuota) {
            throw new Exception('Kuota periode tujuan sudah penuh');
        }
    }
}

6. Best Practice Pagination & Performa (Lanjutan)
A. Query Scope untuk Filtering
php// app/Models/Registration.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Registration extends Model
{
    protected $table = 'registrations';
    
    protected $fillable = [
        'mahasiswa_id', 'period_id', 'kelompok_id', 'status',
        'registration_date', 'approved_at', 'approved_by', 'notes'
    ];

    protected $casts = [
        'registration_date' => 'datetime',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'mahasiswa_id');
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'kelompok_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Query Scopes
    public function scopeByPeriod(Builder $query, int $periodId): Builder
    {
        return $query->where('period_id', $periodId);
    }

    public function scopeByAngkatan(Builder $query, int $angkatan): Builder
    {
        return $query->whereHas('period', function ($q) use ($angkatan) {
            $q->where('angkatan', $angkatan);
        });
    }

    public function scopeByJenisKkn(Builder $query, string $jenis): Builder
    {
        return $query->whereHas('period', function ($q) use ($jenis) {
            $q->where('jenis', $jenis);
        });
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeWithGroup(Builder $query): Builder
    {
        return $query->whereNotNull('kelompok_id');
    }

    public function scopeWithoutGroup(Builder $query): Builder
    {
        return $query->whereNull('kelompok_id');
    }

    public function scopeByFaculty(Builder $query, int $facultyId): Builder
    {
        return $query->whereHas('mahasiswa', function ($q) use ($facultyId) {
            $q->where('faculty_id', $facultyId);
        });
    }

    public function scopeByProgram(Builder $query, int $programId): Builder
    {
        return $query->whereHas('mahasiswa', function ($q) use ($programId) {
            $q->where('program_id', $programId);
        });
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (!$search) {
            return $query;
        }

        return $query->whereHas('mahasiswa', function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('nim', 'like', "%{$search}%");
        });
    }

    public function scopeWithRelations(Builder $query): Builder
    {
        return $query->with([
            'mahasiswa:id,nim,name,faculty_id,program_id,batch_year',
            'mahasiswa.faculty:id,name,code',
            'mahasiswa.program:id,name,code',
            'kelompok:id,code,nama_kelompok,location_id',
            'kelompok.location:id,village_name',
            'period:id,angkatan,jenis,name'
        ]);
    }
}
B. Service Layer dengan Caching
php// app/Services/StudentRegistrationService.php
<?php

namespace App\Services;

use App\Models\Registration;
use App\Models\Student;
use App\Models\Period;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class StudentRegistrationService
{
    /**
     * Get paginated students with advanced filtering
     */
    public function getFilteredStudents(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Registration::query();

        // Apply period filter (mandatory)
        if (isset($filters['period_id'])) {
            $query->byPeriod($filters['period_id']);
        }

        // Apply optional filters
        if (isset($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (isset($filters['faculty_id'])) {
            $query->byFaculty($filters['faculty_id']);
        }

        if (isset($filters['program_id'])) {
            $query->byProgram($filters['program_id']);
        }

        if (isset($filters['kelompok_id'])) {
            $query->where('kelompok_id', $filters['kelompok_id']);
        }

        if (isset($filters['has_group'])) {
            $filters['has_group'] ? $query->withGroup() : $query->withoutGroup();
        }

        if (isset($filters['search'])) {
            $query->search($filters['search']);
        }

        // Eager load relationships
        $query->withRelations();

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        if ($sortBy === 'name') {
            $query->join('students as s', 'registrations.mahasiswa_id', '=', 's.id')
                  ->orderBy('s.name', $sortOrder)
                  ->select('registrations.*');
        } elseif ($sortBy === 'nim') {
            $query->join('students as s', 'registrations.mahasiswa_id', '=', 's.id')
                  ->orderBy('s.nim', $sortOrder)
                  ->select('registrations.*');
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get students for export (no pagination, with memory optimization)
     */
    public function getStudentsForExport(array $filters): \Generator
    {
        $query = Registration::query();

        // Apply same filters as paginated version
        if (isset($filters['period_id'])) {
            $query->byPeriod($filters['period_id']);
        }

        // ... apply other filters ...

        $query->withRelations();

        // Use chunk for memory efficiency
        foreach ($query->cursor() as $registration) {
            yield [
                'nim' => $registration->mahasiswa->nim,
                'nama' => $registration->mahasiswa->name,
                'fakultas' => $registration->mahasiswa->faculty->name ?? '-',
                'prodi' => $registration->mahasiswa->program->name ?? '-',
                'angkatan' => $registration->mahasiswa->batch_year,
                'kelompok' => $registration->kelompok?->nama_kelompok ?? 'Belum ditugaskan',
                'lokasi' => $registration->kelompok?->location?->village_name ?? '-',
                'status' => $registration->status,
                'tanggal_daftar' => $registration->registration_date->format('d/m/Y'),
            ];
        }
    }

    /**
     * Bulk assign students to groups
     */
    public function bulkAssignToGroup(array $studentIds, int $kelompokId): array
    {
        DB::beginTransaction();
        try {
            $updated = Registration::whereIn('mahasiswa_id', $studentIds)
                ->whereNull('kelompok_id')
                ->update([
                    'kelompok_id' => $kelompokId,
                    'status' => 'approved'
                ]);

            // Clear cache
            $this->clearRegistrationCache();

            DB::commit();
            return [
                'success' => true,
                'updated' => $updated,
                'message' => "{$updated} mahasiswa berhasil ditugaskan ke kelompok"
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Gagal menugaskan mahasiswa: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get registration summary for dashboard
     */
    public function getRegistrationSummary(int $periodId): array
    {
        $cacheKey = "registration_summary_{$periodId}";

        return Cache::remember($cacheKey, 300, function () use ($periodId) {
            $baseQuery = Registration::where('period_id', $periodId);

            return [
                'total' => $baseQuery->count(),
                'by_status' => $this->getCountByStatus($periodId),
                'by_faculty' => $this->getCountByFaculty($periodId),
                'assigned' => $baseQuery->whereNotNull('kelompok_id')->count(),
                'unassigned' => $baseQuery->whereNull('kelompok_id')->count(),
            ];
        });
    }

    private function getCountByStatus(int $periodId): array
    {
        return DB::table('registrations')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('period_id', $periodId)
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    private function getCountByFaculty(int $periodId): array
    {
        return DB::table('registrations as r')
            ->join('students as s', 'r.mahasiswa_id', '=', 's.id')
            ->join('faculties as f', 's.faculty_id', '=', 'f.id')
            ->select('f.name', DB::raw('COUNT(*) as count'))
            ->where('r.period_id', $periodId)
            ->groupBy('f.id', 'f.name')
            ->pluck('count', 'name')
            ->toArray();
    }

    public function clearRegistrationCache(?int $periodId = null): void
    {
        if ($periodId) {
            Cache::forget("registration_summary_{$periodId}");
            Cache::forget("dashboard_stats_period_{$periodId}");
        } else {
            // Clear all registration caches
            Cache::tags(['registrations'])->flush();
        }
    }
}
7. Implementasi Controller dengan Inertia.js
php// app/Http/Controllers/StudentRegistrationController.php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentRegistrationRequest;
use App\Services\StudentRegistrationService;
use App\Services\DashboardService;
use App\Helpers\PeriodHelper;
use App\Models\Period;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentRegistrationController extends Controller
{
    public function __construct(
        private StudentRegistrationService $registrationService,
        private DashboardService $dashboardService
    ) {}

    /**
     * Display list of registered students
     */
    public function index(Request $request): Response
    {
        // Get active period from session
        $activePeriodId = PeriodHelper::getActivePeriodId();
        
        if (!$activePeriodId) {
            return Inertia::render('Students/NoPeriodSelected');
        }

        // Build filters
        $filters = [
            'period_id' => $activePeriodId,
            'status' => $request->input('status'),
            'faculty_id' => $request->input('faculty_id'),
            'program_id' => $request->input('program_id'),
            'kelompok_id' => $request->input('kelompok_id'),
            'has_group' => $request->input('has_group'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by', 'created_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
        ];

        // Get paginated data
        $students = $this->registrationService->getFilteredStudents(
            $filters,
            $request->input('per_page', 15)
        );

        // Get summary statistics
        $summary = $this->registrationService->getRegistrationSummary($activePeriodId);

        // Get filter options
        $filterOptions = $this->getFilterOptions($activePeriodId);

        return Inertia::render('Students/Index', [
            'students' => $students,
            'summary' => $summary,
            'filters' => $filters,
            'filterOptions' => $filterOptions,
            'availablePeriods' => PeriodHelper::getAvailablePeriods(),
        ]);
    }

    /**
     * Display dashboard with statistics
     */
    public function dashboard(Request $request): Response
    {
        $activePeriodId = PeriodHelper::getActivePeriodId();
        
        if (!$activePeriodId) {
            return Inertia::render('Dashboard/NoPeriodSelected');
        }

        $activePeriod = Period::with('academicYear')->find($activePeriodId);
        
        // Get comprehensive statistics
        $stats = $this->dashboardService->getPeriodStatistics($activePeriodId);

        // Get batch comparison if requested
        $batchStats = null;
        if ($request->input('show_batch_comparison')) {
            $batchStats = $this->dashboardService->getBatchStatistics($activePeriod->angkatan);
        }

        return Inertia::render('Dashboard/Index', [
            'activePeriod' => $activePeriod,
            'statistics' => $stats,
            'batchStatistics' => $batchStats,
            'availablePeriods' => PeriodHelper::getAvailablePeriods(),
        ]);
    }

    /**
     * Bulk assign students to group
     */
    public function bulkAssign(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'kelompok_id' => 'required|exists:groups,id',
        ]);

        $result = $this->registrationService->bulkAssignToGroup(
            $request->student_ids,
            $request->kelompok_id
        );

        if ($result['success']) {
            return back()->with('success', $result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /**
     * Export students to Excel
     */
    public function export(Request $request)
    {
        $activePeriodId = PeriodHelper::getActivePeriodId();
        
        $filters = [
            'period_id' => $activePeriodId,
            'status' => $request->input('status'),
            'faculty_id' => $request->input('faculty_id'),
            'program_id' => $request->input('program_id'),
            'kelompok_id' => $request->input('kelompok_id'),
            'search' => $request->input('search'),
        ];

        // Use generator for memory efficiency
        $students = $this->registrationService->getStudentsForExport($filters);

        // Create Excel file
        return $this->generateExcel($students);
    }

    /**
     * Get filter options for dropdowns
     */
    private function getFilterOptions(int $periodId): array
    {
        return [
            'statuses' => [
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'document_submitted', 'label' => 'Dokumen Terkirim'],
                ['value' => 'approved', 'label' => 'Disetujui'],
                ['value' => 'rejected', 'label' => 'Ditolak'],
                ['value' => 'completed', 'label' => 'Selesai'],
            ],
            'faculties' => Faculty::select('id', 'name')->get(),
            'programs' => Program::with('faculty:id,name')
                ->select('id', 'name', 'faculty_id')
                ->get(),
            'groups' => Group::where('period_id', $periodId)
                ->select('id', 'code', 'nama_kelompok')
                ->get(),
        ];
    }

    /**
     * Generate Excel export
     */
    private function generateExcel(\Generator $students)
    {
        $period = PeriodHelper::getActivePeriod();
        $filename = "mahasiswa_kkn_{$period->angkatan}_{$period->jenis}_" . date('Y-m-d') . ".xlsx";

        return response()->streamDownload(function () use ($students) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, [
                'NIM', 'Nama', 'Fakultas', 'Program Studi', 
                'Angkatan', 'Kelompok', 'Lokasi', 'Status', 'Tanggal Daftar'
            ]);

            // Data rows
            foreach ($students as $student) {
                fputcsv($file, $student);
            }

            fclose($file);
        }, $filename);
    }
}
8. React Component untuk Student List
typescript// resources/js/Pages/Students/Index.tsx
import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { debounce } from 'lodash';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PeriodSelector from '@/Components/PeriodSelector';
import Pagination from '@/Components/Pagination';

interface Student {
  id: number;
  mahasiswa: {
    nim: string;
    name: string;
    faculty: { name: string; code: string };
    program: { name: string; code: string };
    batch_year: number;
  };
  kelompok?: {
    code: string;
    nama_kelompok: string;
    location?: { village_name: string };
  };
  status: string;
  registration_date: string;
}

interface Props {
  students: {
    data: Student[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total: number;
    by_status: Record<string, number>;
    by_faculty: Record<string, number>;
    assigned: number;
    unassigned: number;
  };
  filters: {
    status?: string;
    faculty_id?: number;
    program_id?: number;
    kelompok_id?: number;
    search?: string;
    sort_by: string;
    sort_order: string;
  };
  filterOptions: {
    statuses: Array<{ value: string; label: string }>;
    faculties: Array<{ id: number; name: string }>;
    programs: Array<{ id: number; name: string; faculty_id: number }>;
    groups: Array<{ id: number; code: string; nama_kelompok: string }>;
  };
  availablePeriods: Record<number, any[]>;
}

export default function StudentIndex({
  students,
  summary,
  filters,
  filterOptions,
  availablePeriods,
}: Props) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  // Debounced search
  const handleSearch = debounce((search: string) => {
    router.get(
      route('students.index'),
      { ...filters, search },
      { preserveState: true, preserveScroll: true }
    );
  }, 500);

  const handleFilterChange = (key: string, value: any) => {
    router.get(
      route('students.index'),
      { ...filters, [key]: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSort = (column: string) => {
    const newOrder =
      filters.sort_by === column && filters.sort_order === 'asc'
        ? 'desc'
        : 'asc';

    router.get(
      route('students.index'),
      { ...filters, sort_by: column, sort_order: newOrder },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleBulkAssign = (kelompokId: number) => {
    router.post(
      route('students.bulk-assign'),
      {
        student_ids: selectedStudents,
        kelompok_id: kelompokId,
      },
      {
        onSuccess: () => {
          setSelectedStudents([]);
          setShowBulkAssign(false);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      document_submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      document_submitted: 'Dokumen Terkirim',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      completed: 'Selesai',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          badges[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title="Daftar Mahasiswa KKN" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Period Selector */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Daftar Mahasiswa KKN
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Total {summary.total} mahasiswa terdaftar
              </p>
            </div>
            <PeriodSelector availablePeriods={availablePeriods} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="Total Mahasiswa"
              value={summary.total}
              icon="👥"
              color="blue"
            />
            <SummaryCard
              title="Sudah Ditugaskan"
              value={summary.assigned}
              icon="✅"
              color="green"
            />
            <SummaryCard
              title="Belum Ditugaskan"
              value={summary.unassigned}
              icon="⏳"
              color="yellow"
            />
            <SummaryCard
              title="Disetujui"
              value={summary.by_status.approved || 0}
              icon="👍"
              color="indigo"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari
                </label>
                <input
                  type="text"
                  placeholder="NIM atau Nama..."
                  defaultValue={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) =>
                    handleFilterChange('status', e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Status</option>
                  {filterOptions.statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fakultas
                </label>
                <select
                  value={filters.faculty_id || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'faculty_id',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Fakultas</option>
                  {filterOptions.faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kelompok
                </label>
                <select
                  value={filters.kelompok_id || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'kelompok_id',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Kelompok</option>
                  {filterOptions.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.code} - {group.nama_kelompok}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="flex gap-2">
                {selectedStudents.length > 0 && (
                  <button
                    onClick={() => setShowBulkAssign(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Tugaskan {selectedStudents.length} Mahasiswa
                  </button>
                )}
              </div>
              
                href={route('students.export', filters)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📥 Export Excel
              </a>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(students.data.map((s) => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                      checked={selectedStudents.length === students.data.length}
                    />
                  </th>
                  <SortableHeader
                    label="NIM"
                    column="nim"
                    currentSort={filters.sort_by}
                    currentOrder={filters.sort_order}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Nama"
                    column="name"
                    currentSort={filters.sort_by}
                    currentOrder={filters.sort_order}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fakultas/Prodi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kelompok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.data.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(
                              selectedStudents.filter((id) => id !== student.id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.mahasiswa.nim}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.mahasiswa.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Angkatan {student.mahasiswa.batch_year}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {student.mahasiswa.faculty.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.mahasiswa.program.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.kelompok ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.kelompok.code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.kelompok.location?.village_name || '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Belum ditugaskan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Detail
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <Pagination data={students} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// Helper Components
function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentOrder: string;
  onSort: (column: string) => void;
}) {
  const isActive = currentSort === column;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span>{currentOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );
}
9. Optimisasi Database Query dengan Raw Queries
php// app/Repositories/StudentRepository.php
<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class StudentRepository
{
    /**
     * Get optimized student list with single query
     * Menggunakan raw query untuk performa maksimal
     */
    public function getStudentsOptimized(array $filters, int $perPage = 15)
    {
        $sql = "
            SELECT 
                r.id,
                r.status,
                r.registration_date,
                r.kelompok_id,
                s.id as student_id,
                s.nim,
                s.name as student_name,
                s.batch_year,
                f.id as faculty_id,
                f.name as faculty_name,
                f.code as faculty_code,
                p.id as program_id,
                p.name as program_name,
                p.code as program_code,
                g.code as group_code,
                g.nama_kelompok,
                l.village_name as location_name
            FROM registrations r
            INNER JOIN students s ON r.mahasiswa_id = s.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN programs p ON s.program_id = p.id
            LEFT JOIN `groups` g ON r.kelompok_id = g.id
            LEFT JOIN locations l ON g.location_id = l.id
            WHERE r.period_id = :period_id
        ";

        $bindings = ['period_id' => $filters['period_id']];

        // Add conditional filters
        if (!empty($filters['status'])) {
            $sql .= " AND r.status = :status";
            $bindings['status'] = $filters['status'];
        }

        if (!empty($filters['faculty_id'])) {
            $sql .= " AND s.faculty_id = :faculty_id";
            $bindings['faculty_id'] = $filters['faculty_id'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (s.name LIKE :search OR s.nim LIKE :search)";
            $bindings['search'] = "%{$filters['search']}%";
        }

        // Order by
        $sql .= " ORDER BY s.name ASC";

        // Execute query
        $results = DB::select($sql, $bindings);

        // Manual pagination
        $total = count($results);
        $currentPage = request()->input('page', 1);
        $offset = ($currentPage - 1) * $perPage;
        
        $paginatedResults = array_slice($results, $offset, $perPage);

        return [
            'data' => $paginatedResults,
            'current_page' => $currentPage,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
        ];
    }
}
Kesimpulan & Best Practices
✅ Schema Database sudah SOLID untuk multi-angkatan & multi-jenis KKN
🎯 Rekomendasi Implementasi:

Active Period Context: Session + Middleware ✅
Caching Strategy: Cache statistik 5 menit, clear on update ✅
Query Optimization: Index, Eager Loading, Query Scopes ✅
Pagination: 15-25 items per page untuk UX terbaik ✅
Multi-DPL: Schema sudah support, track via groups table ✅
Transfer Mahasiswa: Gunakan tabel period_transfers ✅

📊 Performance Tips:

Gunakan Database Index pada kolom yang sering di-query
Cache statistik dashboard (TTL 5-10 menit)
Lazy Load relasi yang tidak selalu dibutuhkan
Chunk/Cursor untuk export data besar
Queue untuk proses bulk assignment
Redis untuk session & cache jika traffic tinggi

------

Saya akan menganalisis arsitektur Sistem Informasi KKN Anda secara komprehensif. Ini adalah sistem yang cukup kompleks dengan multi-tenancy implisit (per angkatan/periode). Mari kita bahas satu per satu.
1. Analisis Schema Database
Evaluasi Schema Saat Ini
Schema Anda sudah cukup baik untuk menangani multi-angkatan + multi-jenis KKN, namun ada beberapa critical improvements yang diperlukan:
Issues yang Perlu Diperbaiki:
Tidak ada tracking history perpindahan mahasiswa (penting untuk audit)
Relasi DPL-Kelompok perlu direvisi untuk handle 1 dosen di multiple jenis KKN
Kurangnya soft deletes untuk data sensitif
Tidak ada tabel pivot untuk DPL-Period (many-to-many)
Migration Script: Improvements
php
Copy
<?php
// database/migrations/2025_02_15_000001_improve_kkn_schema.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel pivot: DPL bisa mengajar di multiple periode
        Schema::create('dpl_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lecturer_id')->constrained('lecturers')->onDelete('cascade');
            $table->foreignId('period_id')->constrained('periods')->onDelete('cascade');
            $table->integer('max_groups')->default(5); // Maksimal kelompok yang bisa dibimbing
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['lecturer_id', 'period_id']);
        });

        // 2. History perpindahan mahasiswa (AUDIT TRAIL)
        Schema::create('registration_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations');
            $table->foreignId('from_period_id')->nullable()->constrained('periods');
            $table->foreignId('to_period_id')->constrained('periods');
            $table->foreignId('from_group_id')->nullable()->constrained('groups');
            $table->foreignId('to_group_id')->nullable()->constrained('groups');
            $table->string('reason'); // alasan perpindahan
            $table->foreignId('processed_by')->constrained('users');
            $table->timestamp('processed_at');
            $table->timestamps();
        });

        // 3. Modifikasi tabel groups: DPL diambil dari dpl_periods
        Schema::table('groups', function (Blueprint $table) {
            // Hapus foreign key lama jika ada
            // $table->dropForeign(['dpl_id']);
            // $table->dropColumn('dpl_id');
            
            // Tambah relasi ke dpl_periods
            $table->foreignId('dpl_period_id')->nullable()->after('period_id')
                  ->constrained('dpl_periods')->nullOnDelete();
        });

        // 4. Add soft deletes ke tabel penting
        Schema::table('periods', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('groups', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('registrations', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('daily_reports', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('final_reports', fn(Blueprint $t) => $t->softDeletes());

        // 5. Add indexes untuk performa
        Schema::table('registrations', function (Blueprint $table) {
            $table->index(['period_id', 'status']);
            $table->index(['mahasiswa_id', 'period_id']);
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->index(['kelompok_id', 'date']);
            $table->index(['mahasiswa_id', 'status']);
        });

        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->index(['kelompok_id', 'is_finalized']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_histories');
        Schema::dropIfExists('dpl_periods');
        
        Schema::table('groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dpl_period_id');
            $table->foreignId('dpl_id')->constrained('lecturers');
        });
    }
};
2. Active Period Selector Architecture
Rekomendasi: Hybrid Approach (Session + URL Parameter)
Alasan:
Session: Menyimpan context aktif agar tidak hilang saat navigasi
URL Parameter: Untuk shareable links dan bookmark specific period
Implementasi:
php
Copy
<?php
// app/Http/Middleware/HandleActivePeriod.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\PeriodContextService;
use Symfony\Component\HttpFoundation\Response;

class HandleActivePeriod
{
    public function __construct(
        private PeriodContextService $contextService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Priority: URL Parameter > Session > Default (active period)
        $periodId = $request->query('period_id') 
            ?? session('active_period_id')
            ?? $this->contextService->getDefaultPeriodId();

        if ($periodId) {
            $this->contextService->setActivePeriod((int) $periodId);
            
            // Share ke Inertia
            \Inertia\Inertia::share('activePeriod', fn() => [
                'id' => $periodId,
                'data' => $this->contextService->getActivePeriodData()
            ]);
        }

        return $next($request);
    }
}
php
Copy
<?php
// app/Services/PeriodContextService.php

namespace App\Services;

use App\Models\Period;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;

class PeriodContextService
{
    private const CACHE_PREFIX = 'period_context:';
    private const SESSION_KEY = 'active_period_id';

    public function setActivePeriod(int $periodId): void
    {
        $period = Period::with(['academicYear'])->findOrFail($periodId);
        
        Session::put(self::SESSION_KEY, $periodId);
        Session::put('active_period_data', [
            'id' => $period->id,
            'angkatan' => $period->angkatan,
            'jenis' => $period->jenis,
            'name' => $period->name,
            'academic_year' => $period->academicYear->year,
        ]);

        // Cache untuk quick access
        Cache::put(self::CACHE_PREFIX . auth()->id(), $periodId, now()->addHours(24));
    }

    public function getActivePeriodId(): ?int
    {
        return Session::get(self::SESSION_KEY);
    }

    public function getActivePeriodData(): ?array
    {
        return Session::get('active_period_data');
    }

    public function getDefaultPeriodId(): ?int
    {
        return Period::where('is_active', true)
            ->orderBy('angkatan', 'desc')
            ->value('id');
    }

    public function clear(): void
    {
        Session::forget([self::SESSION_KEY, 'active_period_data']);
        Cache::forget(self::CACHE_PREFIX . auth()->id());
    }
}
TypeScript
Copy
// resources/js/Components/PeriodSelector.tsx
import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Check, ChevronDown, GraduationCap } from 'lucide-react';

interface Period {
  id: number;
  angkatan: number;
  jenis: string;
  name: string;
  academic_year: string;
}

export function PeriodSelector() {
  const { activePeriod, auth } = usePage().props as any;
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch available periods untuk user ini
    fetch('/api/available-periods')
      .then(r => r.json())
      .then(setPeriods);
  }, []);

  const selectPeriod = (period: Period) => {
    router.visit(window.location.pathname, {
      data: { period_id: period.id },
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => window.location.reload() // Reload untuk refresh context
    });
  };

  if (!activePeriod?.data) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                   text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80 font-medium tracking-wider uppercase">
            Periode Aktif
          </span>
          <span className="font-bold text-sm">
            KKN {activePeriod.data.angkatan} • {activePeriod.data.jenis}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-2xl 
                        border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pilih Periode KKN
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => selectPeriod(period)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 
                           transition-colors text-left border-b border-gray-50 last:border-0
                           ${activePeriod.data.id === period.id ? 'bg-indigo-50' : ''}`}
              >
                <div className={`p-2 rounded-lg ${
                  activePeriod.data.id === period.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Angkatan {period.angkatan} • {period.jenis}
                  </p>
                  <p className="text-xs text-gray-500">
                    {period.name} • {period.academic_year}
                  </p>
                </div>
                {activePeriod.data.id === period.id && (
                  <Check className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
3. Query Optimal untuk Dashboard Statistik
php
Copy
<?php
// app/Services/Dashboard/DashboardStatisticsService.php

namespace App\Services\Dashboard;

use App\Models\Period;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardStatisticsService
{
    public function getPeriodStatistics(int $periodId): array
    {
        $cacheKey = "dashboard:period:{$periodId}";
        
        return Cache::remember($cacheKey, 300, function () use ($periodId) {
            $period = Period::findOrFail($periodId);
            
            // Base query dengan eager loading yang dioptimalkan
            $baseQuery = DB::table('registrations')
                ->where('period_id', $periodId)
                ->whereNull('deleted_at');

            return [
                'summary' => $this->getSummaryStats($periodId, $baseQuery),
                'students_by_status' => $this->getStudentsByStatus($periodId),
                'daily_report_progress' => $this->getDailyReportProgress($periodId),
                'work_program_progress' => $this->getWorkProgramProgress($periodId),
                'grade_distribution' => $this->getGradeDistribution($periodId),
                'dpl_workload' => $this->getDplWorkload($periodId),
                'recent_activities' => $this->getRecentActivities($periodId),
            ];
        });
    }

    private function getSummaryStats(int $periodId, $baseQuery): array
    {
        // Single query dengan subquery untuk performa optimal
        $stats = DB::selectOne("
            SELECT 
                (SELECT COUNT(*) FROM registrations 
                 WHERE period_id = ? AND status IN ('approved', 'completed') AND deleted_at IS NULL) as total_students,
                
                (SELECT COUNT(DISTINCT dpl_periods.lecturer_id) 
                 FROM groups 
                 JOIN dpl_periods ON groups.dpl_period_id = dpl_periods.id 
                 WHERE groups.period_id = ? AND groups.deleted_at IS NULL) as total_dpl,
                
                (SELECT COUNT(*) FROM groups 
                 WHERE period_id = ? AND deleted_at IS NULL) as total_groups,
                
                (SELECT COUNT(*) FROM groups 
                 WHERE period_id = ? AND status = 'active' AND deleted_at IS NULL) as active_groups,
                
                (SELECT COUNT(*) FROM daily_reports dr
                 JOIN registrations r ON dr.mahasiswa_id = r.mahasiswa_id AND r.period_id = ?
                 WHERE dr.status = 'approved' AND dr.deleted_at IS NULL) as approved_reports
        ", [$periodId, $periodId, $periodId, $periodId, $periodId]);

        return [
            'total_students' => (int) $stats->total_students,
            'total_dpl' => (int) $stats->total_dpl,
            'total_groups' => (int) $stats->total_groups,
            'active_groups' => (int) $stats->active_groups,
            'approved_reports' => (int) $stats->approved_reports,
            'target_reports' => $this->calculateTargetReports($periodId),
        ];
    }

    private function getStudentsByStatus(int $periodId): array
    {
        return DB::table('registrations')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('period_id', $periodId)
            ->whereNull('deleted_at')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    private function getDailyReportProgress(int $periodId): array
    {
        // Progress laporan harian per kelompok
        return DB::table('groups')
            ->select(
                'groups.id',
                'groups.code as group_code',
                'groups.nama_kelompok',
                DB::raw('COUNT(DISTINCT registrations.mahasiswa_id) as total_students'),
                DB::raw('COUNT(DISTINCT CASE WHEN daily_reports.status = \'approved\' THEN daily_reports.id END) as approved_reports'),
                DB::raw('COUNT(DISTINCT daily_reports.id) as total_reports')
            )
            ->leftJoin('registrations', 'groups.id', '=', 'registrations.kelompok_id')
            ->leftJoin('daily_reports', 'registrations.mahasiswa_id', '=', 'daily_reports.mahasiswa_id')
            ->where('groups.period_id', $periodId)
            ->whereNull('groups.deleted_at')
            ->groupBy('groups.id', 'groups.code', 'groups.nama_kelompok')
            ->get()
            ->map(fn($g) => [
                'group_id' => $g->id,
                'group_code' => $g->group_code,
                'group_name' => $g->nama_kelompok,
                'total_students' => (int) $g->total_students,
                'approved_reports' => (int) $g->approved_reports,
                'total_reports' => (int) $g->total_reports,
                'progress_percentage' => $g->total_students > 0 
                    ? round(($g->approved_reports / ($g->total_students * 30)) * 100, 2) // Asumsi 30 hari KKN
                    : 0,
            ])
            ->toArray();
    }

    private function getWorkProgramProgress(int $periodId): array
    {
        return DB::table('work_programs')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->join('groups', 'work_programs.kelompok_id', '=', 'groups.id')
            ->where('groups.period_id', $periodId)
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    private function getGradeDistribution(int $periodId): array
    {
        return DB::table('nilai_kkn')
            ->select('letter_grade', DB::raw('COUNT(*) as count'))
            ->join('registrations', 'nilai_kkn.mahasiswa_id', '=', 'registrations.mahasiswa_id')
            ->where('registrations.period_id', $periodId)
            ->where('nilai_kkn.is_finalized', true)
            ->groupBy('letter_grade')
            ->orderByRaw("FIELD(letter_grade, 'A', 'B+', 'B', 'C+', 'C', 'D', 'E')")
            ->pluck('count', 'letter_grade')
            ->toArray();
    }

    private function getDplWorkload(int $periodId): array
    {
        return DB::table('dpl_periods')
            ->select(
                'lecturers.name as dpl_name',
                'lecturers.nip',
                DB::raw('COUNT(DISTINCT groups.id) as total_groups'),
                DB::raw('COUNT(DISTINCT registrations.mahasiswa_id) as total_students'),
                DB::raw('COUNT(DISTINCT daily_reports.id) as pending_reviews')
            )
            ->join('lecturers', 'dpl_periods.lecturer_id', '=', 'lecturers.id')
            ->leftJoin('groups', 'dpl_periods.id', '=', 'groups.dpl_period_id')
            ->leftJoin('registrations', 'groups.id', '=', 'registrations.kelompok_id')
            ->leftJoin('daily_reports', function($join) {
                $join->on('registrations.mahasiswa_id', '=', 'daily_reports.mahasiswa_id')
                     ->where('daily_reports.status', 'pending');
            })
            ->where('dpl_periods.period_id', $periodId)
            ->where('dpl_periods.is_active', true)
            ->groupBy('lecturers.id', 'lecturers.name', 'lecturers.nip')
            ->get()
            ->toArray();
    }

    private function getRecentActivities(int $periodId): array
    {
        // Union dari berbagai tabel untuk activity feed
        $reports = DB::table('daily_reports')
            ->select(
                DB::raw('\'report\' as type'),
                'daily_reports.created_at',
                'students.name as actor_name',
                DB::raw('CONCAT(\'Mengirim laporan harian: \', daily_reports.title) as description')
            )
            ->join('students', 'daily_reports.mahasiswa_id', '=', 'students.id')
            ->join('registrations', 'students.id', '=', 'registrations.mahasiswa_id')
            ->where('registrations.period_id', $periodId)
            ->where('daily_reports.created_at', '>', now()->subDays(7));

        $registrations = DB::table('registrations')
            ->select(
                DB::raw('\'registration\' as type'),
                'registrations.created_at',
                'students.name as actor_name',
                DB::raw('CONCAT(\'Mendaftar KKN dengan status: \', registrations.status) as description')
            )
            ->join('students', 'registrations.mahasiswa_id', '=', 'students.id')
            ->where('registrations.period_id', $periodId)
            ->where('registrations.created_at', '>', now()->subDays(7));

        return $reports
            ->union($registrations)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->toArray();
    }

    private function calculateTargetReports(int $periodId): int
    {
        $studentCount = DB::table('registrations')
            ->where('period_id', $periodId)
            ->whereIn('status', ['approved', 'completed'])
            ->count();

        return $studentCount * 30; // Asumsi 30 hari KKN
    }

    public function clearCache(int $periodId): void
    {
        Cache::forget("dashboard:period:{$periodId}");
    }
}
4. Handle 1 Dosen sebagai DPL di Beberapa Jenis KKN
Dengan tabel dpl_periods yang sudah kita buat, implementasinya:
php
Copy
<?php
// app/Models/Lecturer.php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lecturer extends Model
{
    // Relasi: Dosen bisa mengajar di multiple periode
    public function dplPeriods(): HasMany
    {
        return $this->hasMany(DplPeriod::class);
    }

    // Scope: Dosen yang tersedia untuk periode tertentu
    public function scopeAvailableForPeriod($query, int $periodId)
    {
        return $query->whereHas('dplPeriods', function ($q) use ($periodId) {
            $q->where('period_id', $periodId)
              ->where('is_active', true)
              ->whereRaw('(SELECT COUNT(*) FROM groups WHERE dpl_period_id = dpl_periods.id) < max_groups');
        });
    }

    // Cek apakah dosen bisa membimbing kelompok lagi di periode ini
    public function canTakeMoreGroups(int $periodId): bool
    {
        $dplPeriod = $this->dplPeriods()
            ->where('period_id', $periodId)
            ->first();

        if (!$dplPeriod) return false;

        $currentGroups = Group::where('dpl_period_id', $dplPeriod->id)->count();
        return $currentGroups < $dplPeriod->max_groups;
    }
}
php
Copy
<?php
// app/Http/Controllers/Api/DplAssignmentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DplPeriod;
use App\Models\Group;
use App\Models\Lecturer;
use App\Models\Period;
use App\Services\PeriodContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DplAssignmentController extends Controller
{
    public function __construct(
        private PeriodContextService $contextService
    ) {}

    // Assign DPL ke periode (bukan langsung ke kelompok)
    public function assignToPeriod(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'lecturer_id' => 'required|exists:lecturers,id',
            'period_id' => 'required|exists:periods,id',
            'max_groups' => 'required|integer|min:1|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $dplPeriod = DplPeriod::firstOrCreate(
                [
                    'lecturer_id' => $request->lecturer_id,
                    'period_id' => $request->period_id,
                ],
                [
                    'max_groups' => $request->max_groups,
                    'is_active' => true,
                ]
            );

            // Jika sudah ada tapi inactive, activate kembali
            if (!$dplPeriod->wasRecentlyCreated && !$dplPeriod->is_active) {
                $dplPeriod->update(['is_active' => true, 'max_groups' => $request->max_groups]);
            }

            DB::commit();

            return response()->json([
                'message' => 'DPL berhasil diassign ke periode',
                'data' => $dplPeriod->load('lecturer', 'period')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal assign DPL: ' . $e->getMessage()], 500);
        }
    }

    // Assign DPL ke kelompok spesifik
    public function assignToGroup(Request $request, Group $group): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'dpl_period_id' => 'required|exists:dpl_periods,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $dplPeriod = DplPeriod::findOrFail($request->dpl_period_id);

        // Validasi: DPL harus untuk periode yang sama dengan kelompok
        if ($dplPeriod->period_id !== $group->period_id) {
            return response()->json([
                'message' => 'DPL tidak terdaftar di periode ini'
            ], 422);
        }

        // Validasi: Cek kapasitas
        if (!$dplPeriod->lecturer->canTakeMoreGroups($group->period_id)) {
            return response()->json([
                'message' => 'DPL sudah mencapai batas maksimal kelompok'
            ], 422);
        }

        $group->update(['dpl_period_id' => $dplPeriod->id]);

        return response()->json([
            'message' => 'DPL berhasil diassign ke kelompok',
            'data' => $group->load('dplPeriod.lecturer')
        ]);
    }

    // Get available DPL untuk periode aktif
    public function getAvailableDpl(): JsonResponse
    {
        $periodId = $this->contextService->getActivePeriodId();
        
        if (!$periodId) {
            return response()->json(['message' => 'Tidak ada periode aktif'], 400);
        }

        $dplList = DplPeriod::with(['lecturer', 'groups'])
            ->where('period_id', $periodId)
            ->where('is_active', true)
            ->get()
            ->map(fn($dp) => [
                'id' => $dp->id,
                'lecturer' => $dp->lecturer,
                'max_groups' => $dp->max_groups,
                'current_groups' => $dp->groups->count(),
                'remaining_slots' => $dp->max_groups - $dp->groups->count(),
                'groups' => $dp->groups->map(fn($g) => [
                    'id' => $g->id,
                    'code' => $g->code,
                    'student_count' => $g->registrations()->count(),
                ]),
            ]);

        return response()->json($dplList);
    }
}
5. Handle Perpindahan Mahasiswa antar Jenis KKN
php
Copy
<?php
// app/Services/StudentTransferService.php

namespace App\Services;

use App\Models\Registration;
use App\Models\RegistrationHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentTransferService
{
    public function __construct(
        private PeriodContextService $contextService,
        private NotificationService $notificationService
    ) {}

    public function transferStudent(
        int $registrationId,
        int $targetPeriodId,
        ?int $targetGroupId = null,
        string $reason = ''
    ): array {
        $registration = Registration::with(['mahasiswa', 'period', 'group'])->findOrFail($registrationId);
        
        // Validasi business rules
        $validation = $this->validateTransfer($registration, $targetPeriodId);
        if (!$validation['valid']) {
            return ['success' => false, 'message' => $validation['message']];
        }

        try {
            DB::beginTransaction();

            $oldPeriodId = $registration->period_id;
            $oldGroupId = $registration->kelompok_id;

            // 1. Simpan history
            RegistrationHistory::create([
                'registration_id' => $registration->id,
                'from_period_id' => $oldPeriodId,
                'to_period_id' => $targetPeriodId,
                'from_group_id' => $oldGroupId,
                'to_group_id' => $targetGroupId,
                'reason' => $reason,
                'processed_by' => auth()->id(),
                'processed_at' => now(),
            ]);

            // 2. Update registration
            $registration->update([
                'period_id' => $targetPeriodId,
                'kelompok_id' => $targetGroupId,
                'status' => 'pending', // Reset status untuk review ulang
                'notes' => "Transfer dari periode {$oldPeriodId}. Alasan: {$reason}",
            ]);

            // 3. Transfer data terkait (laporan, nilai) - soft delete atau archive
            $this->archiveOldData($registration->id, $oldPeriodId);

            // 4. Notifikasi
            $this->notificationService->notifyTransfer($registration, $oldPeriodId, $targetPeriodId);

            DB::commit();

            Log::info("Student transferred", [
                'registration_id' => $registrationId,
                'from' => $oldPeriodId,
                'to' => $targetPeriodId,
                'by' => auth()->id(),
            ]);

            return [
                'success' => true,
                'message' => 'Mahasiswa berhasil dipindahkan',
                'data' => $registration->fresh(['period', 'group'])
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Transfer failed: " . $e->getMessage());
            return ['success' => false, 'message' => 'Transfer gagal: ' . $e->getMessage()];
        }
    }

    private function validateTransfer(Registration $registration, int $targetPeriodId): array
    {
        // Rule 1: Tidak bisa transfer jika sudah completed
        if ($registration->status === 'completed') {
            return ['valid' => false, 'message' => 'Mahasiswa sudah menyelesaikan KKN, tidak bisa dipindahkan'];
        }

        // Rule 2: Target period harus dalam academic year yang sama atau berikutnya
        $targetPeriod = \App\Models\Period::find($targetPeriodId);
        if ($targetPeriod->angkatan < $registration->period->angkatan) {
            return ['valid' => false, 'message' => 'Tidak bisa pindah ke angkatan sebelumnya'];
        }

        // Rule 3: Cek kuota target period
        $currentCount = Registration::where('period_id', $targetPeriodId)
            ->whereIn('status', ['approved', 'completed'])
            ->count();
        
        if ($currentCount >= $targetPeriod->kuota) {
            return ['valid' => false, 'message' => 'Kuota periode target sudah penuh'];
        }

        // Rule 4: Cek overlapping dates
        if ($registration->period->end_date > $targetPeriod->start_date) {
            return ['valid' => false, 'message' => 'Periode KKN bertabrakan'];
        }

        return ['valid' => true];
    }

    private function archiveOldData(int $registrationId, int $oldPeriodId): void
    {
        // Soft delete laporan di periode lama
        \App\Models\DailyReport::whereHas('registration', function($q) use ($registrationId) {
            $q->where('id', $registrationId);
        })->update(['status' => 'archived']);

        // Nilai di-mark sebagai archived
        \App\Models\NilaiKkn::whereHas('registration', function($q) use ($registrationId) {
            $q->where('id', $registrationId);
        })->update(['is_finalized' => false, 'notes' => 'Archived due to transfer']);
    }
}
6. Best Practice Pagination & Performa
php
Copy
<?php
// app/Traits/OptimizesQueries.php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

trait OptimizesQueries
{
    // Cursor pagination untuk data besar (lebih efisien dari offset/limit)
    public function scopeOptimizedPaginate(Builder $query, int $perPage = 50, string $cursorColumn = 'id')
    {
        $cursor = request()->input('cursor');
        
        if ($cursor) {
            $query->where($cursorColumn, '>', $cursor);
        }

        return $query->limit($perPage + 1)->get();
    }

    // Eager loading dengan spesifik kolom
    public function scopeWithEssentialRelations(Builder $query, array $additional = [])
    {
        $default = [
            'student:id,name,nim,program_id' => [
                'program:id,name,faculty_id',
                'program.faculty:id,name'
            ]
        ];

        return $query->with(array_merge($default, $additional));
    }

    // Query dengan covering index optimization
    public function scopeUseIndex(Builder $query, string $indexName)
    {
        return $query->fromRaw("{$this->getTable()} USE INDEX ({$indexName})");
    }
}
php
Copy
<?php
// app/Http/Controllers/StudentController.php - Optimized Index

public function index(Request $request)
{
    $periodId = $this->contextService->getActivePeriodId();
    
    $query = Registration::query()
        ->select([
            'registrations.id',
            'registrations.mahasiswa_id',
            'registrations.kelompok_id',
            'registrations.status',
            'registrations.created_at',
            'students.nim',
            'students.name as student_name',
            'programs.name as program_name',
            'faculties.name as faculty_name',
            'groups.code as group_code',
        ])
        ->join('students', 'registrations.mahasiswa_id', '=', 'students.id')
        ->join('programs', 'students.program_id', '=', 'programs.id')
        ->join('faculties', 'students.faculty_id', '=', 'faculties.id')
        ->leftJoin('groups', 'registrations.kelompok_id', '=', 'groups.id')
        ->where('registrations.period_id', $periodId)
        ->whereNull('registrations.deleted_at');

    // Filtering
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('students.name', 'like', "%{$search}%")
              ->orWhere('students.nim', 'like', "%{$search}%")
              ->orWhere('groups.code', 'like', "%{$search}%");
        });
    }

    if ($request->filled('status')) {
        $query->where('registrations.status', $request->status);
    }

    if ($request->filled('faculty_id')) {
        $query->where('students.faculty_id', $request->faculty_id);
    }

    // Sorting dengan whitelist
    $sortField = in_array($request->sort_by, ['created_at', 'student_name', 'nim']) 
        ? $request->sort_by 
        : 'created_at';
    $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';

    $query->orderBy($sortField === 'student_name' ? 'students.name' : "registrations.{$sortField}", $sortOrder);

    // Pagination: Gunakan simplePaginate untuk performa lebih baik dengan data besar
    $students = $query->simplePaginate(50)->withQueryString();

    return Inertia::render('Students/Index', [
        'students' => $students,
        'filters' => $request->only(['search', 'status', 'faculty_id', 'sort_by', 'sort_order']),
        'stats' => [
            'total' => Registration::where('period_id', $periodId)->count(),
            'pending' => Registration::where('period_id', $periodId)->where('status', 'pending')->count(),
            'approved' => Registration::where('period_id', $periodId)->where('status', 'approved')->count(),
        ]
    ]);
}
7. Implementasi Lengkap: Controller + Service
php
Copy
<?php
// app/Http/Controllers/StudentManagementController.php

namespace App\Http\Controllers;

use App\Http\Requests\StudentFilterRequest;
use App\Services\StudentManagementService;
use App\Services\PeriodContextService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class StudentManagementController extends Controller
{
    public function __construct(
        private StudentManagementService $studentService,
        private PeriodContextService $contextService
    ) {}

    /**
     * Display paginated student list with filters
     */
    public function index(StudentFilterRequest $request): Response
    {
        $periodId = $this->contextService->getActivePeriodId();
        
        if (!$periodId) {
            return Inertia::render('Error', [
                'message' => 'Silakan pilih periode KKN terlebih dahulu'
            ]);
        }

        $filters = $request->validated();
        $result = $this->studentService->getStudentsByPeriod($periodId, $filters);

        return Inertia::render('Students/Management/Index', [
            'students' => $result['data'],
            'meta' => $result['meta'],
            'filters' => $filters,
            'availableFilters' => $this->studentService->getAvailableFilters($periodId),
            'activePeriod' => $this->contextService->getActivePeriodData(),
        ]);
    }

    /**
     * API endpoint untuk DataTables/React Table
     */
    public function apiIndex(StudentFilterRequest $request): JsonResponse
    {
        $periodId = $this->contextService->getActivePeriodId();
        
        if (!$periodId) {
            return response()->json(['message' => 'No active period'], 400);
        }

        $result = $this->studentService->getStudentsByPeriod(
            $periodId, 
            $request->validated(),
            $request->input('per_page', 50)
        );

        return response()->json($result);
    }

    /**
     * Export students to Excel/CSV
     */
    public function export(StudentFilterRequest $request)
    {
        $periodId = $this->contextService->getActivePeriodId();
        return $this->studentService->exportStudents($periodId, $request->validated());
    }
}
php
Copy
<?php
// app/Services/StudentManagementService.php

namespace App\Services;

use App\Exports\StudentsExport;
use App\Models\Registration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StudentManagementService
{
    private const CACHE_TTL = 300; // 5 menit

    public function getStudentsByPeriod(int $periodId, array $filters = [], int $perPage = 50): array
    {
        $cacheKey = $this->buildCacheKey($periodId, $filters);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($periodId, $filters, $perPage) {
            
            $query = $this->buildBaseQuery($periodId);
            $query = $this->applyFilters($query, $filters);
            $query = $this->applySorting($query, $filters['sort_by'] ?? null, $filters['sort_order'] ?? 'desc');

            $paginated = $query->paginate($perPage);

            return [
                'data' => $paginated->items(),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'from' => $paginated->firstItem(),
                    'to' => $paginated->lastItem(),
                ],
                'summary' => $this->getSummaryStats($periodId),
            ];
        });
    }

    private function buildBaseQuery(int $periodId)
    {
        return Registration::query()
            ->select([
                'registrations.id',
                'registrations.mahasiswa_id',
                'registrations.kelompok_id',
                'registrations.status',
                'registrations.registration_date',
                'registrations.approved_at',
                'students.id as student_id',
                'students.nim',
                'students.name as student_name',
                'students.gender',
                'students.phone',
                'programs.id as program_id',
                'programs.name as program_name',
                'programs.code as program_code',
                'faculties.id as faculty_id',
                'faculties.name as faculty_name',
                'faculties.code as faculty_code',
                'groups.id as group_id',
                'groups.code as group_code',
                'groups.nama_kelompok as group_name',
                'lecturers.name as dpl_name',
                'locations.village_name',
            ])
            ->join('students', 'registrations.mahasiswa_id', '=', 'students.id')
            ->join('programs', 'students.program_id', '=', 'programs.id')
            ->join('faculties', 'students.faculty_id', '=', 'faculties.id')
            ->leftJoin('groups', 'registrations.kelompok_id', '=', 'groups.id')
            ->leftJoin('dpl_periods', 'groups.dpl_period_id', '=', 'dpl_periods.id')
            ->leftJoin('lecturers', 'dpl_periods.lecturer_id', '=', 'lecturers.id')
            ->leftJoin('locations', 'groups.location_id', '=', 'locations.id')
            ->where('registrations.period_id', $periodId)
            ->whereNull('registrations.deleted_at');
    }

    private function applyFilters($query, array $filters)
    {
        // Search filter (NIM, Nama, Kelompok)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('students.name', 'like', "%{$search}%")
                  ->orWhere('students.nim', 'like', "%{$search}%")
                  ->orWhere('groups.code', 'like', "%{$search}%")
                  ->orWhere('lecturers.name', 'like', "%{$search}%");
            });
        }

        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('registrations.status', $filters['status']);
        }

        // Faculty filter
        if (!empty($filters['faculty_id'])) {
            $query->where('students.faculty_id', $filters['faculty_id']);
        }

        // Program filter
        if (!empty($filters['program_id'])) {
            $query->where('students.program_id', $filters['program_id']);
        }

        // Group filter
        if (!empty($filters['group_id'])) {
            $query->where('registrations.kelompok_id', $filters['group_id']);
        }

        // Gender filter
        if (!empty($filters['gender'])) {
            $query->where('students.gender', $filters['gender']);
        }

        // Date range filter
        if (!empty($filters['date_from'])) {
            $query->whereDate('registrations.registration_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('registrations.registration_date', '<=', $filters['date_to']);
        }

        // Has DPL filter
        if (!empty($filters['has_dpl'])) {
            if ($filters['has_dpl'] === 'yes') {
                $query->whereNotNull('groups.dpl_period_id');
            } else {
                $query->whereNull('groups.dpl_period_id');
            }
        }

        return $query;
    }

    private function applySorting($query, ?string $sortBy, string $sortOrder = 'desc')
    {
        $allowedSorts = [
            'registration_date' => 'registrations.registration_date',
            'student_name' => 'students.name',
            'nim' => 'students.nim',
            'faculty' => 'faculties.name',
            'status' => 'registrations.status',
        ];

        $column = $allowedSorts[$sortBy] ?? 'registrations.registration_date';
        $direction = in_array(strtolower($sortOrder), ['asc', 'desc']) ? strtolower($sortOrder) : 'desc';

        return $query->orderBy($column, $direction);
    }

    private function getSummaryStats(int $periodId): array
    {
        return DB::table('registrations')
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed
            ', ['pending', 'approved', 'rejected', 'completed'])
            ->where('period_id', $periodId)
            ->whereNull('deleted_at')
            ->first();
    }

    public function getAvailableFilters(int $periodId): array
    {
        return Cache::remember("filters:period:{$periodId}", 600, function () use ($periodId) {
            return [
                'faculties' => DB::table('faculties')
                    ->select('id', 'name', 'code')
                    ->whereIn('id', function($q) use ($periodId) {
                        $q->select('students.faculty_id')
                          ->from('registrations')
                          ->join('students', 'registrations.mahasiswa_id', '=', 'students.id')
                          ->where('registrations.period_id', $periodId);
                    })
                    ->get(),
                
                'groups' => DB::table('groups')
                    ->select('id', 'code as name', 'nama_kelompok as description')
                    ->where('period_id', $periodId)
                    ->whereNull('deleted_at')
                    ->get(),

                'statuses' => [
                    ['value' => 'pending', 'label' => 'Menunggu Verifikasi'],
                    ['value' => 'document_submitted', 'label' => 'Dokumen Dikirim'],
                    ['value' => 'approved', 'label' => 'Diterima'],
                    ['value' => 'rejected', 'label' => 'Ditolak'],
                    ['value' => 'completed', 'label' => 'Selesai'],
                ],
            ];
        });
    }

    public function exportStudents(int $periodId, array $filters): BinaryFileResponse
    {
        $query = $this->buildBaseQuery($periodId);
        $query = $this->applyFilters($query, $filters);
        
        $students = $query->get();
        $period = \App\Models\Period::find($periodId);

        return Excel::download(
            new StudentsExport($students, $period),
            "kkn-students-{$period->angkatan}-{$period->jenis}-" . now()->format('Y-m-d') . '.xlsx'
        );
    }

    private function buildCacheKey(int $periodId, array $filters): string
    {
        $filterHash = md5(serialize($filters));
        return "students:period:{$periodId}:filters:{$filterHash}";
    }

    public function clearCache(int $periodId): void
    {
        // Clear semua cache untuk period ini (gunakan pattern matching jika memungkinkan)
        Cache::flush(); // Atau implementasi yang lebih spesifik
    }
}
php
Copy
<?php
// app/Http/Requests/StudentFilterRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:all,pending,document_submitted,approved,rejected,completed',
            'faculty_id' => 'nullable|integer|exists:faculties,id',
            'program_id' => 'nullable|integer|exists:programs,id',
            'group_id' => 'nullable|integer|exists:groups,id',
            'gender' => 'nullable|in:L,P',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'has_dpl' => 'nullable|in:yes,no',
            'sort_by' => 'nullable|string|in:registration_date,student_name,nim,faculty,status',
            'sort_order' => 'nullable|string|in:asc,desc',
            'per_page' => 'nullable|integer|in:25,50,100',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Sanitize search input
        if ($this->has('search')) {
            $this->merge([
                'search' => strip_tags(trim($this->search))
            ]);
        }
    }
}
Ringkasan Rekomendasi Utama
Table
Copy
Aspek	Rekomendasi	Prioritas
Schema	Tambah dpl_periods untuk many-to-many DPL-Periode	🔴 Critical
Context	Hybrid Session + URL Parameter untuk Active Period	🔴 Critical
Query	Covering indexes + Cursor pagination untuk data besar	🟡 High
Transfer	Tabel registration_histories untuk audit trail	🟡 High
Cache	Redis/Memcached untuk dashboard statistics	🟢 Medium
Security	Policy-based authorization per periode	🔴 Critical
Sistem Anda sekarang sudah siap untuk skala ribuan mahasiswa dengan multiple angkatan dan jenis KKN yang kompleks.
 
