<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DocumentTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentTemplateController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $templates = DocumentTemplate::query()
            ->withCount(['requirementDefaults', 'periodAssignments'])
            ->when($request->filled('document_key'), fn ($q) => $q->where('document_key', $request->string('document_key')))
            ->latest()
            ->get();

        return $this->success(['templates' => $templates->map(fn (DocumentTemplate $template) => $this->serialize($template))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_key' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:doc,docx,pdf,xls,xlsx', 'max:10240'],
        ]);

        $file = $request->file('file');
        $path = $file->store('document-templates', config('filesystems.default'));

        $template = DocumentTemplate::create([
            'document_key' => $validated['document_key'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => (int) ($file->getSize() ?? 0),
            'uploaded_by' => $request->user()?->id,
            'is_active' => true,
        ]);

        return $this->created(['template' => $this->serialize($template)], 'Template dokumen berhasil diunggah.');
    }


    public function update(Request $request, DocumentTemplate $documentTemplate): JsonResponse
    {
        $validated = $request->validate([
            'document_key' => ['sometimes', 'required', 'string', 'max:120'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $documentTemplate->update($validated);

        return $this->success(['template' => $this->serialize($documentTemplate->refresh())], 'Metadata template berhasil diperbarui.');
    }
    public function destroy(DocumentTemplate $documentTemplate): JsonResponse
    {
        if ($documentTemplate->requirementDefaults()->exists() || $documentTemplate->periodAssignments()->exists()) {
            return $this->error('VALIDATION_ERROR', 'Template masih digunakan oleh requirement atau periode. Lepaskan dulu dari UI sebelum menghapus.', 422);
        }

        Storage::disk(config('filesystems.default'))->delete($documentTemplate->file_path);
        $documentTemplate->delete();

        return $this->noContent('Template dokumen berhasil dihapus.');
    }

    public function download(DocumentTemplate $documentTemplate): StreamedResponse
    {
        return Storage::disk(config('filesystems.default'))->download($documentTemplate->file_path, $documentTemplate->file_name);
    }

    private function serialize(DocumentTemplate $template): array
    {
        return [
            'id' => $template->id,
            'document_key' => $template->document_key,
            'name' => $template->name,
            'description' => $template->description,
            'file_name' => $template->file_name,
            'mime_type' => $template->mime_type,
            'file_size' => $template->file_size,
            'download_url' => route('api.v1.admin.document-templates.download', $template),
            'created_at' => $template->created_at?->toIso8601String(),
            'requirement_defaults_count' => (int) ($template->requirement_defaults_count ?? $template->requirementDefaults()->count()),
            'period_assignments_count' => (int) ($template->period_assignments_count ?? $template->periodAssignments()->count()),
            'is_deletable' => (($template->requirement_defaults_count ?? $template->requirementDefaults()->count()) === 0)
                && (($template->period_assignments_count ?? $template->periodAssignments()->count()) === 0),
        ];
    }
}
