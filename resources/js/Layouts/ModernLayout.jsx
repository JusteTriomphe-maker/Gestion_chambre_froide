import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ModernLayout({ children, title }) {
    const user = usePage().props.auth.user;
    const userRole = user.role || 'gerant';
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Navigation par rôle
    const getNavigationByRole = (role) => {
        const allNav = [
            { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', module: 'dashboard' },
            { name: 'Produits', href: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', module: 'products' },
            { name: 'Clients', href: '/clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', module: 'clients' },
            { name: 'Fournisseurs', href: '/suppliers', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', module: 'suppliers' },
            { name: 'Entrées Stock', href: '/stock-entries', icon: 'M12 4v16m8-8H4', module: 'stock-entries' },
            { name: 'Sorties Stock', href: '/stock-exits', icon: 'M12 4v16m8-8H4', module: 'stock-exits' },
            { name: 'Ventes', href: '/sales', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', module: 'sales' },
            { name: 'Dettes', href: '/debts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', module: 'debts' },
            { name: 'Chiffre d\'Affaires', href: '/chiffre-affaires', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', module: 'revenue' },
            { name: 'Utilisateurs', href: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', module: 'users' },
        ];
        // IMPORTANT : aligné sur les permissions backend (RoleAccessMiddleware)
        // Objectif : ne jamais afficher un lien qui déclenche "Accès refusé".
        const permissions = {
            dg: ['dashboard', 'products', 'clients', 'suppliers', 'stock-entries', 'stock-exits', 'debts', 'users', 'revenue', 'sales'],
            gerant: ['dashboard', 'products', 'stock-entries', 'stock-exits', 'sales'],
            caissier: ['dashboard', 'clients', 'stock-exits', 'sales'],
            comptable: ['dashboard', 'debts', 'revenue'],
        };
        const allowed = permissions[role] || [];
        return allNav.filter(item => allowed.includes(item.module));
    };

    const navigation = getNavigationByRole(userRole);

    const isActive = (href) => {
        return window.location.pathname === href;
    };

    // Obtenir le label du rôle
    const getRoleLabel = (role) => {
        const labels = {
            'dg': 'Directeur Général',
            'gerant': 'Gérant',
            'caissier': 'Caissier',
            'comptable': 'Comptable',
        };
        return labels[role] || role;
    };

    // Déconnexion avec handle
    const handleLogout = async (e) => {
        e.preventDefault();
        
        const token = document.head.querySelector('meta[name="csrf-token"]');
        const csrfToken = token ? token.content : '';
        
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            
            if (response.ok) {
                window.location.href = '/login';
            } else {
                console.error('Logout failed:', response.status);
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                <div className="flex h-16 items-center justify-center border-b border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white">Chambre Froide</span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                                        ${isActive(item.href) 
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{getRoleLabel(userRole)}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Déconnexion"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:px-6 lg:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-700 lg:hidden"
                            aria-label="Ouvrir le menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">{title || 'Dashboard'}</h1>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
                        <div className="relative">
                            <button className="flex items-center gap-2 rounded-full bg-slate-100 p-2 hover:bg-slate-200 transition">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name}</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
