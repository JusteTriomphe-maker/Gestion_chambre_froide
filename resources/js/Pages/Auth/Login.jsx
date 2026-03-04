import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Connexion" />

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

                    {/* Login Card */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
                        <h2 className="text-xl font-semibold text-white mb-6 text-center">Connexion</h2>

                        {status && (
                            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                    placeholder="votre@email.com"
                                    required
                                    autoFocus
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                    placeholder="••••••••"
                                    required
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-offset-slate-800"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-slate-300">
                                    Se souvenir de moi
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connexion en cours...
                                    </div>
                                ) : (
                                    'Se connecter'
                                )}
                            </button>
                        </form>

                        {canResetPassword && (
                            <div className="mt-6 text-center">
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-slate-400 hover:text-white transition duration-200"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Registration is disabled - contact admin message */}
                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-center text-amber-400 text-sm">
                            <span className="font-semibold">Inscription désactivée</span>
                            <br />
                            <span className="text-slate-400">Contactez l'administrateur pour créer un compte</span>
                        </p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
