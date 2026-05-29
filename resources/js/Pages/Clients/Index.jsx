import ModernLayout from '@/Layouts/ModernLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Pagination from '@/Components/Pagination';
import axios from 'axios';
import { usePermissions } from '@/Hooks/usePermissions';

export default function ClientsIndex() {
    const page = usePage();
    const roleFromPage = page?.props?.auth?.user?.role;
    const { isDG: isDGApi, isGerant: isGerantApi } = usePermissions();
    const isDG = roleFromPage ? roleFromPage === 'dg' : isDGApi;
    const isGerant = roleFromPage ? roleFromPage === 'gerant' : isGerantApi;
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [meta, setMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [showPayModal, setShowPayModal] = useState(false);
    const [payingClient, setPayingClient] = useState(null);
    const [payAmount, setPayAmount] = useState('');

    useEffect(() => {
        fetchClients(currentPage);
    }, [search, currentPage]);

    const fetchClients = async (page = 1) => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('page', page);
            
            const response = await axios.get(`/api/clients?${params.toString()}`);
            setClients(response.data.data || []);
            setMeta(response.data.meta || null);
        } catch (error) {
            console.error('Error fetching clients:', error);
            if (error.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (url) => {
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');
        setCurrentPage(parseInt(page));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
            const method = editingClient ? 'put' : 'post';
            
            const response = await axios[method](url, formData);

            if (response.status === 200 || response.status === 201) {
                setShowModal(false);
                setEditingClient(null);
                resetForm();
                fetchClients();
            }
        } catch (error) {
            console.error('Error saving client:', error);
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce client?')) return;
        
        try {
            const response = await axios.delete(`/api/clients/${id}`);

            if (response.status === 200) {
                fetchClients();
            }
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
        });
    };

    const handleOpenPayModal = (client) => {
        setPayingClient(client);
        setPayAmount('');
        setShowPayModal(true);
    };

    const handlePayDebt = async (e) => {
        e.preventDefault();
        if (!payingClient) return;

        try {
            const amountNumber = parseFloat(payAmount);
            if (isNaN(amountNumber) || amountNumber <= 0) {
                return alert('Veuillez saisir un montant valide.');
            }

            await axios.post(`/api/clients/${payingClient.id}/pay`, {
                amount: amountNumber,
            });

            setShowPayModal(false);
            setPayingClient(null);
            setPayAmount('');
            fetchClients(currentPage);
        } catch (error) {
            console.error('Error paying debt:', error);
            alert(error.response?.data?.message || 'Erreur lors du paiement de la dette');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
    };

    return (
        <ModernLayout title="Clients">
            <Head title="Clients" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
                <p className="text-slate-500 mt-1">Gérez vos clients et leurs dettes</p>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher des clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingClient(null);
                        setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Nouveau Client
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Téléphone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Adresse</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dette</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-slate-500">Aucun client trouvé</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className={`hover:bg-slate-50 transition duration-150 ${client.total_debt > 0 ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900">{client.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {client.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {client.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {client.address || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {client.total_debt > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                    {formatCurrency(client.total_debt)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {(isDG || isGerant) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(client)}
                                                            className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition duration-150"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenPayModal(client)}
                                                            disabled={client.total_debt <= 0}
                                                            className={`p-2 rounded-lg transition duration-150 ${
                                                                client.total_debt > 0
                                                                    ? 'text-amber-600 hover:text-amber-900 hover:bg-amber-50'
                                                                    : 'text-slate-300 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(client.id)}
                                                            disabled={client.total_debt > 0}
                                                            className={`p-2 rounded-lg transition duration-150 ${
                                                                client.total_debt > 0
                                                                    ? 'text-slate-300 cursor-not-allowed'
                                                                    : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                                            }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <Pagination meta={meta} onPageChange={handlePageChange} />
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl shadow-slate-500/20 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-emerald-600 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-white">
                                {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du client</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150"
                                        placeholder="Ex: John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150"
                                        placeholder="+225 00 00 00 00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150"
                                        rows="3"
                                        placeholder="Adresse du client..."
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingClient(null);
                                        resetForm();
                                    }}
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition duration-150"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition duration-150 shadow-lg shadow-emerald-500/25"
                                >
                                    {editingClient ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Paiement Dette */}
            {showPayModal && payingClient && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowPayModal(false)}></div>
                    <div className="relative w-full max-w-md max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl shadow-slate-500/20 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-500 to-amber-600 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-white">
                                Payer la dette de {payingClient.name}
                            </h3>
                            <p className="text-xs text-amber-100 mt-1">
                                Dette actuelle : {formatCurrency(payingClient.total_debt)}
                            </p>
                        </div>
                        <form onSubmit={handlePayDebt} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Montant à payer
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition duration-150"
                                        placeholder="Ex: 10000"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Si le montant est égal à la dette totale, elle sera considérée comme soldée.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPayModal(false);
                                        setPayingClient(null);
                                        setPayAmount('');
                                    }}
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition duration-150"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-amber-700 transition duration-150 shadow-lg shadow-amber-500/25"
                                >
                                    Confirmer le paiement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
