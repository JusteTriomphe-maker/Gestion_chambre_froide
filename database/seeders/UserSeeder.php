<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default DG (Directeur Général) user
        User::firstOrCreate(
            ['email' => 'dg@chambrefroide.ci'],
            [
                'name' => 'Directeur Général',
                'password' => Hash::make('dg123456'),
                'role' => 'dg',
                'phone' => '+225 01 02 03 04 05',
                'is_active' => true,
            ]
        );

        $this->command->info('Utilisateur DG créé avec succès!');
        $this->command->info('Email: dg@chambrefroide.ci');
        $this->command->info('Mot de passe: dg123456');
    }
}
