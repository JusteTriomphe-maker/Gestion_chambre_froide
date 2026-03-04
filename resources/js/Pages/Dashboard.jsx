import ModernLayout from '@/Layouts/ModernLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { StockEvolutionChart, ProductCategoryChart, MonthlyRevenueChart, TopProductsChart } from '@/Components/Charts';
import axios from 'axios';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Revenue data states
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [revenueHistory, setRevenueHistory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [revenueLoading, setRevenueLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = '/api';
                
                const statsRes = await axios.get(`${baseUrl}/dashboard/stats`);
                setStats(statsRes.data);

                const chartRes = await axios.get(`${baseUrl}/dashboard/chart-data`);
                setChartData(chartRes.data);

                const alertsRes = await axios.get(`${baseUrl}/dashboard/expiration-alerts`);
                setAlerts(alertsRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                if (error.response?.status === 401) {
                    window.location.href = '/login';
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch revenue data
    useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                const baseUrl = '/api';
                
                // Today's revenue
                const todayRes = await axios.get(`${baseUrl}/dashboard/today-revenue`);
                setTodayRevenue(todayRes.data.today_revenue || 0);

                // Revenue by category (for filter)
                const categoryRes = await axios.get(`${baseUrl}/dashboard/revenue-by-category`);
                setCategories(categoryRes.data.categories || []);

                // Revenue history
                const historyRes = await axios.get(
                    `${baseUrl}/dashboard/revenue-history?category=${selectedCategory}`
                );
                setRevenueHistory(historyRes.data.history || []);
            } catch (error) {
                console.error('Error fetching revenue data:', error);
            } finally {
                setRevenueLoading(false);
            }
        };

        fetchRevenueData();
    }, [selectedCategory]);

    const formatCurrency = (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num === null || num === undefined) {
            return '0 XOF';
        }
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(num);
    };

    const formatCurrencyFull = (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num === null || num === undefined) {
            return '0 XOF';
        }
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const statCards = [
        {
            title: 'Produits',
            value: stats?.total_products || 0,
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            href: '/products',
        },
        {
            title: 'Clients',
            value: stats?.total_clients || 0,
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            href: '/clients',
        },
        {
            title: 'Fournisseurs',
            value: stats?.total_suppliers || 0,
            icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
            color: 'from-violet-500 to-violet-600',
            bgColor: 'bg-violet-50',
            iconColor: 'text-violet-600',
            href: '/suppliers',
        },
        {
            title: 'Valeur Stock',
            value: formatCurrency(stats?.total_stock_value),
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            href: '/products',
        },
    ];

    const alertCards = [
        {
            title: 'Dettes Clients',
            value: formatCurrency(stats?.total_debt_from_clients),
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'from-red-500 to-rose-600',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            href: '/debts',
        },
        {
            title: 'Dettes Fourn.',
            value: formatCurrency(stats?.total_debt_to_suppliers),
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'from-orange-500 to-amber-600',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
            href: '/debts',
        },
        {
            title: 'Total Dettes',
            value: formatCurrency(stats?.total_dettes),
            icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
            color: 'from-rose-600 to-red-700',
            bgColor: 'bg-rose-100',
            iconColor: 'text-rose-700',
            href: '/debts',
        },
    ];

    const quickActions = [
        { name: 'Produits', href: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-700' },
        { name: 'Clients', href: '/clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'from-emerald-500 to-emerald-600', hover: 'hover:from-emerald-600 hover:to-emerald-700' },
        { name: 'Fournisseurs', href: '/suppliers', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'from-violet-500 to-violet-600', hover: 'hover:from-violet-600 hover:to-violet-700' },
        { name: 'Entrées', href: '/stock-entries', icon: 'M12 4v16m8-8H4', color: 'from-green-500 to-green-600', hover: 'hover:from-green-600 hover:to-green-700' },
        { name: 'Sorties', href: '/stock-exits', icon: 'M12 4v16m8-8H4', color: 'from-indigo-500 to-indigo-600', hover: 'hover:from-indigo-600 hover:to-indigo-700' },
        { name: 'Dettes', href: '/debts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-amber-500 to-orange-500', hover: 'hover:from-amber-600 hover:to-orange-600' },
    ];

    if (loading) {
        return (
            <ModernLayout title="Dashboard">
                <Head title="Dashboard" />
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500">Chargement du dashboard...</p>
                    </div>
                </div>
            </ModernLayout>
        );
    }

    return (
        <ModernLayout title="Dashboard">
            <Head title="Dashboard" />
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <a
                        href={stat.href}
                        key={index}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                <svg className={`w-6 h-6 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {alertCards.map((alert, index) => (
                    <a
                        href={alert.href}
                        key={index}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${alert.color} opacity-10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-xl ${alert.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                <svg className={`w-6 h-6 ${alert.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={alert.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{alert.title}</p>
                                <p className={`text-xl font-bold ${index === 2 ? 'text-rose-600' : 'text-slate-900'}`}>{alert.value}</p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {/* Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-lg shadow-green-500/25 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-green-100 font-medium">Entrées Aujourd'hui</span>
                        </div>
                        <p className="text-4xl font-bold">{stats?.entries_today || 0}</p>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg shadow-blue-500/25 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-blue-100 font-medium">Sorties Aujourd'hui</span>
                        </div>
                        <p className="text-4xl font-bold">{stats?.exits_today || 0}</p>
                    </div>
                </div>
            </div>

            {/* Chiffre d'Affaires Section */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 shadow-lg shadow-indigo-500/25 text-white mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-indigo-100 font-medium">Chiffre d'Affaires du Jour</p>
                            <p className="text-3xl font-bold">
                                {revenueLoading ? (
                                    <span className="text-indigo-200">Chargement...</span>
                                ) : (
                                    formatCurrencyFull(todayRevenue)
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-indigo-100">{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
            </div>

            {/* Historique CA Table */}
            <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Historique du Chiffre d'Affaires
                    </h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Filtrer par catégorie:</label>
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {revenueLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : revenueHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Total Vendu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueHistory.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 text-sm text-slate-900">
                                            {formatDate(item.date)}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-semibold text-indigo-600 text-right">
                                            {formatCurrencyFull(item.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>Aucun historique de chiffre d'affaires disponible</p>
                    </div>
                )}
            </div>

            {/* Expiration Alerts */}
            {(alerts?.expiring_soon_count > 0 || alerts?.expired_count > 0) && (
                <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Alertes d'Expiration
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {alerts?.expired_count > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-red-700 font-medium">{alerts.expired_count} produit(s) expiré(s)</span>
                            </div>
                        )}
                        {alerts?.expiring_soon_count > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                <span className="text-amber-700 font-medium">{alerts.expiring_soon_count} produit(s) expirent bientôt</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Évolution du Stock
                    </h3>
                    <div className="h-64">
                        <StockEvolutionChart 
                            entriesData={chartData?.entries_by_month?.map(item => item.total)}
                            exitsData={chartData?.exits_by_month?.map(item => item.total)}
                        />
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                        Top 5 Produits Vendus
                    </h3>
                    <div className="h-64">
                        <TopProductsChart 
                            products={chartData?.top_products?.map(item => item.product?.name || 'Inconnu')}
                            quantities={chartData?.top_products?.map(item => parseFloat(item.total_sold) || 0)}
                        />
                    </div>
                </div>
            </div>

            {/* Debt Evolution Chart */}
            <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Évolution des Dettes
                </h3>
                <div className="h-64">
                    <MonthlyRevenueChart 
                        months={chartData?.debt_by_month?.map(item => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][Math.floor(item.month) - 1] || '')}
                        revenues={chartData?.debt_by_month?.map(item => item.total > 0 ? item.total : 0)}
                        expenses={chartData?.debt_by_month?.map(item => item.total < 0 ? Math.abs(item.total) : 0)}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Actions Rapides
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickActions.map((action, index) => (
                        <a
                            href={action.href}
                            key={index}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br ${action.color} ${action.hover} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
                        >
                            <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                            </svg>
                            <span className="text-sm font-medium">{action.name}</span>
                        </a>
                    ))}
                </div>
            </div>
        </ModernLayout>
    );
}
