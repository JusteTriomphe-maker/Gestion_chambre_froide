import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SalesDemo } from '@/demo/SalesDemo'
import { ClientsDemo } from '@/demo/ClientsDemo'
import './globals.css'

const navigation = [
  { name: '🧾 Ventes', href: 'sales', current: true },
  { name: 'Clients', href: 'clients', current: false },
  { name: 'Produits', href: 'products', current: false },
  { name: 'Fournisseurs', href: 'suppliers', current: false },
]

function App() {
  const [currentPage, setCurrentPage] = useState<'sales' | 'clients'>('sales')

  const user = {
    name: 'John Doe',
    role: 'gerant'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar 
        navigation={navigation} 
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900">
              {currentPage === 'sales' ? 'Gestion des Ventes' : 'Clients'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              JD
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">John Doe</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {currentPage === 'sales' ? <SalesDemo /> : <ClientsDemo />}
        </main>
      </div>
    </div>
  )
}

export default App

