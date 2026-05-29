import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input, SearchInput } from '@/components/ui/input'

export function ClientsDemo() {
  const [showModal, setShowModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)

  const clients = [
    { id: 1, name: 'Jean Dupont', email: 'jean@example.com', phone: '+225 00000000', address: 'Abidjan Cocody', total_debt: 125000 },
    { id: 2, name: 'Marie Martin', email: 'marie@example.com', phone: '+225 11111111', address: '-', total_debt: 0 },
  ]

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-500 mt-1">Gérez vos clients et leurs dettes</p>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <SearchInput placeholder="Rechercher des clients..." className="w-full sm:w-96" />
        <Button 
          variant="emeraldGradient"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
        >
          Nouveau Client
        </Button>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Dette</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className={client.total_debt > 0 ? 'bg-red-50/50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar fallback={client.name.charAt(0)} />
                      <div className="font-semibold text-slate-900">{client.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.address}</TableCell>
                  <TableCell>
                    {client.total_debt > 0 ? (
                      <Badge variant="destructive">
                        {formatCurrency(client.total_debt)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      {client.total_debt > 0 && (
                        <Button variant="ghost" size="icon">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Client Modal */}
      {showModal && (
        <Dialog open={showModal} onClose={() => setShowModal(false)}>
          <DialogContent title="Nouveau Client">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <Input placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input type="email" placeholder="jean@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <Input placeholder="+225 00 00 00 00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <textarea className="w-full px-4 py-2.5 border border-slate-200 rounded-xl resize-vertical focus:ring-2 focus:ring-emerald-500" rows={3} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline">Annuler</Button>
              <Button variant="emeraldGradient">Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Pay Debt Modal */}
      {showPayModal && (
        <Dialog open={showPayModal} onClose={() => setShowPayModal(false)}>
          <DialogContent title="Payer la dette">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
                <Input type="number" placeholder="10000" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline">Annuler</Button>
              <Button variant="amberGradient">Confirmer</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

