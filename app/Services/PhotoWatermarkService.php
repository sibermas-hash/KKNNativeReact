<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class PhotoWatermarkService
{
    /**
     * Apply watermark to a photo.
     * Supports both local and cloud storage by using temporary files.
     */
    public function apply(string $path, array $metadata): bool
    {
        try {
            $disk = Storage::disk(config('filesystems.default'));

            if (! $disk->exists($path)) {
                return false;
            }

            $manager = new ImageManager(new Driver);

            // Create a temporary file to work with (especially important for Cloud Storage)
            $tempPath = storage_path('app/temp-'.Str::random(10).'.jpg');

            // Get the file content and put it in temp
            file_put_contents($tempPath, $disk->get($path));

            // Load from temp
            $image = $manager->read($tempPath);

            $text = sprintf(
                "NIM: %s\nTime: %s\nLoc: %s, %s",
                $metadata['nim'],
                Carbon::parse($metadata['captured_at'])->format('d M Y H:i:s'),
                round((float) $metadata['latitude'], 5),
                round((float) $metadata['longitude'], 5)
            );

            // Add background rectangle for readability
            $image->drawRectangle(10, $image->height() - 110, function ($draw) {
                $draw->background('rgba(0, 0, 0, 0.5)');
                $draw->size(400, 100);
            });

            // Add text
            $image->text($text, 20, $image->height() - 85, function ($font) {
                $font->size(16);
                $font->color('#ffffff');
                $font->align('left');
                $font->valign('top');
            });

            // Save the processed image back to temp
            $image->save($tempPath);

            // Upload the processed image back to the storage disk
            $disk->put($path, file_get_contents($tempPath));

            // Cleanup temp file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Watermark failed: '.$e->getMessage());

            if (isset($tempPath) && file_exists($tempPath)) {
                unlink($tempPath);
            }

            return false;
        }
    }
}
