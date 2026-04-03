<?php

use App\Models\User;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\KelompokKkn;
use App\Policies\KknScorePolicy;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Seed roles
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    
    Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
});

test('admin can view any score', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $policy = new KknScorePolicy();
    expect($policy->viewAny($admin))->toBeTrue();
});

test('admin can create scores', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $policy = new KknScorePolicy();
    expect($policy->create($admin))->toBeTrue();
});

test('admin can finalize scores', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $score = new NilaiKkn(['is_finalized' => false]);

    $policy = new KknScorePolicy();
    expect($policy->finalize($admin, $score))->toBeTrue();
});

test('admin can bulk finalize scores', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $policy = new KknScorePolicy();
    expect($policy->bulkFinalize($admin))->toBeTrue();
});

test('admin cannot update finalized scores', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $score = new NilaiKkn();
    $score->is_finalized = true;

    $policy = new KknScorePolicy();
    expect($policy->update($admin, $score))->toBeFalse();
});

test('admin can update non-finalized scores', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    $score = new NilaiKkn(['is_finalized' => false]);

    $policy = new KknScorePolicy();
    expect($policy->update($admin, $score))->toBeTrue();
});

test('student cannot create scores', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $policy = new KknScorePolicy();
    expect($policy->create($student))->toBeFalse();
});

test('student cannot finalize scores', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $score = new NilaiKkn(['is_finalized' => false]);

    $policy = new KknScorePolicy();
    expect($policy->finalize($student, $score))->toBeFalse();
});

test('superadmin can finalize scores', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $score = new NilaiKkn(['is_finalized' => false]);

    $policy = new KknScorePolicy();
    expect($policy->finalize($superadmin, $score))->toBeTrue();
});

test('dpl can create scores', function () {
    $dpl = User::factory()->create();
    $dpl->assignRole('dpl');

    $policy = new KknScorePolicy();
    expect($policy->create($dpl))->toBeTrue();
});
