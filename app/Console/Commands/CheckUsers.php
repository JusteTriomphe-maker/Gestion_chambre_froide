<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckUsers extends Command
{
    protected $signature = 'users:check';
    protected $description = 'Check all users in database';

    public function handle()
    {
        $users = User::all();
        
        $this->info("Total users: " . $users->count());
        
        foreach ($users as $user) {
            $this->line("ID: {$user->id}, Name: {$user->name}, Email: {$user->email}, Role: {$user->role}");
        }
        
        return 0;
    }
}
