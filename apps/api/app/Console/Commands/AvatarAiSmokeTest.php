<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AvatarValidationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AvatarAiSmokeTest extends Command
{
    protected $signature = 'avatar:ai-smoke-test';

    protected $description = 'Create synthetic valid/invalid avatar images and verify avatar AI validation path.';

    public function handle(AvatarValidationService $validator): int
    {
        Storage::disk('public')->makeDirectory('avatars');
        $valid = 'avatars/ai-smoke-valid.jpg';
        $invalid = 'avatars/ai-smoke-invalid.jpg';
        $this->makeImage(storage_path('app/public/'.$valid), true);
        $this->makeImage(storage_path('app/public/'.$invalid), false);

        $validResult = $validator->validateAvatar($valid);
        $invalidResult = $validator->validateAvatar($invalid);

        Storage::disk('public')->delete([$valid, $invalid]);
        $result = ['valid_photo' => $validResult, 'invalid_photo' => $invalidResult];
        $this->info(json_encode($result, JSON_PRETTY_PRINT));

        return (($validResult['is_valid'] ?? false) && ! ($invalidResult['is_valid'] ?? true)) ? 0 : 1;
    }

    private function makeImage(string $path, bool $valid): void
    {
        $w = 600;
        $h = 800;
        $im = imagecreatetruecolor($w, $h);
        $bg = $valid ? imagecolorallocate($im, 210, 0, 0) : imagecolorallocate($im, 235, 235, 235);
        imagefilledrectangle($im, 0, 0, $w, $h, $bg);
        if ($valid) {
            $jacket = imagecolorallocate($im, 20, 110, 70);
            $skin = imagecolorallocate($im, 230, 190, 160);
            $hair = imagecolorallocate($im, 30, 25, 20);
            imagefilledellipse($im, 300, 250, 150, 180, $skin);
            imagefilledellipse($im, 300, 170, 160, 80, $hair);
            imagefilledpolygon($im, [170, 760, 430, 760, 380, 430, 220, 430], 4, $jacket);
            imagefilledrectangle($im, 250, 390, 350, 470, $skin);
        } else {
            $blue = imagecolorallocate($im, 40, 120, 220);
            imagefilledrectangle($im, 0, 0, $w, $h, $blue);
            $white = imagecolorallocate($im, 255, 255, 255);
            imagestring($im, 5, 140, 360, 'TWIBBON / NOT FORMAL', $white);
        }
        imagejpeg($im, $path, 92);
        imagedestroy($im);
    }
}
