<?php

namespace App\Support;

use App\Models\Product;
use InvalidArgumentException;

class StockUnit
{
    public const UNIT_KG = 'kg';
    public const UNIT_CARTON = 'carton';

    /**
     * Convert an input quantity into kilograms (stock truth).
     *
     * @return array{kg: float, conversion_rate: float|null}
     */
    public static function toKg(Product $product, string $inputUnit, float $inputQuantity): array
    {
        if ($inputQuantity <= 0) {
            throw new InvalidArgumentException('La quantité doit être supérieure à 0.');
        }

        $inputUnit = strtolower(trim($inputUnit));

        if ($inputUnit === self::UNIT_KG) {
            if (!$product->supportsKg()) {
                throw new InvalidArgumentException('Ce produit ne peut pas être géré au kilogramme.');
            }

            return ['kg' => $inputQuantity, 'conversion_rate' => null];
        }

        if ($inputUnit === self::UNIT_CARTON) {
            if (!$product->supportsCarton()) {
                throw new InvalidArgumentException('Ce produit ne peut pas être géré au carton.');
            }

            if (!$product->canConvertCartonToKg()) {
                throw new InvalidArgumentException('Conversion carton→kg impossible : kg par carton non défini.');
            }

            $rate = (float) $product->kg_per_carton;
            return ['kg' => $inputQuantity * $rate, 'conversion_rate' => $rate];
        }

        throw new InvalidArgumentException('Unité invalide. Utilisez "kg" ou "carton".');
    }

    public static function resolveUnitPrice(Product $product, string $inputUnit, ?float $provided = null): float
    {
        if ($provided !== null) {
            return (float) $provided;
        }

        return $product->priceForUnit($inputUnit);
    }
}

