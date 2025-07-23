
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInvitations } from '@/hooks/useInvitations';
import { InvitationModal } from '@/components/InvitationModal';
import { PermissionGuard, AccessDenied } from '@/components/PermissionGuard';
import { UserPlus, Mail, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const roleNames = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  viewer: 'Visualizador'
};

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Aceito', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  expired: { label: 'Expirado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function Convites() {
  const { invitations, isLoading, cancelInvitation, resendInvitation } = useInvitations();
  const [showModal, setShowModal] = useState(false);

  const getInvitationStatus = (invitation: any) => {
    if (invitation.status === 'accepted') return 'accepted';
    if (new Date(invitation.expires_at) < new Date()) return 'expired';
    return 'pending';
  };

  const getInvitationLink = (token: string) => {
    return `${window.location.origin}/aceitar-convite/${token}`;
  };

  const copyInvitationLink = (token: string) => {
    navigator.clipboard.writeText(getInvitationLink(token));
    // toast.success('Link copiado para a área de transferência!');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando convites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard
      permission={{ module: 'users', resource: 'invitations', action: 'read' }}
      fallback={<AccessDenied message="Você não tem permissão para gerenciar convites." />}
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Convites</h1>
            <p className="text-muted-foreground">
              Gerencie convites para novos usuários da sua organização
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Convite
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Convites Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.length > 0 ? (
                    invitations.map((invitation) => {
                      const status = getInvitationStatus(invitation);
                      const statusInfo = statusConfig[status];
                      const StatusIcon = statusInfo.icon;

                      return (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitation.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {roleNames[invitation.role as keyof typeof roleNames] || invitation.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invitation.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invitation.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyInvitationLink(invitation.token)}
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Copiar Link
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resendInvitation.mutate(invitation.id)}
                                    disabled={resendInvitation.isPending}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reenviar
                                  </Button>
                                </>
                              )}
                              {status === 'expired' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resendInvitation.mutate(invitation.id)}
                                  disabled={resendInvitation.isPending}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Renovar
                                </Button>
                              )}
                              {status !== 'accepted' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelInvitation.mutate(invitation.id)}
                                  disabled={cancelInvitation.isPending}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum convite enviado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <InvitationModal
          open={showModal}
          onOpenChange={setShowModal}
        />
      </div>
    </PermissionGuard>
  );
}
