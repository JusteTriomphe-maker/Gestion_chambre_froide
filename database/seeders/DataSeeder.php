<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Client;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for SQLite compatibility
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Clear existing data
        Product::truncate();
        Client::truncate();
        Supplier::truncate();

        // Create Products (Chambre Froide items)
        $products = [
            [
                'name' => 'Poulet Frais',
                'barcode' => 'PF001',
                'category' => 'Volaille',
                'price_buying' => 2500,
                'price_selling' => 3000,
                'unit' => 'kg',
                'min_threshold' => 50,
                'current_stock' => 200,
            ],
            [
                'name' => 'Poulet Congelé',
                'barcode' => 'PC001',
                'category' => 'Volaille',
                'price_buying' => 2200,
                'price_selling' => 2700,
                'unit' => 'kg',
                'min_threshold' => 100,
                'current_stock' => 500,
            ],
            [
                'name' => 'Dinde Fraîche',
                'barcode' => 'DF001',
                'category' => 'Volaille',
                'price_buying' => 4000,
                'price_selling' => 5000,
                'unit' => 'kg',
                'min_threshold' => 30,
                'current_stock' => 80,
            ],
            [
                'name' => 'Canard Frais',
                'barcode' => 'CF001',
                'category' => 'Volaille',
                'price_buying' => 3500,
                'price_selling' => 4200,
                'unit' => 'kg',
                'min_threshold' => 20,
                'current_stock' => 60,
            ],
            [
                'name' => 'Porc Frais',
                'barcode' => 'PO001',
                'category' => 'Viande',
                'price_buying' => 3000,
                'price_selling' => 3800,
                'unit' => 'kg',
                'min_threshold' => 40,
                'current_stock' => 150,
            ],
            [
                'name' => 'Bœuf Frais',
                'barcode' => 'BF001',
                'category' => 'Viande',
                'price_buying' => 4500,
                'price_selling' => 5500,
                'unit' => 'kg',
                'min_threshold' => 30,
                'current_stock' => 100,
            ],
            [
                'name' => 'Poisson Frais (Capitaine)',
                'barcode' => 'FPC001',
                'category' => 'Poisson',
                'price_buying' => 5000,
                'price_selling' => 6500,
                'unit' => 'kg',
                'min_threshold' => 25,
                'current_stock' => 75,
            ],
            [
                'name' => 'Poisson Fumé',
                'barcode' => 'PS001',
                'category' => 'Poisson',
                'price_buying' => 4000,
                'price_selling' => 5000,
                'unit' => 'kg',
                'min_threshold' => 20,
                'current_stock' => 50,
            ],
            [
                'name' => 'Crevettes Séchées',
                'barcode' => 'CS001',
                'category' => 'Poisson',
                'price_buying' => 8000,
                'price_selling' => 10000,
                'unit' => 'kg',
                'min_threshold' => 10,
                'current_stock' => 30,
            ],
            [
                'name' => 'Gésiers de Poulet',
                'barcode' => 'GP001',
                'category' => 'Abats',
                'price_buying' => 1500,
                'price_selling' => 2000,
                'unit' => 'kg',
                'min_threshold' => 15,
                'current_stock' => 40,
            ],
            [
                'name' => 'Foie de Poulet',
                'barcode' => 'FP001',
                'category' => 'Abats',
                'price_buying' => 2000,
                'price_selling' => 2500,
                'unit' => 'kg',
                'min_threshold' => 10,
                'current_stock' => 25,
            ],
            [
                'name' => 'Cœurs de Poulet',
                'barcode' => 'CP001',
                'category' => 'Abats',
                'price_buying' => 1800,
                'price_selling' => 2200,
                'unit' => 'kg',
                'min_threshold' => 15,
                'current_stock' => 35,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }

        $this->command->info(count($products) . ' produits créés avec succès!');

        // Create Clients
        $clients = [
            [
                'name' => 'Restaurant Le Palais',
                'contact_info' => 'Gestionnaire: M. Kouassi',
                'address' => 'Avenue de la République, Brazzaville',
                'phone' => '+242 06 123 45 67',
                'email' => 'contact@palais.restaurant',
                'total_debt' => 0,
            ],
            [
                'name' => 'Hotel Méridien',
                'contact_info' => 'Chef Cuisinier: Mme. Bouchard',
                'address' => 'Centre Ville, Brazzaville',
                'phone' => '+242 05 987 65 43',
                'email' => 'cuisine@meridien.hotel',
                'total_debt' => 150000,
            ],
            [
                'name' => 'Supermarché Casino',
                'contact_info' => 'Responsable Achats: M. Okoyo',
                'address' => 'Quartier Plateau, Brazzaville',
                'phone' => '+242 04 555 55 55',
                'email' => 'achats@casino.cg',
                'total_debt' => 0,
            ],
            [
                'name' => 'Ecole Primaire Notre Dame',
                'contact_info' => 'Gestionnaire: Père Michel',
                'address' => 'Rue de l\'Eglise, Makelekele',
                'phone' => '+242 02 111 22 33',
                'email' => 'gestion@notredame.edu',
                'total_debt' => 75000,
            ],
            [
                'name' => 'Cantine Ecole la Lumière',
                'contact_info' => 'Responsable: Mme. Antoinette',
                'address' => 'Quartier Moungali',
                'phone' => '+242 06 444 55 66',
                'email' => 'cantine@lumiere.edu',
                'total_debt' => 0,
            ],
            [
                'name' => 'Restaurant Chez AL',
                'contact_info' => 'Propriétaire: M. Alain',
                'address' => 'Quartier Poto-Poto',
                'phone' => '+242 05 777 88 99',
                'email' => 'chezal@restaurant.cg',
                'total_debt' => 45000,
            ],
        ];

        foreach ($clients as $client) {
            Client::create($client);
        }

        $this->command->info(count($clients) . ' clients créés avec succès!');

        // Create Suppliers
        $suppliers = [
            [
                'name' => 'Ferme Avicole du Congo',
                'contact_info' => 'Directeur: M. Nguimdzie',
                'address' => 'Route de Kintélé, Brazzaville',
                'phone' => '+242 01 111 11 11',
                'email' => 'info@fermeavicole.cg',
                'total_debt' => 0,
            ],
            [
                'name' => 'Société des Pêches Maritime',
                'contact_info' => 'Responsable: M. Massemba',
                'address' => 'Port de Brazzaville',
                'phone' => '+242 02 222 22 22',
                'email' => 'ventes@pechesmaritime.cg',
                'total_debt' => 500000,
            ],
            [
                'name' => 'Eleveurs du Pool',
                'contact_info' => 'Président: M. Bouka',
                'address' => 'District de Kinkala, Pool',
                'phone' => '+242 03 333 33 33',
                'email' => 'contact@eleveurspool.cg',
                'total_debt' => 0,
            ],
            [
                'name' => 'Coopérative Femmes du Littoral',
                'contact_info' => 'Présidente: Mme. Charlotte',
