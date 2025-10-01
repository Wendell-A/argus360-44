/**
 * Página de Perfil do Usuário
 * Data: 30 de Setembro de 2025
 * 
 * Permite visualizar e editar informações pessoais, credenciais e dados da organização
 */

import { useState, useEffect } from 'react';
import { Loader2, Save, Building2, Users, Briefcase, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { ChangeEmailModal } from '@/components/modals/ChangeEmailModal';
import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const {
    profileData,
    organizationData,
    isLoading,
    isUploadingAvatar,
    updateProfile,
    isUpdatingProfile,
    uploadAvatar,
    changeEmail,
    isChangingEmail,
    changePassword,
    isChangingPassword,
  } = useProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Inicializar campos quando os dados carregarem
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
    }
  }, [profileData]);

  const handleSaveProfile = () => {
    updateProfile({
      full_name: fullName,
      phone: phone,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      {/* Card: Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize sua foto, nome e telefone de contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload
            currentAvatarUrl={profileData?.avatar_url || null}
            userName={profileData?.full_name || null}
            onUpload={uploadAvatar}
            isUploading={isUploadingAvatar}
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nome Completo</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isUpdatingProfile}
            className="w-full sm:w-auto"
          >
            {isUpdatingProfile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Card: Acesso e Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso e Segurança</CardTitle>
          <CardDescription>
            Gerencie suas credenciais de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">E-mail</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {profileData?.email}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEmailModalOpen(true)}
              disabled={isChangingEmail}
            >
              Alterar E-mail
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Senha</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                ••••••••
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
              disabled={isChangingPassword}
            >
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card: Informações da Organização */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Organização</CardTitle>
          <CardDescription>
            Dados da sua empresa e função no sistema (somente leitura)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </Label>
              <Input
                id="tenant"
                value={organizationData?.tenant_name || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="office" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Escritório
              </Label>
              <Input
                id="office"
                value={organizationData?.office_name || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Perfil de Acesso
              </Label>
              <Input
                id="role"
                value={organizationData?.role || 'N/A'}
                disabled
                className="bg-muted capitalize"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Cargo
              </Label>
              <Input
                id="position"
                value={organizationData?.position_name || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {organizationData?.department_name && (
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Departamento
              </Label>
              <Input
                id="department"
                value={organizationData.department_name}
                disabled
                className="bg-muted"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        onConfirm={changePassword}
        isLoading={isChangingPassword}
      />

      <ChangeEmailModal
        open={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
        currentEmail={profileData?.email || ''}
        onConfirm={changeEmail}
        isLoading={isChangingEmail}
      />
    </div>
  );
}
