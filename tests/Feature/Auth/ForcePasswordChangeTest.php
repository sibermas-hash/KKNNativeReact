<?php

use App\Models\KKN\Dosen;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

it('redirects dpl with temporary password to profile until password is changed', function () {
    Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'dosen', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'password' => Hash::make('Password#123'),
        'must_change_password' => true,
        'password_changed_at' => null,
        'is_active' => true,
        'avatar' => 'avatars/test.jpg',
        'phone' => '081234567890',
        'address' => 'Jl. Test No. 1',
        'domicile_village_name' => 'Desa Test',
        'domicile_district_name' => 'Kecamatan Test',
        'domicile_regency_name' => 'Kabupaten Test',
        'address_verified_at' => now(),
    ]);
    $user->assignRole('dosen', 'dpl');

    Dosen::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('dosen.dashboard'))
        ->assertRedirect(route('profile.password-change'));

    // First time change — current_password not required
    $this->actingAs($user)
        ->patch(route('profile.password'), [
            'password' => 'Password#456!',
            'password_confirmation' => 'Password#456!',
        ])
        ->assertRedirect();

    expect($user->fresh()->must_change_password)->toBeFalse();

    $this->actingAs($user->fresh())
        ->get(route('dosen.dashboard'))
        ->assertOk();
});
