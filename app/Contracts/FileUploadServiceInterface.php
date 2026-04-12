<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Model;

/**
 * Interface for File Upload Service
 * Handles file operations securely
 */
interface FileUploadServiceInterface
{
    /**
     * Validate file magic bytes
     */
    public function validateFileMagicBytes($file): void;

    /**
     * Store file securely
     */
    public function storeFile($file, string $path): string;

    /**
     * Delete file
     */
    public function deleteFile(string $path): bool;

    /**
     * Get presigned URL
     */
    public function getPresignedUrl(string $path, int $expirationMinutes = 60): string;

    /**
     * Validate file against allowed types
     */
    public function validateFileType($file, array $allowedTypes): bool;
}
