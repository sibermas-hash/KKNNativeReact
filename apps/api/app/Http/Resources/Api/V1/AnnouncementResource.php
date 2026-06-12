<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            // Derivative enum 'berita'|'pengumuman' yang mengkapsulasi mapping
            // kategori. Frontend list/detail pakai nilai ini untuk tab & route.
            'content_type' => $this->content_type,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'image_url' => $this->image ? rtrim((string) config('app.frontend_url', preg_replace('#/api$#', '', (string) config('app.url'))), '/').'/storage/'.$this->image : null,
            'file_url' => $this->file_path ? rtrim((string) config('app.frontend_url', preg_replace('#/api$#', '', (string) config('app.url'))), '/').'/storage/'.$this->file_path : null,
            'file_name' => $this->file_name,
            'is_active' => $this->is_active,
            'show_as_popup' => (bool) $this->show_as_popup,
            'popup_until' => $this->popup_until?->toIso8601String(),
            'popup_dismissable' => (bool) $this->popup_dismissable,
            'announcement_targets' => $this->resource->targets(),
            'published_at' => $this->published_at?->toIso8601String(),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
