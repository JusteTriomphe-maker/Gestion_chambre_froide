<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\DgActionNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyDG
{
    /**
     * Envoie une notification email aux DG (ou à MAIL_OVERRIDE_TO si défini).
     * Ne doit jamais bloquer l’action métier.
     */
    public static function send(string $title, array $lines = []): void
    {
        try {
            $overrideTo = config('mail.override_to');
            $actionUrl = config('app.url');

            if (is_string($overrideTo) && trim($overrideTo) !== '') {
                Notification::route('mail', $overrideTo)
                    ->notify(new DgActionNotification($title, $lines, $actionUrl));
                return;
            }

            $dgs = User::query()
                ->where('role', 'dg')
                ->where('is_active', true)
                ->whereNotNull('email')
                ->get();

            if ($dgs->isEmpty()) {
                return;
            }

            Notification::send($dgs, new DgActionNotification($title, $lines, $actionUrl));
        } catch (\Throwable $e) {
            Log::warning('DG mail notification failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}

