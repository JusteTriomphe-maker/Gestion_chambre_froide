import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/* ------------------------------------------------------------------ */
/*  Icones inline (pas d'emoji pour eviter les bugs de rendu)          */
/* ------------------------------------------------------------------ */
const IconClient = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const IconSupplier = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);
const IconWallet = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
const Spinner = () => (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

/* ------------------------------------------------------------------ */
/*  Page principale                                                    */
/* ------------------------------------------------------------------ */
export default function DebtsIndex() {
    const [clientDebts, setClientDebts]   = useState([]);
    const [supplierDebts, setSupplierDebts] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [filter, setFilter]             = useState('all');

    // Payment modal
    const [payTarget, setPayTarget]   = useState(null);
    const [payAmount, setPayAmount]   = useState('');
    const [payNotes, setPayNotes]     = useState('');
    const [paying, setPaying]         = useState(false);
    const [payError, setPayError]     = useState('');
    const [paySuccess, setPaySuccess] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { fetchDebts(); }, [filter]);

    /* ---- Fetch ---- */
    const fetchDebts = async () => {
        setLoading(true);
        try {
            const [cr, sr] = await Promise.all([
                axios.get('/api/clients?per_page=500'),
                axios.get('/api/suppliers?per_page=500'),
            ]);

            const cd = (cr.data.data || [])
                .filter(c => Number(c.total_debt) > 0)
                .map(c => ({ id: c.id, type: 'client',   name: c.name, amount: Number(c.total_debt), date: c.updated_at }));

            const sd = (sr.data.data || [])
                .filter(s => Number(s.total_debt) > 0)
                .map(s => ({ id: s.id, type: 'supplier', name: s.name, amount: Number(s.total_debt), date: s.updated_at }));

            setClientDebts(filter === 'supplier' ? [] : cd);
            setSupplierDebts(filter === 'client'  ? [] : sd);
        } catch (e) {
            console.error('Fetch debts error:', e);
        } finally {
            setLoading(false);
        }
    };

    /* ---- Helpers ---- */
    const fmt  = v  => new Intl.NumberFormat('fr-FR').format(v || 0) + ' FCFA';
    const fmtD = dt => dt ? new Date(dt).toLocaleDateString('fr-FR') : '-';

    const totalClient   = clientDebts.reduce((s, d) => s + d.amount, 0);
    const totalSupplier = supplierDebts.reduce((s, d) => s + d.amount, 0);
    const allDebts      = [...clientDebts, ...supplierDebts];

    /* ---- Modal ---- */
    const openModal = (debt) => {
        setPayTarget(debt);
        setPayAmount(String(Math.round(debt.amount)));
        setPayNotes('');
        setPayError('');
        setPaySuccess('');
        setTimeout(() => inputRef.current?.focus(), 80);
    };

    const closeModal = () => {
        if (paying) return;          // empecher fermeture pendant traitement
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
        if (amount > payTarget.amount + 0.01) {
            setPayError(`Maximum autorise : ${fmt(payTarget.amount)}`);
            return;
        }

        setPaying(true);
        setPayError('');
        setPaySuccess('');

        try {
            const url = payTarget.type === 'client'
                ? `/api/clients/${payTarget.id}/pay`
                : `/api/suppliers/${payTarget.id}/pay`;

            const res = await axios.post(url, {
                amount,
                notes: payNotes || undefined,
            });

            const remaining = Math.max(0, payTarget.amount - amount);

            if (remaining <= 0) {
                setPaySuccess('Dette soldee integralement ! La page va se mettre a jour...');
                await fetchDebts();
                setTimeout(() => closeModal(), 1800);
            } else {
                setPaySuccess(`Paiement enregistre. Reste : ${fmt(remaining)}`);
                setPayTarget(prev => ({ ...prev, amount: remaining }));
                setPayAmount('');
                await fetchDebts();
            }
        } catch (err) {
            setPayError(err.response?.data?.message || 'Erreur lors du paiement. Reessayez.');
        } finally {
            setPaying(false);
        }
    };

    /* ---- Render ---- */
    const filterBtns = [
        { key: 'all',      label: 'Toutes',        icon: <IconClient /> },
        { key: 'client',   label: 'Clients',        icon: <IconClient /> },
        { key: 'supplier', label: 'Fournisseurs',   icon: <IconSupplier /> },
    ];

    return (
        <ModernLayout title="Dettes">
            <Head title="Gestion des Dettes" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Gestion des Dettes</h1>
                <p className="text-slate-500 mt-1">Reglez les dettes clients et fournisseurs</p>
            </div>

            {/* Cartes recap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Clients */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg">
                    <p className="text-blue-100 font-medium mb-1">A encaisser (clients)</p>
                    <p className="text-3xl font-bold">{fmt(totalClient)}</p>
                    <p className="text-blue-200 text-sm mt-1">{clientDebts.length} client(s)</p>
                </div>
                {/* Fournisseurs */}
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white shadow-lg">
                    <p className="text-orange-100 font-medium mb-1">A payer (fournisseurs)</p>
                    <p className="text-3xl font-bold">{fmt(totalSupplier)}</p>
                    <p className="text-orange-200 text-sm mt-1">{supplierDebts.length} fournisseur(s)</p>
                </div>
                {/* Position nette */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-6 text-white shadow-lg">
                    <p className="text-slate-300 font-medium mb-1">Position nette</p>
                    <p className={`text-3xl font-bold ${totalClient - totalSupplier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmt(totalClient - totalSupplier)}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                        {totalClient - totalSupplier >= 0 ? 'Vous etes crediteur' : 'Vous etes debiteur'}
                    </p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                {filterBtns.map(btn => (
                    <button key={btn.key} onClick={() => setFilter(btn.key)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                            filter === btn.key
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}>
                        {btn.icon}{btn.label}
                    </button>
                ))}
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Type', 'Nom', 'Montant du', 'Mise a jour', 'Statut', 'Action'].map(h => (
                                    <th key={h} className={`px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${h === 'Action' ? 'text-right' : 'text-left'}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="py-12 text-center">
                                    <div className="flex justify-center items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-slate-500">Chargement...</span>
                                    </div>
                                </td></tr>
                            ) : allDebts.length === 0 ? (
                                <tr><td colSpan="6" className="py-12 text-center">
                                    <p className="text-slate-500 font-medium">Aucune dette en attente</p>
                                    <p className="text-slate-400 text-sm mt-1">Toutes les dettes sont reglees</p>
                                </td></tr>
                            ) : allDebts.map((debt) => (
                                <tr key={`${debt.type}-${debt.id}`} className="hover:bg-slate-50 transition duration-150">
                                    {/* Type */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            debt.type === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                                        }`}>
                                            {debt.type === 'client' ? <IconClient /> : <IconSupplier />}
                                            {debt.type === 'client' ? 'Client' : 'Fournisseur'}
                                        </span>
                                    </td>
                                    {/* Nom */}
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
                                    {/* Montant */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-base font-bold text-red-600">{fmt(debt.amount)}</span>
                                    </td>
                                    {/* Date */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{fmtD(debt.date)}</td>
                                    {/* Statut */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                            En attente
                                        </span>
                                    </td>
                                    {/* Action */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => openModal(debt)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                        >
                                            <IconWallet />
                                            Payer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===================== MODAL PAIEMENT ===================== */}
            {payTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(15,23,42,0.65)' }}
                    onClick={closeModal}                        /* clic sur fond = fermer */
                >
                    {/* La carte du modal – stopPropagation pour ne pas fermer quand on clique dedans */}
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* En-tete */}
                        <div className={`px-6 py-5 text-white ${
                            payTarget.type === 'client'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-700'
                                : 'bg-gradient-to-r from-violet-500 to-violet-700'
                        }`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold leading-tight">
                                        {payTarget.type === 'client' ? 'Encaisser un paiement client' : 'Payer un fournisseur'}
                                    </h3>
                                    <p className="text-white/80 text-sm mt-0.5">{payTarget.name}</p>
                                </div>
                                <button onClick={closeModal} disabled={paying}
                                    className="text-white/70 hover:text-white transition mt-0.5 flex-shrink-0">
                                    <IconClose />
                                </button>
                            </div>
                        </div>

                        {/* Corps */}
                        <div className="p-6 space-y-4">

                            {/* Resume dette */}
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-red-600 font-medium">Montant total du</span>
                                <span className="text-xl font-bold text-red-700">{fmt(payTarget.amount)}</span>
                            </div>

                            {/* Montant a payer */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Montant {payTarget.type === 'client' ? 'encaisse' : 'paye'} (FCFA)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        min="1"
                                        max={Math.round(payTarget.amount)}
                                        step="1"
                                        value={payAmount}
                                        onChange={e => { setPayAmount(e.target.value); setPayError(''); setPaySuccess(''); }}
                                        onKeyDown={e => e.key === 'Enter' && !paying && handlePay()}
                                        className="flex-1 border-2 border-slate-300 focus:border-emerald-500 rounded-xl px-4 py-3 text-lg font-bold outline-none transition"
                                        placeholder="0"
                                        disabled={paying}
                                    />
                                    <button
                                        type="button"
                                        disabled={paying}
                                        onClick={() => { setPayAmount(String(Math.round(payTarget.amount))); setPayError(''); setPaySuccess(''); }}
                                        className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition text-sm disabled:opacity-50"
                                    >
                                        Tout
                                    </button>
                                </div>
                                {/* Preview */}
                                {parseFloat(payAmount) > 0 && parseFloat(payAmount) < payTarget.amount && (
                                    <p className="text-xs text-amber-600 mt-1.5 font-medium">
                                        Paiement partiel — restera : {fmt(payTarget.amount - parseFloat(payAmount))}
                                    </p>
                                )}
                                {parseFloat(payAmount) >= payTarget.amount && parseFloat(payAmount) > 0 && (
                                    <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                                        Paiement integral — dette soldee
                                    </p>
                                )}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Note (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={payNotes}
                                    onChange={e => setPayNotes(e.target.value)}
                                    disabled={paying}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition disabled:bg-slate-50"
                                    placeholder="Ex: Paiement en especes, virement..."
                                />
                            </div>

                            {/* Erreur */}
                            {payError && (
                                <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
                                    {payError}
                                </div>
                            )}

                            {/* Succes */}
                            {paySuccess && (
                                <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
                                    {paySuccess}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={paying}
                                className="flex-1 min-h-[46px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handlePay}
                                disabled={paying || !parseFloat(payAmount) || parseFloat(payAmount) <= 0}
                                className="flex-1 min-h-[46px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {paying ? <><Spinner /> Traitement...</> : <><IconCheck /> Confirmer</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
