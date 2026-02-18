<?php

use App\Services\GradingService;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
});

test('determineLetterGrade returns correct grades', function () {
    expect(GradingService::determineLetterGrade(90))->toBe('A');
    expect(GradingService::determineLetterGrade(85))->toBe('A');
    expect(GradingService::determineLetterGrade(84))->toBe('A-');
    expect(GradingService::determineLetterGrade(80))->toBe('A-');
    expect(GradingService::determineLetterGrade(79))->toBe('B+');
    expect(GradingService::determineLetterGrade(75))->toBe('B+');
    expect(GradingService::determineLetterGrade(74))->toBe('B');
    expect(GradingService::determineLetterGrade(70))->toBe('B');
    expect(GradingService::determineLetterGrade(69))->toBe('B-');
    expect(GradingService::determineLetterGrade(65))->toBe('B-');
    expect(GradingService::determineLetterGrade(64))->toBe('C+');
    expect(GradingService::determineLetterGrade(60))->toBe('C+');
    expect(GradingService::determineLetterGrade(59))->toBe('C');
    expect(GradingService::determineLetterGrade(55))->toBe('C');
    expect(GradingService::determineLetterGrade(54))->toBe('D');
    expect(GradingService::determineLetterGrade(30))->toBe('D');
    expect(GradingService::determineLetterGrade(0))->toBe('D');
});

test('calculateFinalGrade saves lppm_weighted_score', function () {
    // TODO: Rewrite with KKN model factories (KelompokKkn, NilaiKkn, KonfigurasiPenilaian)
    $this->markTestSkipped('Requires KKN model factories to be created.');
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
