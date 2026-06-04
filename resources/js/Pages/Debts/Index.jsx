import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DebtsIndex() {
    const [clientDebts, setClientDebts] = useState([]);
    const [supplierDebts, setSupplierDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Payment modal state
    const [showPayModal, setShowPayModal] = useState(false);
    const [payTarget, setPayTarget] = useState(null); // { id, type, name, amount }
    const [payAmount, setPayAmount] = useState('');
    const [payNotes, setPayNotes] = useState('');
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState('');
    const [paySuccess, setPaySuccess] = useState('');

    useEffect(() => {
        fetchDebts();
    }, [filter]);

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const [clientsRes, suppliersRes] = await Promise.all([
                axios.get('/api/clients?per_page=200'),
                axios.get('/api/suppliers?per_page=200'),
            ]);

            const clientsWithDebt = (clientsRes.data.data || [])
                .filter(c => Number(c.total_debt) > 0)
                .map(c => ({
                    id: c.id,
                    type: 'client',
                    name: c.name,
                    amount: Number(c.total_debt) || 0,
                    date: c.updated_at,
                }));

            const suppliersWithDebt = (suppliersRes.data.data || [])
                .filter(s => Number(s.total_debt) > 0)
                .map(s => ({
                    id: s.id,
                    type: 'supplier',
                    name: s.name,
                    amount: Number(s.total_debt) || 0,
                    date: s.updated_at,
                }));

            if (filter === 'client') {
                setClientDebts(clientsWithDebt);
                setSupplierDebts([]);
            } else if (filter === 'supplier') {
                setClientDebts([]);
                setSupplierDebts(suppliersWithDebt);
            } else {
                setClientDebts(clientsWithDebt);
                setSupplierDebts(suppliersWithDebt);
            }
        } catch (error) {
            console.error('Error fetching debts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const totalClientDebt = clientDebts.reduce((sum, d) => sum + d.amount, 0);
    const totalSupplierDebt = supplierDebts.reduce((sum, d) => sum + d.amount, 0);
    const allDebts = [...clientDebts, ...supplierDebts];

    // --- Payment modal ---
    const openPayModal = (debt) => {
        setPayTarget(debt);
        setPayAmount(debt.amount.toFixed(0));
        setPayNotes('');
        setPayError('');
        setPaySuccess('');
        setShowPayModal(true);
    };

    const closePayModal = () => {
        setShowPayModal(false);
        setPayTarget(null);
        setPayAmount('');
        setPayNotes('');
        setPayError('');
        setPaySuccess('');
    };

    const handlePay = async () => {
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0) {
            setPayError('Veuillez saisir un montant valide.');
            return;
        }
        if (amount > payTarget.amount) {
            setPayError(`Le montant ne peut pas dépasser la dette de ${formatCurrency(payTarget.amount)}.`);
            return;
        }

        setPaying(true);
        setPayError('');
        try {
            const endpoint = payTarget.type === 'client'
                ? `/api/clients/${payTarget.id}/pay`
                : `/api/suppliers/${payTarget.id}/pay`;

            await axios.post(endpoint, {
                amount,
                notes: payNotes || undefined,
            });

            const remaining = payTarget.amount - amount;
            setPaySuccess(
                remaining <= 0
                    ? `✅ Dette de ${payTarget.name} soldée intégralement !`
                    : `✅ Paiement enregistré. Reste : ${formatCurrency(remaining)}`
            );
            await fetchDebts();
            // Auto-close after 2s if fully paid
            if (remaining <= 0) {
                setTimeout(() => closePayModal(), 2000);
            } else {
                // Update remaining amount in modal
                setPayTarget(prev => ({ ...prev, amount: remaining }));
                setPayAmount('');
            }
        } catch (error) {
            setPayError(error.response?.data?.message || 'Erreur lors du paiement.');
        } finally {
            setPaying(false);
        }
    };

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
                <p className="text-slate-500 mt-1">Suivez et réglez les dettes clients et fournisseurs</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-lg shadow-blue-500/25 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                    <div className="relative z-10">
                        <p className="text-blue-100 font-medium mb-1">Dettes Clients (à encaisser)</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalClientDebt)}</p>
                        <p className="text-blue-200 text-sm mt-1">{clientDebts.length} client(s) en attente</p>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 shadow-lg shadow-orange-500/25 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                    <div className="relative z-10">
                        <p className="text-orange-100 font-medium mb-1">Dettes Fournisseurs (à payer)</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalSupplierDebt)}</p>
                        <p className="text-orange-200 text-sm mt-1">{supplierDebts.length} fournisseur(s) en attente</p>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-6 shadow-lg shadow-slate-500/25 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                    <div className="relative z-10">
                        <p className="text-slate-300 font-medium mb-1">Position Nette</p>
                        <p className={`text-3xl font-bold ${totalClientDebt - totalSupplierDebt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(totalClientDebt - totalSupplierDebt)}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {totalClientDebt - totalSupplierDebt >= 0 ? 'Vous êtes créditeur' : 'Vous êtes débiteur'}
                        </p>
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Montant dû</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mise à jour</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : allDebts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-slate-500 font-medium">Aucune dette en attente</span>
                                            <span className="text-slate-400 text-sm">Toutes les dettes sont réglées 🎉</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                allDebts.map((debt) => (
                                    <tr key={`${debt.type}-${debt.id}`} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                debt.type === 'client'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-violet-100 text-violet-700'
                                            }`}>
                                                {debt.type === 'client' ? '👤 Client' : '🏭 Fournisseur'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                    debt.type === 'client'
                                                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                                        : 'bg-gradient-to-br from-violet-400 to-violet-600'
                                                }`}>
                                                    {debt.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900">{debt.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-base font-bold text-red-600">{formatCurrency(debt.amount)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatDate(debt.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                                                En attente
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openPayModal(debt)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                Payer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayModal && payTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closePayModal}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className={`px-6 py-5 text-white ${
                            payTarget.type === 'client'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-700'
                                : 'bg-gradient-to-r from-violet-500 to-violet-700'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {payTarget.type === 'client' ? '💰 Encaisser un paiement' : '💸 Payer le fournisseur'}
                                    </h3>
                                    <p className="text-white/80 text-sm mt-0.5">{payTarget.name}</p>
                                </div>
                                <button
                                    onClick={closePayModal}
                                    className="text-white/70 hover:text-white transition"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Debt summary */}
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <p className="text-sm text-red-600 font-medium">Montant total dû</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(payTarget.amount)}</p>
                            </div>

                            {/* Amount input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Montant à {payTarget.type === 'client' ? 'encaisser' : 'payer'} (FCFA)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max={payTarget.amount}
                                        value={payAmount}
                                        onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPayAmount(payTarget.amount.toFixed(0))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-200 transition"
                                    >
                                        Tout
                                    </button>
                                </div>
                                {parseFloat(payAmount) > 0 && parseFloat(payAmount) < payTarget.amount && (
                                    <p className="text-xs text-amber-600 mt-1.5">
                                        ⚠️ Paiement partiel — restera : {formatCurrency(payTarget.amount - parseFloat(payAmount || 0))}
                                    </p>
                                )}
                                {parseFloat(payAmount) >= payTarget.amount && (
                                    <p className="text-xs text-emerald-600 mt-1.5">
                                        ✅ Paiement intégral — la dette sera soldée
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Note (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={payNotes}
                                    onChange={(e) => setPayNotes(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                    placeholder="Ex: Paiement en espèces..."
                                />
                            </div>

                            {/* Error / Success */}
                            {payError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
                                    ❌ {payError}
                                </div>
                            )}
                            {paySuccess && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
                                    {paySuccess}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={closePayModal}
                                className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handlePay}
                                disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                                className="flex-1 min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                            >
                                {paying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Confirmer le paiement
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
