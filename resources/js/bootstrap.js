import axios from 'axios';

window.axios = axios;

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

/**
 * Récupère le jeton CSRF (meta Inertia ou cookie XSRF-TOKEN de Laravel).
 */
function getCsrfToken() {
    const meta = document.head.querySelector('meta[name="csrf-token"]');
    if (meta?.content) {
        return meta.content;
    }

    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (match) {
        return decodeURIComponent(match[1]);
    }

    return null;
}

function applyCsrfHeaders(config) {
    const token = getCsrfToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-TOKEN'] = token;
        config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
}

// Jeton initial
const initialToken = getCsrfToken();
if (initialToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = initialToken;
    axios.defaults.headers.common['X-XSRF-TOKEN'] = initialToken;
}

// Rafraîchir le jeton avant chaque requête (session régénérée, onglet long ouvert, etc.)
axios.interceptors.request.use((config) => applyCsrfHeaders(config));

// En cas de 419 : récupérer un nouveau cookie CSRF puis réessayer une fois
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (
            error.response?.status === 419 &&
            original &&
            !original._csrfRetried
        ) {
            original._csrfRetried = true;

            try {
                await axios.get('/sanctum/csrf-cookie');
                applyCsrfHeaders(original);
                return axios.request(original);
            } catch (retryError) {
                console.error('CSRF refresh failed:', retryError);
            }

            alert(
                'Votre session a expiré ou le jeton de sécurité est invalide. La page va se recharger.'
            );
            window.location.reload();
        }

        return Promise.reject(error);
    }
);

// Pré-charger le cookie CSRF au démarrage (Sanctum SPA)
axios.get('/sanctum/csrf-cookie').catch(() => {
    // Ignorer si hors ligne ou avant login
});
