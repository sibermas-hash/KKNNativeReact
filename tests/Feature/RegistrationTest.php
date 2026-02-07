<?php

use App\Models\Period;
use App\Models\Registration;
use App\Models\Student;

test('student can register for active period', function () {
    $student = Student::factory()->create();
    $period = Period::factory()->active()->create();

    $this->actingAs($student->user)
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
            'notes' => 'Pengajuan awal',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('registrations', [
        'student_id' => $student->id,
        'period_id' => $period->id,
    ]);
});

test('student cannot register twice for the same period', function () {
    $student = Student::factory()->create();
    $period = Period::factory()->active()->create();

    Registration::create([
        'student_id' => $student->id,
        'period_id' => $period->id,
        'status' => 'pending',
    ]);

    $this->actingAs($student->user)
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
        ])
        ->assertSessionHasErrors('period_id');
});