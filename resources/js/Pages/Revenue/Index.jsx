import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function RevenueIndex() {
    const [dateHistory, setDateHistory] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateSales, setSelectedDateSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState(null);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [category, setCategory] = useState('all');

    useEffect(() => {
        fetchTodayRevenue();
        fetchDateHistory();
    }, [category]);

    const fetchTodayRevenue = async () => {
        try {
            const response = await axios.get('/api/dashboard/today-revenue');
            setTodayRevenue(Number(response.data.today_revenue) || 0);
        } catch (err) {
            console.error('Error fetching today revenue:', err);
            setTodayRevenue(0);
        }
    };

    const fetchDateHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (category && category !== 'all') {
                params.category = category;
            }
            
            const response = await axios.get('/api/revenue/history', { params });
            const historyData = response.data.history || [];
            
            setDateHistory(historyData);
            
            const today = new Date().toISOString().split('T')[0];
            const todayData = historyData.find(h => h.date === today);
            
            if (todayData) {
                setSelectedDate(today);
                fetchDateDetail(today);
            } else if (historyData.length > 0) {
                setSelectedDate(historyData[0].date);
                fetchDateDetail(historyData[0].date);
            } else {
                setSelectedDate(null);
                setSelectedDateSales([]);
            }
        } catch (err) {
            console.error('Error fetching revenue history:', err);
            setError('Erreur lors du chargement de l\'historique');
            setDateHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDateDetail = async (date) => {
        setLoadingDetail(true);
        try {
            const response = await axios.get(`/api/revenue/by-date?date=${date}`);
            const salesData = response.data.sales || [];
            setSelectedDateSales(salesData);
        } catch (err) {
            console.error('Error fetching date detail:', err);
            setSelectedDateSales([]);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleDateClick = useCallback((date) => {
        setSelectedDate(date);
        fetchDateDetail(date);
    }, []);

    const handleCategoryChange = useCallback((newCategory) => {
        setCategory(newCategory);
    }, []);

    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    /** Montant ligne : subtotal en base (correct kg/carton), pas quantity×prix. */
    const lineAmount = (row) => {
        if (row.subtotal != null && row.subtotal !== '') {
            return Number(row.subtotal);
        }
        const qty = row.input_quantity ?? row.quantity;
        return (Number(qty) || 0) * (Number(row.unit_price) || 0);
    };

    const formatLineQuantity = (row) => {
        if (row.input_quantity != null && row.input_unit) {
            return `${row.input_quantity} ${row.input_unit}`;
        }
        return `${Number(row.quantity || 0).toFixed(2)} kg`;
    };

    const calculateTotal = (items) => {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + lineAmount(item), 0);
    };

    const getSelectedDateTotal = () => {
        return calculateTotal(selectedDateSales);
    };

    const getSortedSales = () => {
        if (!Array.isArray(selectedDateSales)) return [];
        return [...selectedDateSales].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });
    };

    if (loading) {
        return (
            <ModernLayout title="Chiffre d'Affaires">
                <Head title="Chiffre d'Affaires" />
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500">Chargement...</p>
                    </div>
                </div>
            </ModernLayout>
        );
    }

    return (
        <ModernLayout title="Chiffre d'Affaires">
            <Head title="Chiffre d'Affaires" />
            
            <div className="space-y-6">
                {/* Today's Revenue Card */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-emerald-100 font-medium">Chiffre d'Affaires du Jour</p>
                            <p className="text-4xl font-bold text-white mt-1">
                                {formatCurrency(todayRevenue)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 rounded-lg px-4 py-2">
                                <span className="text-emerald-100 text-sm">Aujourd'hui</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-slate-700">Filtrer par catégorie:</label>
                        <select
                            value={category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="all">Toutes les catégories</option>
                            <option value="viandes">Viandes</option>
                            <option value="poissons">Poissons</option>
                            <option value="produits_laitiers">Produits laitiers</option>
                            <option value="surgeles">Surgelés</option>
                            <option value="autres">Autres</option>
                        </select>
                    </div>
                </div>

                {/* Historique des dates */}
                <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Historique des jours
                        </h3>
                    </div>

                    {error && (
                        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {dateHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Date</th>
                                        <th className="text-right py-4 px-6 text-sm font-semibold text-slate-600">Total</th>
                                        <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">Transactions</th>
                                        <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dateHistory.map((item, index) => (
                                        <tr 
                                            key={index} 
                                            className={`border-b border-slate-100 cursor-pointer transition-colors ${
                                                selectedDate === item.date 
                                                    ? 'bg-indigo-50 hover:bg-indigo-100' 
                                                    : 'hover:bg-slate-50'
                                            }`}
                                            onClick={() => handleDateClick(item.date)}
                                        >
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {formatDate(item.date)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-semibold text-indigo-600">
                                                    {formatCurrency(item.total)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    {item.transaction_count || 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                    Voir détail
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-slate-500 text-lg">Aucune vente payée pour cette période</p>
                            <p className="text-slate-400 text-sm mt-2">Le chiffre d'affaires ne inclut que les ventes payées (is_paid = true)</p>
                        </div>
                    )}
                </div>

                {/* Détail de la date sélectionnée */}
                {selectedDate && (
                    <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-500 to-purple-600">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-indigo-100 font-medium">{formatFullDate(selectedDate)}</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {formatCurrency(getSelectedDateTotal())}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className="text-indigo-100">Détail des ventes du jour</span>
                                </div>
                            </div>
                        </div>

                        {loadingDetail ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : getSortedSales().length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Reçu</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Produit</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-600">Quantité</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-600">Prix Unit.</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-600">Total</th>
                                            <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">Heure</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getSortedSales().map((sale, index) => (
                                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                        {sale.receipt_number || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {sale.product?.name || 'Produit'}
                                                            </p>
                                                            {sale.product?.category && (
                                                                <p className="text-xs text-slate-500">{sale.product.category}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm text-slate-900 font-medium">
                                                    {formatLineQuantity(sale)}
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm text-slate-600">
                                                    {formatCurrency(sale.unit_price)}
                                                    {sale.input_unit && (
                                                        <span className="block text-xs text-slate-400">/ {sale.input_unit}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm font-semibold text-indigo-600">
                                                    {formatCurrency(lineAmount(sale))}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                        {formatTime(sale.created_at)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan="4" className="py-4 px-6 text-right text-sm font-semibold text-slate-600">
                                                TOTAL
                                            </td>
                                            <td className="py-4 px-6 text-right text-lg font-bold text-indigo-600">
                                                {formatCurrency(getSelectedDateTotal())}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-slate-500 text-lg">Aucune vente payée pour cette date</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ModernLayout>
    );
}

