<?php

declare(strict_types=1);

use App\Console\Commands\AvatarRequeuePendingCommand;
use App\Jobs\ValidateAvatarUploadJob;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Tester\CommandTester;

function prepareAvatarPublicDisk(): string
{
    $diskRoot = sys_get_temp_dir().'/sibermas-avatar-tests-'.uniqid('', true);
    File::ensureDirectoryExists($diskRoot);
    config(['filesystems.disks.public.root' => $diskRoot]);

    return $diskRoot;
}

it('updates the moderation reason when avatar validation exhausts retries', function () {
    $diskRoot = prepareAvatarPublicDisk();

    try {
        $user = createUserWithRole('student');
        $path = 'avatars/stuck-avatar.jpg';
        Storage::disk('public')->put($path, 'avatar-bytes');

        $user->forceFill([
            'avatar' => $path,
            'avatar_moderation_status' => 'pending',
            'avatar_moderation_reason' => 'Sedang diverifikasi otomatis oleh sistem.',
            'avatar_moderation_reviewed_at' => null,
            'avatar_moderation_reviewed_by' => null,
        ])->save();

        $job = new ValidateAvatarUploadJob($user->id, $path);
        $job->failed(new RuntimeException('AI timeout'));

        $user->refresh();

        expect($user->avatar_moderation_status)->toBe('pending');
        expect($user->avatar_moderation_reason)->toBe('Validasi otomatis gagal setelah beberapa percobaan. Menunggu verifikasi admin.');
    } finally {
        File::deleteDirectory($diskRoot);
    }
});

it('requeues only pending avatars that are still stuck in automatic verification', function () {
    Queue::fake();
    $diskRoot = prepareAvatarPublicDisk();

    try {
        $requeueUser = createUserWithRole('student');
        $requeuePath = 'avatars/requeue-me.jpg';
        Storage::disk('public')->put($requeuePath, 'avatar-bytes');
        $requeueUser->forceFill([
            'avatar' => $requeuePath,
            'avatar_moderation_status' => 'pending',
            'avatar_moderation_reason' => 'Sedang diverifikasi otomatis oleh sistem.',
        ])->save();

        $manualReviewUser = createUserWithRole('student');
        $manualReviewPath = 'avatars/manual-review.jpg';
        Storage::disk('public')->put($manualReviewPath, 'avatar-bytes');
        $manualReviewUser->forceFill([
            'avatar' => $manualReviewPath,
            'avatar_moderation_status' => 'pending',
            'avatar_moderation_reason' => 'Server AI tidak tersedia, menunggu verifikasi admin.',
        ])->save();

        $missingFileUser = createUserWithRole('student');
        $missingFileUser->forceFill([
            'avatar' => 'avatars/missing.jpg',
            'avatar_moderation_status' => 'pending',
            'avatar_moderation_reason' => 'Sedang diverifikasi otomatis oleh sistem.',
        ])->save();

        $command = app(AvatarRequeuePendingCommand::class);
        $command->setLaravel(app());
        $tester = new CommandTester($command);
        $tester->execute(['--limit' => 5000]);

        Queue::assertPushed(ValidateAvatarUploadJob::class, function (ValidateAvatarUploadJob $job) use ($requeueUser, $requeuePath) {
            return $job->userId === $requeueUser->id
                && $job->path === $requeuePath
                && $job->queue === 'long';
        });

    } finally {
        File::deleteDirectory($diskRoot);
    }
});

it('supports dry run mode for pending avatar requeue', function () {
    Queue::fake();
    $diskRoot = prepareAvatarPublicDisk();

    try {
        $user = createUserWithRole('student');
        $path = 'avatars/dry-run.jpg';
        Storage::disk('public')->put($path, 'avatar-bytes');

        $user->forceFill([
            'avatar' => $path,
            'avatar_moderation_status' => 'pending',
            'avatar_moderation_reason' => 'Sedang diverifikasi otomatis oleh sistem.',
        ])->save();

        $command = app(AvatarRequeuePendingCommand::class);
        $command->setLaravel(app());
        $tester = new CommandTester($command);
        $tester->execute(['--limit' => 5000, '--dry-run' => true]);

        Queue::assertNothingPushed();
    } finally {
        File::deleteDirectory($diskRoot);
    }
});
