import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function UsersIndex() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'gerant',
        phone: '',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const getCsrfToken = () => {
        const token = document.head.querySelector('meta[name="csrf-token"]');
        return token ? token.content : '';
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                headers: { 
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await response.json();
            setUsers(data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            // Log response status for debugging
            console.log('Response status:', response.status);
            
            if (response.ok || response.status === 201) {
                setShowModal(false);
                setEditingUser(null);
                resetForm();
                // Small delay to ensure server has saved data
                setTimeout(() => {
                    fetchUsers();
                }, 100);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(errorData.message || 'Erreur lors de la création de l\'utilisateur');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Erreur de connexion');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'gerant',
            phone: user.phone || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) return;
        try {
            await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: 'gerant',
            phone: '',
        });
    };

    const getRoleBadge = (role) => {
        const badges = {
            'dg': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Directeur Général' },
            'gerant': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Gérant' },
            'caissier': { bg: 'bg-green-100', text: 'text-green-700', label: 'Caissier' },
            'comptable': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Comptable' },
        };
        const badge = badges[role] || badges.gerant;
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const roleOptions = [
        { value: 'dg', label: 'Directeur Général' },
        { value: 'gerant', label: 'Gérant' },
        { value: 'caissier', label: 'Caissier' },
        { value: 'comptable', label: 'Comptable' },
    ];

    return (
        <ModernLayout title="Utilisateurs">
            <Head title="Gestion des Utilisateurs" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
                <p className="text-slate-500 mt-1">Gérez les utilisateurs et leurs rôles</p>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Nouvel Utilisateur
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Utilisateur</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Téléphone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Rôle</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Statut</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center"><div className="flex justify-center items-center gap-3"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div><span className="text-slate-500">Chargement...</span></div></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center"><div className="flex flex-col items-center gap-2"><svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg><span className="text-slate-500">Aucun utilisateur trouvé</span></div></td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.phone || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Actif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(user)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                            <h3 className="text-lg font-semibold text-white">{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Jean Dupont" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="jean@exemple.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {roleOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="+225 07 00 00 00 00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {editingUser ? 'Nouveau mot de passe (laisser vide pour garder l\'actuel)' : 'Mot de passe'}
                                    </label>
                                    <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                                </div>
                                {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Confirmer le mot de passe
                                    </label>
                                    <input type="password" required={!editingUser} value={formData.password_confirmation} onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                                </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition">
                                    Annuler
                                </button>
                                <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition">
                                    {editingUser ? 'Enregistrer' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ModernLayout>
    );
}
