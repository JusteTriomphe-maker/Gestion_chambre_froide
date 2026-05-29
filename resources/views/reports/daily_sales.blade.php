@php
    $formatCurrency = fn ($value) => number_format((float) $value, 0, ',', ' ') . ' FCFA';
@endphp

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des ventes - {{ \Carbon\Carbon::parse($date)->format('d/m/Y') }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111827; }
        h1, h2 { margin: 0 0 10px 0; }
        .header { text-align: center; margin-bottom: 20px; }
        .subtitle { color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; }
        th { background-color: #f3f4f6; font-weight: 600; font-size: 11px; }
        tfoot td { font-weight: 700; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .badge-paid { display: inline-block; padding: 2px 6px; border-radius: 9999px; background: #dcfce7; color: #166534; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport des ventes journalières</h1>
        <div class="subtitle">
            Date : {{ \Carbon\Carbon::parse($date)->format('d/m/Y') }}
        </div>
    </div>

    <table>
        <thead>
        <tr>
            <th class="text-center">N° Reçu</th>
            <th>Date</th>
            <th>Client</th>
            <th>Caissier</th>
            <th class="text-center">Payée</th>
            <th class="text-right">Montant</th>
        </tr>
        </thead>
        <tbody>
        @forelse($sales as $sale)
            @php
                $saleTotal = $sale->items->sum(fn ($item) => (float) $item->subtotal);
            @endphp
            <tr>
                <td class="text-center">{{ $sale->receipt_number }}</td>
                <td>{{ optional($sale->sale_date)->format('d/m/Y') }}</td>
                <td>{{ optional($sale->client)->name ?? '-' }}</td>
                <td>{{ optional($sale->user)->name ?? '-' }}</td>
                <td class="text-center">{{ $sale->is_paid ? 'Oui' : 'Non' }}</td>
                <td class="text-right">{{ $formatCurrency($saleTotal) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="6" class="text-center">Aucune vente enregistrée pour cette date.</td>
            </tr>
        @endforelse
        </tbody>
        <tfoot>
        <tr>
            <td colspan="5" class="text-right">Total des ventes</td>
            <td class="text-right">{{ $formatCurrency($totalAmount) }}</td>
        </tr>
        </tfoot>
    </table>
</body>
</html>

