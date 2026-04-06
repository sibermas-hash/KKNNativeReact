<?php

namespace Tests\Unit\Services;

use App\Models\KKN\SystemSetting;
use App\Services\MasterApiService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MasterApiServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        $keys = [
            'master_api_url',
            'master_api_client_id',
            'master_api_client_secret',
            'master_api_token',
        ];

        SystemSetting::query()->whereIn('config_key', $keys)->delete();

        foreach ($keys as $key) {
            Cache::forget("system_setting_{$key}");
        }

        parent::tearDown();
    }

    public function test_get_token_prefers_static_token_from_system_settings(): void
    {
        SystemSetting::set('master_api_token', 'static-token-123');

        Http::fake();

        $service = new MasterApiService();

        $this->assertSame('static-token-123', $service->getToken());
        Http::assertNothingSent();
    }

    public function test_get_students_by_nim_list_uses_filtered_master_api_when_supported(): void
    {
        SystemSetting::set('master_api_url', 'https://master.example/api/v1');
        SystemSetting::set('master_api_token', 'static-token-123');

        Http::fake([
            'https://master.example/api/v1/sync/mahasiswa*' => Http::response([
                'data' => [
                    ['nim' => '24010001', 'name' => 'Mahasiswa Satu'],
                    ['nim' => '24010002', 'name' => 'Mahasiswa Dua'],
                ],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ], 200),
        ]);

        $service = new MasterApiService();
        $students = $service->getStudentsByNimList(['24010001', '24010002']);

        $this->assertCount(2, $students);
        $this->assertSame('24010001', $students[0]['nim']);
        $this->assertSame('24010002', $students[1]['nim']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/sync/mahasiswa')
                && $request['nim_list'] === '24010001,24010002';
        });
    }
}
