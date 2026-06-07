<?php

declare(strict_types=1);

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

it('returns immediately after inline avatar moderation', function () {
    config(['queue.default' => 'database']);
    Queue::fake();
    Storage::fake('public');

    $user = createUserWithRole('student');

    $response = $this->actingAs($user)
        ->post('/api/v1/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 1600, 2400),
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    expect($response->json('data.moderation_status'))
        ->toBeIn(['pending', 'approved', 'rejected']);

    $user->refresh();

    expect($user->avatar_moderation_status)
        ->toBeIn(['pending', 'approved', 'rejected']);

    if ($user->avatar !== null) {
        Storage::disk('public')->assertExists($user->avatar);
    }
});
