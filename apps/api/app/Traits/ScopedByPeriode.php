<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Trait ScopedByPeriode
 *
 * Menerapkan Global Scope yang otomatis memfilter query berdasarkan
 * session 'active_periode_id'. Juga otomatis mengisi periode_id
 * saat record baru dibuat.
 *
 * Gunakan withoutGlobalScope('isolasi_periode') untuk query lintas periode
 * (misal: laporan rekap, export semua data).
 *
 * @usage class PesertaKkn extends Model { use ScopedByPeriode; }
 */
trait ScopedByPeriode
{
    protected static function bootScopedByPeriode(): void
    {
        // Hanya aktifkan Global Scope di konteks web (bukan console/artisan/test)
        if (! app()->runningInConsole()) {
            static::addGlobalScope('isolasi_periode', function (Builder $builder) {
                $periodeId = session('active_periode_id');

                if ($periodeId) {
                    $table = (new static)->getTable();
                    $builder->where("{$table}.periode_id", $periodeId);
                }
            });
        }

        // Auto-fill periode_id saat creating (jika belum diisi)
        static::creating(function (Model $model) {
            if (empty($model->periode_id) && session()->has('active_periode_id')) {
                $model->periode_id = session('active_periode_id');
            }
        });
    }
}
