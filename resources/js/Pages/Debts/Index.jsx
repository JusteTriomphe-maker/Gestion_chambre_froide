import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function DebtsIndex() {
    const [clientDebts, setClientDebts] = useState([]);
    const [supplierDebts, setSupplierDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchDebts();
    }, [filter]);

    const getCsrfToken = () => {
        const token = document.head.querySelector('meta[name="csrf-token"]');
        return token ? token.content : '';
    };

    const fetchDebts = async () => {
        setLoading(true);
        try {
            // Fetch clients with debts
            const clientsRes = await fetch('/api/clients?per_page=100', {
                headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            });
            const clientsData = await clientsRes.json();
            
            // Fetch suppliers with debts
            const suppliersRes = await fetch('/api/suppliers?per_page=100', {
                headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            });
            const suppliersData = await suppliersRes.json();

            // Filter clients with debt (ensure amount is converted to number)
            const clientsWithDebt = (clientsData.data || []).filter(c => Number(c.total_debt) > 0).map(c => ({
                id: c.id,
                type: 'client',
                name: c.name,
                amount: Number(c.total_debt) || 0,
                date: c.updated_at,
            }));

            // Filter suppliers with debt (ensure amount is converted to number)
            const suppliersWithDebt = (suppliersData.data || []).filter(s => Number(s.total_debt) > 0).map(s => ({
                id: s.id,
                type: 'supplier',
                name: s.name,
                amount: Number(s.total_debt) || 0,
                date: s.updated_at,
            }));

            if (filter === 'all') {
                setClientDebts(clientsWithDebt);
                setSupplierDebts(suppliersWithDebt);
            } else if (filter === 'client') {
                setClientDebts(clientsWithDebt);
                setSupplierDebts([]);
            } else if (filter === 'supplier') {
                setClientDebts([]);
                setSupplierDebts(suppliersWithDebt);
            }
        } catch (error) {
            console.error('Error fetching debts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    // Calculate totals
    const totalClientDebt = clientDebts.reduce((sum, d) => sum + d.amount, 0);
    const totalSupplierDebt = supplierDebts.reduce((sum, d) => sum + d.amount, 0);
    const allDebts = [...clientDebts, ...supplierDebts];

    const filterButtons = [
        { key: 'all', label: 'Toutes', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { key: 'client', label: 'Clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { key: 'supplier', label: 'Fournisseurs', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    ];

    return (
        <ModernLayout title="Dettes">
            <Head title="Gestion des Dettes" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Gestion des Dettes</h1>
                <p className="text-slate-500 mt-1">Suivez et gérez les dettes clients et fournisseurs</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-6 shadow-lg shadow-red-500/25 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                    <div className="relative z-10">
                        <p className="text-red-100 font-medium mb-1">Total Dettes Clients</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalClientDebt)}</p>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 shadow-lg shadow-orange-500/25 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                    <div className="relative z-10">
                        <p className="text-orange-100 font-medium mb-1">Total Dettes Fournisseurs</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalSupplierDebt)}</p>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-6 shadow-lg shadow-slate-500/25 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                    <div className="relative z-10">
                        <p className="text-slate-300 font-medium mb-1">Total Dettes</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalClientDebt + totalSupplierDebt)}</p>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                {filterButtons.map((btn) => (
                    <button
                        key={btn.key}
                        onClick={() => setFilter(btn.key)}
                        className={`inline-flex items-center px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                            filter === btn.key
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={btn.icon} />
                        </svg>
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Debts Table */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client/Fournisseur</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : allDebts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-slate-500">Aucune dette trouvée</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                allDebts.map((debt) => (
                                    <tr key={`${debt.type}-${debt.id}`} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(debt.date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                debt.type === 'client' 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-violet-100 text-violet-700'
                                            }`}>
                                                {debt.type === 'client' ? 'Client' : 'Fournisseur'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                                                    debt.type === 'client' 
                                                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                                                        : 'bg-gradient-to-br from-violet-400 to-violet-600'
                                                }`}>
                                                    {debt.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">
                                                    {debt.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                            {formatCurrency(debt.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                                                En attente
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModernLayout>
    );
}
