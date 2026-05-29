import ModernLayout from '@/Layouts/ModernLayout';
import { Head, Link } from '@inertiajs/react';

export default function Error403({ message = "Accès refusé : vous n'avez pas la permission d'accéder à ce module." }) {
    return (
        <ModernLayout title="Accès Refusé">
            <Head title="Accès Refusé" />
            
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    {/* Icon */}
                    <div className="mb-8">
                        <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Accès Refusé</h1>
                    
                    {/* Message */}
                    <p className="text-slate-600 mb-8">
                        {message}
                    </p>
                    
                    {/* Additional info */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-8 text-sm text-slate-500">
                        <p>Contactez l'administrateur si vous pensez que c'est une erreur.</p>
                    </div>
                    
                    {/* Back to Dashboard */}
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour au Dashboard
                    </Link>
                </div>
            </div>
        </ModernLayout>
    );
}
