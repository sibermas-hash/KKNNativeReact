<?php

declare(strict_types=1);

use App\Services\AI\TelegramAiService;
use App\Services\TelegramAlertService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

uses(TestCase::class);

function makeTelegramAiService(): TelegramAiService
{
    return new TelegramAiService(new TelegramAlertService);
}

function invokeTelegramAiServiceMethod(TelegramAiService $service, string $method, mixed ...$args): mixed
{
    return (fn () => $this->{$method}(...$args))->call($service);
}

describe('Telegram AI service', function () {
    beforeEach(function () {
        Carbon::setTestNow('2026-05-16 09:00:00');
    });

    afterEach(function () {
        Carbon::setTestNow();
        Mockery::close();
    });

    it('counts daily AI analyses from ai_analysis quality_score JSON only for today', function () {
        $today = now()->toDateString();

        $dailyReportsQuery = Mockery::mock();
        $dailyReportsQuery->shouldReceive('whereDate')->once()->with('created_at', $today)->andReturnSelf();
        $dailyReportsQuery->shouldReceive('count')->once()->andReturn(2);

        $registrationsQuery = Mockery::mock();
        $registrationsQuery->shouldReceive('whereDate')->once()->with('created_at', $today)->andReturnSelf();
        $registrationsQuery->shouldReceive('count')->once()->andReturn(2);

        $activeStudentsQuery = Mockery::mock();
        $activeStudentsQuery->shouldReceive('where')->once()->with('status', 'approved')->andReturnSelf();
        $activeStudentsQuery->shouldReceive('count')->once()->andReturn(1);

        $jobsQuery = Mockery::mock();
        $jobsQuery->shouldReceive('count')->once()->andReturn(5);

        $failedJobsQuery = Mockery::mock();
        $failedJobsQuery->shouldReceive('count')->once()->andReturn(1);

        $aiAnalysesQuery = Mockery::mock();
        $aiAnalysesQuery->shouldReceive('whereDate')->once()->with('created_at', $today)->andReturnSelf();
        $aiAnalysesQuery->shouldReceive('whereRaw')->once()->with("(ai_analysis->>'quality_score') IS NOT NULL")->andReturnSelf();
        $aiAnalysesQuery->shouldReceive('count')->once()->andReturn(1);

        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($dailyReportsQuery);
        DB::shouldReceive('table')->once()->with('peserta_kkn')->andReturn($registrationsQuery);
        DB::shouldReceive('table')->once()->with('peserta_kkn')->andReturn($activeStudentsQuery);
        DB::shouldReceive('table')->once()->with('jobs')->andReturn($jobsQuery);
        DB::shouldReceive('table')->once()->with('failed_jobs')->andReturn($failedJobsQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($aiAnalysesQuery);

        $stats = invokeTelegramAiServiceMethod(makeTelegramAiService(), 'gatherDailyStats');

        expect($stats)->toMatchArray([
            'daily_reports_today' => 2,
            'registrations_today' => 2,
            'active_students' => 1,
            'queue_pending' => 5,
            'failed_jobs' => 1,
            'ai_analyses_today' => 1,
        ]);
    });

    it('aggregates weekly quality and flagged counts from ai_analysis JSON fields', function () {
        $weekAgo = now()->subWeek();

        $totalReportsQuery = Mockery::mock();
        $totalReportsQuery->shouldReceive('where')
            ->once()
            ->with('created_at', '>=', Mockery::on(fn ($value) => $value instanceof Carbon && $value->equalTo($weekAgo)))
            ->andReturnSelf();
        $totalReportsQuery->shouldReceive('count')->once()->andReturn(4);

        $avgQualityQuery = Mockery::mock();
        $avgQualityQuery->shouldReceive('where')
            ->once()
            ->with('created_at', '>=', Mockery::on(fn ($value) => $value instanceof Carbon && $value->equalTo($weekAgo)))
            ->andReturnSelf();
        $avgQualityQuery->shouldReceive('selectRaw')
            ->once()
            ->with("AVG((ai_analysis->>'quality_score')::numeric) as avg_quality_score")
            ->andReturnSelf();
        $avgQualityQuery->shouldReceive('value')->once()->with('avg_quality_score')->andReturn(7.0);

        $flaggedReportsQuery = Mockery::mock();
        $flaggedReportsQuery->shouldReceive('where')
            ->once()
            ->with('created_at', '>=', Mockery::on(fn ($value) => $value instanceof Carbon && $value->equalTo($weekAgo)))
            ->andReturnSelf();
        $flaggedReportsQuery->shouldReceive('whereRaw')
            ->once()
            ->with("COALESCE((ai_analysis->>'flagged')::boolean, false) = true")
            ->andReturnSelf();
        $flaggedReportsQuery->shouldReceive('count')->once()->andReturn(2);

        $mostActiveGroupQuery = Mockery::mock();
        $mostActiveGroupQuery->shouldReceive('join')->once()->with('peserta_kkn', 'kegiatan_kkn.mahasiswa_id', '=', 'peserta_kkn.mahasiswa_id')->andReturnSelf();
        $mostActiveGroupQuery->shouldReceive('join')->once()->with('kelompok_kkn', 'peserta_kkn.kelompok_id', '=', 'kelompok_kkn.id')->andReturnSelf();
        $mostActiveGroupQuery->shouldReceive('where')
            ->once()
            ->with('kegiatan_kkn.created_at', '>=', Mockery::on(fn ($value) => $value instanceof Carbon && $value->equalTo($weekAgo)))
            ->andReturnSelf();
        $mostActiveGroupQuery->shouldReceive('groupBy')->once()->with('kelompok_kkn.nama')->andReturnSelf();
        $mostActiveGroupQuery->shouldReceive('orderByRaw')->once()->with('COUNT(*) DESC')->andReturnSelf();
        $mostActiveGroupQuery->shouldReceive('limit')->once()->with(1)->andReturnSelf();
        $mostActiveGroupQuery->shouldReceive('value')->once()->with('kelompok_kkn.nama')->andReturn('Kelompok Alpha');

        $approvedStudentsQuery = Mockery::mock();
        $approvedStudentsQuery->shouldReceive('where')->once()->with('status', 'approved')->andReturnSelf();
        $approvedStudentsQuery->shouldReceive('count')->once()->andReturn(2);

        $attendanceQuery = Mockery::mock();
        $attendanceQuery->shouldReceive('where')
            ->once()
            ->with('created_at', '>=', Mockery::on(fn ($value) => $value instanceof Carbon && $value->equalTo($weekAgo)))
            ->andReturnSelf();
        $attendanceQuery->shouldReceive('distinct')->once()->with('mahasiswa_id', 'date')->andReturnSelf();
        $attendanceQuery->shouldReceive('count')->once()->andReturn(7);

        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($totalReportsQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($avgQualityQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($flaggedReportsQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($mostActiveGroupQuery);
        DB::shouldReceive('table')->once()->with('peserta_kkn')->andReturn($approvedStudentsQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($attendanceQuery);

        $stats = invokeTelegramAiServiceMethod(makeTelegramAiService(), 'gatherWeeklyStats');

        expect($stats['total_reports'])->toBe(4);
        expect($stats['avg_quality_score'])->toBe(7.0);
        expect($stats['flagged_reports'])->toBe(2);
        expect($stats['avg_attendance'])->toBe(50);
        expect($stats['most_active_group'])->toBe('Kelompok Alpha');
    });

    it('detects a high AI flag rate from ai_analysis JSON flags', function () {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $oneHourAgo = now()->subHour();

        $todayCountQuery = Mockery::mock();
        $todayCountQuery->shouldReceive('whereDate')->once()->with('created_at', $today)->andReturnSelf();
        $todayCountQuery->shouldReceive('count')->once()->andReturn(6);

        $yesterdayCountQuery = Mockery::mock();
        $yesterdayCountQuery->shouldReceive('whereDate')->once()->with('created_at', $yesterday)->andReturnSelf();
        $yesterdayCountQuery->shouldReceive('count')->once()->andReturn(10);

        $recentReportsQuery = Mockery::mock();
        $recentReportsQuery->shouldReceive('whereDate')->once()->with('created_at', $today)->andReturnSelf();
        $recentReportsQuery->shouldReceive('count')->once()->andReturn(6);

        $flaggedTodayQuery = Mockery::mock();
        $flaggedTodayQuery->shouldReceive('whereDate')->once()->with('created_at', $today)->andReturnSelf();
        $flaggedTodayQuery->shouldReceive('whereRaw')->once()->with("COALESCE((ai_analysis->>'flagged')::boolean, false) = true")->andReturnSelf();
        $flaggedTodayQuery->shouldReceive('count')->once()->andReturn(3);

        $jobsQuery = Mockery::mock();
        $jobsQuery->shouldReceive('count')->once()->andReturn(0);

        $failedJobsQuery = Mockery::mock();
        $failedJobsQuery->shouldReceive('where')
            ->once()
            ->with('failed_at', '>=', Mockery::on(fn ($value) => $value instanceof Carbon && $value->equalTo($oneHourAgo)))
            ->andReturnSelf();
        $failedJobsQuery->shouldReceive('count')->once()->andReturn(0);

        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($todayCountQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($yesterdayCountQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($recentReportsQuery);
        DB::shouldReceive('table')->once()->with('kegiatan_kkn')->andReturn($flaggedTodayQuery);
        DB::shouldReceive('table')->once()->with('jobs')->andReturn($jobsQuery);
        DB::shouldReceive('table')->once()->with('failed_jobs')->andReturn($failedJobsQuery);

        $anomalies = invokeTelegramAiServiceMethod(makeTelegramAiService(), 'detectAnomalies');

        expect($anomalies)->toHaveKey('high_flag_rate');
        expect($anomalies['high_flag_rate'])->toContain('3/6');
        expect($anomalies['high_flag_rate'])->toContain('>30%');
    });
});
