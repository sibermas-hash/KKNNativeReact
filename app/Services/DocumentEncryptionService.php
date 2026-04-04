<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentEncryptionService
{
    /**
     * Encrypt and store a sensitive document
     */
    public static function encryptAndStore($file, string $disk = 'private', string $path = 'kkn/documents')
    {
        $contents = file_get_contents($file->getRealPath());
        $encryptedContents = Crypt::encrypt($contents);
        
        $filename = Str::random(40) . '.enc';
        $fullPath = "{$path}/{$filename}";
        
        Storage::disk($disk)->put($fullPath, $encryptedContents);
        
        return $fullPath;
    }

    /**
     * Retrieve and decrypt a sensitive document
     */
    public static function decryptAndRetrieve(string $path, string $disk = 'private')
    {
        if (!Storage::disk($disk)->exists($path)) {
            return null;
        }

        $encryptedContents = Storage::disk($disk)->get($path);
        
        try {
            return Crypt::decrypt($encryptedContents);
        } catch (\Exception $e) {
            \Log::error("Gagal mendekripsi dokumen pada path: {$path}. Error: " . $e->getMessage());
            return null;
        }
    }
}
