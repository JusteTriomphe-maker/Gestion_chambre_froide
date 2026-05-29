import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Pagination from '@/Components/Pagination';
import axios from 'axios';

export default function SuppliersIndex() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [meta, setMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
    });

    useEffect(() => {
        fetchSuppliers(currentPage);
    }, [search, currentPage]);

    const fetchSuppliers = async (page = 1) => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('page', page);
            
            const response = await axios.get(`/api/suppliers?${params.toString()}`);
            setSuppliers(response.data.data || []);
            setMeta(response.data.meta || null);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
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
            const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
            const method = editingSupplier ? 'put' : 'post';
            
            const response = await axios[method](url, formData);

            if (response.status === 200 || response.status === 201) {
                setShowModal(false);
                setEditingSupplier(null);
                resetForm();
                fetchSuppliers();
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            contact_person: supplier.contact_person || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur?')) return;
        
        try {
            const response = await axios.delete(`/api/suppliers/${id}`);

            if (response.status === 200) {
                fetchSuppliers();
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            contact_person: '',
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
    };

    return (
        <ModernLayout title="Fournisseurs">
            <Head title="Fournisseurs" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Fournisseurs</h1>
                <p className="text-slate-500 mt-1">Gérez vos fournisseurs et leurs dettes</p>
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
                        placeholder="Rechercher des fournisseurs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingSupplier(null);
                        setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-violet-500/25"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Nouveau Fournisseur
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fournisseur</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Téléphone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dette</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                            <span className="text-slate-500">Aucun fournisseur trouvé</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr key={supplier.id} className={`hover:bg-slate-50 transition duration-150 ${supplier.total_debt > 0 ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {supplier.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900">{supplier.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {supplier.contact_person || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {supplier.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {supplier.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {supplier.total_debt > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                    {formatCurrency(supplier.total_debt)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(supplier)}
                                                    className="p-2 text-violet-600 hover:text-violet-900 hover:bg-violet-50 rounded-lg transition duration-150"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition duration-150"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
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
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-500 to-violet-600 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-white">
                                {editingSupplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du fournisseur</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150"
                                        placeholder="Ex: Société X"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Personne de contact</label>
                                    <input
                                        type="text"
                                        value={formData.contact_person}
                                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150"
                                        placeholder="Ex: Jean Dupont"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150"
                                        placeholder="contact@fournisseur.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150"
                                        placeholder="+225 00 00 00 00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150"
                                        rows="3"
                                        placeholder="Adresse du fournisseur..."
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingSupplier(null);
                                        resetForm();
                                    }}
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition duration-150"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-violet-700 transition duration-150 shadow-lg shadow-violet-500/25"
                                >
                                    {editingSupplier ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
