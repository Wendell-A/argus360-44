import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProposalWithClient, useUpdateProposal } from '@/hooks/useProposals';

interface ProposalEditModalProps {
  proposal: ProposalWithClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalEditModal({ proposal, open, onOpenChange }: ProposalEditModalProps) {
  const updateProposal = useUpdateProposal();
  
  const [formData, setFormData] = useState({
    valor_da_simulacao: proposal?.valor_da_simulacao || 0,
    valor_da_parcela: proposal?.valor_da_parcela || 0,
    prazo: proposal?.prazo || 0,
    taxa_comissao_escritorio: proposal?.taxa_comissao_escritorio || 0,
    taxa_comissao_vendedor: proposal?.taxa_comissao_vendedor || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    await updateProposal.mutateAsync({
      id: proposal.id,
      ...formData,
    });

    onOpenChange(false);
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Orçamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor_simulacao">Valor da Simulação (R$)</Label>
            <Input
              id="valor_simulacao"
              type="number"
              step="0.01"
              value={formData.valor_da_simulacao}
              onChange={(e) => setFormData({ ...formData, valor_da_simulacao: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_parcela">Valor da Parcela (R$)</Label>
            <Input
              id="valor_parcela"
              type="number"
              step="0.01"
              value={formData.valor_da_parcela}
              onChange={(e) => setFormData({ ...formData, valor_da_parcela: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prazo">Prazo (meses)</Label>
            <Input
              id="prazo"
              type="number"
              value={formData.prazo}
              onChange={(e) => setFormData({ ...formData, prazo: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxa_escritorio">Taxa Comissão Escritório (%)</Label>
            <Input
              id="taxa_escritorio"
              type="number"
              step="0.01"
              value={formData.taxa_comissao_escritorio}
              onChange={(e) => setFormData({ ...formData, taxa_comissao_escritorio: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxa_vendedor">Taxa Comissão Vendedor (%)</Label>
            <Input
              id="taxa_vendedor"
              type="number"
              step="0.01"
              value={formData.taxa_comissao_vendedor}
              onChange={(e) => setFormData({ ...formData, taxa_comissao_vendedor: parseFloat(e.target.value) })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProposal.isPending}>
              {updateProposal.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
