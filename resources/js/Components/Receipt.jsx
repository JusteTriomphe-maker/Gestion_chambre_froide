import { useEffect, useRef, useState } from 'react';

export default function Receipt({ exit, isOpen, onClose }) {
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

    if (!isOpen || !exit) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const formatTime = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

// Check if it's a multi-product sale (has items array) or single product
    const isMultiProduct = exit.items && exit.items.length > 0;
    
    // Calculate items to display - ensure all values are numbers
    const displayItems = isMultiProduct 
        ? exit.items.map(item => ({
            name: item.product?.name || item.product_name || 'Produit',
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.subtotal) || (Number(item.quantity) * Number(item.unit_price)) || 0
        }))
        : [{
            name: exit.product?.name || 'Produit',
            quantity: Number(exit.quantity) || 0,
            unit_price: Number(exit.unit_price) || 0,
            total: (Number(exit.quantity) * Number(exit.unit_price)) || 0
        }];

    // Calculate grand total - ensure it's a number
    const grandTotal = displayItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    
    const receiptNumber = exit.receipt_number || `RCPT-${String(exit.id).padStart(6, '0')}`;

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-sm sm:max-w-md max-h-[90vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header - Fixed */}
                <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm sm:text-base font-bold">Reçu de Paiement</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Receipt Content - Scrollable */}
                <div ref={receiptRef} className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
                    {/* Company Header */}
                    <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-3">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">CHAMBRE FROIDE</h2>
                        <p className="text-xs sm:text-sm text-slate-600">Gestion de Stock</p>
                        <p className="text-sm sm:text-base font-semibold text-slate-800 mt-1">Brazzaville, Congo</p>
                        <p className="text-xs sm:text-sm text-slate-600">Tél: +242 06 000 00 00</p>
                    </div>

                    {/* Receipt Info */}
                    <div className="mb-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">N° Reçu:</span>
                            <span className="font-semibold text-slate-900">{receiptNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Date:</span>
                            <span className="text-slate-900">{formatDate(exit.sale_date || exit.exit_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Heure:</span>
                            <span className="text-slate-900">{formatTime(exit.created_at)}</span>
                        </div>
                        {exit.user && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Caissier(e):</span>
                                <span className="text-slate-900 font-medium">{exit.user.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-b border-dashed border-slate-300 my-2"></div>

                    {/* Products Table - Supports Multiple Items */}
                    <table className="w-full mb-2 text-xs sm:text-sm">
                        <thead>
                            <tr className="text-left text-slate-500 border-b border-slate-200">
                                <th className="pb-1 font-medium">Article</th>
                                <th className="pb-1 text-right font-medium">Qté</th>
                                <th className="pb-1 text-right font-medium">Prix</th>
                                <th className="pb-1 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, index) => (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="py-1.5">
                                        <div className="font-medium text-slate-900">{item.name}</div>
                                    </td>
                                    <td className="py-1.5 text-right text-slate-700">{item.quantity}</td>
                                    <td className="py-1.5 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-1.5 text-right font-medium text-slate-900">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-b border-dashed border-slate-300 my-2"></div>

                    {/* Total */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-900">TOTAL</span>
                        <span className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                    </div>

                    {/* Payment Status */}
                    {exit.is_paid !== undefined && (
                        <div className="mb-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                exit.is_paid 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {exit.is_paid ? 'PAID' : 'NON PAYÉ'}
                            </span>
                        </div>
                    )}

                    {/* Client Info */}
                    {exit.client && (
                        <div className="mb-2 p-2 bg-slate-50 rounded text-xs sm:text-sm">
                            <p className="font-medium text-slate-900">{exit.client.name}</p>
                            {exit.client.phone && <p className="text-slate-600">{exit.client.phone}</p>}
                        </div>
                    )}

                    {/* Reason */}
                    {exit.reason && (
                        <div className="mb-2 text-xs sm:text-sm">
                            <p className="text-slate-500">Motif:</p>
                            <p className="text-slate-700">{exit.reason}</p>
                        </div>
                    )}

                    {/* Notes */}
                    {exit.notes && (
                        <div className="mb-2 text-xs sm:text-sm">
                            <p className="text-slate-500">Notes:</p>
                            <p className="text-slate-700">{exit.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center border-t border-dashed border-slate-300 pt-2 mt-2">
                        <p className="text-xs text-slate-600">Merci pour votre confiance!</p>
                    </div>

                    {/* Signature Area */}
                    <div className="mt-4 pt-2 border-t border-dashed border-slate-300">
                        <div className="flex justify-between items-end">
                            <div className="text-center">
                                <div className="border-b border-slate-400 w-24 h-8 mb-1"></div>
                                <p className="text-xs text-slate-500">Signature Client</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-slate-400 w-24 h-8 mb-1 flex items-end justify-center">
                                    {exit.user && (
                                        <span className="text-xs text-slate-600 italic">
                                            {exit.user.name?.charAt(0).toUpperCase()}.
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">Signature Caissier(e)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions - Fixed at bottom */}
                <div className="px-3 py-2 sm:px-4 sm:py-3 bg-slate-50 flex gap-2 flex-shrink-0">
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm flex items-center justify-center gap-1"
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
