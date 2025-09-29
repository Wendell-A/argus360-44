import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProposalWithClient, useProposalsWithClient, useProposalsTotalValue } from '@/hooks/useProposals';
import { ProposalEditModal } from '@/components/proposals/ProposalEditModal';
import { ProposalDeleteDialog } from '@/components/proposals/ProposalDeleteDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Proposals() {
  const navigate = useNavigate();
  const { data: proposals, isLoading } = useProposalsWithClient();
  const { data: totalValue, isLoading: isLoadingTotal } = useProposalsTotalValue();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProposal, setEditingProposal] = useState<ProposalWithClient | null>(null);
  const [deletingProposal, setDeletingProposal] = useState<{ id: string; name: string } | null>(null);

  const filteredProposals = proposals?.filter(proposal =>
    proposal.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os orçamentos que ainda não foram convertidos em vendas
          </p>
        </div>
      </div>

      {/* Card de Previsibilidade */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Previsibilidade de Valor
          </CardTitle>
          <CardDescription>
            Soma total de todos os orçamentos em aberto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTotal ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(totalValue || 0)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Busca */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabela de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !filteredProposals || filteredProposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">
                      {proposal.client_name}
                    </TableCell>
                    <TableCell>{formatCurrency(proposal.valor_da_simulacao)}</TableCell>
                    <TableCell>{formatCurrency(proposal.valor_da_parcela)}</TableCell>
                    <TableCell>{proposal.prazo}x</TableCell>
                    <TableCell>{formatDate(proposal.data_da_simulacao)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {proposal.client_phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleWhatsApp(proposal.client_phone)}
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/clients/${proposal.client_id}`)}
                          title="Ver no CRM"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingProposal(proposal)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingProposal({ 
                            id: proposal.id, 
                            name: proposal.client_name 
                          })}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <ProposalEditModal
        proposal={editingProposal}
        open={!!editingProposal}
        onOpenChange={(open) => !open && setEditingProposal(null)}
      />

      <ProposalDeleteDialog
        proposalId={deletingProposal?.id || null}
        clientName={deletingProposal?.name || ''}
        open={!!deletingProposal}
        onOpenChange={(open) => !open && setDeletingProposal(null)}
      />
    </div>
  );
}
