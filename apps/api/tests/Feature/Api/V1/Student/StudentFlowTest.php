<?php

use App\Models\KKN\Mahasiswa as KknMahasiswa;
use App\Models\Master\Mahasiswa;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

describe('Student Registration Flow (E2E)', function () {

    // Student without complete profile gets PROFILE_INCOMPLETE on most endpoints
    it('student without complete profile gets 403 PROFILE_INCOMPLETE on dashboard', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/dashboard')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on work-programs', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/work-programs')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on daily-reports', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/daily-reports')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on certificates', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/certificates')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on leave-requests', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/leave-requests')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on final-report', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/final-report')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on posko', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/posko')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on dpl-evaluation form', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/dpl-evaluation/form')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    // Registration form and status are also blocked by profile middleware
    it('student without complete profile gets 403 on registration form', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/registration/form')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without complete profile gets 403 on registration status', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/registration/status')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    // POST endpoints without profile return 403 (profile check before validation)
    it('student without profile cannot submit daily report', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->postJson('/api/v1/student/daily-reports', [])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('student without profile cannot submit leave request', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->postJson('/api/v1/student/leave-requests', [])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

})->group('e2e', 'student');
