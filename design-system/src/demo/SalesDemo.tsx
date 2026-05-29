import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, StatCard, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'

export function SalesDemo() {
  const [showNewSale, setShowNewSale] = useState(false)

  const dailySummary = {
    total_amount: 1250000,
    transaction_count: 23,
    date: '20 Oct 2024',
    sales_by_product: [{ product_name: 'Tomate' }]
  }

  const sales = [
    { id: 1, receipt_number: 'REC-001', sale_date: '2024-10-20', client: { name: 'Jean Dupont' }, user: { name: 'John Doe' }, total_amount: 45000 },
    { id: 2, receipt_number: 'REC-002', sale_date: '2024-10-20', client: { name: 'Marie Martin' }, user: { name: 'John Doe' }, total_amount: 85000 },
  ]

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Ventes</h1>
          <Button 
            variant="redGradient" 
            onClick={() => setShowNewSale(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle Vente
          </Button>
        </div>

        {/* Daily Stats */}
        {dailySummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard color="red">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-red-700">1 250 000 FCFA</CardTitle>
                <CardDescription>Ventes du jour</CardDescription>
              </CardHeader>
              <CardDescription className="text-xs text-slate-500">20 Oct 2024</CardDescription>
            </StatCard>
            <StatCard color="blue">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-700">23</CardTitle>
                <CardDescription>Nombre de transactions</CardDescription>
              </CardHeader>
            </StatCard>
            <StatCard color="green">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-700">Tomate</CardTitle>
                <CardDescription>Top Produit</CardDescription>
              </CardHeader>
            </StatCard>
          </div>
        )}

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Reçu</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Caissier</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.receipt_number}</TableCell>
                    <TableCell>20 Oct 2024</TableCell>
                    <TableCell>{sale.client.name}</TableCell>
                    <TableCell>{sale.user.name}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer">
                        Voir reçu
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Sale Modal Demo */}
      {showNewSale && (
        <Dialog open={showNewSale} onClose={() => setShowNewSale(false)}>
          <DialogContent title="Nouvelle Vente">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tapez un nom de client..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <select className="border border-slate-200 rounded-xl px-3 py-2">
                  <option>Sélectionner produit</option>
                </select>
                <input type="number" className="border border-slate-200 rounded-xl px-3 py-2" />
                <Button className="w-full" variant="emeraldGradient">Ajouter</Button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowNewSale(false)}>
                Annuler
              </Button>
              <Button variant="redGradient">Valider la vente</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

