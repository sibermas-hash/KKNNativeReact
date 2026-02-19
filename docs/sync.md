Panduan Implementasi Webhook Realtime Sync Antar Aplikasi Laravel
Berikut adalah panduan teknis lengkap untuk mengimplementasikan sinkronisasi realtime via webhook antara Master API (sender) dan dua aplikasi client (eSPPD & KKN). Pendekatan ini menggunakan:

Laravel Observers untuk mendeteksi perubahan data (created/updated/deleted).
Queued Job untuk mengirim webhook secara asynchronous (tidak memblokir request utama).
HMAC Signature dengan header X-Hub-Signature-256 untuk keamanan.

Saya akan berikan contoh kode yang clean dan mudah dipahami. Asumsikan model yang disinkronkan adalah Mahasiswa (bisa digandakan untuk Dosen/Pegawai).
1. Implementasi di Master API (Sender)
a. Tabel webhook_endpoints
Buat migration untuk menyimpan endpoint client beserta secret key-nya.
Bashphp artisan make:migration create_webhook_endpoints_table
Migration:
PHPuse Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('webhook_endpoints', function (Blueprint $table) {
            $table->id();
            $table->string('url');                  // URL webhook client, misal: https://esppd.example.com/api/webhook/sync
            $table->string('secret');               // Secret unik per endpoint untuk HMAC
            $table->json('events')->nullable();     // Optional: ['mahasiswa.created', 'mahasiswa.updated', ...]
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_endpoints');
    }
};
Model WebhookEndpoint:
PHPnamespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEndpoint extends Model
{
    protected $fillable = ['url', 'secret', 'events', 'active'];

    protected $casts = [
        'events' => 'array',
        'active' => 'boolean',
    ];
}
Catatan: Tambahkan endpoint melalui seeder atau panel admin. Contoh secret: Str::random(40).
b. Deteksi Perubahan Data dengan Observer
Buat observer untuk model Mahasiswa.
Bashphp artisan make:observer MahasiswaObserver --model=App\Models\Mahasiswa
MahasiswaObserver.php:
PHPnamespace App\Observers;

use App\Models\Mahasiswa;
use App\Jobs\SendWebhookJob;

class MahasiswaObserver
{
    public function created(Mahasiswa $mahasiswa): void
    {
        SendWebhookJob::dispatch($mahasiswa, 'mahasiswa.created');
    }

    public function updated(Mahasiswa $mahasiswa): void
    {
        SendWebhookJob::dispatch($mahasiswa, 'mahasiswa.updated');
    }

    public function deleted(Mahasiswa $mahasiswa): void
    {
        SendWebhookJob::dispatch($mahasiswa, 'mahasiswa.deleted');
    }
}
Register observer di AppServiceProvider@boot:
PHPuse App\Models\Mahasiswa;
use App\Observers\MahasiswaObserver;

public function boot(): void
{
    Mahasiswa::observe(MahasiswaObserver::class);
    // Ulangi untuk model lain (Dosen, Pegawai, dll)
}
c. Queued Job SendWebhookJob
Bashphp artisan make:job SendWebhookJob
SendWebhookJob.php:
PHPnamespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use App\Models\WebhookEndpoint;
use App\Models\Mahasiswa;

class SendWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Mahasiswa $model, protected string $event)
    {
        //
    }

    public function handle(): void
    {
        $endpoints = WebhookEndpoint::where('active', true)->get();

        $payload = [
            'event' => $this->event,
            'data'  => $this->event === 'mahasiswa.deleted'
                ? ['id' => $this->model->id]
                : $this->model->toArray(),
        ];

        foreach ($endpoints as $endpoint) {
            // Optional: filter berdasarkan events yang di-subscribe
            // if (!in_array($this->event, $endpoint->events ?? [])) continue;

            $signature = hash_hmac('sha256', json_encode($payload), $endpoint->secret);

            Http::withHeaders([
                'Content-Type'          => 'application/json',
                'X-Hub-Signature-256'   => 'sha256=' . $signature,
            ])->post($endpoint->url, $payload);
            // Laravel akan otomatis retry jika gagal (konfigurasi di queue config)
        }
    }
}
Pastikan queue driver aktif (QUEUE_CONNECTION=database atau redis) dan jalankan php artisan queue:work.
2. Implementasi di Client (eSPPD & KKN)
Kedua aplikasi client memiliki kode yang sama.
a. Route & Controller
routes/api.php:
PHPuse App\Http\Controllers\WebhookController;

Route::post('/webhook/sync', [WebhookController::class, 'handle']);
Buat controller:
Bashphp artisan make:controller WebhookController
WebhookController.php:
PHPnamespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Mahasiswa; // Sesuaikan dengan model lokal

class WebhookController extends Controller
{
    protected string $secret = 'YOUR_SHARED_SECRET_HERE'; // Simpan di .env: WEBHOOK_SECRET=xxx

    public function handle(Request $request)
    {
        // 1. Verifikasi signature
        if (!$this->verifySignature($request)) {
            return response('Invalid signature', 401);
        }

        $payload = $request->all();

        $event = $payload['event'] ?? null;
        $data  = $payload['data'] ?? null;

        if (!$event || !$data) {
            return response('Invalid payload', 400);
        }

        // 2. Proses sesuai event
        switch ($event) {
            case 'mahasiswa.created':
            case 'mahasiswa.updated':
                Mahasiswa::updateOrCreate(['id' => $data['id']], $data);
                break;

            case 'mahasiswa.deleted':
                Mahasiswa::find($data['id'])?->delete();
                break;
        }

        return response('OK', 200);
    }

    protected function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-Hub-Signature-256');

        if (!$signature) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $this->secret);

        return hash_equals($expected, $signature);
    }
}
Rekomendasi keamanan: Simpan secret di .env (sama dengan yang ada di tabel webhook_endpoints Master). Jangan hardcode di produksi.
3. Keamanan Tambahan

HMAC dengan X-Hub-Signature-256
Header ini berisi hash HMAC-SHA256 dari payload JSON menggunakan secret key.
Master mengirim: sha256= + hash_hmac('sha256', json_encode($payload), $secret)
Client memverifikasi dengan menghitung ulang hash dari raw body ($request->getContent()) dan membandingkan menggunakan hash_equals() (untuk mencegah timing attack).

Praktik terbaik tambahan:
Gunakan HTTPS untuk semua endpoint webhook.
Batasi IP source jika memungkinkan (middleware).
Log semua webhook yang gagal di client.
Implementasi retry dengan exponential backoff di job (Laravel sudah mendukung).
Gunakan kolom events di tabel endpoint untuk granular subscription (misalnya eSPPD hanya butuh Pegawai/Dosen, KKN butuh Mahasiswa/Dosen).

-----

Panduan Implementasi Webhook Realtime Antar 3 Aplikasi Laravel
Master API (Sender) → eSPPD & KKN (Client)

Dokumen ini memberikan panduan teknis lengkap untuk mengintegrasikan tiga aplikasi Laravel menggunakan webhook dengan keamanan HMAC. Setiap perubahan data di Master API akan secara otomatis dikirim ke aplikasi client (eSPPD dan KKN) secara realtime melalui job queue agar tidak memperlambat response.

📦 Sisi Master API (Sender)
1. Buat Tabel webhook_endpoints
Tabel ini menyimpan daftar client yang berhak menerima webhook beserta URL endpoint dan secret key masing-masing.

Migration:

php
// database/migrations/xxxx_xx_xx_create_webhook_endpoints_table.php
public function up()
{
    Schema::create('webhook_endpoints', function (Blueprint $table) {
        $table->id();
        $table->string('name');                // misal: eSPPD, KKN
        $table->string('url');                  // endpoint client
        $table->string('secret');                // rahasia untuk HMAC
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}
Model:

php
// app/Models/WebhookEndpoint.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEndpoint extends Model
{
    protected $fillable = ['name', 'url', 'secret', 'is_active'];
}
2. Deteksi Perubahan Data dengan Observer
Kita akan menggunakan Observer untuk memantau model yang perlu disinkronkan (contoh: Dosen, Mahasiswa, Pegawai). Setiap event created, updated, deleted akan memicu job pengiriman webhook.

Buat Observer:

bash
php artisan make:observer MahasiswaObserver --model=Mahasiswa
Isi Observer:

php
// app/Observers/MahasiswaObserver.php
namespace App\Observers;

use App\Models\Mahasiswa;
use App\Jobs\SendWebhookJob;

class MahasiswaObserver
{
    public function created(Mahasiswa $mahasiswa)
    {
        $this->dispatchWebhook('mahasiswa.created', $mahasiswa);
    }

    public function updated(Mahasiswa $mahasiswa)
    {
        $this->dispatchWebhook('mahasiswa.updated', $mahasiswa);
    }

    public function deleted(Mahasiswa $mahasiswa)
    {
        // Untuk deleted, kita bisa kirim ID saja sebagai referensi
        $this->dispatchWebhook('mahasiswa.deleted', ['id' => $mahasiswa->id]);
    }

    private function dispatchWebhook($event, $data)
    {
        $payload = [
            'event' => $event,
            'data'  => $data instanceof Model ? $data->toArray() : $data,
            'timestamp' => now()->toIso8601String(),
        ];

        // Ambil semua endpoint aktif
        $endpoints = \App\Models\WebhookEndpoint::where('is_active', true)->get();

        foreach ($endpoints as $endpoint) {
            SendWebhookJob::dispatch($endpoint, $payload);
        }
    }
}
Daftarkan Observer di AppServiceProvider:

php
// app/Providers/AppServiceProvider.php
use App\Models\Mahasiswa;
use App\Observers\MahasiswaObserver;

public function boot()
{
    Mahasiswa::observe(MahasiswaObserver::class);
    // Daftarkan observer lain: DosenObserver, PegawaiObserver, dll.
}
3. Buat Job SendWebhookJob
Job ini bertugas mengirim HTTP POST ke client dengan payload JSON dan header signature.

bash
php artisan make:job SendWebhookJob
php
// app/Jobs/SendWebhookJob.php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\WebhookEndpoint;
use Illuminate\Support\Facades\Http;

class SendWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $endpoint;
    protected $payload;

    public function __construct(WebhookEndpoint $endpoint, array $payload)
    {
        $this->endpoint = $endpoint;
        $this->payload = $payload;
    }

    public function handle()
    {
        $payloadJson = json_encode($this->payload);

        // Generate HMAC signature menggunakan secret client
        $signature = hash_hmac('sha256', $payloadJson, $this->endpoint->secret);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-Hub-Signature' => 'sha256=' . $signature,
        ])->post($this->endpoint->url, $this->payload);

        if ($response->failed()) {
            // Log error atau retry job (bisa dimanfaatkan fitur retry job Laravel)
            $this->fail("Gagal mengirim ke {$this->endpoint->url}. Response: " . $response->body());
        }
    }
}
Konfigurasi Queue: Pastikan queue driver sudah diatur (misal database, redis) dan jalankan worker:

bash
php artisan queue:work
4. Input Data Endpoint Client
Tambahkan data client secara manual atau via seeder:

php
// database/seeders/WebhookEndpointSeeder.php
WebhookEndpoint::create([
    'name' => 'eSPPD',
    'url' => 'https://esppd.kampus.ac.id/api/webhook',
    'secret' => 'rahasia_untuk_esppd',
    'is_active' => true,
]);

WebhookEndpoint::create([
    'name' => 'KKN',
    'url' => 'https://kkn.kampus.ac.id/api/webhook',
    'secret' => 'rahasia_untuk_kkn',
    'is_active' => true,
]);
🖥️ Sisi Client (eSPPD & KKN)
Kita asumsikan setiap client adalah aplikasi Laravel terpisah. Implementasi di kedua aplikasi sama, hanya berbeda database.

1. Buat Route untuk Menerima Webhook
php
// routes/api.php
Route::post('/webhook', [App\Http\Controllers\WebhookController::class, 'handle'])
    ->name('webhook.handle');
2. Buat Controller WebhookController
bash
php artisan make:controller WebhookController
php
// app/Http/Controllers/WebhookController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Mahasiswa; // contoh model di client

class WebhookController extends Controller
{
    protected $secret; // ambil dari konfigurasi (.env)

    public function __construct()
    {
        $this->secret = env('WEBHOOK_SECRET'); // secret yang sama dengan di Master
    }

    public function handle(Request $request)
    {
        // Verifikasi signature
        if (!$this->verifySignature($request)) {
            Log::warning('Webhook signature invalid', ['ip' => $request->ip()]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $payload = $request->all();
        $event = $payload['event'] ?? null;

        // Proses berdasarkan event
        try {
            switch ($event) {
                case 'mahasiswa.created':
                case 'mahasiswa.updated':
                    $this->syncMahasiswa($payload['data']);
                    break;
                case 'mahasiswa.deleted':
                    $this->deleteMahasiswa($payload['data']['id']);
                    break;
                // tambahkan event lain: dosen, pegawai, dll.
                default:
                    Log::info('Unhandled webhook event', ['event' => $event]);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Webhook processing error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    private function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-Hub-Signature');
        if (!$signature) return false;

        // Format: sha256=hash
        list($algo, $hash) = explode('=', $signature, 2);

        if (!in_array($algo, hash_hmac_algos())) return false;

        $payload = $request->getContent();
        $expectedHash = hash_hmac($algo, $payload, $this->secret);

        return hash_equals($expectedHash, $hash);
    }

    private function syncMahasiswa(array $data)
    {
        // Update atau create data mahasiswa di database client
        Mahasiswa::updateOrCreate(
            ['id' => $data['id']], // asumsi primary key sama dengan di master
            $data
        );
    }

    private function deleteMahasiswa($id)
    {
        Mahasiswa::where('id', $id)->delete();
    }
}
Catatan:

Di client, model Mahasiswa harus memiliki field yang sama dengan master (minimal field yang diperlukan).

Secret disimpan di .env client, misal:

text
WEBHOOK_SECRET=rahasia_untuk_esppd
🔐 Keamanan Webhook dengan HMAC & X-Hub-Signature
Master membuat signature dengan hash_hmac('sha256', $payload, $clientSecret).

Signature dikirim dalam header X-Hub-Signature: sha256=....

Client membaca header, memisahkan algoritma dan hash, lalu menghitung ulang signature menggunakan secret yang sama.

Perbandingan menggunakan hash_equals untuk mencegah timing attack.

Keuntungan:

Memastikan bahwa payload benar-benar berasal dari Master yang sah.

Payload tidak diubah di tengah jalan (integrity).

Secret tidak pernah dikirim, hanya digunakan untuk hashing.

✅ Kesimpulan
Dengan implementasi di atas:

Master API secara otomatis mengirim notifikasi setiap kali ada perubahan data.

Pengiriman dilakukan melalui queue sehingga response Master tetap cepat.

Client menerima webhook, memverifikasi keaslian, dan langsung menyinkronkan database.

Keamanan terjamin dengan HMAC.

Catatan Tambahan:

Pastikan kedua client memiliki endpoint yang dapat diakses dari Master (bisa menggunakan URL publik atau internal network).

Untuk pengiriman batch atau retry, Anda bisa memanfaatkan fitur backoff dan attempts pada job.

Jika data sangat besar, pertimbangkan untuk mengirim hanya field yang berubah atau menggunakan queue terpisah.

Selamat mencoba! Jika ada pertanyaan lebih lanjut, jangan ragu untuk menghubungi tim pengembang.


-----

Saya akan membuat panduan teknis lengkap implementasi Webhook Realtime untuk ekosistem Laravel Anda. Ini akan mencakup arsitektur Master API sebagai sender dan Client Apps (eSPPD & KKN) sebagai receiver dengan keamanan HMAC signature.
Arsitektur Sistem
plain
Copy
┌─────────────────┐         Webhook HTTP POST          ┌─────────────┐
│   Master API    │ ─────────────────────────────────> │    eSPPD    │
│  (Data Center)  │         + JSON Payload               │  (Client)   │
│                 │         + X-Hub-Signature          │             │
│  • Observers    │                                    └─────────────┘
│  • Job Queue    │
│  • Retry Logic  │         Webhook HTTP POST          ┌─────────────┐
│                 │ ─────────────────────────────────> │     KKN     │
└─────────────────┘         + JSON Payload               │  (Client)   │
                            + X-Hub-Signature          └─────────────┘
1. Sisi Master API (Sender)
1.1 Migration: Tabel webhook_endpoints
php
Copy
<?php
// database/migrations/2024_01_15_000001_create_webhook_endpoints_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_endpoints', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "eSPPD Production", "KKN Staging"
            $table->string('url'); // Target URL client
            $table->string('secret'); // For HMAC signature generation
            $table->json('events'); // ["mahasiswa.created", "dosen.updated", "pegawai.deleted"]
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('retry_attempts')->default(3);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();
            
            $table->index(['is_active', 'events']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_endpoints');
    }
};
1.2 Model: WebhookEndpoint
php
Copy
<?php
// app/Models/WebhookEndpoint.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebhookEndpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'url', 'secret', 'events', 
        'is_active', 'retry_attempts', 'last_sent_at', 'failed_at'
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
        'last_sent_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    /**
     * Check if endpoint subscribes to specific event
     */
    public function subscribesTo(string $event): bool
    {
        return in_array($event, $this->events) || in_array('*', $this->events);
    }

    /**
     * Scope: Active endpoints only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
1.3 Event: DataChanged
php
Copy
<?php
// app/Events/DataChanged.php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DataChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $entityType,    // 'mahasiswa', 'dosen', 'pegawai'
        public string $action,       // 'created', 'updated', 'deleted'
        public array $data,          // Full data payload
        public ?array $changedFields = null // For updates: fields that changed
    ) {}

    /**
     * Get event name in format: entity.action
     */
    public function getEventName(): string
    {
        return "{$this->entityType}.{$this->action}";
    }
}
1.4 Observer Pattern (Contoh: Mahasiswa)
php
Copy
<?php
// app/Observers/MahasiswaObserver.php

namespace App\Observers;

use App\Events\DataChanged;
use App\Models\Mahasiswa;

class MahasiswaObserver
{
    /**
     * Handle the Mahasiswa "created" event.
     */
    public function created(Mahasiswa $mahasiswa): void
    {
        event(new DataChanged(
            entityType: 'mahasiswa',
            action: 'created',
            data: $mahasiswa->toArray()
        ));
    }

    /**
     * Handle the Mahasiswa "updated" event.
     */
    public function updated(Mahasiswa $mahasiswa): void
    {
        // Get only changed fields for efficiency
        $changed = $mahasiswa->getChanges();
        unset($changed['updated_at']); // Ignore timestamp

        event(new DataChanged(
            entityType: 'mahasiswa',
            action: 'updated',
            data: $mahasiswa->fresh()->toArray(),
            changedFields: array_keys($changed)
        ));
    }

    /**
     * Handle the Mahasiswa "deleted" event.
     */
    public function deleted(Mahasiswa $mahasiswa): void
    {
        event(new DataChanged(
            entityType: 'mahasiswa',
            action: 'deleted',
            data: ['id' => $mahasiswa->id, 'nim' => $mahasiswa->nim]
        ));
    }
}
php
Copy
<?php
// app/Providers/EventServiceProvider.php

namespace App\Providers;

use App\Models\Mahasiswa;
use App\Models\Dosen;
use App\Models\Pegawai;
use App\Observers\MahasiswaObserver;
use App\Observers\DosenObserver; // Buat similar
use App\Observers\PegawaiObserver; // Buat similar
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \App\Events\DataChanged::class => [
            \App\Listeners\DispatchWebhookListener::class,
        ],
    ];

    public function boot(): void
    {
        Mahasiswa::observe(MahasiswaObserver::class);
        Dosen::observe(DosenObserver::class);
        Pegawai::observe(PegawaiObserver::class);
    }
}
1.5 Listener: Dispatch Webhook
php
Copy
<?php
// app/Listeners/DispatchWebhookListener.php

namespace App\Listeners;

use App\Events\DataChanged;
use App\Jobs\SendWebhookJob;
use App\Models\WebhookEndpoint;
use Illuminate\Contracts\Queue\ShouldQueue;

class DispatchWebhookListener implements ShouldQueue
{
    public function handle(DataChanged $event): void
    {
        $eventName = $event->getEventName();
        
        // Find all active endpoints that subscribe to this event
        $endpoints = WebhookEndpoint::active()
            ->get()
            ->filter(fn ($endpoint) => $endpoint->subscribesTo($eventName));

        foreach ($endpoints as $endpoint) {
            SendWebhookJob::dispatch($endpoint, $event)
                ->onQueue('webhooks'); // Dedicated queue
        }
    }
}
1.6 Job: SendWebhookJob (Dengan Retry Logic)
php
Copy
<?php
// app/Jobs/SendWebhookJob.php

namespace App\Jobs;

use App\Events\DataChanged;
use App\Models\WebhookEndpoint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries;
    public $backoff;

    public function __construct(
        public WebhookEndpoint $endpoint,
        public DataChanged $event
    ) {
        $this->tries = $endpoint->retry_attempts;
        $this->backoff = [10, 30, 60]; // Retry delays: 10s, 30s, 60s
    }

    public function handle(): void
    {
        $payload = $this->buildPayload();
        $signature = $this->generateSignature($payload);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Event' => $this->event->getEventName(),
                    'X-Hub-Signature' => $signature,
                    'X-Webhook-ID' => uniqid('wh_', true),
                    'X-Webhook-Timestamp' => now()->toIso8601String(),
                    'User-Agent' => 'MasterAPI-Webhook/1.0',
                ])
                ->post($this->endpoint->url, $payload);

            if ($response->successful()) {
                $this->endpoint->update(['last_sent_at' => now()]);
                Log::info('Webhook delivered', [
                    'endpoint' => $this->endpoint->name,
                    'event' => $this->event->getEventName(),
                    'response_status' => $response->status()
                ]);
            } else {
                $response->throw();
            }

        } catch (\Exception $e) {
            Log::error('Webhook failed', [
                'endpoint' => $this->endpoint->name,
                'event' => $this->event->getEventName(),
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);
            throw $e; // Trigger retry
        }
    }

    /**
     * Build structured payload
     */
    protected function buildPayload(): array
    {
        return [
            'event' => $this->event->getEventName(),
            'timestamp' => now()->toIso8601String(),
            'data' => [
                'entity_type' => $this->event->entityType,
                'action' => $this->event->action,
                'payload' => $this->event->data,
                'changed_fields' => $this->event->changedFields,
            ],
            'metadata' => [
                'webhook_id' => uniqid('wh_', true),
                'retry_count' => $this->attempts() - 1,
            ]
        ];
    }

    /**
     * Generate HMAC SHA256 signature
     */
    protected function generateSignature(array $payload): string
    {
        $body = json_encode($payload);
        return 'sha256=' . hash_hmac('sha256', $body, $this->endpoint->secret);
    }

    /**
     * Handle job failure after all retries exhausted
     */
    public function failed(\Throwable $exception): void
    {
        $this->endpoint->update(['failed_at' => now()]);
        
        // Optional: Send alert to admin
        // Notification::route('mail', 'admin@kampus.ac.id')
        //     ->notify(new WebhookFailedNotification($this->endpoint, $exception));
    }
}
1.7 Seeder: Setup Endpoints
php
Copy
<?php
// database/seeders/WebhookEndpointSeeder.php

namespace Database\Seeders;

use App\Models\WebhookEndpoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebhookEndpointSeeder extends Seeder
{
    public function run(): void
    {
        // eSPPD - butuh data Pegawai & Dosen
        WebhookEndpoint::create([
            'name' => 'eSPPD Production',
            'url' => 'https://espdd.kampus.ac.id/api/webhooks/master-data',
            'secret' => Str::random(32),
            'events' => ['pegawai.created', 'pegawai.updated', 'pegawai.deleted', 
                        'dosen.created', 'dosen.updated', 'dosen.deleted'],
            'is_active' => true,
            'retry_attempts' => 3,
        ]);

        // KKN - butuh data Mahasiswa & Dosen
        WebhookEndpoint::create([
            'name' => 'KKN Production',
            'url' => 'https://kkn.kampus.ac.id/api/webhooks/master-data',
            'secret' => Str::random(32),
            'events' => ['mahasiswa.created', 'mahasiswa.updated', 'mahasiswa.deleted',
                        'dosen.created', 'dosen.updated', 'dosen.deleted'],
            'is_active' => true,
            'retry_attempts' => 5, // KKN lebih critical, retry lebih banyak
        ]);
    }
}
2. Sisi Client (eSPPD & KKN)
2.1 Middleware: VerifyWebhookSignature
php
Copy
<?php
// app/Http/Middleware/VerifyWebhookSignature.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    /**
     * Expected header name from Master API
     */
    protected const SIGNATURE_HEADER = 'X-Hub-Signature';
    protected const SECRET_ENV_KEY = 'MASTER_API_WEBHOOK_SECRET';

    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header(self::SIGNATURE_HEADER);
        
        if (!$signature) {
            Log::warning('Webhook missing signature', [
                'ip' => $request->ip(),
                'url' => $request->url()
            ]);
            return response()->json(['error' => 'Missing signature'], 401);
        }

        $secret = config('services.master_api.webhook_secret');
        
        if (!$secret) {
            Log::error('Webhook secret not configured');
            return response()->json(['error' => 'Server configuration error'], 500);
        }

        $computed = $this->computeSignature($request->getContent(), $secret);

        // Timing-attack safe comparison
        if (!hash_equals($computed, $signature)) {
            Log::warning('Webhook invalid signature', [
                'ip' => $request->ip(),
                'expected' => substr($computed, 0, 10) . '...',
                'received' => substr($signature, 0, 10) . '...'
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Attach verified payload to request for controller
        $request->attributes->set('webhook_verified', true);
        $request->attributes->set('webhook_event', $request->header('X-Webhook-Event'));

        return $next($request);
    }

    /**
     * Compute HMAC SHA256 signature
     */
    protected function computeSignature(string $payload, string $secret): string
    {
        return 'sha256=' . hash_hmac('sha256', $payload, $secret);
    }
}
2.2 Kernel: Register Middleware
php
Copy
<?php
// app/Http/Kernel.php

protected $routeMiddleware = [
    // ... other middleware
    'webhook.verify' => \App\Http\Middleware\VerifyWebhookSignature::class,
];
2.3 Routes
php
Copy
<?php
// routes/api.php

use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/master-data', [WebhookController::class, 'handle'])
    ->middleware('webhook.verify')
    ->name('webhooks.master-data');
2.4 Controller: WebhookController
php
Copy
<?php
// app/Http/Controllers/WebhookController.php

namespace App\Http\Controllers;

use App\Jobs\ProcessWebhookJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle incoming webhook from Master API
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        $event = $request->header('X-Webhook-Event');
        $webhookId = $request->header('X-Webhook-ID');

        // Idempotency check: Prevent duplicate processing
        $cacheKey = "webhook:processed:{$webhookId}";
        if (cache()->has($cacheKey)) {
            Log::info('Duplicate webhook ignored', ['webhook_id' => $webhookId]);
            return response()->json(['status' => 'already processed'], 200);
        }

        // Mark as processed (24 hours TTL)
        cache()->put($cacheKey, true, now()->addHours(24));

        // Dispatch to queue for async processing (jangan blocking response)
        ProcessWebhookJob::dispatch($event, $payload)
            ->onQueue('webhook-processing');

        // Return 202 Accepted immediately (best practice webhook)
        return response()->json([
            'status' => 'accepted',
            'webhook_id' => $webhookId,
            'event' => $event,
            'queued_at' => now()->toIso8601String()
        ], 202);
    }
}
2.5 Job: ProcessWebhookJob (Client Side)
php
Copy
<?php
// app/Jobs/ProcessWebhookJob.php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(
        public string $event,
        public array $payload
    ) {}

    public function handle(): void
    {
        [$entityType, $action] = explode('.', $this->event);
        $data = $this->payload['data']['payload'] ?? [];

        Log::info('Processing webhook', [
            'event' => $this->event,
            'entity' => $entityType,
            'action' => $action
        ]);

        try {
            match($entityType) {
                'mahasiswa' => $this->handleMahasiswa($action, $data),
                'dosen' => $this->handleDosen($action, $data),
                'pegawai' => $this->handlePegawai($action, $data),
                default => throw new \Exception("Unknown entity: {$entityType}")
            };
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'event' => $this->event,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Handle Mahasiswa data (untuk aplikasi KKN)
     */
    protected function handleMahasiswa(string $action, array $data): void
    {
        // Mapping field dari Master API ke struktur lokal KKN
        $mappedData = [
            'master_id' => $data['id'], // ID dari Master API (untuk referensi)
            'nim' => $data['nim'],
            'nama_lengkap' => $data['nama'],
            'program_studi' => $data['prodi']['nama'] ?? null,
            'fakultas' => $data['fakultas']['nama'] ?? null,
            'angkatan' => $data['angkatan'],
            'email' => $data['email'],
            'no_hp' => $data['telepon'],
            'status' => $data['status'], // aktif/non-aktif/lulus
            'synced_at' => now(),
        ];

        match($action) {
            'created' => DB::table('mahasiswa')->insert($mappedData),
            'updated' => DB::table('mahasiswa')
                ->where('master_id', $data['id'])
                ->update($mappedData),
            'deleted' => DB::table('mahasiswa')
                ->where('master_id', $data['id'])
                ->update(['deleted_at' => now(), 'status' => 'deleted']),
            default => null
        };

        Log::info("Mahasiswa {$action} processed", ['nim' => $data['nim']]);
    }

    /**
     * Handle Dosen data (untuk eSPPD & KKN)
     */
    protected function handleDosen(string $action, array $data): void
    {
        $mappedData = [
            'master_id' => $data['id'],
            'nidn' => $data['nidn'],
            'nama' => $data['nama'],
            'gelar_depan' => $data['gelar_depan'],
            'gelar_belakang' => $data['gelar_belakang'],
            'prodi' => $data['prodi']['nama'] ?? null,
            'jabatan_fungsional' => $data['jabatan_fungsional'],
            'status_aktif' => $data['status'],
            'synced_at' => now(),
        ];

        match($action) {
            'created' => DB::table('dosen')->insert($mappedData),
            'updated' => DB::table('dosen')
                ->where('master_id', $data['id'])
                ->update($mappedData),
            'deleted' => DB::table('dosen')
                ->where('master_id', $data['id'])
                ->delete(),
            default => null
        };
    }

    /**
     * Handle Pegawai data (untuk eSPPD)
     */
    protected function handlePegawai(string $action, array $data): void
    {
        $mappedData = [
            'master_id' => $data['id'],
            'nip' => $data['nip'],
            'nama' => $data['nama'],
            'jabatan' => $data['jabatan']['nama'] ?? null,
            'unit_kerja' => $data['unit_kerja']['nama'] ?? null,
            'golongan' => $data['golongan'],
            'status' => $data['status'],
            'synced_at' => now(),
        ];

        match($action) {
            'created' => DB::table('pegawai')->insert($mappedData),
            'updated' => DB::table('pegawai')
                ->where('master_id', $data['id'])
                ->update($mappedData),
            'deleted' => DB::table('pegawai')
                ->where('master_id', $data['id'])
                ->delete(),
            default => null
        };
    }
}
2.6 Config: services.php (Client)
php
Copy
<?php
// config/services.php

return [
    // ... other configs
    
    'master_api' => [
        'webhook_secret' => env('MASTER_API_WEBHOOK_SECRET'),
        'base_url' => env('MASTER_API_URL', 'https://master-api.kampus.ac.id'),
    ],
];
3. Keamanan Lanjutan
3.1 IP Whitelisting (Opsional tapi direkomendasikan)
php
Copy
<?php
// app/Http/Middleware/VerifyWebhookIp.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookIp
{
    protected array $allowedIps;

    public function __construct()
    {
        // IP Master API (statis) atau dari config
        $this->allowedIps = config('services.master_api.allowed_ips', [
            '203.0.113.10', // IP Production Master API
            '203.0.113.20', // IP Backup Master API
        ]);
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->ip(), $this->allowedIps)) {
            return response()->json(['error' => 'Unauthorized IP'], 403);
        }

        return $next($request);
    }
}
3.2 Rate Limiting Khusus Webhook
php
Copy
<?php
// app/Providers/RouteServiceProvider.php

protected function configureRateLimiting(): void
{
    RateLimiter::for('webhooks', function (Request $request) {
        // Limit 60 requests per minute per IP (Master API)
        return Limit::perMinute(60)->by($request->ip());
    });
}
php
Copy
// routes/api.php
Route::middleware(['throttle:webhooks', 'webhook.verify', 'webhook.ip'])
    ->post('/webhooks/master-data', [WebhookController::class, 'handle']);
4. Monitoring & Debugging
4.1 Command: Test Webhook (Master API)
php
Copy
<?php
// app/Console/Commands/TestWebhook.php

namespace App\Console\Commands;

use App\Jobs\SendWebhookJob;
use App\Models\WebhookEndpoint;
use Illuminate\Console\Command;

class TestWebhook extends Command
{
    protected $signature = 'webhook:test 
                            {endpoint : ID or name of endpoint}
                            {--event=mahasiswa.created : Event to simulate}
                            {--payload= : JSON payload}';

    protected $description = 'Test webhook delivery to specific endpoint';

    public function handle(): int
    {
        $endpointId = $this->argument('endpoint');
        
        $endpoint = is_numeric($endpointId) 
            ? WebhookEndpoint::find($endpointId)
            : WebhookEndpoint::where('name', $endpointId)->first();

        if (!$endpoint) {
            $this->error("Endpoint not found: {$endpointId}");
            return 1;
        }

        $payload = $this->option('payload') 
            ? json_decode($this->option('payload'), true)
            : ['id' => 999, 'nama' => 'Test Data', 'nim' => '2024001'];

        $event = new \App\Events\DataChanged(
            explode('.', $this->option('event'))[0],
            explode('.', $this->option('event'))[1],
            $payload
        );

        SendWebhookJob::dispatch($endpoint, $event);

        $this->info("Test webhook dispatched to: {$endpoint->name}");
        $this->info("URL: {$endpoint->url}");
        $this->info("Event: {$this->option('event')}");

        return 0;
    }
}
4.2 Tabel Log Webhook (Opsional)
php
Copy
<?php
// Migration untuk logging
Schema::create('webhook_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('webhook_endpoint_id')->constrained();
    $table->string('event');
    $table->string('webhook_id')->unique();
    $table->text('payload')->nullable();
    $table->integer('response_status')->nullable();
    $table->text('response_body')->nullable();
    $table->timestamp('sent_at');
    $table->float('duration_ms')->nullable(); // Response time
    $table->timestamps();
});
5. Checklist Implementasi
Table
Copy
Tahap	Master API	Client (eSPPD/KKN)
1. Database	✅ Migration webhook_endpoints	✅ Migration tabel data (dengan master_id)
2. Model	✅ Model WebhookEndpoint	✅ -
3. Event/Observer	✅ DataChanged event + Observers	✅ -
4. Queue	✅ SendWebhookJob	✅ ProcessWebhookJob
5. Security	✅ HMAC Signature generation	✅ Middleware VerifyWebhookSignature
6. Routes	✅ -	✅ Route dengan middleware
7. Config	✅ .env (APP_KEY untuk fallback)	✅ MASTER_API_WEBHOOK_SECRET
8. Testing	✅ Command webhook:test	✅ Log processing
Environment Variables
Master API .env:
env
Copy
QUEUE_CONNECTION=redis # atau database
WEBHOOK_QUEUE=webhooks
Client Apps .env:
env
Copy
MASTER_API_WEBHOOK_SECRET=your_generated_secret_here
MASTER_API_ALLOWED_IPS=203.0.113.10,203.0.113.20
6. Alur Data Lengkap
plain
Copy
[User Update Data Mahasiswa di Master API]
           │
           ▼
[MahasiswaObserver@updated]
           │
           ▼
[Event: DataChanged dispatched]
           │
           ▼
[DispatchWebhookListener]
           │
           ├───► [Queue: SendWebhookJob] ───► [HTTP POST ke eSPPD]
           │                                      │
           │                                      ▼
           │                              [Middleware: Verify Signature]
           │                                      │
           │                                      ▼
           │                              [WebhookController@handle]
           │                                      │
           │                                      ▼
           │                              [Queue: ProcessWebhookJob]
           │                                      │
           │                                      ▼
           │                              [Update DB lokal eSPPD]
           │
           └───► [Queue: SendWebhookJob] ───► [HTTP POST ke KKN]
                                                  │
                                                  ▼
                                          [Middleware: Verify Signature]
                                                  │
                                                  ▼
                                          [WebhookController@handle]
                                                  │
                                                  ▼
                                          [Queue: ProcessWebhookJob]
                                                  │
                                                  ▼
                                          [Update DB lokal KKN]
Dengan arsitektur ini, Master API tetap responsif karena menggunakan Queue, data tersinkron secara realtime (dalam hitungan detik), dan keamanan terjaga dengan HMAC signature + IP whitelisting.

---


Panduan Implementasi Webhook Realtime Antar 3 Aplikasi Laravel
Saya akan membantu Anda membangun sistem webhook yang aman dan efisien untuk sinkronisasi data antar aplikasi dalam ekosistem kampus.
1. MASTER API (Sender Side)
1.1 Migration untuk Webhook Endpoints
php<?php
// database/migrations/2024_02_16_create_webhook_endpoints_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('webhook_endpoints', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "eSPPD", "KKN"
            $table->string('url'); // Endpoint URL client
            $table->string('secret'); // Secret key untuk HMAC signature
            $table->json('events'); // Events yang di-subscribe: ["mahasiswa.*", "dosen.*"]
            $table->boolean('is_active')->default(true);
            $table->integer('retry_count')->default(3); // Max retry jika gagal
            $table->timestamps();
        });

        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_endpoint_id')->constrained()->onDelete('cascade');
            $table->string('event'); // e.g., "mahasiswa.updated"
            $table->json('payload'); // Data yang dikirim
            $table->string('status'); // success, failed, pending
            $table->text('response')->nullable(); // Response dari client
            $table->integer('attempts')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('webhook_logs');
        Schema::dropIfExists('webhook_endpoints');
    }
};
1.2 Model WebhookEndpoint
php<?php
// app/Models/WebhookEndpoint.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEndpoint extends Model
{
    protected $fillable = [
        'name',
        'url',
        'secret',
        'events',
        'is_active',
        'retry_count'
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
    ];

    public function logs()
    {
        return $this->hasMany(WebhookLog::class);
    }

    public function shouldReceiveEvent(string $event): bool
    {
        if (!$this->is_active) {
            return false;
        }

        foreach ($this->events as $pattern) {
            if ($this->matchesPattern($event, $pattern)) {
                return true;
            }
        }

        return false;
    }

    private function matchesPattern(string $event, string $pattern): bool
    {
        $pattern = preg_quote($pattern, '/');
        $pattern = str_replace('\*', '.*', $pattern);
        return (bool) preg_match('/^' . $pattern . '$/', $event);
    }
}
1.3 Model WebhookLog
php<?php
// app/Models/WebhookLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'webhook_endpoint_id',
        'event',
        'payload',
        'status',
        'response',
        'attempts',
        'sent_at'
    ];

    protected $casts = [
        'payload' => 'array',
        'sent_at' => 'datetime',
    ];

    public function endpoint()
    {
        return $this->belongsTo(WebhookEndpoint::class, 'webhook_endpoint_id');
    }
}
1.4 Observer untuk Mahasiswa
php<?php
// app/Observers/MahasiswaObserver.php

namespace App\Observers;

use App\Models\Mahasiswa;
use App\Services\WebhookService;

class MahasiswaObserver
{
    protected $webhookService;

    public function __construct(WebhookService $webhookService)
    {
        $this->webhookService = $webhookService;
    }

    public function created(Mahasiswa $mahasiswa)
    {
        $this->webhookService->trigger('mahasiswa.created', [
            'id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
            'nama' => $mahasiswa->nama,
            'email' => $mahasiswa->email,
            'program_studi' => $mahasiswa->program_studi,
            'angkatan' => $mahasiswa->angkatan,
            'status' => $mahasiswa->status,
        ]);
    }

    public function updated(Mahasiswa $mahasiswa)
    {
        $this->webhookService->trigger('mahasiswa.updated', [
            'id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
            'nama' => $mahasiswa->nama,
            'email' => $mahasiswa->email,
            'program_studi' => $mahasiswa->program_studi,
            'angkatan' => $mahasiswa->angkatan,
            'status' => $mahasiswa->status,
            'changed' => array_keys($mahasiswa->getChanges()),
        ]);
    }

    public function deleted(Mahasiswa $mahasiswa)
    {
        $this->webhookService->trigger('mahasiswa.deleted', [
            'id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
        ]);
    }
}
1.5 Observer untuk Dosen
php<?php
// app/Observers/DosenObserver.php

namespace App\Observers;

use App\Models\Dosen;
use App\Services\WebhookService;

class DosenObserver
{
    protected $webhookService;

    public function __construct(WebhookService $webhookService)
    {
        $this->webhookService = $webhookService;
    }

    public function created(Dosen $dosen)
    {
        $this->webhookService->trigger('dosen.created', [
            'id' => $dosen->id,
            'nidn' => $dosen->nidn,
            'nama' => $dosen->nama,
            'email' => $dosen->email,
            'jabatan' => $dosen->jabatan,
            'status' => $dosen->status,
        ]);
    }

    public function updated(Dosen $dosen)
    {
        $this->webhookService->trigger('dosen.updated', [
            'id' => $dosen->id,
            'nidn' => $dosen->nidn,
            'nama' => $dosen->nama,
            'email' => $dosen->email,
            'jabatan' => $dosen->jabatan,
            'status' => $dosen->status,
            'changed' => array_keys($dosen->getChanges()),
        ]);
    }

    public function deleted(Dosen $dosen)
    {
        $this->webhookService->trigger('dosen.deleted', [
            'id' => $dosen->id,
            'nidn' => $dosen->nidn,
        ]);
    }
}
1.6 Webhook Service
php<?php
// app/Services/WebhookService.php

namespace App\Services;

use App\Models\WebhookEndpoint;
use App\Models\WebhookLog;
use App\Jobs\SendWebhookJob;

class WebhookService
{
    public function trigger(string $event, array $data)
    {
        $endpoints = WebhookEndpoint::where('is_active', true)->get();

        foreach ($endpoints as $endpoint) {
            if ($endpoint->shouldReceiveEvent($event)) {
                $this->dispatch($endpoint, $event, $data);
            }
        }
    }

    protected function dispatch(WebhookEndpoint $endpoint, string $event, array $data)
    {
        $payload = [
            'event' => $event,
            'timestamp' => now()->toIso8601String(),
            'data' => $data,
        ];

        // Simpan log dengan status pending
        $log = WebhookLog::create([
            'webhook_endpoint_id' => $endpoint->id,
            'event' => $event,
            'payload' => $payload,
            'status' => 'pending',
            'attempts' => 0,
        ]);

        // Dispatch job ke queue
        SendWebhookJob::dispatch($endpoint, $log);
    }

    public static function generateSignature(array $payload, string $secret): string
    {
        return hash_hmac('sha256', json_encode($payload), $secret);
    }
}
1.7 SendWebhookJob
php<?php
// app/Jobs/SendWebhookJob.php

namespace App\Jobs;

use App\Models\WebhookEndpoint;
use App\Models\WebhookLog;
use App\Services\WebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900]; // Retry after 1min, 5min, 15min

    protected $endpoint;
    protected $log;

    public function __construct(WebhookEndpoint $endpoint, WebhookLog $log)
    {
        $this->endpoint = $endpoint;
        $this->log = $log;
    }

    public function handle()
    {
        try {
            $payload = $this->log->payload;
            $signature = WebhookService::generateSignature($payload, $this->endpoint->secret);

            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Hub-Signature-256' => 'sha256=' . $signature,
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'Master-API-Webhook/1.0',
                ])
                ->post($this->endpoint->url, $payload);

            $this->log->update([
                'status' => $response->successful() ? 'success' : 'failed',
                'response' => $response->body(),
                'attempts' => $this->log->attempts + 1,
                'sent_at' => now(),
            ]);

            if (!$response->successful()) {
                Log::warning("Webhook failed for {$this->endpoint->name}", [
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);

                if ($this->attempts() < $this->tries) {
                    $this->release($this->backoff[$this->attempts()] ?? 900);
                }
            }

        } catch (\Exception $e) {
            Log::error("Webhook exception for {$this->endpoint->name}: " . $e->getMessage());

            $this->log->update([
                'status' => 'failed',
                'response' => $e->getMessage(),
                'attempts' => $this->log->attempts + 1,
            ]);

            if ($this->attempts() < $this->tries) {
                $this->release($this->backoff[$this->attempts()] ?? 900);
            }
        }
    }

    public function failed(\Throwable $exception)
    {
        $this->log->update([
            'status' => 'failed',
            'response' => 'Max retries exceeded: ' . $exception->getMessage(),
        ]);
    }
}
1.8 Register Observers
php<?php
// app/Providers/EventServiceProvider.php

namespace App\Providers;

use App\Models\Mahasiswa;
use App\Models\Dosen;
use App\Observers\MahasiswaObserver;
use App\Observers\DosenObserver;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Mahasiswa::observe(MahasiswaObserver::class);
        Dosen::observe(DosenObserver::class);
    }
}
1.9 Seeder untuk Setup Endpoints
php<?php
// database/seeders/WebhookEndpointSeeder.php

namespace Database\Seeders;

use App\Models\WebhookEndpoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebhookEndpointSeeder extends Seeder
{
    public function run()
    {
        WebhookEndpoint::create([
            'name' => 'eSPPD',
            'url' => env('ESPPD_WEBHOOK_URL', 'https://esppd.kampus.ac.id/api/webhook'),
            'secret' => env('ESPPD_WEBHOOK_SECRET', Str::random(32)),
            'events' => ['dosen.*', 'pegawai.*'],
            'is_active' => true,
            'retry_count' => 3,
        ]);

        WebhookEndpoint::create([
            'name' => 'KKN',
            'url' => env('KKN_WEBHOOK_URL', 'https://kkn.kampus.ac.id/api/webhook'),
            'secret' => env('KKN_WEBHOOK_SECRET', Str::random(32)),
            'events' => ['mahasiswa.*', 'dosen.*'],
            'is_active' => true,
            'retry_count' => 3,
        ]);
    }
}

2. CLIENT APPS (eSPPD & KKN - Receiver Side)
2.1 Migration untuk Sync Log
php<?php
// database/migrations/2024_02_16_create_webhook_sync_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('webhook_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event');
            $table->json('payload');
            $table->string('status'); // processed, failed, duplicate
            $table->text('error_message')->nullable();
            $table->string('signature')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('webhook_sync_logs');
    }
};
2.2 WebhookController
php<?php
// app/Http/Controllers/WebhookController.php

namespace App\Http\Controllers;

use App\Models\WebhookSyncLog;
use App\Services\WebhookHandlerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    protected $handler;

    public function __construct(WebhookHandlerService $handler)
    {
        $this->handler = $handler;
    }

    public function handle(Request $request)
    {
        // Verifikasi signature
        if (!$this->verifySignature($request)) {
            Log::warning('Invalid webhook signature', [
                'ip' => $request->ip(),
                'signature' => $request->header('X-Hub-Signature-256'),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid signature'
            ], 401);
        }

        try {
            $payload = $request->all();
            $event = $payload['event'] ?? null;

            if (!$event) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Event type is required'
                ], 400);
            }

            // Log webhook masuk
            $syncLog = WebhookSyncLog::create([
                'event' => $event,
                'payload' => $payload,
                'status' => 'processing',
                'signature' => $request->header('X-Hub-Signature-256'),
            ]);

            // Process webhook
            $result = $this->handler->process($event, $payload['data'] ?? []);

            $syncLog->update([
                'status' => $result['status'],
                'error_message' => $result['message'] ?? null,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Webhook processed successfully',
                'event' => $event,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Webhook processing error: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            if (isset($syncLog)) {
                $syncLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Webhook processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    protected function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-Hub-Signature-256');
        
        if (!$signature) {
            return false;
        }

        // Remove 'sha256=' prefix
        $signature = str_replace('sha256=', '', $signature);

        $payload = $request->getContent();
        $secret = env('MASTER_API_WEBHOOK_SECRET');

        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        return hash_equals($expectedSignature, $signature);
    }
}
2.3 WebhookHandlerService (untuk eSPPD)
php<?php
// app/Services/WebhookHandlerService.php (eSPPD)

namespace App\Services;

use App\Models\Dosen;
use App\Models\Pegawai;
use Illuminate\Support\Facades\DB;

class WebhookHandlerService
{
    public function process(string $event, array $data): array
    {
        [$entity, $action] = explode('.', $event);

        return match ($entity) {
            'dosen' => $this->handleDosen($action, $data),
            'pegawai' => $this->handlePegawai($action, $data),
            default => ['status' => 'ignored', 'message' => 'Event not handled'],
        };
    }

    protected function handleDosen(string $action, array $data): array
    {
        try {
            DB::beginTransaction();

            switch ($action) {
                case 'created':
                case 'updated':
                    Dosen::updateOrCreate(
                        ['id' => $data['id']],
                        [
                            'nidn' => $data['nidn'],
                            'nama' => $data['nama'],
                            'email' => $data['email'],
                            'jabatan' => $data['jabatan'],
                            'status' => $data['status'],
                        ]
                    );
                    break;

                case 'deleted':
                    Dosen::where('id', $data['id'])->delete();
                    break;

                default:
                    return ['status' => 'ignored', 'message' => 'Unknown action'];
            }

            DB::commit();
            return ['status' => 'processed'];

        } catch (\Exception $e) {
            DB::rollBack();
            return ['status' => 'failed', 'message' => $e->getMessage()];
        }
    }

    protected function handlePegawai(string $action, array $data): array
    {
        try {
            DB::beginTransaction();

            switch ($action) {
                case 'created':
                case 'updated':
                    Pegawai::updateOrCreate(
                        ['id' => $data['id']],
                        [
                            'nip' => $data['nip'],
                            'nama' => $data['nama'],
                            'email' => $data['email'],
                            'jabatan' => $data['jabatan'],
                            'status' => $data['status'],
                        ]
                    );
                    break;

                case 'deleted':
                    Pegawai::where('id', $data['id'])->delete();
                    break;

                default:
                    return ['status' => 'ignored', 'message' => 'Unknown action'];
            }

            DB::commit();
            return ['status' => 'processed'];

        } catch (\Exception $e) {
            DB::rollBack();
            return ['status' => 'failed', 'message' => $e->getMessage()];
        }
    }
}
2.4 WebhookHandlerService (untuk KKN)
php<?php
// app/Services/WebhookHandlerService.php (KKN)

namespace App\Services;

use App\Models\Mahasiswa;
use App\Models\Dosen;
use Illuminate\Support\Facades\DB;

class WebhookHandlerService
{
    public function process(string $event, array $data): array
    {
        [$entity, $action] = explode('.', $event);

        return match ($entity) {
            'mahasiswa' => $this->handleMahasiswa($action, $data),
            'dosen' => $this->handleDosen($action, $data),
            default => ['status' => 'ignored', 'message' => 'Event not handled'],
        };
    }

    protected function handleMahasiswa(string $action, array $data): array
    {
        try {
            DB::beginTransaction();

            switch ($action) {
                case 'created':
                case 'updated':
                    Mahasiswa::updateOrCreate(
                        ['id' => $data['id']],
                        [
                            'nim' => $data['nim'],
                            'nama' => $data['nama'],
                            'email' => $data['email'],
                            'program_studi' => $data['program_studi'],
                            'angkatan' => $data['angkatan'],
                            'status' => $data['status'],
                        ]
                    );
                    break;

                case 'deleted':
                    Mahasiswa::where('id', $data['id'])->delete();
                    break;

                default:
                    return ['status' => 'ignored', 'message' => 'Unknown action'];
            }

            DB::commit();
            return ['status' => 'processed'];

        } catch (\Exception $e) {
            DB::rollBack();
            return ['status' => 'failed', 'message' => $e->getMessage()];
        }
    }

    protected function handleDosen(string $action, array $data): array
    {
        try {
            DB::beginTransaction();

            switch ($action) {
                case 'created':
                case 'updated':
                    Dosen::updateOrCreate(
                        ['id' => $data['id']],
                        [
                            'nidn' => $data['nidn'],
                            'nama' => $data['nama'],
                            'email' => $data['email'],
                            'jabatan' => $data['jabatan'],
                            'status' => $data['status'],
                        ]
                    );
                    break;

                case 'deleted':
                    Dosen::where('id', $data['id'])->delete();
                    break;

                default:
                    return ['status' => 'ignored', 'message' => 'Unknown action'];
            }

            DB::commit();
            return ['status' => 'processed'];

        } catch (\Exception $e) {
            DB::rollBack();
            return ['status' => 'failed', 'message' => $e->getMessage()];
        }
    }
}
2.5 Routes untuk Webhook
php<?php
// routes/api.php (eSPPD & KKN)

use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhook', [WebhookController::class, 'handle'])
    ->name('webhook.handle');
2.6 Disable CSRF untuk Webhook Route
php<?php
// app/Http/Middleware/VerifyCsrfToken.php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected $except = [
        'api/webhook',
    ];
}

3. KONFIGURASI ENVIRONMENT
Master API (.env)
env# Webhook Endpoints
ESPPD_WEBHOOK_URL=https://esppd.kampus.ac.id/api/webhook
ESPPD_WEBHOOK_SECRET=your-esppd-secret-key-min-32-chars

KKN_WEBHOOK_URL=https://kkn.kampus.ac.id/api/webhook
KKN_WEBHOOK_SECRET=your-kkn-secret-key-min-32-chars

# Queue Configuration
QUEUE_CONNECTION=redis
eSPPD (.env)
env# Master API Webhook Secret
MASTER_API_WEBHOOK_SECRET=your-esppd-secret-key-min-32-chars
KKN (.env)
env# Master API Webhook Secret
MASTER_API_WEBHOOK_SECRET=your-kkn-secret-key-min-32-chars

4. TESTING WEBHOOK
Test Script (Master API)
php<?php
// routes/console.php atau Artisan Command

use App\Services\WebhookService;

Artisan::command('webhook:test', function (WebhookService $webhookService) {
    $webhookService->trigger('mahasiswa.created', [
        'id' => 999,
        'nim' => '123456789',
        'nama' => 'Test Mahasiswa',
        'email' => 'test@kampus.ac.id',
        'program_studi' => 'Teknik Informatika',
        'angkatan' => 2024,
        'status' => 'aktif',
    ]);

    $this->info('Test webhook dispatched!');
});
Jalankan: php artisan webhook:test

5. MONITORING & LOGGING
Dashboard Monitoring (Master API)
php<?php
// app/Http/Controllers/WebhookMonitorController.php

namespace App\Http\Controllers;

use App\Models\WebhookLog;
use Illuminate\Http\Request;

class WebhookMonitorController extends Controller
{
    public function index(Request $request)
    {
        $logs = WebhookLog::with('endpoint')
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->endpoint_id, fn($q, $id) => $q->where('webhook_endpoint_id', $id))
            ->latest()
            ->paginate(50);

        return view('webhook.monitor', compact('logs'));
    }

    public function retry($id)
    {
        $log = WebhookLog::findOrFail($id);
        
        if ($log->status === 'failed') {
            SendWebhookJob::dispatch($log->endpoint, $log);
            return back()->with('success', 'Webhook queued for retry');
        }

        return back()->with('error', 'Only failed webhooks can be retried');
    }
}

6. KEAMANAN TAMBAHAN
Rate Limiting (Client Apps)
php<?php
// app/Http/Kernel.php

protected $middlewareGroups = [
    'api' => [
        \Illuminate\Routing\Middleware\ThrottleRequests::class.':60,1',
    ],
];

// routes/api.php
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->middleware('throttle:100,1'); // Max 100 requests per minute
IP Whitelist (Optional)
php<?php
// app/Http/Middleware/WebhookIpWhitelist.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class WebhookIpWhitelist
{
    protected $allowedIps = [
        '192.168.1.100', // Master API Server IP
    ];

    public function handle(Request $request, Closure $next)
    {
        if (!in_array($request->ip(), $this->allowedIps)) {
            return response()->json(['error' => 'Unauthorized IP'], 403);
        }

        return $next($request);
    }
}

7. CHECKLIST IMPLEMENTASI
Master API:

 Jalankan migration untuk webhook_endpoints dan webhook_logs
 Setup Queue Worker (php artisan queue:work)
 Daftarkan Observer di EventServiceProvider
 Jalankan seeder untuk setup endpoints
 Set environment variables untuk webhook URLs dan secrets

Client Apps (eSPPD & KKN):

 Jalankan migration untuk webhook_sync_logs
 Tambahkan route /api/webhook
 Disable CSRF untuk webhook route
 Set MASTER_API_WEBHOOK_SECRET di .env
 Test webhook dengan curl atau Postman

Testing:

 Test create mahasiswa di Master API → cek KKN
 Test update dosen di Master API → cek eSPPD & KKN
 Test delete data di Master API → cek client apps
 Monitor webhook logs untuk memastikan delivery berhasil

Sistem webhook realtime Anda siap digunakan! Semua perubahan data akan tersinkron otomatis antar aplikasi dengan keamanan HMAC signature. 🚀
