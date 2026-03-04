import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Enable credentials and CSRF token for API requests
axios.defaults.withCredentials = true;

// Setup CSRF token for axios
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
} else {
    // Fallback: try to get token from cookie
    const csrfCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='));
    if (csrfCookie) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = decodeURIComponent(csrfCookie.split('=')[1]);
    }
}
