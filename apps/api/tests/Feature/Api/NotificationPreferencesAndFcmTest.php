<?php

declare(strict_types=1);

use App\Models\KKN\DeviceToken;
use App\Models\User;
use App\Notifications\Channels\FcmChannel;
use App\Notifications\GenericNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

/*
 * Notification preferences + FCM channel.
 *
 * Preferences: /v1/profile/notification-preferences (GET + PATCH).
 * FCM channel behavior is mocked — we never hit the real Firebase endpoint,
 * we only verify the wire-level POST body + token-cleanup logic.
 */

// ── Preferences endpoint ───────────────────────────────────────────────

it('GET /profile/notification-preferences returns defaults when unset', function () {
    $user = createUserWithRole('superadmin');

    $response = $this->actingAs($user)->getJson('/api/v1/profile/notification-preferences');

    $response->assertOk();
    $response->assertJsonPath('data.preferences.in_app', true);
    $response->assertJsonPath('data.preferences.email', true);
    $response->assertJsonPath('data.preferences.push', true);
    $response->assertJsonPath('data.raw', null);
});

it('PATCH updates only specified channels', function () {
    $user = createUserWithRole('superadmin');

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/notification-preferences', ['push' => false])
        ->assertOk()
        ->assertJsonPath('data.preferences.push', false)
        ->assertJsonPath('data.preferences.email', true) // untouched
        ->assertJsonPath('data.preferences.in_app', true);

    expect($user->fresh()->wantsNotificationVia('fcm'))->toBeFalse();
    expect($user->fresh()->wantsNotificationVia('database'))->toBeTrue();
});

it('PATCH reset clears user preferences (back to defaults)', function () {
    $user = createUserWithRole('superadmin');
    $user->notification_preferences = ['in_app' => false, 'email' => false, 'push' => false];
    $user->save();

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/notification-preferences', ['reset' => true])
        ->assertOk()
        ->assertJsonPath('data.raw', null)
        ->assertJsonPath('data.preferences.in_app', true);
});

it('PATCH rejects invalid payload', function () {
    $user = createUserWithRole('superadmin');

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/notification-preferences', ['in_app' => 'not-a-bool'])
        ->assertStatus(422);
});

it('requires authentication', function () {
    $this->getJson('/api/v1/profile/notification-preferences')->assertStatus(401);
    $this->patchJson('/api/v1/profile/notification-preferences', [])->assertStatus(401);
});

// ── User model helper ──────────────────────────────────────────────────

it('wantsNotificationVia maps channel aliases correctly', function () {
    $user = createUserWithRole('superadmin');
    $user->notification_preferences = ['in_app' => true, 'email' => false, 'push' => true];
    $user->save();

    expect($user->wantsNotificationVia('database'))->toBeTrue();
    expect($user->wantsNotificationVia('mail'))->toBeFalse();
    expect($user->wantsNotificationVia('email'))->toBeFalse(); // alias
    expect($user->wantsNotificationVia('fcm'))->toBeTrue();
    expect($user->wantsNotificationVia('push'))->toBeTrue(); // alias
    expect($user->wantsNotificationVia('unknown-channel'))->toBeTrue(); // default
});

// ── FCM channel ────────────────────────────────────────────────────────

it('FCM channel is a no-op when FCM_SERVER_KEY is not set', function () {
    config(['services.fcm.server_key' => '']);
    Http::fake();

    $user = createUserWithRole('superadmin');
    DeviceToken::create(['token' => 'some-token', 'user_id' => $user->id, 'platform' => 'android']);

    $channel = new FcmChannel;
    $channel->send($user, new GenericNotification('Title', 'Body'));

    Http::assertNothingSent();
});

it('FCM channel is a no-op when user has disabled push', function () {
    config(['services.fcm.server_key' => 'fake-server-key']);
    Http::fake();

    $user = createUserWithRole('superadmin');
    $user->notification_preferences = ['push' => false];
    $user->save();
    DeviceToken::create(['token' => 'tkn', 'user_id' => $user->id, 'platform' => 'android']);

    (new FcmChannel)->send($user, new GenericNotification('Title', 'Body'));

    Http::assertNothingSent();
});

it('FCM channel POSTs to Firebase with tokens + notification payload', function () {
    config(['services.fcm.server_key' => 'fake-server-key']);
    Http::fake(['fcm.googleapis.com/*' => Http::response(['results' => []], 200)]);

    $user = createUserWithRole('superadmin');
    DeviceToken::create(['token' => 'tkn-1', 'user_id' => $user->id, 'platform' => 'android']);
    DeviceToken::create(['token' => 'tkn-2', 'user_id' => $user->id, 'platform' => 'ios']);

    (new FcmChannel)->send(
        $user,
        new GenericNotification(title: 'Laporan disetujui', message: 'Laporan harian disetujui DPL.', action: '/mahasiswa/laporan-harian')
    );

    Http::assertSent(function ($req) {
        $body = $req->data();

        return $req->hasHeader('Authorization', 'key=fake-server-key')
            && $req->url() === 'https://fcm.googleapis.com/fcm/send'
            && $body['notification']['title'] === 'Laporan disetujui'
            && $body['notification']['body'] === 'Laporan harian disetujui DPL.'
            && count($body['registration_ids']) === 2;
    });
});

it('FCM channel deletes tokens flagged NotRegistered by Firebase', function () {
    config(['services.fcm.server_key' => 'fake-server-key']);
    Http::fake(['fcm.googleapis.com/*' => Http::response([
        'results' => [
            ['message_id' => 'ok'],
            ['error' => 'NotRegistered'],
        ],
    ], 200)]);

    $user = createUserWithRole('superadmin');
    DeviceToken::create(['token' => 'good-token', 'user_id' => $user->id, 'platform' => 'android']);
    DeviceToken::create(['token' => 'dead-token', 'user_id' => $user->id, 'platform' => 'ios']);

    (new FcmChannel)->send($user, new GenericNotification('T', 'M'));

    expect(DeviceToken::where('token', 'good-token')->exists())->toBeTrue();
    expect(DeviceToken::where('token', 'dead-token')->exists())->toBeFalse();
});

// ── GenericNotification via() filters by preferences ───────────────────

it('GenericNotification.via filters channels by user preferences', function () {
    $user = createUserWithRole('superadmin');
    $user->email = 'test@example.com';
    $user->notification_preferences = ['in_app' => true, 'email' => false, 'push' => true];
    $user->save();

    $channels = (new GenericNotification('T', 'M'))->via($user);

    expect($channels)->toContain('database');
    expect($channels)->not->toContain('mail');
    expect($channels)->toContain(FcmChannel::class);
});

it('GenericNotification.via omits mail channel when user has no email', function () {
    $user = createUserWithRole('superadmin');
    $user->email = null;
    $user->notification_preferences = ['in_app' => true, 'email' => true, 'push' => true];
    $user->save();

    $channels = (new GenericNotification('T', 'M'))->via($user);

    expect($channels)->not->toContain('mail');
});

// ── SSE endpoint headers (quick smoke — full stream test is manual) ────

it('SSE stream endpoint requires authentication', function () {
    $this->getJson('/api/notifications/stream')->assertStatus(401);
});
