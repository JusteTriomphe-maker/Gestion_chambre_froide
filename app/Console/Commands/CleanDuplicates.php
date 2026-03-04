<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanDuplicates extends Command
{
    protected $signature = 'clean:duplicates {table=stock_exits}';
    protected $description = 'Remove duplicate records from a table';

    public function handle()
    {
        $table = $this->argument('table');
        
        $this->info("Cleaning duplicates from {$table}...");
        
        // Get all tables with potential duplicates
        $tables = ['stock_exits', 'stock_entries'];
        
        foreach ($tables as $tableName) {
            $dateColumn = $tableName === 'stock_entries' ? 'entry_date' : 'exit_date';
            
            $count = DB::table($tableName)->count();
            
            // Keep only the first record for each group of duplicates
            DB::statement("DELETE FROM {$tableName} WHERE id NOT IN (
                SELECT MIN(id) FROM {$tableName} GROUP BY product_id, quantity, {$dateColumn}
            )");
            
            $newCount = DB::table($tableName)->count();
            $this->info("{$tableName}: {$count} -> {$newCount} records");
        }
        
        $this->info('Done!');
        
        return 0;
    }
}
