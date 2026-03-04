<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanDatabase extends Command
{
    protected $signature = 'db:clean {--keep-dg : Garder le DG existant}';
    protected $description = 'Nettoie toutes les données de la base de données sauf le DG';

    public function handle()
    {
        $this->info('🧹 Nettoyage de la base de données...');
        $this->newLine();

        // Désactiver les contraintes de clé étrangère
        Schema::disableForeignKeyConstraints();

        // Ordre de suppression (respecter les dépendances) - SAUF USERS
        $tables = [
            'sale_items',
            'sales',
            'debts',
            'stock_exits',
            'stock_entries',
            'clients',
            'suppliers',
            'products',
            // On NE supprime PAS les utilisateurs
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                if ($count > 0) {
                    DB::table($table)->delete();
                    $this->line("✓ Table '$table' vidée ($count enregistrements)");
                } else {
                    $this->line("✓ Table '$table' déjà vide");
                }
            }
        }

        $this->newLine();
        $this->info('✅ Base de données nettoyée avec succès !');

        // Réactiver les contraintes de clé étrangère
        Schema::enableForeignKeyConstraints();

        return Command::SUCCESS;
    }
}
