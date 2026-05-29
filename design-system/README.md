# Chambre Froide Design System

Design system extrait fidèlement du projet Laravel/React/Tailwind "PROJET Chambre froide". Reproduit exactement:
- **ModernLayout** (sidebar slate-900, gradients indigo/purple/emerald)
- **Couleurs/espacements/shadows** (slate, red/emerald/amber gradients, rounded-2xl)
- **Composants/pages** (Sales/Clients tables, modals, stats cards, badges avatars)
- **Emojis** (🧾 Ventes), backdrops, transitions

## 🚀 Démo
```bash
cd design-system
npm install
npm run dev
```
Ouvrir http://localhost:5173 - Naviguez entre Ventes/Clients (exact visuel original).

## 📦 Intégration dans nouveau projet React (Vite/CRA)

1. **Créer projet Vite:**
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

2. **Installer design system deps:**
```bash
npm i @headlessui/react clsx tailwind-merge lucide-react
npm i -D tailwindcss postcss autoprefixer tailwindcss-animate class-variance-authority
npx tailwindcss init -p
```

3. **Copier fichiers:**
```
src/
├── lib/utils.ts (cn)
├── components/ui/ (Button Input Card Table etc.)
├── components/layout/ (Sidebar)
└── globals.css (@tailwind + vars)
```
```
tailwind.config.js (copier extend theme)
postcss.config.js
```

4. **Utilisation:**
```tsx
import { Button } from '@/components/ui/button'
import { Card, StatCard } from '@/components/ui/card'
// etc.

<Sidebar navigation={nav} user={user} />
<Button variant="emeraldGradient">Nouvelle Vente</Button>
<StatCard color="red"><CardTitle>1 250 000 FCFA</CardTitle></StatCard>
```

## 🎨 Design Tokens Exact
- **Theme:** Modern slate + accents (emerald/red/amber/gradient purple-indigo)
- **Typography:** Figtree, text-xs uppercase buttons
- **Radius:** rounded-xl/2xl
- **Shadows:** shadow-lg/2xl slate-500/20

## ✅ Structure Complète
```
design-system/
├── components/ui/     ← Primitives shadcn-style (variants)
├── components/layout/ ← Sidebar exact
├── demo/             ← Sales/Clients pages exactes
├── lib/utils.ts      ← cn()
├── tailwind.config.js← Tokens extraits
└── Full Vite project
```

**100% portable** - zéro Laravel/Inertia deps. Copiez dans n'importe quel React/Tailwind!

Testé ✅ `npm run dev` montre Ventes/Clients exacts.

