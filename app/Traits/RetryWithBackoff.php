<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Trait untuk retry logic dengan exponential backoff
 */
trait RetryWithBackoff
{
    /**
     * Execute callback with retry and exponential backoff
     *
     * @param callable $callback Function to execute
     * @param int $maxAttempts Maximum number of attempts
     * @param int $initialDelay Initial delay in milliseconds
     * @param float $backoffMultiplier Backoff multiplier (default: 2 = exponential)
     * @param array $exceptions Exceptions to retry on
     * @return mixed
     * @throws Exception
     */
    protected function retry(
        callable $callback,
        int $maxAttempts = 3,
        int $initialDelay = 100,
        float $backoffMultiplier = 2.0,
        array $exceptions = []
    ): mixed {
        $attempts = 0;
        $delay = $initialDelay;

        $defaultExceptions = [
            \Illuminate\Http\Client\ConnectionException::class,
            \Illuminate\Http\Client\RequestException::class,
            \GuzzleHttp\Exception\ConnectException::class,
            \GuzzleHttp\Exception\ServerException::class,
            Exception::class,
        ];

        $retryableExceptions = array_merge($defaultExceptions, $exceptions);

        while ($attempts < $maxAttempts) {
            try {
                $attempts++;

                if ($attempts > 1) {
                    Log::info("Retry attempt {$attempts}/{$maxAttempts} after {$delay}ms");
                    usleep($delay * 1000); // Convert ms to microseconds
                }

                return $callback();

            } catch (Exception $e) {
                $shouldRetry = false;

                foreach ($retryableExceptions as $exception) {
                    if ($e instanceof $exception) {
                        $shouldRetry = true;
                        break;
                    }
                }

                if (!$shouldRetry || $attempts >= $maxAttempts) {
                    Log::error("Operation failed after {$attempts} attempts", [
                        'error' => $e->getMessage(),
                        'exception' => get_class($e),
                    ]);

                    throw $e;
                }

                Log::warning("Attempt {$attempts} failed, retrying...", [
                    'error' => $e->getMessage(),
                    'delay' => $delay,
                ]);

                // Exponential backoff
                $delay = (int) ($delay * $backoffMultiplier);

                // Add jitter (±10%) to prevent thundering herd
                $jitter = (int) ($delay * 0.1 * (rand() / getrandmax() * 2 - 1));
                $delay += $jitter;
            }
        }

        throw new Exception('Max retry attempts reached');
    }

    /**
     * Simple retry without backoff (fixed delay)
     */
    protected function retrySimple(
        callable $callback,
        int $maxAttempts = 3,
        int $delay = 1000
    ): mixed {
        return $this->retry($callback, $maxAttempts, $delay, 1.0);
    }
}
