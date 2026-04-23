<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class ActivityReviewerAgent implements Agent, Conversational, HasStructuredOutput, HasTools
{
    use Promptable;

    /**
     * Get the model that the agent should use.
     */
    public function model(): string
    {
        return 'qwen-plus';
    }

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return 'Anda adalah Asisten Pakar Audit SIBERMAS. Analisis laporan KKN berbasis metodologi ABCD. WAJIB kembalikan JSON dengan format tepat seperti ini: {"summary": "...", "abcd_compliance": 1-10, "quality_score": 1-10, "feedback": "...", "flagged": false, "tags": ["tag1", "tag2"]}. JANGAN tambahkan teks lain.';
    }

    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return Message[]
     */
    public function messages(): iterable
    {
        return [];
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [];
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'summary' => $schema->string()->description('Ringkasan singkat kegiatan (1-2 kalimat).')->required(),
            'abcd_compliance' => $schema->integer()->description('Skor kepatuhan terhadap tahapan ABCD (1-10).')->required(),
            'quality_score' => $schema->integer()->description('Skor kualitas narasi dan refleksi (1-10).')->required(),
            'feedback' => $schema->string()->description('Saran perbaikan singkat untuk mahasiswa.')->required(),
            'flagged' => $schema->boolean()->description('Tandai jika konten tidak pantas atau tidak relevan.')->required(),
            'tags' => $schema->array()->items($schema->string())->description('Tag kategori kegiatan (misal: Keagamaan, Pendidikan, Lingkungan).')->required(),
        ];
    }
}
