# Architecture des Composants React - Cold Storage Management

## Structure des Dossiers

```
resources/js/
├── app.jsx                    # Point d'entrée principal
├── components/
│   ├── Layout/
│   │   ├── AppLayout.jsx      # Layout principal avec sidebar
│   │   ├── Header.jsx         # En-tête avec user menu
│   │   ├── Sidebar.jsx        # Navigation latérale
│   │   └── Footer.jsx         # Pied de page
│   │
│   ├── UI/                    # Composants réutilisables
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Alert.jsx
│   │   ├── Avatar.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Pagination.jsx
│   │   ├── SearchInput.jsx
│   │   ├── DatePicker.jsx
│   │   └── LoadingSpinner.jsx
│   │
│   ├── Charts/                # Composants de graphiques
│   │   ├── LineChart.jsx
│   │   ├── BarChart.jsx
│   │   ├── PieChart.jsx
│   │   └── AreaChart.jsx
│   │
│   └── Forms/                 # Composants de formulaires
│       ├── ProductForm.jsx
│       ├── SupplierForm.jsx
│       ├── ClientForm.jsx
│       ├── StockEntryForm.jsx
│       ├── StockExitForm.jsx
│       └── DebtForm.jsx
│
├── pages/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   │
│   ├── Dashboard/
│   │   └── Index.jsx          # Tableau de bord principal
│   │
│   ├── Products/
│   │   ├── Index.jsx          # Liste des produits
│   │   ├── Create.jsx         # Créer un produit
│   │   ├── Edit.jsx           # Modifier un produit
│   │   └── Show.jsx           # Détails d'un produit
│   │
│   ├── Suppliers/
│   │   ├── Index.jsx
│   │   ├── Create.jsx
│   │   ├── Edit.jsx
│   │   └── Show.jsx
│   │
│   ├── Clients/
│   │   ├── Index.jsx
│   │   ├── Create.jsx
│   │   ├── Edit.jsx
│   │   └── Show.jsx
│   │
│   ├── Stock/
│   │   ├── Entries/
│   │   │   ├── Index.jsx
│   │   │   └── Create.jsx
│   │   │
│   │   └── Exits/
│   │       ├── Index.jsx
│   │       └── Create.jsx
│   │
│   ├── Debts/
│   │   ├── Index.jsx          # Vue d'ensemble des dettes
│   │   ├── Clients.jsx        # Dettes clients
│   │   └── Suppliers.jsx      # Dettes fournisseurs
│   │
│   ├── Reports/
│   │   ├── Index.jsx
│   │   ├── Expiration.jsx     # Rapport péremption
│   │   └── StockMovement.jsx  # Rapport mouvements
│   │
│   └── Settings/
│       ├── Index.jsx
│       └── Users.jsx          # Gestion utilisateurs
│
├── hooks/                     # Custom React Hooks
│   ├── useProducts.js
│   ├── useSuppliers.js
│   ├── useClients.js
│   ├── useDebts.js
│   ├── useChartData.js
│   └── useSearch.js
│
├── services/                  # Services API
│   ├── api.js                 # Instance Axios configurée
│   ├── productService.js
│   ├── supplierService.js
│   ├── clientService.js
│   ├── stockService.js
│   └── debtService.js
│
├── utils/                     # Utilitaires
│   ├── formatters.js          # Formatage dates, devises
│   ├── validators.js          # Validations
│   └── constants.js           # Constantes partagées
│
└── stores/                    # State Management (Zustand ou Context)
    ├── authStore.js
    └── appStore.js
```

## Composants Principaux Détaillés

### 1. AppLayout.jsx
```jsx
// Structure principale de l'application
- Sidebar navigation (responsive)
- Header avec user menu
- Main content area
- Gestion des routes via Inertia
```

### 2. Dashboard/Index.jsx
```
jsx
// Composants du dashboard:
- StatsCards: Total produits, valeur stock, alertes
- StockAlertsWidget: Produits sous seuil
- ExpirationWidget: Produits expirant dans 7 jours
- ChartEntréesSorties: Graphique entrées/sorties mois
- RecentTransactions: Dernières transactions
```

### 3. Products/Index.jsx
```
jsx
// Fonctionnalités:
- SearchInput: Recherche temps réel par nom, barcode
- Table: Liste produits avec pagination
- Filtres: Catégorie, statut stock (normal, alert, rupture)
- Actions: CRUD buttons
- Bulk actions: Supprimer, exporter
```

### 4. Stock/Entries/Create.jsx
```
jsx
// Formulaire d'entrée:
- Select produit (avec search)
- Select fournisseur
- Input: quantité, prix unitaire
- DatePicker: date entrée, date péremption
- Input: numéro lot (optionnel)
- Checkbox: payé/non payé
- Notes textarea
```

### 5. Stock/Exits/Create.jsx
```
jsx
// Formulaire de sortie:
- Select client
- Select produit (avec stock disponible)
- Affichage: stock actuel, date péremption plus proche
- Input: quantité
- Select: raison (vente, perte, péremption, autre)
- Auto-calcul: montant total
```

### 6. Debts/Index.jsx
```
jsx
// Tableau de bord dettes:
- SummaryCards: Total clients, Total fournisseurs
- Tabs: Clients | Fournisseurs
- Table dette client: nom, total dû, dernière transaction
- Table dette fournisseur: nom, total dû, dernière transaction
- Actions: Voir détails, ajouter paiement
```

## Flux de Données

### Avec Inertia.js
```
Laravel Controller → Inertia::render() → React Page Component
                                     ↓
                              props (data)
                                     ↓
                           Use: const { props } = usePage()
```

### Avec API (pour graphiques, stats)
```
React Component → useEffect() → API Service → Axios → Laravel API
                                        ↓
                              useState + useEffect
```

## Modèle de Données Props (Inertia)

### Page: Dashboard
```
javascript
{
  stats: {
    totalProducts: number,
    totalStockValue: number,
    lowStockCount: number,
    expiringSoonCount: number,
    totalClientDebt: number,
    totalSupplierDebt: number
  },
  chartData: {
    entries: [...],
    exits: [...]
  },
  alerts: {
    lowStock: [...],
    expiring: [...]
  }
}
```

### Page: Products Index
```
javascript
{
  products: {
    data: [...],
    current_page: number,
    last_page: number,
    per_page: number,
    total: number
  },
  filters: {
    search: string,
    category: string,
    stock_status: string
  }
}
```

## Design System - Tailwind CSS

### Couleurs
```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',    // Bleu principal
    600: '#0284c7',
    700: '#0369a1',
  },
  success: '#22c55e',  // Vert - Stock OK
  warning: '#f59e0b',  // Orange - Alerte
  danger: '#ef4444',   // Rouge - Critique/Peremption
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    // ...
  }
}
```

### Composants UI - Spécifications

#### Button
- Variants: primary, secondary, danger, outline
- Sizes: sm, md, lg
- States: default, hover, active, disabled, loading

#### Table
- Striped rows
- Hover effect
- Sortable columns
- Pagination controls
- Bulk selection

#### Card
- Shadow: sm, md, lg
- Padding: default (p-4), relaxed (p-6)
- Border radius: default (rounded-lg)

#### Modal
- Centered overlay
- Close on backdrop click
- Close on escape
- Header, body, footer sections

#### Alert
- Types: success, warning, error, info
- Icon, message, dismiss button
- Auto-dismiss timer (optionnel)

## Graphiques - ApexCharts

### LineChart - Entrées/Sorties
```
javascript
// Configuration ApexCharts
{
  chart: {
    type: 'area',
    height: 350,
    toolbar: { show: false }
  },
  colors: ['#0ea5e9', '#22c55e'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', ...]
  },
  legend: { position: 'top' }
}
```

### PieChart - Catégories Produits
```
javascript
{
  chart: {
    type: 'donut',
    height: 350
  },
  labels: ['Légumes', 'Fruits', 'Viandes', 'Produits Laitiers'],
  colors: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444']
}
```

## Recherche Temps Réel

### Implémentation avec React
```
javascript
// useSearch.js hook
const useSearch = (items, searchFields) => {
  const [query, setQuery] = useState('');
  
  const filtered = useMemo(() => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => 
        String(item[field]).toLowerCase().includes(lowerQuery)
      )
    );
  }, [items, query]);
  
  return { query, setQuery, filtered };
};
```

### Utilisation dans ProductIndex
```
javascript
const { query, setQuery, filteredProducts } = useSearch(
  products.data,
  ['name', 'barcode', 'category']
);
```

## Form Validation

### Avec React Hook Form
```
javascript
// ProductForm.jsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(productSchema)
});

<Input 
  {...register('name')}
  error={errors.name?.message}
/>
```

## Responsive Design

### Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md, lg)
- Desktop: > 1024px (xl, 2xl)

### Sidebar Mobile
- Hamburger menu
- Slide-in drawer
- Overlay backdrop

## Conclusion

Cette architecture fournit:
1. **Séparation claire** des préoccupations (UI, logique, données)
2. **Composants réutilisables** pour une maintenance facile
3. **Integration transparente** avec Laravel via Inertia
4. **Design cohérent** avec Tailwind CSS
5. **Graphiques interactifs** avec ApexCharts
6. **Recherche temps réel** côté client
7. **Validation côté client** avec React Hook Form + Zod
8. **Responsive design** pour mobile et desktop
