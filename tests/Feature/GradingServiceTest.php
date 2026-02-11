<?php

use App\Services\GradingService;
use App\Models\KknScore;
use App\Models\GradingConfig;
use App\Models\Group;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
});

test('determineLetterGrade returns correct grades', function () {
    $service = new GradingService();

    expect($service->determineLetterGrade(90))->toBe('A');
    expect($service->determineLetterGrade(85))->toBe('A');
    expect($service->determineLetterGrade(80))->toBe('AB');
    expect($service->determineLetterGrade(75))->toBe('AB');
    expect($service->determineLetterGrade(70))->toBe('B');
    expect($service->determineLetterGrade(65))->toBe('B');
    expect($service->determineLetterGrade(60))->toBe('BC');
    expect($service->determineLetterGrade(55))->toBe('BC');
    expect($service->determineLetterGrade(50))->toBe('C');
    expect($service->determineLetterGrade(45))->toBe('C');
    expect($service->determineLetterGrade(40))->toBe('D');
    expect($service->determineLetterGrade(30))->toBe('D');
    expect($service->determineLetterGrade(20))->toBe('E');
    expect($service->determineLetterGrade(0))->toBe('E');
});

test('calculateFinalGrade saves lppm_weighted_score', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    
    $dpl = User::factory()->create();
    $dpl->assignRole('dpl');

    $group = Group::factory()->create();

    $score = KknScore::factory()->create([
        'student_id' => $student->id,
        'group_id' => $group->id,
        'final_report_score' => 80,
        'execution_score' => 85,
        'article_score' => 75,
        'discipline_score' => 90,
        'attitude_score' => 85,
        'workshop_score' => 100,
        'administration_score' => 80,
        'is_finalized' => false,
    ]);

    // Create default grading configs
    $configs = [
        'weight_dpl_report' => '30',
        'weight_dpl_execution' => '40',
        'weight_dpl_article' => '30',
        'weight_village_discipline' => '50',
        'weight_village_attitude' => '50',
        'weight_admin_workshop' => '60',
        'weight_admin_administration' => '40',
        'weight_main_dpl' => '50',
        'weight_main_village' => '30',
        'weight_main_lppm' => '20',
    ];

    foreach ($configs as $key => $value) {
        GradingConfig::firstOrCreate(
            ['config_key' => $key],
            ['config_value' => $value]
        );
    }

    $service = new GradingService();
    $service->calculateFinalGrade($score);

    $score->refresh();

    expect($score->lppm_weighted_score)->not->toBeNull();
    expect($score->dpl_weighted_score)->not->toBeNull();
    expect($score->village_weighted_score)->not->toBeNull();
    expect($score->total_score)->not->toBeNull();
    expect($score->letter_grade)->not->toBeNull();
});
