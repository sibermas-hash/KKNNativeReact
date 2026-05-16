<?php

declare(strict_types=1);

use App\Jobs\ValidateAvatarUploadJob;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

it('queues avatar validation instead of blocking the upload request', function () {
    config(['queue.default' => 'database']);
    Queue::fake();
    Storage::fake('public');

    $user = createUserWithRole('student');

    $response = $this->actingAs($user)
        ->post('/api/v1/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 400, 400),
        ]);

    $response->assertOk()
        ->assertJsonPath('data.moderation_status', 'pending')
        ->assertJsonPath('success', true);

    $user->refresh();

    expect($user->avatar)->not->toBeNull();
    expect($user->avatar_moderation_status)->toBe('pending');
    expect($user->avatar_moderation_reason)->toBe('Sedang diverifikasi otomatis oleh sistem.');

    Storage::disk('public')->assertExists($user->avatar);

    Queue::assertPushed(ValidateAvatarUploadJob::class, function (ValidateAvatarUploadJob $job) use ($user) {
        return $job->userId === $user->id
            && $job->path === $user->avatar
            && $job->queue === 'long';
    });
});
