<?php

declare(strict_types=1);

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    /**
     * Success response with data.
     */
    protected function success(mixed $data = null, string $message = 'OK', int $code = 200, array $headers = []): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code, $headers);
    }

    /**
     * Success response with a Resource.
     */
    protected function successResource(JsonResource $resource, string $message = 'OK', int $code = 200): JsonResponse
    {
        return $resource->response()->setStatusCode($code)->setData([
            'success' => true,
            'message' => $message,
            'data' => $resource->resolve(request()),
        ]);
    }

    /**
     * Success response with a ResourceCollection (paginated).
     */
    protected function successCollection(ResourceCollection $collection, string $message = 'OK'): JsonResponse
    {
        $resolved = $collection->resolve(request());

        $response = [
            'success' => true,
            'message' => $message,
            'data' => $resolved,
        ];

        if ($collection->resource instanceof LengthAwarePaginator) {
            $paginator = $collection->resource;
            $response['meta'] = [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ];
            $response['links'] = [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ];
        }

        return response()->json($response);
    }

    /**
     * Created response.
     */
    protected function created(mixed $data = null, string $message = 'Data berhasil dibuat.'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /**
     * No content response.
     */
    protected function noContent(string $message = 'OK'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], 200);
    }

    /**
     * Error response.
     */
    protected function error(string $code, string $message, int $httpCode, array $errors = []): JsonResponse
    {
        $response = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];

        if (! empty($errors)) {
            $response['error']['errors'] = $errors;
        }

        return response()->json($response, $httpCode);
    }

    /**
     * Bad request (400).
     */
    protected function badRequest(string $message = 'Permintaan tidak valid.', array $errors = []): JsonResponse
    {
        return $this->error('BAD_REQUEST', $message, 400, $errors);
    }

    /**
     * Unauthorized (401).
     */
    protected function unauthorized(string $message = 'Tidak terotentikasi.'): JsonResponse
    {
        return $this->error('UNAUTHORIZED', $message, 401);
    }

    /**
     * Forbidden (403).
     */
    protected function forbidden(string $message = 'Akses ditolak.'): JsonResponse
    {
        return $this->error('FORBIDDEN', $message, 403);
    }

    /**
     * Not found (404).
     */
    protected function notFound(string $message = 'Data tidak ditemukan.'): JsonResponse
    {
        return $this->error('NOT_FOUND', $message, 404);
    }

    /**
     * Validation error (422).
     */
    protected function validationError(array $errors, string $message = 'Data yang diberikan tidak valid.'): JsonResponse
    {
        return $this->error('VALIDATION_ERROR', $message, 422, $errors);
    }

    /**
     * Rate limited (429).
     */
    protected function rateLimited(string $message = 'Terlalu banyak permintaan. Silakan coba lagi nanti.'): JsonResponse
    {
        return $this->error('RATE_LIMITED', $message, 429);
    }

    /**
     * Server error (500).
     */
    protected function serverError(string $message = 'Terjadi kesalahan internal.'): JsonResponse
    {
        return $this->error('SERVER_ERROR', $message, 500);
    }

    /**
     * Custom error with redirect suggestion.
     */
    protected function redirect(string $url, string $message = 'Redirect', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'redirect_to' => $url,
        ], $code);
    }
}
