
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvitations } from '@/hooks/useInvitations';
import { usePublicInvitations } from '@/hooks/usePublicInvitations';
import { InvitationModal } from '@/components/InvitationModal';
import { PublicLinkModal } from '@/components/PublicLinkModal';
import { PermissionGuard, AccessDenied } from '@/components/PermissionGuard';
import { UserPlus, Mail, Clock, CheckCircle, XCircle, RotateCcw, AlertCircle, Copy, Check, Link, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const { publicLinks, isLoading: isLoadingPublicLinks, deactivatePublicLink, activatePublicLink } = usePublicInvitations();
  const [showModal, setShowModal] = useState(false);
  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const [copiedPublicLinks, setCopiedPublicLinks] = useState<Set<string>>(new Set());

  const getInvitationStatus = (invitation: any) => {
    // Sistema padrão Supabase - status baseado na data de criação
    const daysSinceCreated = Math.floor((Date.now() - new Date(invitation.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 7) return 'expired';
    return 'pending';
  };

  const getInvitationInfo = (invitation: any) => {
    return `Email: ${invitation.email} | Função: ${roleNames[invitation.role as keyof typeof roleNames]}`;
  };

  const copyInvitationInfo = async (invitation: any) => {
    try {
      const info = getInvitationInfo(invitation);
      await navigator.clipboard.writeText(info);
      setCopiedLinks(prev => new Set(prev).add(invitation.id));
      toast.success('Informações copiadas! Use o painel administrativo do Supabase para enviar o email.');
      
      // Remover o estado de copiado após 3 segundos
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(invitation.id);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      toast.error('Erro ao copiar informações');
    }
  };

  const copyPublicLink = async (publicLink: any) => {
    try {
      const link = `${window.location.origin}/registrar/${publicLink.token}`;
      await navigator.clipboard.writeText(link);
      setCopiedPublicLinks(prev => new Set(prev).add(publicLink.id));
      toast.success('Link copiado! Compartilhe com seus funcionários.');
      
      // Remover o estado de copiado após 3 segundos
      setTimeout(() => {
        setCopiedPublicLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(publicLink.id);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const getLinkStatus = (publicLink: any) => {
    if (!publicLink.is_active) return 'inactive';
    if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) return 'expired';
    if (publicLink.max_uses && publicLink.current_uses >= publicLink.max_uses) return 'exhausted';
    return 'active';
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

  const pendingInvitations = invitations.filter(inv => getInvitationStatus(inv) === 'pending');
  const acceptedInvitations = invitations.filter(() => false); // Sistema Supabase não rastreia aceitos na tabela
  const expiredInvitations = invitations.filter(inv => getInvitationStatus(inv) === 'expired');

  return (
    <PermissionGuard
      permission={{ module: 'users', resource: 'invitations', action: 'read' }}
      fallback={<AccessDenied message="Você não tem permissão para gerenciar convites." />}
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciar Convites</h1>
            <p className="text-muted-foreground">
              Convide novos usuários para sua organização e acompanhe o status dos convites
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Convite
          </Button>
        </div>

        {/* Estatísticas dos convites */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{invitations.length}</p>
                </div>
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingInvitations.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aceitos</p>
                  <p className="text-2xl font-bold text-green-600">{acceptedInvitations.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expirados</p>
                  <p className="text-2xl font-bold text-red-600">{expiredInvitations.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções sobre convites */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como funciona:</strong> Use convites por email para usuários específicos ou crie links públicos 
            que podem ser compartilhados em grupos para registro automático com configurações pré-definidas.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Convites por Email
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Links Públicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Convites Individuais</h3>
                <p className="text-sm text-muted-foreground">
                  Envie convites específicos por email
                </p>
              </div>
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Convite
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
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
                          const isCopied = copiedLinks.has(invitation.id);

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
                                {format(new Date(new Date(invitation.created_at).getTime() + 7 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {status === 'pending' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyInvitationInfo(invitation)}
                                      >
                                        {isCopied ? (
                                          <Check className="h-3 w-3 mr-1" />
                                        ) : (
                                          <Copy className="h-3 w-3 mr-1" />
                                        )}
                                        {isCopied ? 'Copiado!' : 'Copiar Info'}
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => cancelInvitation.mutate(invitation.id)}
                                    disabled={cancelInvitation.isPending}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Mail className="h-8 w-8 text-muted-foreground" />
                              <p>Nenhum convite enviado ainda.</p>
                              <Button onClick={() => setShowModal(true)} variant="outline" size="sm">
                                Enviar Primeiro Convite
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Links de Convite Público</h3>
                <p className="text-sm text-muted-foreground">
                  Crie links que podem ser compartilhados com múltiplos usuários
                </p>
              </div>
              <Button onClick={() => setShowPublicLinkModal(true)} className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Criar Link Público
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Função</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publicLinks.length > 0 ? (
                        publicLinks.map((publicLink) => {
                          const linkStatus = getLinkStatus(publicLink);
                          const isCopied = copiedPublicLinks.has(publicLink.id);

                          return (
                            <TableRow key={publicLink.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {roleNames[publicLink.role as keyof typeof roleNames] || publicLink.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    linkStatus === 'active' ? 'bg-green-100 text-green-800' :
                                    linkStatus === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {linkStatus === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {linkStatus === 'inactive' && <EyeOff className="h-3 w-3 mr-1" />}
                                  {(linkStatus === 'expired' || linkStatus === 'exhausted') && <XCircle className="h-3 w-3 mr-1" />}
                                  {linkStatus === 'active' ? 'Ativo' :
                                   linkStatus === 'inactive' ? 'Inativo' :
                                   linkStatus === 'expired' ? 'Expirado' : 'Esgotado'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {publicLink.current_uses}
                                {publicLink.max_uses ? `/${publicLink.max_uses}` : '/∞'}
                              </TableCell>
                              <TableCell>
                                {publicLink.expires_at 
                                  ? format(new Date(publicLink.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                  : 'Nunca'
                                }
                              </TableCell>
                              <TableCell>
                                {format(new Date(publicLink.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyPublicLink(publicLink)}
                                  >
                                    {isCopied ? (
                                      <Check className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Copy className="h-3 w-3 mr-1" />
                                    )}
                                    {isCopied ? 'Copiado!' : 'Copiar Link'}
                                  </Button>
                                  
                                  {publicLink.is_active ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deactivatePublicLink.mutate(publicLink.id)}
                                      disabled={deactivatePublicLink.isPending}
                                    >
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Desativar
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => activatePublicLink.mutate(publicLink.id)}
                                      disabled={activatePublicLink.isPending}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Ativar
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`/registrar/${publicLink.token}`, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Testar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Link className="h-8 w-8 text-muted-foreground" />
                              <p>Nenhum link público criado ainda.</p>
                              <Button onClick={() => setShowPublicLinkModal(true)} variant="outline" size="sm">
                                Criar Primeiro Link
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <InvitationModal
          open={showModal}
          onOpenChange={setShowModal}
        />
        
        <PublicLinkModal
          open={showPublicLinkModal}
          onOpenChange={setShowPublicLinkModal}
        />
      </div>
    </PermissionGuard>
  );
}
