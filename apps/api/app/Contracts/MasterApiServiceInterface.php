<?php

declare(strict_types=1);

namespace App\Contracts;

/**
 * Interface for Master API Service
 * Handles communication with external Master API
 */
interface MasterApiServiceInterface
{
    /**
     * Get access token from Master API
     */
    public function getAccessToken(): string;

    /**
     * Sync faculty data
     */
    public function syncFacultyData(): array;

    /**
     * Sync program data
     */
    public function syncProgramData(): array;

    /**
     * Get location data
     */
    public function getLocationData(): array;

    /**
     * Handle webhook from Master API
     */
    public function handleWebhook(array $data): bool;

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $signature, string $payload): bool;
}
