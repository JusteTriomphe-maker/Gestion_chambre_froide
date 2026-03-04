import { useEffect, useRef, useState } from 'react';

export default function SaleReceipt({ sale, isOpen, onClose }) {
    const receiptRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (isOpen && !isPrinting) {
            setTimeout(() => {
                if (receiptRef.current) {
                    window.print();
                }
            }, 500);
        }
    }, [isOpen, isPrinting]);

    if (!isOpen || !sale) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR');
    };

    const formatTime = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('fr-FR');
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    const cashierName = sale.user?.name || 'Caissier';
    const clientName = sale.client?.name || 'Vente comptoir';
    const items = sale.items || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-sm sm:max-w-md max-h-[90vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-red-800 to-red-700 text-white flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm sm:text-base font-bold">🧾 Reçu de Vente</h3>
                        <button
                            onClick={onClose}
                            className="text-red-200 hover:text-white p-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Receipt Content - Scrollable */}
                <div ref={receiptRef} className="flex-1 overflow-y-auto p-4 bg-white text-sm">
                    {/* Company Header */}
                    <div className="text-center border-b-2 border-dashed border-red-300 pb-3 mb-3">
                        <h2 className="text-lg font-bold text-red-900">BOUCHERIE LA FRAÎCHEUR</h2>
                        <p className="text-xs text-red-700">Adresse : Marché Total, Tchilou, Congo</p>
                        <p className="text-xs text-red-700">Tél : +242 06 000 00 00</p>
                    </div>

                    {/* Receipt Info */}
                    <div className="mb-3 text-xs">
                        <div className="flex justify-between">
                            <span className="text-red-800">N° Reçu :</span>
                            <span className="font-bold text-red-900">{sale.receipt_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-800">Date :</span>
                            <span className="text-red-900">{formatDate(sale.sale_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-800">Heure :</span>
                            <span className="text-red-900">{formatTime(sale.created_at)}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-red-300 my-2"></div>

                    {/* Cashier & Client */}
                    <div className="mb-3 text-xs">
                        <p><span className="text-red-800">Caissière :</span> <span className="font-medium text-red-900">{cashierName}</span></p>
                        <p><span className="text-red-800">Client :</span> <span className="font-medium text-red-900">{clientName}</span></p>
                    </div>

                    <div className="border-b border-dashed border-red-300 my-2"></div>

                    {/* Products Table Header */}
                    <div className="mb-2">
                        <p className="text-center text-xs font-bold text-red-900 mb-2">🥩 Détail des articles</p>
                    </div>

                    {/* Products Table */}
                    <table className="w-full mb-3 text-xs">
                        <thead>
                            <tr className="text-left text-red-800 border-b border-red-200">
                                <th className="pb-1 font-semibold">Produit</th>
                                <th className="pb-1 text-right font-semibold">Qté</th>
                                <th className="pb-1 text-right font-semibold">Prix U.</th>
                                <th className="pb-1 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-dotted border-red-100">
                                    <td className="py-1 text-red-900">
                                        <div>{item.product?.name || 'Produit'}</div>
                                        {item.product?.unit && (
                                            <div className="text-xs text-red-600">{item.product.unit}</div>
                                        )}
                                    </td>
                                    <td className="py-1 text-right text-red-900">{item.quantity}</td>
                                    <td className="py-1 text-right text-red-900">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-1 text-right text-red-900 font-medium">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-b border-dashed border-red-300 my-2"></div>

                    {/* Totals */}
                    <div className="mb-3 text-xs">
                        <div className="flex justify-between mb-1">
                            <span className="text-red-800">Sous-total :</span>
                            <span className="text-red-900">{formatCurrency(sale.total_amount)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="text-red-800">Remise :</span>
                            <span className="text-red-900">0 FCFA</span>
                        </div>
                        <div className="flex justify-between border-t border-red-200 pt-1">
                            <span className="font-bold text-red-900">Total à payer :</span>
                            <span className="font-bold text-lg text-red-700">{formatCurrency(sale.total_amount)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-3 text-xs">
                        <p><span className="text-red-800">Mode de paiement :</span> <span className="font-medium text-red-900">Espèces</span></p>
                    </div>

                    {/* Signature */}
                    <div className="mb-3 pt-4">
                        <p className="text-xs text-red-800">Signature caissière : _______________</p>
                    </div>

                    {/* Footer */}
                    <div className="text-center border-t border-dashed border-red-300 pt-3 mt-3">
                        <p className="text-sm text-red-900 font-medium">Merci pour votre confiance 🙏</p>
                        <p className="text-xs text-red-700 mt-1">Tout produit alimentaire vendu n'est pas remboursable</p>
                    </div>
                </div>

                {/* Actions - Fixed at bottom */}
                <div className="px-3 py-2 sm:px-4 sm:py-3 bg-slate-50 flex gap-2 flex-shrink-0">
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-3 py-2 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition text-xs sm:text-sm flex items-center justify-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimer
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition text-xs sm:text-sm"
                    >
                        Fermer
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .fixed, .fixed * { visibility: visible; }
                    .fixed {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                    }
                    button, .fixed > div:first-child { display: none !important; }
                    .overflow-y-auto { overflow: visible !important; }
                }
            `}</style>
        </div>
    );
}
