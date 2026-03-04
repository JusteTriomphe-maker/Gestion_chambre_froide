import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function Register() {
    return (
        <GuestLayout>
            <Head title="Inscription" />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Chambre Froide</h1>
                        <p className="text-slate-400 mt-2">Gestion de stock simplifiée</p>
                    </div>

                    {/* Registration Disabled Card */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
                        <div className="text-center">
                            {/* Lock Icon */}
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-6">
                                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            
                            <h2 className="text-xl font-semibold text-white mb-3">Inscription désactivée</h2>
                            <p className="text-slate-400 mb-6">
                                Pour des raisons de sécurité, la création de compte 
                                est reservée aux administrateurs.
                            </p>
                            
                            {/* Contact Admin Card */}
                            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-slate-300 mb-2">
                                    <span className="font-semibold text-amber-400">Contactez l'administrateur</span> pour créer un compte
                                </p>
                                <p className="text-xs text-slate-500">
                                    Seul le Directeur Général peut créer de nouveaux utilisateurs
                                </p>
                            </div>

                            {/* Back to Login */}
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Retour à la connexion
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
