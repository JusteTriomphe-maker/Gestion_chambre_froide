import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Pagination from '@/Components/Pagination';
import axios from 'axios';

export default function ProductsIndex() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [meta, setMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        category: '',
        price_buying: '',
        price_selling: '',
        price_per_carton: '',
        unit: '',
        stock_mode: 'kg_only',
        kg_per_carton: '',
        min_threshold: '',
        current_stock: '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchProducts(currentPage);
    }, [search, currentPage]);

    const fetchProducts = async (page = 1) => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('page', page);
            
            const response = await axios.get(`/api/products?${params.toString()}`);

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            setProducts(response.data.data || []);
            setMeta(response.data.meta || null);
        } catch (error) {
            console.error('Error fetching products:', error);
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
        setSaving(true);
        setErrors({});
        
        try {
            // Prepare data - convert empty strings to numbers
            const dataToSend = {
                name: formData.name,
                barcode: formData.barcode || null,
                category: formData.category || null,
                price_buying: parseFloat(formData.price_buying) || 0,
                price_selling: parseFloat(formData.price_selling) || 0,
                price_per_carton: formData.price_per_carton === '' ? null : (parseFloat(formData.price_per_carton) || 0),
                unit: formData.unit,
                stock_mode: formData.stock_mode || 'kg_only',
                kg_per_carton: formData.kg_per_carton === '' ? null : (parseFloat(formData.kg_per_carton) || 0),
                min_threshold: formData.min_threshold ? parseFloat(formData.min_threshold) : 0,
                current_stock: formData.current_stock ? parseFloat(formData.current_stock) : 0,
            };
            
            let response;
            if (editingProduct) {
                response = await axios.put(`/api/products/${editingProduct.id}`, dataToSend);
            } else {
                response = await axios.post('/api/products', dataToSend);
            }

            if (response.status === 200 || response.status === 201) {
                setShowModal(false);
                setEditingProduct(null);
                resetForm();
                fetchProducts();
            }
        } catch (error) {
            console.error('Error saving product:', error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert('Une erreur est survenue lors de l\'enregistrement');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            barcode: product.barcode || '',
            category: product.category || '',
            price_buying: product.price_buying || '',
            price_selling: product.price_selling || '',
            price_per_carton: product.price_per_carton ?? '',
            unit: product.unit || '',
            stock_mode: product.stock_mode || 'kg_only',
            kg_per_carton: product.kg_per_carton ?? '',
            min_threshold: product.min_threshold || '',
            current_stock: product.current_stock || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) return;
        
        try {
            const response = await axios.delete(`/api/products/${id}`);

            if (response.status === 200) {
                fetchProducts();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            barcode: '',
            category: '',
            price_buying: '',
            price_selling: '',
            price_per_carton: '',
            unit: '',
            stock_mode: 'kg_only',
            kg_per_carton: '',
            min_threshold: '',
            current_stock: '',
        });
    };

    const formatCurrency = (value) => new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

    const formatStock = (product) => {
        const stockKg = Number(product.current_stock || 0);
        const unit = (product.unit || 'kg').toLowerCase();

        if ((product.stock_mode === 'carton_only' || product.stock_mode === 'kg_and_carton') && Number(product.kg_per_carton || 0) > 0) {
            const k = Number(product.kg_per_carton);
            const cartons = Math.floor(stockKg / k);
            const resteKg = +(stockKg - cartons * k).toFixed(2);
            return `${cartons} carton(s) + ${resteKg} kg`;
        }

        return `${stockKg} ${unit}`;
    };

    return (
        <ModernLayout title="Produits">
            <Head title="Produits" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
                <p className="text-slate-500 mt-1">Gérez votre inventaire de produits</p>
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
                        placeholder="Rechercher des produits..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingProduct(null);
                        setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouveau Produit
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Produit</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Catégorie</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Seuil Min</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Prix Achat</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Prix Vente</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-slate-500">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            <span className="text-slate-500">Aucun produit trouvé</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className={`hover:bg-slate-50 transition duration-150 ${product.current_stock < product.min_threshold ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {product.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                                                    {product.barcode && <div className="text-xs text-slate-500">{product.barcode}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {product.category || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${product.current_stock < product.min_threshold ? 'text-red-600' : 'text-slate-900'}`}>
                                                    {formatStock(product)}
                                                </span>
                                                {product.current_stock < product.min_threshold && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        Low
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {product.min_threshold}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {formatCurrency(product.price_buying)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                                            {formatCurrency(product.price_selling)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition duration-150"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
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
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-white">
                                {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        placeholder="Ex: Pommes congelées"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Code Barres</label>
                                        <input
                                            type="text"
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                            placeholder="Ex: Fruits"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Prix Achat (XOF)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.price_buying}
                                            onChange={(e) => setFormData({ ...formData, price_buying: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Prix Vente (XOF)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.price_selling}
                                            onChange={(e) => setFormData({ ...formData, price_selling: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mode Stock</label>
                                        <select
                                            value={formData.stock_mode}
                                            onChange={(e) => setFormData({ ...formData, stock_mode: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        >
                                            <option value="kg_only">Kg uniquement</option>
                                            <option value="carton_only">Carton uniquement</option>
                                            <option value="kg_and_carton">Kg + Carton</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Kg par carton</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.kg_per_carton}
                                            onChange={(e) => setFormData({ ...formData, kg_per_carton: e.target.value })}
                                            disabled={formData.stock_mode === 'kg_only'}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 disabled:bg-slate-100"
                                            placeholder="Ex: 10"
                                        />
                                    </div>
                                </div>
                                {formData.stock_mode !== 'kg_only' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Prix / carton (FCFA)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price_per_carton}
                                            onChange={(e) => setFormData({ ...formData, price_per_carton: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                            placeholder="Ex: 15000"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Indépendant du prix au kg.</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                                        <select
                                            required
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        >
                                            <option value="">Sélectionner une unité</option>
                                            <option value="kg">Kg</option>
                                            <option value="Carton">Carton</option>
                                            <option value="Sachet">Sachet</option>
                                            <option value="Tige">Tige (Pièce)</option>
                                            <option value="Pièce">Pièce</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Seuil Min</label>
                                        <input
                                            type="number"
                                            value={formData.min_threshold}
                                            onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        />
                                    </div>
                                </div>
                                {!editingProduct && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Stock Initial</label>
                                        <input
                                            type="number"
                                            value={formData.current_stock}
                                            onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingProduct(null);
                                        resetForm();
                                    }}
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition duration-150"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition duration-150 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        editingProduct ? 'Mettre à jour' : 'Créer'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
