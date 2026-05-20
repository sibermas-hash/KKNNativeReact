<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\PesertaKkn;

class KknWorkflowService
{
    public function state(?PesertaKkn $registration): array
    {
        if (! $registration) {
            return $this->payload('not_registered', 'Belum mendaftar KKN.', false, false, false, [
                'Daftar pada periode KKN aktif.',
            ]);
        }

        $registration->loadMissing(['periode.jenisKkn', 'kelompok']);
        $workflow = $this->workflowConfig($registration);
        $status = (string) $registration->status;
        $kelompok = $registration->kelompok;
        $role = strtolower((string) $registration->role);

        if (in_array($status, ['pending', 'document_submitted'], true)) {
            return $this->payload('admin_review_pending', 'Menunggu review/approve admin.', false, false, false, [
                'Admin memeriksa dokumen dan kelayakan pendaftaran.',
            ]);
        }

        if ($status === 'document_verified') {
            return $this->payload('approval_pending', 'Dokumen terverifikasi, menunggu approve pendaftaran.', false, false, false, [
                'Admin melakukan approve pendaftaran.',
            ]);
        }

        if ($status === 'rejected') {
            return $this->payload('rejected', 'Pendaftaran ditolak. Perbaiki data/dokumen lalu kirim ulang.', true, false, false, [
                'Perbaiki sesuai catatan admin.',
                'Upload ulang dokumen bila diperlukan.',
            ]);
        }

        if ($status !== 'approved') {
            return $this->payload('inactive', 'Pendaftaran belum aktif.', false, false, false, []);
        }

        if (($workflow['require_group'] ?? true) && ! $registration->kelompok_id) {
            return $this->payload('placement_pending', 'Pendaftaran disetujui, menunggu plotting lokasi/kelompok.', false, false, false, [
                'Admin melakukan plotting lokasi/kelompok.',
                'Setelah kelompok ada, admin menetapkan ketua dan DPL.',
            ]);
        }

        if (($workflow['require_leader'] ?? true) && $role !== 'ketua') {
            return $this->payload('leader_pending', 'Kelompok sudah ada, menunggu penetapan ketua kelompok.', false, false, false, [
                'Admin menetapkan ketua kelompok.',
                'Hanya ketua kelompok yang dapat mengajukan program kerja.',
            ]);
        }

        $hasDpl = (bool) ($kelompok?->dpl_id || $kelompok?->dpl_periode_id);
        if (($workflow['require_dpl'] ?? true) && ! $hasDpl) {
            return $this->payload('dpl_pending', 'Kelompok sudah ada, menunggu penetapan DPL.', false, false, false, [
                'Admin menetapkan DPL.',
                'Setelah DPL ditetapkan, ketua dapat membuat program kerja.',
            ]);
        }

        $canCreateWorkProgram = (bool) ($workflow['enable_work_program'] ?? true) && $role === 'ketua';

        $readyPayload = $this->payload('ready_for_activity', 'Siap kegiatan KKN.', false, $canCreateWorkProgram, true, [
            $canCreateWorkProgram ? 'Ketua kelompok dapat mengajukan program kerja.' : 'Program kerja dikelola oleh ketua kelompok.',
        ]);
        $readyPayload['can']['submit_daily_report'] = (bool) ($workflow['enable_daily_report'] ?? true);
        $readyPayload['can']['generate_certificate'] = (bool) ($workflow['enable_certificate'] ?? true);

        return $readyPayload;
    }

    public function workflowConfig(PesertaKkn $registration): array
    {
        $registration->loadMissing('periode.jenisKkn');
        $periode = $registration->periode;
        $jenis = $periode?->jenisKkn;
        $placementMode = $periode?->placement_mode ?: $jenis?->placement_mode;

        $defaults = $this->defaultWorkflow($placementMode);
        $jenisWorkflow = $this->extractWorkflow($jenis?->requirements_config ?? []);
        $periodeWorkflow = $this->extractWorkflow($periode?->settings_override ?? []);

        return array_merge($defaults, $jenisWorkflow, $periodeWorkflow);
    }

    public function defaultWorkflow(?string $placementMode = null): array
    {
        return [
            'require_documents' => true,
            'require_admin_approval' => true,
            'require_group' => ! in_array($placementMode, ['self_determined'], true),
            'require_leader' => true,
            'require_dpl' => true,
            'enable_work_program' => true,
            'work_program_actor' => 'leader',
            'enable_daily_report' => true,
            'enable_certificate' => true,
        ];
    }

    public function extractWorkflow(array $config): array
    {
        $workflow = $config['workflow'] ?? [];
        if (! is_array($workflow)) {
            return [];
        }

        if (isset($workflow['steps']) && is_array($workflow['steps'])) {
            return $this->flattenSteps($workflow['steps']);
        }

        return $workflow;
    }

    private function flattenSteps(array $steps): array
    {
        $flat = [];
        foreach ($steps as $step) {
            if (! is_array($step) || ! isset($step['key'])) {
                continue;
            }
            $key = (string) $step['key'];
            $enabled = (bool) ($step['enabled'] ?? true);
            $required = (bool) ($step['required'] ?? true);
            if ($key === 'documents') {
                $flat['require_documents'] = $enabled && $required;
            } elseif ($key === 'approval') {
                $flat['require_admin_approval'] = $enabled && $required;
            } elseif ($key === 'placement') {
                $flat['require_group'] = $enabled && $required;
            } elseif ($key === 'leader') {
                $flat['require_leader'] = $enabled && $required;
            } elseif ($key === 'dpl') {
                $flat['require_dpl'] = $enabled && $required;
            } elseif ($key === 'work_program') {
                $flat['enable_work_program'] = $enabled;
                $flat['work_program_actor'] = (string) ($step['actor'] ?? 'leader');
            } elseif ($key === 'daily_report') {
                $flat['enable_daily_report'] = $enabled;
            } elseif ($key === 'certificate') {
                $flat['enable_certificate'] = $enabled;
            }
        }
        return $flat;
    }

    private function payload(string $state, string $message, bool $canUploadDocuments, bool $canCreateWorkProgram, bool $ready, array $nextSteps): array
    {
        return [
            'state' => $state,
            'label' => $message,
            'message' => $message,
            'ready_for_activity' => $ready,
            'can' => [
                'upload_documents' => $canUploadDocuments,
                'create_work_program' => $canCreateWorkProgram,
                'submit_daily_report' => $ready,
                'generate_certificate' => $ready,
            ],
            'next_steps' => $nextSteps,
        ];
    }
}
