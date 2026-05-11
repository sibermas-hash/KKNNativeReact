<?php

declare(strict_types=1);

namespace App\Traits;

/**
 * Behavior for models that track manually-edited-and-therefore-locked fields.
 *
 * `manually_edited_fields` is a JSON array of field names that admins/users
 * have changed by hand. The SIAKAD sync respects that list and will NOT
 * overwrite those fields.
 */
trait HasManuallyEditedFields
{
    /**
     * Add the given field names to the lock list.
     */
    public function lockFields(array $fieldNames): void
    {
        if (empty($fieldNames)) {
            return;
        }

        $current = (array) ($this->manually_edited_fields ?? []);
        $merged = array_values(array_unique(array_merge($current, array_values($fieldNames))));

        $this->manually_edited_fields = $merged;
        $this->save();
    }

    /**
     * Remove a field from the lock list (superadmin "release lock" action).
     */
    public function unlockField(string $fieldName): void
    {
        $current = (array) ($this->manually_edited_fields ?? []);
        $next = array_values(array_diff($current, [$fieldName]));

        $this->manually_edited_fields = empty($next) ? null : $next;
        $this->save();
    }

    public function isFieldLocked(string $fieldName): bool
    {
        return in_array($fieldName, (array) ($this->manually_edited_fields ?? []), true);
    }

    public function lockedFields(): array
    {
        return (array) ($this->manually_edited_fields ?? []);
    }

    /**
     * Filter an associative array of incoming updates — strip any field that
     * is locked on this model. Use this in sync paths before `fill()` /
     * `updateOrCreate()`.
     */
    public function filterLockedFields(array $updates): array
    {
        $locked = $this->lockedFields();
        if (empty($locked)) {
            return $updates;
        }

        return array_diff_key($updates, array_flip($locked));
    }
}
