import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

export function usePermissions(options = {}) {
    const { cache = true, autoRefresh = false, refreshInterval = 0 } = options;
    
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cache local
    const cacheKey = 'app_permissions';
    const cachedPermissions = cache ? localStorage.getItem(cacheKey) : null;

    useEffect(() => {
        // Vérifier le cache au démarrage
        if (cache && cachedPermissions) {
            try {
                const parsed = JSON.parse(cachedPermissions);
                setPermissions(parsed);
                setLoading(false);
                return;
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }
        
        fetchPermissions();
    }, []);

    // Auto-refresh si activé
    useEffect(() => {
        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(fetchPermissions, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);

    const fetchPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/permissions/current');
            const data = response.data;
            
            setPermissions(data);
            setError(null);
            
            // Mettre en cache
            if (cache) {
                localStorage.setItem(cacheKey, JSON.stringify(data));
            }
        } catch (err) {
            console.error('Error fetching permissions:', err);
            setError(err);
            
            // Utiliser le cache en cas d'erreur
            if (cache && cachedPermissions) {
                try {
                    setPermissions(JSON.parse(cachedPermissions));
                } catch (e) {
                    // Ignorer
                }
            }
        } finally {
            setLoading(false);
        }
    }, [cache]);

    // Vérifier une permission spécifique
    const can = useCallback((module, action = 'view') => {
        if (!permissions) return false;
        return permissions.can?.[module]?.[action] ?? false;
    }, [permissions]);

    // Vérifier si on peut accéder à un module
    const canAccess = useCallback((module) => {
        if (!permissions) return false;
        return permissions.allowed_modules?.includes(module) ?? false;
    }, [permissions]);

    // Vérifier le rôle
    const hasRole = useCallback((role) => {
        if (!permissions) return false;
        return permissions.user?.role === role;
    }, [permissions]);

    // Vérifier si DG
    const isDG = useMemo(() => hasRole('dg'), [hasRole]);

    // Vérifier si Gérant
    const isGerant = useMemo(() => hasRole('gerant'), [hasRole]);

    // Vérifier si Caissier
    const isCaissier = useMemo(() => hasRole('caissier'), [hasRole]);

    // Vérifier si Magasinier
    const isMagasinier = useMemo(() => hasRole('magasinier'), [hasRole]);

    // Vérifier si Comptable
    const isComptable = useMemo(() => hasRole('comptable'), [hasRole]);

    // Raccourcis pratiques
    const isAdmin = useMemo(() => isDG || isGerant, [isDG, isGerant]);
    const isStockManager = useMemo(() => isMagasinier || isGerant, [isMagasinier, isGerant]);
    const isSales = useMemo(() => isCaissier || isGerant || isDG, [isCaissier, isGerant, isDG]);
    const isFinance = useMemo(() => isComptable || isGerant || isDG, [isComptable, isGerant, isDG]);

    // Vérifier si peut gérer les utilisateurs
    const canManageUsers = useMemo(() => 
        permissions?.can_manage_users ?? false, [permissions]);

    // Vérifier si peut voir les rapports
    const canViewReports = useMemo(() => 
        permissions?.can_view_reports ?? false, [permissions]);

    // Obtenir les modules accessibles
    const allowedModules = useMemo(() => 
        permissions?.allowed_modules ?? [], [permissions]);

    // Obtenir le label du rôle
    const roleLabel = useMemo(() => 
        permissions?.user?.role_label ?? '', [permissions]);

    // Obtenir les infos utilisateur
    const user = useMemo(() => 
        permissions?.user ?? null, [permissions]);

    // Effacer le cache
    const clearCache = useCallback(() => {
        localStorage.removeItem(cacheKey);
        setPermissions(null);
    }, []);

    // Forcer un refresh
    const refresh = useCallback(() => {
        clearCache();
        fetchPermissions();
    }, [clearCache, fetchPermissions]);

    return {
        // Data
        permissions,
        user,
        roleLabel,
        allowedModules,
        
        // Status
        loading,
        error,
        
        // Checks
        can,
        canAccess,
        hasRole,
        
        // Role shortcuts
        isDG,
        isGerant,
        isCaissier,
        isMagasinier,
        isComptable,
        isAdmin,
        isStockManager,
        isSales,
        isFinance,
        
        // Special permissions
        canManageUsers,
        canViewReports,
        
        // Actions
        refresh,
        clearCache,
        fetchPermissions,
    };
}

// Helper pour vérifier les permissions sans hook (pour les vérifications statiques)
export function checkPermission(permissions, module, action) {
    if (!permissions) return false;
    return permissions.can?.[module]?.[action] ?? false;
}

// Helper pour vérifier si un module est accessible
export function checkModuleAccess(permissions, module) {
    if (!permissions) return false;
    return permissions.allowed_modules?.includes(module) ?? false;
}

// Helper pour vérifier le rôle
export function checkRole(permissions, role) {
    if (!permissions) return false;
    return permissions.user?.role === role;
}

// Constantes des modules pour éviter les erreurs de frappe
export const MODULES = {
    DASHBOARD: 'dashboard',
    PRODUCTS: 'products',
    CLIENTS: 'clients',
    SUPPLIERS: 'suppliers',
    STOCK_ENTRIES: 'stock-entries',
    STOCK_EXITS: 'stock-exits',
    DEBTS: 'debts',
    USERS: 'users',
    REPORTS: 'reports',
    SETTINGS: 'settings',
};

// Constantes des actions
export const ACTIONS = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    EXPORT: 'export',
    PAY: 'pay',
};

// Constantes des rôles
export const ROLES = {
    DG: 'dg',
    GERANT: 'gerant',
    CAISSIER: 'caissier',
    MAGASINIER: 'magasinier',
    COMPTABLE: 'comptable',
};

export default usePermissions;
