<?php

namespace Tests\Feature;

use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminWorkshopsManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    public function test_superadmin_can_bulk_mark_workshop_attendance(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_workshop_attendance',
            'email' => 'superadmin-workshop-attendance@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $presentUser = User::factory()->create([
            'name' => 'Peserta Hadir',
            'email' => 'peserta-hadir@example.test',
        ]);

        $absentUser = User::factory()->create([
            'name' => 'Peserta Absen',
            'email' => 'peserta-absen@example.test',
        ]);

        $workshop = Workshop::create([
            'title' => 'Pembekalan Lapangan',
            'description' => 'Workshop pembekalan sebelum KKN.',
            'methodology' => 'Tatap muka',
            'workshop_date' => now()->addDays(2)->toDateString(),
            'location' => 'Aula Kampus',
            'status' => 'scheduled',
        ]);

        $presentParticipant = PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $presentUser->id,
            'attendance_status' => 'registered',
        ]);

        $absentParticipant = PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $absentUser->id,
            'attendance_status' => 'attended',
            'certificate_generated' => true,
            'certificate_path' => 'certificates/workshops/legacy.pdf',
            'certificate_issued_at' => now(),
        ]);

        Storage::disk('public')->put('certificates/workshops/legacy.pdf', 'legacy');

        $this->actingAs($superadmin)
            ->post(route('admin.workshops.mark-attendance', $workshop), [
                'user_ids' => [$presentUser->id],
            ])
            ->assertRedirect();

        $presentParticipant->refresh();
        $absentParticipant->refresh();

        $this->assertSame('attended', $presentParticipant->attendance_status);
        $this->assertTrue($presentParticipant->certificate_generated);
        $this->assertNotNull($presentParticipant->certificate_path);

        $this->assertSame('absent', $absentParticipant->attendance_status);
        $this->assertFalse($absentParticipant->certificate_generated);
        $this->assertNull($absentParticipant->certificate_path);
        Storage::disk('public')->assertMissing('certificates/workshops/legacy.pdf');
    }

    public function test_superadmin_can_update_workshop_details_and_capacity(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_workshop_update',
            'email' => 'superadmin-workshop-update@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $workshop = Workshop::create([
            'title' => 'Pembekalan Awal',
            'description' => 'Versi awal.',
            'methodology' => 'Tatap muka',
            'workshop_date' => now()->addDays(3)->toDateString(),
            'start_time' => '08:00',
            'end_time' => '10:00',
            'location' => 'Aula Lama',
            'max_participants' => 50,
            'status' => 'scheduled',
        ]);

        $this->actingAs($superadmin)
            ->patch(route('admin.workshops.update', $workshop), [
                'title' => 'Pembekalan Final',
                'description' => 'Versi final.',
                'methodology' => 'Hybrid',
                'workshop_date' => now()->addDays(5)->toDateString(),
                'start_time' => '09:00',
                'end_time' => '11:30',
                'location' => 'Aula Baru',
                'max_participants' => 80,
            ])
            ->assertRedirect();

        $workshop->refresh();

        $this->assertSame('Pembekalan Final', $workshop->title);
        $this->assertSame('Versi final.', $workshop->description);
        $this->assertSame('Hybrid', $workshop->methodology);
        $this->assertSame('09:00', $workshop->start_time);
        $this->assertSame('11:30', $workshop->end_time);
        $this->assertSame('Aula Baru', $workshop->location);
        $this->assertSame(80, $workshop->max_participants);
    }

    public function test_superadmin_can_cancel_workshop_before_attendance_is_recorded(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_workshop_cancel',
            'email' => 'superadmin-workshop-cancel@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $participantUser = User::factory()->create([
            'name' => 'Peserta Terdaftar',
            'email' => 'peserta-terdaftar@example.test',
        ]);

        $workshop = Workshop::create([
            'title' => 'Pembekalan Batal',
            'description' => 'Akan dibatalkan.',
            'methodology' => 'Tatap muka',
            'workshop_date' => now()->addDays(4)->toDateString(),
            'location' => 'Aula Tengah',
            'status' => 'scheduled',
        ]);

        PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $participantUser->id,
            'attendance_status' => 'registered',
        ]);

        $this->actingAs($superadmin)
            ->patch(route('admin.workshops.cancel', $workshop))
            ->assertRedirect();

        $workshop->refresh();

        $this->assertSame('cancelled', $workshop->status);
    }

    public function test_superadmin_cannot_cancel_workshop_after_attendance_has_been_recorded(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_workshop_block_cancel',
            'email' => 'superadmin-workshop-block-cancel@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $participantUser = User::factory()->create([
            'name' => 'Peserta Sudah Presensi',
            'email' => 'peserta-sudah-presensi@example.test',
        ]);

        $workshop = Workshop::create([
            'title' => 'Pembekalan Terkunci',
            'description' => 'Sudah ada presensi.',
            'methodology' => 'Tatap muka',
            'workshop_date' => now()->addDays(4)->toDateString(),
            'location' => 'Aula Tengah',
            'status' => 'scheduled',
        ]);

        PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $participantUser->id,
            'attendance_status' => 'attended',
        ]);

        $this->actingAs($superadmin)
            ->patch(route('admin.workshops.cancel', $workshop))
            ->assertSessionHas('error', 'Pembekalan yang sudah memiliki presensi tercatat tidak dapat dibatalkan.');

        $workshop->refresh();

        $this->assertSame('scheduled', $workshop->status);
    }
}
