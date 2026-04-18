<?php

namespace Tests\Feature;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DebugDatabaseTest extends TestCase
{
    public function test_can_create_mahasiswa_and_periode()
    {
        DB::listen(function ($query) {
            echo "QUERY [{$query->connectionName}]: {$query->sql}\n";
        });

        echo "--- Creating User ---\n";
        $user = User::factory()->create();

        echo "--- Assigning Role ---\n";
        try {
            $user->assignRole('student');
            echo "Role assigned successfully\n";
        } catch (\Throwable $e) {
            echo 'Role assignment FAILED: '.$e->getMessage()."\n";
            throw $e;
        }

        echo "--- Creating Mahasiswa ---\n";
        try {
            Mahasiswa::factory()->create(['user_id' => $user->id]);
            echo "Mahasiswa created successfully\n";
        } catch (\Throwable $e) {
            echo 'Mahasiswa creation FAILED: '.$e->getMessage()."\n";
            throw $e;
        }

        echo "--- Creating Periode ---\n";
        try {
            Periode::factory()->active()->create();
            echo "Periode created successfully\n";
        } catch (\Throwable $e) {
            echo 'Periode creation FAILED: '.$e->getMessage()."\n";
            throw $e;
        }

        echo "--- Making Request ---\n";
        try {
            $response = $this->actingAs($user)
                ->get(route('student.registration.create'));
            echo 'Request completed with status: '.$response->status()."\n";
        } catch (\Throwable $e) {
            echo 'Request FAILED: '.$e->getMessage()."\n";
            throw $e;
        }

        echo "--- Final Check ---\n";
        $response->assertOk();
    }
}
