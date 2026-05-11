<?php

declare(strict_types=1);

namespace App\Traits;

/**
 * HasBlindIndex — HMAC-SHA256 blind index pattern for encrypted PII columns.
 *
 * PROBLEM:
 *   Laravel `encrypted` cast makes values unqueryable — ciphertext is
 *   non-deterministic (different IV each encrypt) so you can never
 *   `WHERE encrypted_col = ?`. For fields that NEED exact-match lookup
 *   (NIM, email, NIP), we keep the encrypted column AND a parallel
 *   "blind index" column that stores HMAC-SHA256(plaintext) using a
 *   server-side key.
 *
 * USAGE:
 *   class Mahasiswa extends Model {
 *       use HasBlindIndex;
 *
 *       protected function blindIndexMap(): array {
 *           return ['nim' => 'nim_bidx'];   // source -> destination
 *       }
 *   }
 *
 *   // Write: cukup set attribute biasa. Trait akan otomatis populate
 *   // nim_bidx saat saving.
 *   $m->nim = '1423203072';
 *   $m->save();
 *
 *   // Read lookup: gunakan helper static.
 *   Mahasiswa::whereBlind('nim', '1423203072')->first();
 *
 *   // Or via scope convenience on the model:
 *   Mahasiswa::whereNim('1423203072')->first();
 *
 * KEY MANAGEMENT:
 *   Uses config('app.blind_index_key'). Must be a strong random string
 *   (>= 32 bytes). Rotating this key invalidates ALL existing blind
 *   indexes; a rotation script would need to recompute everything.
 *   We intentionally refuse to compute indexes if the key is unset,
 *   rather than silently degrade to a lookup-friendly-but-insecure state.
 */
trait HasBlindIndex
{
    /**
     * Map source attribute -> destination blind-index column.
     * Implement this in the model.
     *
     * @return array<string, string>
     */
    abstract protected function blindIndexMap(): array;

    public static function bootHasBlindIndex(): void
    {
        static::saving(function (self $model): void {
            foreach ($model->blindIndexMap() as $source => $destination) {
                // `isDirty` prevents recomputation when the source attribute
                // was not touched during this save — cheap no-op for
                // unrelated writes.
                if (! $model->isDirty($source)) {
                    continue;
                }

                $value = $model->getAttributeValue($source);

                if ($value === null || $value === '') {
                    $model->setAttribute($destination, null);

                    continue;
                }

                $model->setAttribute(
                    $destination,
                    self::computeBlindIndex((string) $value),
                );
            }
        });
    }

    /**
     * Scope helper: `Model::whereBlind('nim', $value)`. Accepts the SOURCE
     * attribute name; trait resolves the destination column internally.
     */
    public function scopeWhereBlind($query, string $sourceAttribute, string $value)
    {
        $map = $this->blindIndexMap();

        if (! isset($map[$sourceAttribute])) {
            throw new \InvalidArgumentException(sprintf(
                'Attribute "%s" is not registered in blindIndexMap() on %s.',
                $sourceAttribute,
                static::class,
            ));
        }

        return $query->where($map[$sourceAttribute], self::computeBlindIndex($value));
    }

    /**
     * Compute HMAC-SHA256(plaintext) hex-encoded (64 chars). Intentionally
     * NOT a bcrypt/argon hash — we need deterministic output for lookups.
     * Security relies on the HMAC key being kept server-side-only and
     * on plaintext having enough entropy that brute-force is impractical.
     *
     * For short values like NIM (10 digits = 10^10 search space), a leaked
     * blind index + leaked key would still let an attacker confirm a
     * guessed NIM. This is a worse-than-encryption but better-than-plaintext
     * tradeoff; accept it knowingly.
     */
    public static function computeBlindIndex(string $plaintext): string
    {
        $key = (string) config('app.blind_index_key', '');

        if ($key === '' || strlen($key) < 32) {
            throw new \RuntimeException(
                'config/app.php blind_index_key tidak di-set atau < 32 bytes. '
                    .'Set APP_BLIND_INDEX_KEY di .env (generate: openssl rand -base64 32). '
                    .'Tanpa key, blind index tidak dapat dihitung — refuse-to-compute '
                    .'dari pada degrade ke pattern insecure.'
            );
        }

        return hash_hmac('sha256', $plaintext, $key);
    }
}
