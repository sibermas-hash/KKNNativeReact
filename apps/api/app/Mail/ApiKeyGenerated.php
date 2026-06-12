<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApiKeyGenerated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $projectName,
        public string $apiKey,
        public string $serverUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "API Key untuk {$this->projectName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.api-key-generated',
        );
    }
}
