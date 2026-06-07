<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

it('external lppm admin can access external dashboard', function () {
    $externalUniversityId = DB::table('external_universities')->insertGetId([
        'code' => 'EXT-TEST',
        'name' => 'Kampus Eksternal Test',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    /** @var User $user */
    $user = createUserWithRole('external_lppm_admin');
    $user->forceFill(['external_university_id' => $externalUniversityId])->save();

    $this->actingAs($user)
        ->getJson('/api/v1/external/dashboard')
        ->assertOk()
        ->assertJsonPath('role', 'external_lppm_admin')
        ->assertJsonPath('external_university.id', $externalUniversityId);
});

it('external lppm admin cannot access admin dashboard', function () {
    $user = createUserWithRole('external_lppm_admin');

    $this->actingAs($user)
        ->getJson('/api/v1/admin/dashboard')
        ->assertForbidden();
});

it('admin lppm cannot access external dashboard', function () {
    $user = createUserWithRole('admin');

    $this->actingAs($user)
        ->getJson('/api/v1/external/dashboard')
        ->assertForbidden();
});
