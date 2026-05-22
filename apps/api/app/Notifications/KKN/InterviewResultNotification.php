<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\InterviewParticipant;
use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterviewResultNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly InterviewParticipant $participant,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', FcmChannel::class];
    }

    private function isPassed(): bool
    {
        return $this->participant->result === 'passed';
    }

    private function resultLabel(): string
    {
        return $this->isPassed() ? 'LULUS' : 'TIDAK LULUS';
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => "Hasil Wawancara: {$this->resultLabel()}",
            'message' => $this->isPassed()
                ? 'Selamat! Anda dinyatakan lulus wawancara KKN. Silakan tunggu informasi selanjutnya.'
                : 'Mohon maaf, Anda dinyatakan tidak lulus wawancara KKN.' . ($this->participant->notes ? " Catatan: {$this->participant->notes}" : ''),
            'type' => 'interview_result',
            'priority' => 'high',
            'action' => '/mahasiswa/wawancara',
            'data' => [
                'participant_id' => $this->participant->id,
                'result' => $this->participant->result,
                'notes' => $this->participant->notes,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Hasil Wawancara KKN: {$this->resultLabel()}")
            ->greeting("Assalamu'alaikum, {$notifiable->name}");

        if ($this->isPassed()) {
            $mail->line('🎉 Selamat! Anda dinyatakan **LULUS** wawancara KKN.')
                ->line('Silakan tunggu informasi penempatan kelompok selanjutnya.');
        } else {
            $mail->line('Mohon maaf, Anda dinyatakan **TIDAK LULUS** wawancara KKN.');
            if ($this->participant->notes) {
                $mail->line("📝 Catatan: {$this->participant->notes}");
            }
            $mail->line('Silakan hubungi panitia jika ada pertanyaan.');
        }

        return $mail->action('Lihat Detail', url('/mahasiswa/wawancara'));
    }

    public function toFcm(object $notifiable): array
    {
        return [
            'title' => "Hasil Wawancara: {$this->resultLabel()}",
            'body' => $this->isPassed()
                ? 'Selamat! Anda lulus wawancara KKN.'
                : 'Mohon maaf, Anda tidak lulus wawancara KKN.',
            'data' => [
                'type' => 'interview_result',
                'action' => '/mahasiswa/wawancara',
                'result' => $this->participant->result,
            ],
        ];
    }
}
