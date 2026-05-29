import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function StockEntriesIndex() {
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        supplier_id: '',
        input_unit: 'kg',
        input_quantity: '',
        quantity: '',
        unit_price: '',
        entry_date: new Date().toISOString().split('T')[0],
        expiration_date: '',
        batch_number: '',
        is_paid: false,
        notes: '',
    });

    useEffect(() => {
        fetchEntries();
        fetchProducts();
        fetchSuppliers();
    }, []);

    const fetchEntries = async () => {
        try {
            const response = await axios.get('/api/stock-entries');
            setEntries(response.data.data || []);
        } catch (error) {
            console.error('Error fetching stock entries:', error);
            if (error.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products?per_page=100');
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('/api/suppliers?per_page=100');
            setSuppliers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const quantityForCompat = formData.input_quantity || formData.quantity;
            const payload = {
                ...formData,
                input_quantity: quantityForCompat,
                quantity: quantityForCompat,
            };

            const response = await axios.post('/api/stock-entries', payload);

            if (response.status === 200 || response.status === 201) {
                setShowModal(false);
                resetForm();
                fetchEntries();
            }
        } catch (error) {
            console.error('Error creating entry:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée?')) return;
        try {
            await axios.delete(`/api/stock-entries/${id}`);
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            product_id: '',
            supplier_id: '',
            input_unit: 'kg',
            input_quantity: '',
            quantity: '',
            unit_price: '',
            entry_date: new Date().toISOString().split('T')[0],
            expiration_date: '',
            batch_number: '',
            is_paid: false,
            notes: '',
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    return (
        <ModernLayout title="Entrées Stock">
            <Head title="Entrées Stock" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Entrées Stock</h1>
                <p className="text-slate-500 mt-1">Gérez les entrées de produits en stock</p>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-green-500/25"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle Entrée
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Produit</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Fournisseur</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Quantité</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Prix Unit.</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Expiration</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Statut</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="8" className="px-6 py-12 text-center"><div className="flex justify-center items-center gap-3"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div><span className="text-slate-500">Chargement...</span></div></td></tr>
                            ) : entries.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-12 text-center"><div className="flex flex-col items-center gap-2"><svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg><span className="text-slate-500">Aucune entrée trouvée</span></div></td></tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(entry.entry_date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-semibold text-xs">
                                                    {entry.product?.name?.charAt(0) || 'P'}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">{entry.product?.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.supplier?.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                            <div className="flex flex-col">
                                                <span>{entry.input_quantity ?? entry.quantity} {entry.input_unit ?? 'kg'}</span>
                                                <span className="text-xs text-slate-500">→ {entry.quantity} kg</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatCurrency(entry.unit_price)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(entry.expiration_date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {entry.is_paid ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Payé</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Non payé</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button onClick={() => handleDelete(entry.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-white">Nouvelle Entrée de Stock</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Produit</label>
                                    <select required value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500">
                                        <option value="">Sélectionner un produit</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
                                    <select required value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500">
                                        <option value="">Sélectionner un fournisseur</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                                        <select
                                            value={formData.input_unit}
                                            onChange={(e) => setFormData({ ...formData, input_unit: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="kg">Kg</option>
                                            <option value="carton">Carton</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.input_quantity}
                                            onChange={(e) => setFormData({ ...formData, input_quantity: e.target.value, quantity: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="hidden">
                                        {/* Champ compat API (kg). Renseigné automatiquement à partir de input_quantity. */}
                                        <input type="hidden" value={formData.quantity} readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Prix Unitaire</label>
                                        <input type="number" step="0.01" required value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date d'entrée</label>
                                        <input type="date" required value={formData.entry_date} onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date d'expiration</label>
                                        <input type="date" value={formData.expiration_date} onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de lot</label>
                                    <input type="text" value={formData.batch_number} onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={formData.is_paid} onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })} className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                                        <span className="ml-2 text-sm text-slate-600">Payé au fournisseur</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium">Annuler</button>
                                <button type="submit" className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
