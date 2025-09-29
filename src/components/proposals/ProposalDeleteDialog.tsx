import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteProposal } from '@/hooks/useProposals';

interface ProposalDeleteDialogProps {
  proposalId: string | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalDeleteDialog({ 
  proposalId, 
  clientName, 
  open, 
  onOpenChange 
}: ProposalDeleteDialogProps) {
  const deleteProposal = useDeleteProposal();

  const handleDelete = async () => {
    if (!proposalId) return;
    
    await deleteProposal.mutateAsync(proposalId);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o orçamento do cliente <strong>{clientName}</strong>? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteProposal.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProposal.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
