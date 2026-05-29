<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DgActionNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly array $lines = [],
        private readonly ?string $actionUrl = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage())
            ->subject($this->title)
            ->greeting('Bonjour')
            ->line($this->title);

        foreach ($this->lines as $line) {
            if ($line !== null && $line !== '') {
                $message->line((string) $line);
            }
        }

        if ($this->actionUrl) {
            $message->action('Ouvrir l’application', $this->actionUrl);
        }

        return $message->salutation('— Chambre Froide');
    }
}

