<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\EvaluasiDplPeserta;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DplParticipantEvaluationFeatureTest extends TestCase
{
    public function test_student_can_open_and_submit_dpl_evaluation_once(): void
    {
        [$studentUser, $dosen] = $this->createEligibleStudentAndDpl();

        $this->actingAs($studentUser)
            ->get(route('student.evaluasi-dpl.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/DplEvaluation/Index')
                ->where('eligible', true)
                ->has('criteria', 5)
                ->where('dpl.name', $dosen->nama)
            );

        $this->actingAs($studentUser)
            ->post(route('student.evaluasi-dpl.store'), [
                'scores' => [
                    'kehadiran_pembimbingan' => 5,
                    'responsivitas' => 4,
                    'kejelasan_arahan' => 5,
                    'dukungan_penyelesaian_masalah' => 4,
                    'sikap_pembimbingan' => 5,
                ],
                'recommendation' => 'sangat_direkomendasikan',
                'notes' => 'DPL responsif dan memberi arahan yang jelas.',
                'confirmation' => true,
            ])
            ->assertRedirect(route('student.evaluasi-dpl.index'))
            ->assertSessionHas('success');

        $evaluation = EvaluasiDplPeserta::query()->first();

        $this->assertNotNull($evaluation);
        $this->assertSame('sangat_direkomendasikan', $evaluation->recommendation);
        $this->assertEquals(4.6, (float) $evaluation->total_score);
        $this->assertDatabaseCount('item_evaluasi_dpl_peserta', 5);
    }

    public function test_student_cannot_submit_duplicate_dpl_evaluation(): void
    {
        [$studentUser, $dosen, $mahasiswa, $group, $period] = $this->createEligibleStudentAndDpl();

        $evaluation = EvaluasiDplPeserta::create([
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'mahasiswa_id' => $mahasiswa->id,
            'dosen_id' => $dosen->id,
            'total_score' => 4.4,
            'recommendation' => 'direkomendasikan',
            'notes' => 'Sudah pernah dinilai.',
            'is_anonymous_to_dpl' => true,
            'submitted_at' => now(),
        ]);

        $evaluation->items()->createMany([
            [
                'criterion_key' => 'kehadiran_pembimbingan',
                'criterion_label' => 'Kehadiran Pembimbingan',
                'score' => 4,
                'weight' => 20,
            ],
        ]);

        $this->actingAs($studentUser)
            ->post(route('student.evaluasi-dpl.store'), [
                'scores' => [
                    'kehadiran_pembimbingan' => 5,
                    'responsivitas' => 5,
                    'kejelasan_arahan' => 5,
                    'dukungan_penyelesaian_masalah' => 5,
                    'sikap_pembimbingan' => 5,
                ],
                'recommendation' => 'sangat_direkomendasikan',
                'notes' => 'Coba kirim ulang.',
                'confirmation' => true,
            ])
            ->assertSessionHasErrors('evaluation');

        $this->assertDatabaseCount('evaluasi_dpl_peserta', 1);
    }

    public function test_admin_can_view_dpl_participant_evaluation_summary(): void
    {
        [$studentUser, $dosen, $mahasiswa, $group, $period] = $this->createEligibleStudentAndDpl();

        EvaluasiDplPeserta::create([
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'mahasiswa_id' => $mahasiswa->id,
            'dosen_id' => $dosen->id,
            'total_score' => 4.8,
            'recommendation' => 'sangat_direkomendasikan',
            'notes' => 'Sangat membantu selama KKN.',
            'is_anonymous_to_dpl' => true,
            'submitted_at' => now(),
        ]);

        $admin = User::factory()->create([
            'username' => 'admin_eval_dpl',
            'email' => 'admin-eval-dpl@example.test',
        ]);
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->get(route('admin.evaluasi-dpl.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Academic/DplParticipantEvaluations/Index')
                ->has('summaries', 1)
                ->where('summaries.0.dosen_name', $dosen->nama)
                ->where('stats.total_responses', 1)
            );
    }

    public function test_dpl_can_only_see_anonymous_participant_feedback(): void
    {
        [$studentUser, $dosen, $mahasiswa, $group, $period, $dplUser] = $this->createEligibleStudentAndDpl();

        $evaluation = EvaluasiDplPeserta::create([
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'mahasiswa_id' => $mahasiswa->id,
            'dosen_id' => $dosen->id,
            'total_score' => 4.2,
            'recommendation' => 'direkomendasikan',
            'notes' => 'Bimbingan lapangan konsisten dan membantu.',
            'is_anonymous_to_dpl' => true,
            'submitted_at' => now(),
        ]);

        $evaluation->items()->createMany([
            [
                'criterion_key' => 'kehadiran_pembimbingan',
                'criterion_label' => 'Kehadiran Pembimbingan',
                'score' => 4,
                'weight' => 20,
            ],
        ]);

        $this->actingAs($dplUser)
            ->get(route('dosen.feedback-dpl.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dpl/ParticipantFeedback/Index')
                ->where('comments.0.group_name', $group->nama_kelompok)
                ->where('comments.0.notes', 'Bimbingan lapangan konsisten dan membantu.')
                ->missing('comments.0.student_name')
            );
    }

    /**
     * @return array{0: User, 1: Dosen, 2: Mahasiswa, 3: KelompokKkn, 4: Periode, 5: User}
     */
    private function createEligibleStudentAndDpl(): array
    {
        $period = Periode::factory()->grading()->create();

        $dplUser = User::factory()->create([
            'username' => 'dpl_feedback_'.fake()->unique()->numerify('####'),
            'email' => fake()->unique()->safeEmail(),
        ]);
        $dplUser->assignRole('dosen', 'dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $dplUser->id,
            'nama' => 'Dr. Pembimbing Lapangan',
            'nip' => '198812312020121001',
        ]);

        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'nama_kelompok' => 'Kelompok Melati',
            'code' => 'KKN-5601',
        ]);
        $group->dosen()->attach($dosen->id, ['role' => 'Ketua']);

        $studentUser = User::factory()->create([
            'username' => 'student_feedback_'.fake()->unique()->numerify('####'),
            'email' => fake()->unique()->safeEmail(),
        ]);
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'nama' => 'Mahasiswa Penilai',
            'nim' => '2117201001',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'periode_id' => $period->id,
            'role' => 'Anggota',
        ]);

        return [$studentUser, $dosen, $mahasiswa, $group, $period, $dplUser];
    }
}
