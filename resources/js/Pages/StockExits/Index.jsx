import { useState, useEffect, useRef } from 'react';
import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import SaleReceipt from '@/Components/SaleReceipt';

/** Montant d'une ligne : utilise subtotal (correct kg/carton), pas quantity×prix. */
function lineItemAmount(item) {
    if (item.subtotal != null && item.subtotal !== '') {
        return Number(item.subtotal);
    }
    const qty = item.input_quantity ?? item.quantity;
    return Number(qty) * Number(item.unit_price);
}

/** Total d'une vente : total_amount en base ou somme des lignes. */
function saleTotalAmount(sale) {
    if (sale?.total_amount != null && sale.total_amount !== '') {
        return Number(sale.total_amount);
    }
    return (sale?.items || []).reduce((sum, item) => sum + lineItemAmount(item), 0);
}

/** Quantité affichée (unité saisie, pas les kg stock). */
function formatLineQuantity(item) {
    if (item.input_quantity != null && item.input_unit) {
        return `${item.input_quantity} ${item.input_unit}`;
    }
    return String(item.quantity ?? '');
}

// =============================================================================
// SOUS-COMPOSANTS
// =============================================================================

/**
 * Composant Modal générique pour les détails de vente
 */
function SaleDetailModal({ sale, isOpen, onClose }) {
    if (!isOpen || !sale) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0) + ' FCFA';
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const items = sale.items || [];
    const productCount = items.length;

    const calculateTotal = () => saleTotalAmount(sale);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center gap-2">
                    <div>
                        <h2 className="text-lg font-bold">Détails de la Vente</h2>
                        <p className="text-sm text-indigo-200">Reçu: {sale.receipt_number}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-indigo-200 hover:text-white p-1"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {/* Sale Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-500">Date</p>
                            <p className="font-semibold text-slate-900">{formatDate(sale.sale_date)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-500">Client</p>
                            <p className="font-semibold text-slate-900">{sale.client?.name || '-'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-500">Caissier</p>
                            <p className="font-semibold text-slate-900">{sale.user?.name || '-'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-500">Statut</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sale.is_paid 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                            }`}>
                                {sale.is_paid ? 'Payée' : 'Crédit'}
                            </span>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">
                            Articles ({productCount})
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Produit</th>
                                        <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qté</th>
                                        <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Prix Unit.</th>
                                        <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-3 sm:px-4 py-3 text-sm text-slate-900">
                                                {item.product?.name || 'Produit supprimé'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">
                                                {formatLineQuantity(item)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                                                {formatCurrency(lineItemAmount(item))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                                            Total:
                                        </td>
                                        <td className="px-4 py-3 text-lg font-bold text-indigo-600 text-right">
                                            {formatCurrency(calculateTotal())}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Composant pour créer une nouvelle vente
 */
function NewSaleModal({ isOpen, onClose, onSuccess }) {
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState('kg');
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientInput, setClientInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredClients, setFilteredClients] = useState([]);
    const [isPaid, setIsPaid] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchClients();
            // Reset form when opening
            setClientInput('');
            setFilteredClients([]);
            setShowSuggestions(false);
        }
    }, [isOpen]);

    const handleClientInputChange = (e) => {
        const value = e.target.value;
        setClientInput(value);
        
        if (value.trim().length > 0) {
            const filtered = clients.filter(client =>
                client.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredClients(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredClients([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectClient = (client) => {
        setClientInput(client.name);
        setSelectedClient(client);
        setFilteredClients([]);
        setShowSuggestions(false);
    };

    const handleClearClient = () => {
        setClientInput('');
        setSelectedClient(null);
        setFilteredClients([]);
        setShowSuggestions(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products?per_page=100');
            setProducts(response.data.data || response.data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get('/api/clients?per_page=100');
            setClients(response.data.data || response.data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const addItem = () => {
        if (!selectedProduct || quantity < 1) return;
        
        const existingIndex = saleItems.findIndex(item => item.product_id === selectedProduct.id);
        const inputUnit = unit;
        const inputQty = Number(quantity) || 0;
        const unitPrice = inputUnit === 'carton'
            ? (Number(selectedProduct.price_per_carton) || 0)
            : (Number(selectedProduct.price_selling) || 0);
        const qtyKg = inputUnit === 'carton' && Number(selectedProduct.kg_per_carton) > 0
            ? inputQty * Number(selectedProduct.kg_per_carton)
            : inputQty;
        
        if (existingIndex >= 0) {
            const updated = [...saleItems];
            if ((updated[existingIndex].input_unit ?? 'kg') !== inputUnit) {
                setSaleItems([...saleItems, {
                    product_id: selectedProduct.id,
                    product: selectedProduct,
                    input_unit: inputUnit,
                    input_quantity: inputQty,
                    quantity: inputQty, // compat API
                    quantity_kg: qtyKg,
                    unit_price: unitPrice,
                    subtotal: inputQty * unitPrice,
                }]);
            } else {
                updated[existingIndex].input_quantity = (Number(updated[existingIndex].input_quantity) || 0) + inputQty;
                updated[existingIndex].quantity = updated[existingIndex].input_quantity; // compat API
                updated[existingIndex].quantity_kg = (Number(updated[existingIndex].quantity_kg) || 0) + qtyKg;
                updated[existingIndex].unit_price = unitPrice;
                updated[existingIndex].subtotal = updated[existingIndex].input_quantity * unitPrice;
                setSaleItems(updated);
            }
        } else {
            setSaleItems([...saleItems, {
                product_id: selectedProduct.id,
                product: selectedProduct,
                input_unit: inputUnit,
                input_quantity: inputQty,
                quantity: inputQty, // compat API
                quantity_kg: qtyKg,
                unit_price: unitPrice,
                subtotal: inputQty * unitPrice
            }]);
        }
        
        setSelectedProduct(null);
        setQuantity(1);
        setUnit('kg');
    };

    const removeItem = (index) => {
        const updated = saleItems.filter((_, i) => i !== index);
        setSaleItems(updated);
    };

    const calculateTotal = () => {
        return saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSale = async () => {
        if (saleItems.length === 0) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Check if client exists or create new one
            const matchedClient = clients.find(
                c => c.name.toLowerCase() === clientInput.trim().toLowerCase()
            );
            
            const saleData = {
                items: saleItems.map(item => ({
                    product_id: item.product_id,
                    input_unit: item.input_unit ?? 'kg',
                    input_quantity: item.input_quantity ?? item.quantity,
                    quantity: item.input_quantity ?? item.quantity, // compat
                    unit_price: item.unit_price
                })),
                is_paid: isPaid
            };
            
            if (matchedClient) {
                saleData.client_id = matchedClient.id;
            } else if (clientInput.trim()) {
                saleData.client_name = clientInput.trim();
            }
            
            const response = await axios.post('/api/sales', saleData);
            
            onSuccess(response.data.data);
            onClose();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la vente');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSaleItems([]);
        setSelectedProduct(null);
        setSelectedClient(null);
        setClientInput('');
        setFilteredClients([]);
        setShowSuggestions(false);
        setQuantity(1);
        setUnit('kg');
        setIsPaid(true);
        setError(null);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0) + ' FCFA';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center gap-2">
                    <h2 className="text-lg font-bold">Nouvelle Vente</h2>
                    <button onClick={onClose} className="text-indigo-200 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

{/* Client Selection */}
                    <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={clientInput}
                                onChange={handleClientInputChange}
                                onFocus={() => clientInput && filteredClients.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Tapez un nom de client existant ou nouveau..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {clientInput && (
                                <button
                                    type="button"
                                    onClick={handleClearClient}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {showSuggestions && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredClients.map((client) => (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center justify-between"
                                    >
                                        <span className="font-medium text-slate-900">{client.name}</span>
                                        <span className="text-xs text-green-600">Client existant</span>
                                    </button>
                                ))}
                                {filteredClients.length === 0 && clientInput && (
                                    <div className="px-4 py-2 text-sm text-blue-600">
                                        Nouveau client : "{clientInput}"
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <p className="text-xs text-slate-500 mt-1">
                            💡 Tapez un nom : si le client existe, il sera sélectionné automatiquement. Sinon, un nouveau client sera créé.
                        </p>
                    </div>

                    {/* Payment Status */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Statut du paiement</label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={isPaid}
                                    onChange={() => setIsPaid(true)}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">Payée</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!isPaid}
                                    onChange={() => setIsPaid(false)}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-slate-700">Crédit</span>
                            </label>
                        </div>
                    </div>

                    {/* Add Product */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Produit</label>
                            <select
                                value={selectedProduct?.id || ''}
                                onChange={(e) => {
                                    const product = products.find(p => p.id === parseInt(e.target.value));
                                    setSelectedProduct(product || null);
                                }}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Sélectionner</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({product.unit})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="kg">Kg</option>
                                <option value="carton">Carton</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex items-end sm:col-span-3">
                            <button
                                onClick={addItem}
                                disabled={!selectedProduct}
                                className="w-full min-h-[44px] px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>

                    {/* Sale Items */}
                    {saleItems.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-slate-900 mb-2">Articles</h3>
                            <div className="border border-slate-200 rounded-lg overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Produit</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Qté</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Prix</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Total</th>
                                            <th className="px-4 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {saleItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-sm">{item.product?.name}</td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    {item.input_quantity} {item.input_unit}
                                                    <div className="text-xs text-slate-500">→ {item.quantity_kg} kg</div>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-4 py-2 text-sm font-medium text-right">{formatCurrency(item.subtotal)}</td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Total à payer:</p>
                                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(calculateTotal())}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSale}
                        disabled={saleItems.length === 0 || loading}
                        className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                    >
                        {loading ? 'Traitement...' : 'Valider la vente'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function StockExitsIndex() {
    // -------------------------------------------------------------------------
    // STATES
    // -------------------------------------------------------------------------
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewSale, setShowNewSale] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [dailySummary, setDailySummary] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // -------------------------------------------------------------------------
    // EFFETS
    // -------------------------------------------------------------------------
    useEffect(() => {
        fetchSales();
        fetchDailySummary();
    }, []);

    // -------------------------------------------------------------------------
    // FONCTIONS API
    // -------------------------------------------------------------------------
    
    /**
     * Récupère toutes les ventes
     */
    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/sales?per_page=100');
            setSales(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Récupère le résumé journalier
     */
    const fetchDailySummary = async () => {
        try {
            const response = await axios.get('/api/sales/daily-summary');
            setDailySummary(response.data);
        } catch (error) {
            console.error('Error fetching daily summary:', error);
        }
    };

    /**
     * Supprime une vente et restaure le stock
     */
    const deleteSale = async (saleId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente?')) {
            return;
        }

        if (!confirm('Cette action supprimera également les articles et restaurera le stock. Continuer?')) {
            return;
        }

        try {
            setDeleteLoading(saleId);
            await axios.delete(`/api/sales/${saleId}`);
            
            // Rafraîchir les données
            await fetchSales();
            await fetchDailySummary();
            
            alert('Vente supprimée avec succès');
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteLoading(null);
        }
    };

    /**
     * Ouvre le modal des détails
     */
    const openDetailModal = (sale) => {
        setSelectedSale(sale);
        setShowDetailModal(true);
    };

    /**
     * Imprime le reçu d'une vente
     */
    const handlePrintReceipt = (sale) => {
        setSelectedSale(sale);
        setShowReceiptModal(true);
    };

    /**
     * Gère le succès d'une nouvelle vente
     */
    const handleNewSaleSuccess = (newSale) => {
        fetchSales();
        fetchDailySummary();
        setSelectedSale(newSale);
        setShowReceiptModal(true);
    };

    // -------------------------------------------------------------------------
    // FONCTIONS UTILITAIRES
    // -------------------------------------------------------------------------

    /**
     * Calcule le total d'une vente dynamiquement
     * @param {object} sale - L'objet sale
     * @returns {number} - Le total calculé
     */
    const calculateTotal = (sale) => saleTotalAmount(sale);

    /**
     * Compte le nombre de produits dans une vente
     * @param {object} sale - L'objet sale
     * @returns {number} - Le nombre de produits
     */
    const countProducts = (sale) => {
        return (sale.items || []).length;
    };

    /**
     * Formate le montant en devise
     */
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0) + ' FCFA';
    };

    /**
     * Formate la date
     */
    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // -------------------------------------------------------------------------
    // RENDU
    // -------------------------------------------------------------------------
    return (
        <ModernLayout title="Sorties de Stock / Ventes">
            <Head title="Ventes" />
            
            {/* En-tête avec bouton nouvelle vente */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ventes</h1>
                    <p className="text-slate-500">Gestion des sorties de stock et des ventes</p>
                </div>
                <button
                    onClick={() => setShowNewSale(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle Vente
                </button>
            </div>

            {/* Résumé journalier */}
            {dailySummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500">Ventes du jour</p>
                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(dailySummary.total_amount)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500">Transactions</p>
                        <p className="text-2xl font-bold text-slate-900">{dailySummary.transaction_count}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500">Top Produit</p>
                        {dailySummary.sales_by_product?.[0] ? (
                            <p className="text-lg font-bold text-green-600">{dailySummary.sales_by_product[0].product_name}</p>
                        ) : (
                            <p className="text-slate-400">-</p>
                        )}
                    </div>
                </div>
            )}

            {/* Tableau des ventes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Historique des ventes</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500">Chargement...</p>
                        </div>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>Aucune vente enregistrée</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">N° Reçu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Produits</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Statut</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-slate-900">{sale.receipt_number}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {formatDate(sale.sale_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {sale.client?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm">
                                                {countProducts(sale)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="font-bold text-indigo-600">
                                                {formatCurrency(calculateTotal(sale))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                sale.is_paid 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {sale.is_paid ? 'Payée' : 'Crédit'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handlePrintReceipt(sale)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    Imprimer
                                                </button>
                                                <button
                                                    onClick={() => openDetailModal(sale)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Voir
                                                </button>
                                                <button
                                                    onClick={() => deleteSale(sale.id)}
                                                    disabled={deleteLoading === sale.id}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    {deleteLoading === sale.id ? '...' : 'Supprimer'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Nouvelle Vente */}
            <NewSaleModal 
                isOpen={showNewSale} 
                onClose={() => setShowNewSale(false)} 
                onSuccess={handleNewSaleSuccess}
            />

            {/* Modal Détails Vente */}
            <SaleDetailModal 
                sale={selectedSale}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedSale(null);
                }}
            />

            {/* Modal Reçu de Vente */}
            <SaleReceipt 
                sale={selectedSale}
                isOpen={showReceiptModal}
                onClose={() => {
                    setShowReceiptModal(false);
                    setSelectedSale(null);
                }}
            />
        </ModernLayout>
    );
}

