<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\PesertaKkn;
use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesNotificationChannels;
    public function __construct(public PesertaKkn $registration, public string $periodName, public ?string $groupName = null) {}
    public function via(object $notifiable): array { return $this->preferredChannels($notifiable, ['mail', 'database', WaGatewayChannel::class]); }
    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)->subject('✅ Pendaftaran KKN Disetujui — SIBERMAS')->greeting("Assalamu'alaikum, {$notifiable->name}")->line("Selamat! Pendaftaran Anda untuk **{$this->periodName}** telah **disetujui**.");
        $mail->line($this->groupName ? "Anda telah ditempatkan di kelompok: **{$this->groupName}**." : 'Penempatan kelompok akan ditentukan oleh sistem setelah seluruh pendaftaran diproses.');
        return $mail->action('Lihat Detail Pendaftaran', url('/student/dashboard'))->line('Silakan pantau informasi selanjutnya melalui portal SIBERMAS.');
    }
    public function toWaGateway(object $notifiable): string { return "✅ *Pendaftaran KKN Disetujui*

Pendaftaran Anda untuk {$this->periodName} telah disetujui.".($this->groupName ? "
Kelompok: {$this->groupName}" : "
Penempatan kelompok akan ditentukan kemudian.")."

Buka: ".url('/student/dashboard'); }
    public function toArray(object $notifiable): array { return ['type'=>'registration_approved','registration_id'=>$this->registration->id,'period_name'=>$this->periodName,'group_name'=>$this->groupName,'message'=>"Pendaftaran {$this->periodName} telah disetujui.".($this->groupName ? " Kelompok: {$this->groupName}" : '')]; }
}
