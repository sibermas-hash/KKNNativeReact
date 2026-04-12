<?php

namespace App\Contracts;

/**
 * Interface for Period Context Service
 * Handles period-related context and operations
 */
interface PeriodContextServiceInterface
{
    /**
     * Get active period ID
     */
    public function getActivePeriodId(): ?int;

    /**
     * Get default period ID
     */
    public function getDefaultPeriodId(): ?int;

    /**
     * Get current period
     */
    public function getCurrentPeriod();

    /**
     * Set active period
     */
    public function setActivePeriod($periodId): void;
}
