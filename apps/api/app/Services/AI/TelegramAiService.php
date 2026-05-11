<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Services\TelegramAlertService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * TelegramAiService — AI-powered Telegram bot integration.
 *
 * Combines health monitoring data with AI analysis to send intelligent
 * summaries, anomaly detection, and actionable recommendations via Telegram.
 */
class TelegramAiService
{
    use HasAiFailover;

    private const CACHE_PREFIX = 'telegram_ai:';

    public function __construct(
        private TelegramAlertService $telegram,
    ) {}

    /**
     * Generate and send daily KKN operations digest via Telegram.
     */
    public function sendDailyDigest(): bool
    {
        if (! $this->telegram->isConfigured()) {
            return false;
        }

        $stats = $this->gatherDailyStats();
        $aiSummary = $this->generateAiSummary('daily_digest', $stats);

        $message = "*DAILY DIGEST KKN*\n"
            . "_" . now()->translatedFormat('l, d F Y') . "_\n\n"
            . $aiSummary . "\n\n"
            . "*Statistik Hari Ini:*\n"
            . "• Laporan harian baru: {$stats['daily_reports_today']}\n"
            . "• Pendaftaran baru: {$stats['registrations_today']}\n"
            . "• Mahasiswa aktif: {$stats['active_students']}\n"
            . "• Queue pending: {$stats['queue_pending']}\n"
            . "• Failed jobs: {$stats['failed_jobs']}";

        return $this->telegram->send($message, TelegramAlertService::SEVERITY_INFO);
    }

    /**
     * Detect anomalies and send AI-analyzed alert.
     */
    public function detectAndAlertAnomalies(): bool
    {
        if (! $this->telegram->isConfigured()) {
            return false;
        }

        $anomalies = $this->detectAnomalies();

        if (empty($anomalies)) {
            return false;
        }

        // Dedup: don't send same anomaly type within 2 hours
        $dedupKey = self::CACHE_PREFIX . 'anomaly:' . md5(json_encode(array_keys($anomalies)));
        if (Cache::has($dedupKey)) {
            return false;
        }

        $aiAnalysis = $this->generateAiSummary('anomaly_detection', $anomalies);

        $message = "*ANOMALY DETECTED*\n\n"
            . $aiAnalysis . "\n\n"
            . "*Detail:*\n";

        foreach ($anomalies as $type => $detail) {
            $message .= "• *{$type}*: {$detail}\n";
        }

        $sent = $this->telegram->send($message, TelegramAlertService::SEVERITY_WARNING);

        if ($sent) {
            Cache::put($dedupKey, true, now()->addHours(2));
        }

        return $sent;
    }

    /**
     * Send AI-powered weekly performance report.
     */
    public function sendWeeklyReport(): bool
    {
        if (! $this->telegram->isConfigured()) {
            return false;
        }

        $stats = $this->gatherWeeklyStats();
        $aiSummary = $this->generateAiSummary('weekly_report', $stats);

        $message = "*LAPORAN MINGGUAN KKN*\n"
            . "_Periode: " . now()->subWeek()->format('d M') . " - " . now()->format('d M Y') . "_\n\n"
            . $aiSummary . "\n\n"
            . "*Ringkasan Angka:*\n"
            . "• Total laporan harian: {$stats['total_reports']}\n"
            . "• Rata-rata kualitas AI: {$stats['avg_quality_score']}/10\n"
            . "• Laporan di-flag: {$stats['flagged_reports']}\n"
            . "• Kehadiran rata-rata: {$stats['avg_attendance']}%\n"
            . "• Kelompok paling aktif: {$stats['most_active_group']}";

        return $this->telegram->send($message, TelegramAlertService::SEVERITY_INFO);
    }

    /**
     * Alert when AI flags a logbook entry as problematic.
     */
    public function alertFlaggedLogbook(int $activityId, string $reason, string $studentName): bool
    {
        if (! $this->telegram->isConfigured()) {
            return false;
        }

        $message = "*LOGBOOK FLAGGED*\n\n"
            . "Mahasiswa: *{$studentName}*\n"
            . "Activity ID: `{$activityId}`\n"
            . "Alasan: _{$reason}_\n\n"
            . "Tindakan: Review manual diperlukan oleh DPL/Admin.";

        return $this->telegram->send($message, TelegramAlertService::SEVERITY_WARNING);
    }

    /**
     * Generate AI summary using the project's 3-tier failover.
     */
    private function generateAiSummary(string $context, array $data): string
    {
        $tiers = $this->loadAiTiers();
        $prompt = $this->buildPrompt($context, $data);

        foreach ($tiers as $tier) {
            if (empty($tier['key'])) {
                continue;
            }

            try {
                $response = Http::withToken($tier['key'])
                    ->timeout(30)
                    ->post(rtrim($tier['url'], '/') . '/chat/completions', [
                        'model' => $tier['model'],
                        'messages' => [
                            ['role' => 'system', 'content' => 'Anda adalah asisten monitoring KKN. Berikan analisis singkat, actionable, dalam Bahasa Indonesia. Maksimal 3-4 kalimat. Fokus pada insight dan rekomendasi.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.3,
                        'max_tokens' => 300,
                    ]);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content', '');
                    if ($content !== '') {
                        return trim($content);
                    }
                }
            } catch (\Throwable $e) {
                Log::debug("TelegramAiService: tier {$tier['label']} failed: " . $e->getMessage());
            }
        }

        // Fallback: return basic summary without AI
        return $this->fallbackSummary($context, $data);
    }

    private function buildPrompt(string $context, array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return match ($context) {
            'daily_digest' => "Analisis statistik harian KKN berikut dan berikan insight singkat tentang produktivitas, potensi masalah, dan saran:\n\n{$json}",
            'anomaly_detection' => "Anomali terdeteksi di sistem KKN. Analisis dan berikan rekomendasi penanganan:\n\n{$json}",
            'weekly_report' => "Berikut statistik mingguan KKN. Berikan evaluasi performa, tren, dan rekomendasi perbaikan:\n\n{$json}",
            default => "Analisis data berikut:\n\n{$json}",
        };
    }

    private function fallbackSummary(string $context, array $data): string
    {
        return match ($context) {
            'daily_digest' => 'Sistem berjalan normal. Periksa statistik di atas untuk detail.',
            'anomaly_detection' => 'Anomali terdeteksi. Periksa detail di bawah dan ambil tindakan.',
            'weekly_report' => 'Laporan mingguan tersedia. Lihat angka di bawah untuk evaluasi.',
            default => 'Data tersedia untuk review.',
        };
    }

    private function gatherDailyStats(): array
    {
        $today = now()->toDateString();

        return [
            'daily_reports_today' => DB::table('kegiatan_kkn')->whereDate('created_at', $today)->count(),
            'registrations_today' => DB::table('peserta_kkn')->whereDate('created_at', $today)->count(),
            'active_students' => DB::table('peserta_kkn')->where('status', 'approved')->count(),
            'queue_pending' => DB::table('jobs')->count(),
            'failed_jobs' => DB::table('failed_jobs')->count(),
            'ai_analyses_today' => DB::table('kegiatan_kkn')->whereDate('created_at', $today)->whereNotNull('ai_quality_score')->count(),
        ];
    }

    private function gatherWeeklyStats(): array
    {
        $weekAgo = now()->subWeek();

        $totalReports = DB::table('kegiatan_kkn')->where('created_at', '>=', $weekAgo)->count();
        $avgQuality = DB::table('kegiatan_kkn')->where('created_at', '>=', $weekAgo)->whereNotNull('ai_quality_score')->avg('ai_quality_score');
        $flagged = DB::table('kegiatan_kkn')->where('created_at', '>=', $weekAgo)->where('ai_flagged', true)->count();

        $mostActiveGroup = DB::table('kegiatan_kkn')
            ->join('peserta_kkn', 'kegiatan_kkn.mahasiswa_id', '=', 'peserta_kkn.mahasiswa_id')
            ->join('kelompok_kkn', 'peserta_kkn.kelompok_id', '=', 'kelompok_kkn.id')
            ->where('kegiatan_kkn.created_at', '>=', $weekAgo)
            ->groupBy('kelompok_kkn.nama')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(1)
            ->value('kelompok_kkn.nama') ?? '-';

        return [
            'total_reports' => $totalReports,
            'avg_quality_score' => round((float) ($avgQuality ?? 0), 1),
            'flagged_reports' => $flagged,
            'avg_attendance' => $this->calculateWeeklyAttendance($weekAgo),
            'most_active_group' => $mostActiveGroup,
        ];
    }

    private function calculateWeeklyAttendance($since): int
    {
        try {
            $total = DB::table('peserta_kkn')->where('status', 'approved')->count();
            if ($total === 0) return 0;

            $daysInWeek = 7;
            $expectedEntries = $total * $daysInWeek;
            $actualEntries = DB::table('kegiatan_kkn')->where('created_at', '>=', $since)->distinct('mahasiswa_id', 'date')->count();

            return min(100, (int) round(($actualEntries / max(1, $expectedEntries)) * 100));
        } catch (\Throwable) {
            return 0;
        }
    }

    private function detectAnomalies(): array
    {
        $anomalies = [];
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        // 1. Sudden drop in daily reports
        $todayCount = DB::table('kegiatan_kkn')->whereDate('created_at', $today)->count();
        $yesterdayCount = DB::table('kegiatan_kkn')->whereDate('created_at', $yesterday)->count();
        if ($yesterdayCount > 10 && $todayCount < ($yesterdayCount * 0.3)) {
            $anomalies['report_drop'] = "Laporan hari ini ({$todayCount}) turun drastis dari kemarin ({$yesterdayCount})";
        }

        // 2. High flag rate
        $recentReports = DB::table('kegiatan_kkn')->whereDate('created_at', $today)->count();
        $flaggedToday = DB::table('kegiatan_kkn')->whereDate('created_at', $today)->where('ai_flagged', true)->count();
        if ($recentReports > 5 && ($flaggedToday / max(1, $recentReports)) > 0.3) {
            $anomalies['high_flag_rate'] = "{$flaggedToday}/{$recentReports} laporan hari ini di-flag AI (>30%)";
        }

        // 3. Queue buildup
        $queueSize = DB::table('jobs')->count();
        if ($queueSize > 500) {
            $anomalies['queue_buildup'] = "{$queueSize} jobs pending — kemungkinan worker down";
        }

        // 4. Failed jobs spike
        $failedRecent = DB::table('failed_jobs')->where('failed_at', '>=', now()->subHour())->count();
        if ($failedRecent > 5) {
            $anomalies['failed_jobs_spike'] = "{$failedRecent} failed jobs dalam 1 jam terakhir";
        }

        return $anomalies;
    }
}
