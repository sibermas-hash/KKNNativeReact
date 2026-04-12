<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PhotoWatermarkService
{
    /**
     * Apply watermark to a photo.
     */
    public function apply(string $path, array $metadata): bool
    {
        try {
            $manager = new ImageManager(new Driver());
            $fullPath = Storage::disk('local')->path($path);
            
            $image = $manager->read($fullPath);
            
            $text = sprintf(
                "NIM: %s\nTime: %s\nLoc: %s, %s",
                $metadata['nim'],
                Carbon::parse($metadata['captured_at'])->format('d M Y H:i:s'),
                round($metadata['latitude'], 5),
                round($metadata['longitude'], 5)
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

            $image->save();
            return true;
        } catch (\Exception $e) {
            \Log::error('Watermark failed: ' . $e->getMessage());
            return false;
        }
    }
}
