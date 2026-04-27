<?php

namespace Tests\Feature;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\ProfilUser;
use App\Models\User;
use Tests\TestCase;

class ProfileSnapshotTest extends TestCase
{
    public function test_profile_show_creates_student_profile_snapshot(): void
    {
        $user = User::factory()->create([
            'name' => 'Ahmad Snapshot',
            'phone' => '081234567890',
            'address' => 'Jl. Snapshot No. 1',
            'avatar' => 'avatars/ahmad.png',
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nama' => 'Ahmad Snapshot',
        ]);

        $this->actingAs($user)
            ->get(route('profile.show'))
            ->assertOk();

        $this->assertDatabaseHas('profil_user', [
            'user_id' => $user->id,
            'profileable_type' => $mahasiswa->getMorphClass(),
            'profileable_id' => $mahasiswa->id,
            'phone' => '081234567890',
            'address' => 'Jl. Snapshot No. 1',
            'avatar' => 'avatars/ahmad.png',
        ]);
    }

    public function test_profile_update_synchronizes_existing_profile_snapshot(): void
    {
        $user = User::factory()->create([
            'name' => 'Siti Lama',
            'phone' => '081200000000',
            'address' => 'Alamat Lama',
            'domicile_village_name' => 'Desa Lama',
            'domicile_district_name' => 'Kecamatan Lama',
            'domicile_regency_name' => 'Kabupaten Lama',
            'address_verified_at' => now()->subDay(),
            'avatar' => 'avatars/siti.png',
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nama' => 'Siti Lama',
            'nik' => '3301010101010002',
            'mother_name' => 'Ibu Lama',
            'birth_place' => 'Banyumas',
            'birth_date' => '2003-02-02',
            'gender' => 'P',
            'shirt_size' => 'M',
        ]);

        ProfilUser::query()->create([
            'user_id' => $user->id,
            'profileable_type' => $mahasiswa->getMorphClass(),
            'profileable_id' => $mahasiswa->id,
            'phone' => '089999999999',
            'address' => 'Alamat Snapshot Lama',
            'avatar' => 'avatars/old.png',
        ]);

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Siti Baru',
                'phone' => '081211111111',
                'address' => 'Alamat Baru',
                'domicile_village_name' => 'Desa Baru',
                'domicile_district_name' => 'Kecamatan Baru',
                'domicile_regency_name' => 'Kabupaten Baru',
                'address_verified' => true,
                'nik' => '3301010101010002',
                'mother_name' => 'Ibu Baru',
                'gender' => 'P',
                'shirt_size' => 'L',
                'birth_place' => 'Cilacap',
                'birth_date' => '2003-03-03',
            ])
            ->assertRedirect('/mahasiswa/daftar');

        $this->assertDatabaseHas('profil_user', [
            'user_id' => $user->id,
            'profileable_type' => $mahasiswa->getMorphClass(),
            'profileable_id' => $mahasiswa->id,
            'phone' => '081211111111',
            'address' => 'Alamat Baru',
            'avatar' => 'avatars/siti.png',
        ]);
    }
}
