<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_date',
        'total_amount',
        'user_id',
        'client_id',
        'receipt_number',
        'notes',
        'is_paid',
        'paid_at',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'total_amount' => 'decimal:2',
        'is_paid' => 'boolean',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public static function generateReceiptNumber(): string
    {
        $date = now()->format('Ymd');
        $lastSale = self::whereDate('sale_date', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastSale ? (int)substr($lastSale->receipt_number, -4) + 1 : 1;
        
        return sprintf('RCPT-%s-%04d', $date, $sequence);
    }

    public static function getDailyTotal(\Carbon\Carbon $date = null): float
    {
        $date = $date ?? today();
        return self::whereDate('sale_date', $date)->sum('total_amount');
    }

    public static function getDailySalesByProduct(\Carbon\Carbon $date = null): array
    {
        $date = $date ?? today();
        
        return self::whereDate('sale_date', $date)
            ->with(['items.product'])
            ->get()
            ->flatMap(function ($sale) {
                return $sale->items->map(function ($item) use ($sale) {
                    return [
                        'sale_id' => $sale->id,
                        'receipt_number' => $sale->receipt_number,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name ?? 'Produit supprimé',
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'subtotal' => $item->subtotal,
                        'sale_date' => $sale->sale_date,
                    ];
                });
            })
            ->groupBy('product_id')
            ->map(function ($items) {
                return [
                    'product_name' => $items->first()['product_name'],
                    'total_quantity' => $items->sum('quantity'),
                    'total_amount' => $items->sum('subtotal'),
                ];
            })
            ->values()
            ->toArray();
    }
}
