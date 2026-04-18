<?php

use App\Enums\KknType;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GroupManagementWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function createAdminUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        return $user;
    }

    private function createDplUser(): array
    {
        $user = User::factory()->create();
        $user->assignRole('dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $user->id,
        ]);

        return compact('user', 'dosen');
    }

    private function createStudentUser(): array
    {
        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['fakultas_id' => $faculty->id]);

        $user = User::factory()->create([
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 1',
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'gender' => 'L',
            'shirt_size' => 'L',
        ]);

        return compact('user', 'mahasiswa');
    }

    public function test_admin_creates_group_with_dpl(): void
    {
        $admin = $this->createAdminUser();
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();

        // Assign DPL to period first
        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        // Admin creates group
        $this->actingAs($admin)
            ->from(route('admin.kelompok.index'))
            ->post(route('admin.kelompok.store'), [
                'periode_id' => $period->id,
                'location_id' => $location->id,
                'dpl_periode_id' => $dplPeriod->id,
                'nama_kelompok' => 'Kelompok Anggrek',
                'capacity' => 12,
                'status' => 'active',
            ])
            ->assertRedirect(route('admin.kelompok.index'));

        $group = KelompokKkn::where('nama_kelompok', 'Kelompok Anggrek')->firstOrFail();

        expect($group->periode_id)->toBe($period->id)
            ->and($group->location_id)->toBe($location->id)
            ->and($group->capacity)->toBe(12)
            ->and($group->status)->toBe('active');

        // Verify DPL is assigned to group
        $this->actingAs($admin)
            ->from(route('admin.dpl.penugasan'))
            ->post(route('admin.dpl.tugaskan-kelompok', $group), [
                'dpl_periode_id' => $dplPeriod->id,
            ])
            ->assertRedirect(route('admin.dpl.penugasan'));

        $group->refresh();
        expect($group->dosen()->where('dosen_id', $dosen->id)->exists())->toBeTrue();
    }

    public function test_students_are_assigned_to_group(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create([
            'jenis' => KknType::NUSANTARA,
            'program_type' => Periode::PROGRAM_TYPE_NUSANTARA,
            'registration_mode' => Periode::REGISTRATION_MODE_SELECTIVE,
            'placement_mode' => Periode::PLACEMENT_MODE_MANUAL_ADMIN,
        ]);
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
            'capacity' => 10,
        ]);

        // Create and register students
        ['user' => $studentUser1, 'mahasiswa' => $mahasiswa1] = $this->createStudentUser();
        ['user' => $studentUser2, 'mahasiswa' => $mahasiswa2] = $this->createStudentUser();

        $registration1 = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa1->id,
            'periode_id' => $period->id,
            'status' => 'pending',
        ]);

        $registration2 = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa2->id,
            'periode_id' => $period->id,
            'status' => 'pending',
        ]);

        // Admin approves and assigns to group
        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.setujui', $registration1))
            ->assertRedirect();

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.setujui', $registration2))
            ->assertRedirect();

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.tugaskan-kelompok', $registration1), [
                'kelompok_id' => $group->id,
            ])
            ->assertRedirect();

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.tugaskan-kelompok', $registration2), [
                'kelompok_id' => $group->id,
            ])
            ->assertRedirect();

        $registration1->refresh();
        $registration2->refresh();

        expect($registration1->kelompok_id)->toBe($group->id)
            ->and($registration2->kelompok_id)->toBe($group->id)
            ->and($registration1->status)->toBe('approved')
            ->and($registration2->status)->toBe('approved');

        // Verify group member count
        $memberCount = PesertaKkn::where('kelompok_id', $group->id)
            ->where('status', 'approved')
            ->count();

        expect($memberCount)->toBe(2);
    }

    public function test_group_capacity_is_enforced(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
            'capacity' => 2, // Very limited capacity
        ]);

        // Fill the group to capacity
        for ($i = 0; $i < 2; $i++) {
            ['mahasiswa' => $mahasiswa] = $this->createStudentUser();

            $registration = PesertaKkn::factory()->create([
                'mahasiswa_id' => $mahasiswa->id,
                'periode_id' => $period->id,
                'kelompok_id' => $group->id,
                'status' => 'pending',
            ]);

            $this->actingAs($admin)
                ->patch(route('admin.pendaftaran.setujui', $registration))
                ->assertRedirect();
        }

        // Try to add one more student — should fail due to capacity
        ['mahasiswa' => $extraStudent] = $this->createStudentUser();

        $extraRegistration = PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $extraStudent->id,
            'periode_id' => $period->id,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.pendaftaran.index'))
            ->patch(route('admin.pendaftaran.tugaskan-kelompok', $extraRegistration), [
                'kelompok_id' => $group->id,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('kelompok_id');

        // The registration should NOT have been assigned to the full group
        // (capacity enforcement happens at the controller/service level)
        $extraRegistration->refresh();

        // Verify group is at capacity
        $approvedCount = PesertaKkn::where('kelompok_id', $group->id)
            ->where('status', 'approved')
            ->count();

        expect($approvedCount <= $group->capacity)->toBeTrue();
    }

    public function test_group_leader_is_designated(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        ['user' => $studentUser1, 'mahasiswa' => $mahasiswa1] = $this->createStudentUser();
        ['user' => $studentUser2, 'mahasiswa' => $mahasiswa2] = $this->createStudentUser();

        $registration1 = PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa1->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'role' => 'Anggota',
        ]);

        $registration2 = PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa2->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'role' => 'Anggota',
        ]);

        // Admin designates student 1 as group leader
        $this->actingAs($admin)
            ->from(route('admin.pendaftaran.index'))
            ->post(route('admin.pendaftaran.jadikan-ketua', $registration1))
            ->assertRedirect();

        $registration1->refresh();
        $registration2->refresh();

        expect($registration1->role)->toBe('Ketua')
            ->and($registration2->role)->toBe('Anggota');

        // Verify via scope
        $ketua = PesertaKkn::where('kelompok_id', $group->id)
            ->ketua()
            ->first();

        expect($ketua->mahasiswa_id)->toBe($mahasiswa1->id);
    }

    public function test_empty_group_can_be_deleted(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();

        $emptyGroup = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'draft',
        ]);

        // No students assigned — should be deletable
        $this->actingAs($admin)
            ->from(route('admin.kelompok.index'))
            ->delete(route('admin.kelompok.destroy', $emptyGroup))
            ->assertRedirect(route('admin.kelompok.index'));

        $this->assertSoftDeleted('kelompok_kkn', ['id' => $emptyGroup->id], 'kkn');
    }

    public function test_group_with_students_cannot_be_deleted(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();

        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        ['mahasiswa' => $mahasiswa] = $this->createStudentUser();

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        // Group has students — should not be deletable
        $this->actingAs($admin)
            ->from(route('admin.kelompok.index'))
            ->delete(route('admin.kelompok.destroy', $group))
            ->assertRedirect(route('admin.kelompok.index'))
            ->assertSessionHas('error');

        $this->assertNotSoftDeleted('kelompok_kkn', ['id' => $group->id], 'kkn');
    }

    public function test_group_can_be_edited(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => 'Kelompok Lama',
            'capacity' => 10,
            'status' => 'active',
        ]);

        $newLocation = Lokasi::factory()->create();

        // Admin edits group
        $this->actingAs($admin)
            ->from(route('admin.kelompok.index'))
            ->put(route('admin.kelompok.update', $group), [
                'periode_id' => $period->id,
                'location_id' => $newLocation->id,
                'nama_kelompok' => 'Kelompok Baru',
                'capacity' => 15,
                'status' => 'active',
            ])
            ->assertRedirect(route('admin.kelompok.index'));

        $group->refresh();

        expect($group->nama_kelompok)->toBe('Kelompok Baru')
            ->and($group->capacity)->toBe(15)
            ->and($group->location_id)->toBe($newLocation->id);
    }

    public function test_group_show_page_displays_members(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => 'Kelompok Mawar',
            'status' => 'active',
        ]);

        // Add some members
        for ($i = 0; $i < 3; $i++) {
            ['mahasiswa' => $mahasiswa] = $this->createStudentUser();

            PesertaKkn::factory()->approved()->create([
                'mahasiswa_id' => $mahasiswa->id,
                'periode_id' => $period->id,
                'kelompok_id' => $group->id,
            ]);
        }

        // Admin views group details
        $response = $this->actingAs($admin)
            ->get(route('admin.kelompok.show', $group))
            ->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Operational/Groups/Show')
            ->where('group.nama_kelompok', 'Kelompok Mawar')
            ->has('members')
        );
    }

    public function test_group_list_page_shows_all_groups(): void
    {
        $admin = $this->createAdminUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();

        for ($i = 0; $i < 3; $i++) {
            KelompokKkn::factory()->create([
                'periode_id' => $period->id,
                'location_id' => $location->id,
                'nama_kelompok' => "Kelompok {$i}",
                'status' => 'active',
            ]);
        }

        $this->actingAs($admin)
            ->get(route('admin.kelompok.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Groups/Index')
                ->has('groups.data', 3)
            );
    }

    public function test_group_list_page_includes_main_lecturer_payload(): void
    {
        $admin = $this->createAdminUser();
        ['dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => 'Kelompok Melati',
            'status' => 'active',
        ]);

        $group->dosen()->syncWithoutDetaching([
            $dosen->id => ['role' => 'Ketua'],
        ]);
        $group->syncKetuaFlatColumns();

        $this->actingAs($admin)
            ->get(route('admin.kelompok.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Groups/Index')
                ->where('groups.data.0.main_lecturer.name', $dosen->nama)
            );
    }

    public function test_dpl_can_view_assigned_group_details(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $group->update([
            'dpl_id' => $dosen->id,
            'dpl_periode_id' => $dplPeriod->id,
        ]);
        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        // DPL can view their assigned groups
        $this->actingAs($dplUser)
            ->get(route('dpl.kelompok.index'))
            ->assertOk();

        $this->actingAs($dplUser)
            ->get(route('dpl.kelompok.show', $group))
            ->assertOk();
    }
}
