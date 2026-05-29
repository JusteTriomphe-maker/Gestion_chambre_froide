import { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import SaleReceipt from '@/Components/SaleReceipt';
import axios from 'axios';
import { usePermissions } from '@/Hooks/usePermissions';

export default function SalesIndex() {
    const page = usePage();
    const roleFromPage = page?.props?.auth?.user?.role;
    const { isDG: isDGApi, isGerant: isGerantApi } = usePermissions();
    const isDG = roleFromPage ? roleFromPage === 'dg' : isDGApi;
    const isGerant = roleFromPage ? roleFromPage === 'gerant' : isGerantApi;
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [dailySummary, setDailySummary] = useState(null);
    const [showNewSale, setShowNewSale] = useState(false);
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState('kg');
    const [saving, setSaving] = useState(false);
    const [isPaid, setIsPaid] = useState(true);
    
    const [clientInput, setClientInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredClients, setFilteredClients] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchSales();
        fetchDailySummary();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await axios.get('/api/sales');
            setSales(response.data.data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailySummary = async () => {
        try {
            const response = await axios.get('/api/sales/daily-summary');
            setDailySummary(response.data);
        } catch (error) {
            console.error('Error fetching daily summary:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products');
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get('/api/clients');
            setClients(response.data.data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const openNewSale = () => {
        setSaleItems([]);
        setClientInput('');
        setFilteredClients([]);
        setShowSuggestions(false);
        setIsPaid(true);
        fetchProducts();
        fetchClients();
        setShowNewSale(true);
    };

    const getSellingPriceKg = (product) => Number(product?.price_selling ?? 0);
    const getSellingPriceCarton = (product) => Number(product?.price_per_carton ?? 0);

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
        setFilteredClients([]);
        setShowSuggestions(false);
    };

    const handleClearClient = () => {
        setClientInput('');
        setFilteredClients([]);
        setShowSuggestions(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const addItem = () => {
        if (!selectedProduct || quantity < 1) return;
        
        const existingIndex = saleItems.findIndex(item => item.product_id === selectedProduct.id);
        const inputUnit = unit;
        const inputQty = Number(quantity) || 0;
        const unitPrice = inputUnit === 'carton' ? getSellingPriceCarton(selectedProduct) : getSellingPriceKg(selectedProduct);
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
                subtotal: inputQty * unitPrice,
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

    const getTotal = () => {
        return saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSale = async () => {
        if (saleItems.length === 0) return;
        
        setSaving(true);
        try {
            const saleData = {
                items: saleItems.map(item => ({
                    product_id: item.product_id,
                    input_unit: item.input_unit ?? 'kg',
                    input_quantity: item.input_quantity ?? item.quantity,
                    quantity: item.input_quantity ?? item.quantity, // compat
                    unit_price: item.unit_price,
                })),
                is_paid: isPaid,
            };
            
            const matchedClient = clients.find(
                c => c.name.toLowerCase() === clientInput.trim().toLowerCase()
            );
            
            if (matchedClient) {
                saleData.client_id = matchedClient.id;
            } else if (clientInput.trim()) {
                saleData.client_name = clientInput.trim();
            }
            
            const response = await axios.post('/api/sales', saleData);
            
            setShowNewSale(false);
            setSaleItems([]);
            setClientInput('');
            fetchSales();
            fetchDailySummary();
            setSelectedSale(response.data.data);
            setShowReceipt(true);
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de la vente');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    return (
        <ModernLayout title="Ventes">
            <Head title="Ventes" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des Ventes</h1>
                        <div className="flex items-center gap-3">
                            {(isDG || isGerant) && (
                                <a
                                    href="/sales/daily-report"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8m2-9h4a2 2 0 012 2v1H8V5a2 2 0 012-2zm-4 5h8v9a2 2 0 01-2 2H8a2 2 0 01-2-2v-9z" />
                                    </svg>
                                    Imprimer rapport journalier
                                </a>
                            )}
                            <button
                                onClick={openNewSale}
                                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nouvelle Vente
                            </button>
                        </div>
                    </div>

                    {dailySummary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white overflow-hidden shadow-lg rounded-lg p-6 border-l-4 border-red-600">
                                <p className="text-sm text-gray-500">Ventes du jour</p>
                                <p className="text-2xl font-bold text-red-700">{formatCurrency(dailySummary.total_amount)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {dailySummary.date}
                                    {dailySummary.paid_amount != null && dailySummary.paid_amount !== dailySummary.total_amount && (
                                        <span className="block">dont payé : {formatCurrency(dailySummary.paid_amount)}</span>
                                    )}
                                </p>
                            </div>
                            <div className="bg-white overflow-hidden shadow-lg rounded-lg p-6 border-l-4 border-blue-600">
                                <p className="text-sm text-gray-500">Nombre de transactions</p>
                                <p className="text-2xl font-bold text-blue-700">{dailySummary.transaction_count}</p>
                            </div>
                            <div className="bg-white overflow-hidden shadow-lg rounded-lg p-6 border-l-4 border-green-600">
                                <p className="text-sm text-gray-500">Top Produit</p>
                                {dailySummary.sales_by_product?.[0] && (
                                    <p className="text-lg font-bold text-green-700">{dailySummary.sales_by_product[0].product_name}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-lg rounded-lg">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des ventes</h2>
                            
                            {loading ? (
                                <p className="text-center text-gray-500">Chargement...</p>
                            ) : sales.length === 0 ? (
                                <p className="text-center text-gray-500">Aucune vente enregistrée</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Reçu</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caissier</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{sale.receipt_number}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(sale.sale_date)}</td>
<td className="px-6 py-4 whitespace-nowrap text-gray-500">{sale.client?.name || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{sale.user?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">{formatCurrency(sale.total_amount)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSale(sale);
                                                                setShowReceipt(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        >
                                                            Voir reçu
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showNewSale && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNewSale(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
                        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-red-700 text-white flex justify-between items-center gap-2">
                            <h2 className="text-lg font-bold">Nouvelle Vente</h2>
                            <button onClick={() => setShowNewSale(false)} className="text-red-200 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="mb-4 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={clientInput}
                                        onChange={handleClientInputChange}
                                        onFocus={() => clientInput && filteredClients.length > 0 && setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Tapez un nom de client existant ou nouveau..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                    {clientInput && (
                                        <button
                                            type="button"
                                            onClick={handleClearClient}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                
                                {showSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filteredClients.map((client) => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => handleSelectClient(client)}
                                                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center justify-between"
                                            >
                                                <span className="font-medium text-gray-900">{client.name}</span>
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
                                
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Tapez un nom : si le client existe, il sera sélectionné automatiquement. Sinon, un nouveau client sera créé.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Statut du paiement</label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={isPaid}
                                            onChange={() => setIsPaid(true)}
                                            className="w-4 h-4 text-red-600"
                                        />
                                        <span className="text-sm text-gray-700">Payée</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isPaid}
                                            onChange={() => setIsPaid(false)}
                                            className="w-4 h-4 text-red-600"
                                        />
                                        <span className="text-sm text-gray-700">Crédit (dette client)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
                                    <select
                                        value={selectedProduct?.id || ''}
                                        onChange={(e) => {
                                            const product = products.find(p => p.id === parseInt(e.target.value));
                                            setSelectedProduct(product);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {formatCurrency(product.price_selling)} /kg {product.price_per_carton ? ` - ${formatCurrency(product.price_per_carton)} /carton` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="kg">Kg</option>
                                        <option value="carton">Carton</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div className="flex items-end sm:col-span-3">
                                    <button
                                        onClick={addItem}
                                        disabled={!selectedProduct}
                                        className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </div>

                            {saleItems.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Articles</h3>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qté</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Prix</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {saleItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2">{item.product?.name}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        {item.input_quantity} {item.input_unit}
                                                        <div className="text-xs text-gray-500">→ {item.quantity_kg} kg</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                                                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-600 hover:text-red-800"
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
                                            <p className="text-sm text-gray-500">Total à payer:</p>
                                            <p className="text-2xl font-bold text-red-700">{formatCurrency(getTotal())}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4">
                            <button
                                onClick={() => setShowNewSale(false)}
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSale}
                                disabled={saleItems.length === 0 || saving}
                                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:bg-gray-300"
                            >
                                {saving ? 'Traitement...' : 'Valider la vente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReceipt && selectedSale && (
                <SaleReceipt
                    sale={selectedSale}
                    isOpen={showReceipt}
                    onClose={() => {
                        setShowReceipt(false);
                        setSelectedSale(null);
                    }}
                />
            )}
        </ModernLayout>
    );
}

