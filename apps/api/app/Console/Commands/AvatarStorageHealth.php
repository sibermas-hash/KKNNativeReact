<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AvatarStorageHealth extends Command
{
    protected $signature = 'avatar:storage-health';
    protected $description = 'Verify avatar storage directory, write/read/delete, and public symlink.';

    public function handle(): int
    {
        Storage::disk('public')->makeDirectory('avatars');
        $test = 'avatars/.health-'.uniqid().'.txt';
        $okWrite = Storage::disk('public')->put($test, 'ok');
        $exists = Storage::disk('public')->exists($test);
        $content = $exists ? Storage::disk('public')->get($test) : null;
        Storage::disk('public')->delete($test);

        $publicLink = public_path('storage');
        $avatarDir = storage_path('app/public/avatars');
        $result = [
            'disk_root' => storage_path('app/public'),
            'avatar_dir' => $avatarDir,
            'avatar_dir_exists' => is_dir($avatarDir),
            'avatar_dir_writable' => is_writable($avatarDir),
            'public_storage_link_exists' => file_exists($publicLink),
            'public_storage_is_link' => is_link($publicLink),
            'write_ok' => (bool) $okWrite,
            'read_ok' => $content === 'ok',
            'delete_ok' => ! Storage::disk('public')->exists($test),
        ];
        $this->info(json_encode($result, JSON_PRETTY_PRINT));
        return ($result['avatar_dir_exists'] && $result['avatar_dir_writable'] && $result['write_ok'] && $result['read_ok'] && $result['delete_ok']) ? 0 : 1;
    }
}
