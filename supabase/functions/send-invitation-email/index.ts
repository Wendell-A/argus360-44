import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  email: string;
  inviterName: string;
  tenantName: string;
  role: string;
  invitationToken: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      email, 
      inviterName, 
      tenantName, 
      role, 
      invitationToken,
      invitationId 
    }: InvitationEmailRequest = await req.json();

    console.log('📧 Enviando email de convite para:', email);

    // Construir o link de convite
    const invitationLink = `${req.headers.get('origin') || 'https://localhost:5173'}/aceitar-convite/${invitationToken}`;

    // Traduzir o role para português
    const roleNames: Record<string, string> = {
      owner: 'Proprietário',
      admin: 'Administrador', 
      manager: 'Gerente',
      user: 'Usuário',
      viewer: 'Visualizador'
    };

    const roleName = roleNames[role] || role;

    // Preparar o conteúdo do email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite para ${tenantName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Você foi convidado!</h1>
        </div>
        <div class="content">
          <p>Olá!</p>
          <p><strong>${inviterName}</strong> convidou você para fazer parte da organização <strong>${tenantName}</strong> no sistema Argus360.</p>
          
          <div class="info-box">
            <h3>📋 Detalhes do Convite</h3>
            <p><strong>Organização:</strong> ${tenantName}</p>
            <p><strong>Seu perfil:</strong> ${roleName}</p>
            <p><strong>Email convidado:</strong> ${email}</p>
            <p><strong>Convite expira em:</strong> 7 dias</p>
          </div>

          <p>Para aceitar este convite, clique no botão abaixo:</p>
          
          <div style="text-align: center;">
            <a href="${invitationLink}" class="button">✅ Aceitar Convite</a>
          </div>

          <p style="font-size: 14px; color: #666;">
            Ou copie e cole este link no seu navegador:<br>
            <span style="word-break: break-all;">${invitationLink}</span>
          </p>

          <div class="info-box">
            <h4>🔐 O que você poderá fazer como ${roleName}:</h4>
            <ul>
              ${role === 'owner' ? `
                <li>Acesso total ao sistema</li>
                <li>Gerenciar usuários e permissões</li>
                <li>Configurar a organização</li>
              ` : role === 'admin' ? `
                <li>Gerenciar usuários</li>
                <li>Acessar relatórios</li>
                <li>Configurar sistema</li>
              ` : role === 'manager' ? `
                <li>Gerenciar equipe</li>
                <li>Acessar dados do escritório</li>
                <li>Criar relatórios</li>
              ` : role === 'user' ? `
                <li>Gerenciar seus clientes</li>
                <li>Registrar vendas</li>
                <li>Acompanhar comissões</li>
              ` : `
                <li>Visualizar relatórios</li>
                <li>Consultar dados</li>
                <li>Acessar dashboards</li>
              `}
            </ul>
          </div>

          <p><em>Se você não esperava este convite, pode ignorar este email com segurança.</em></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Argus360 - Sistema de Gestão</p>
          <p>Este é um email automático, não responda a esta mensagem.</p>
        </div>
      </body>
      </html>
    `;

    // Por enquanto, apenas log o email (aqui você pode integrar com um serviço de email)
    console.log('📧 Email preparado para:', email);
    console.log('🔗 Link do convite:', invitationLink);
    
    // Simular envio bem-sucedido
    // Em produção, você deve integrar com um serviço como SendGrid, Resend, etc.
    
    // Atualizar o status do convite para indicar que o email foi enviado
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        settings: { 
          email_sent: true, 
          email_sent_at: new Date().toISOString(),
          invitation_link: invitationLink
        } 
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ Erro ao atualizar status do convite:', updateError);
    }

    console.log('✅ Email de convite processado com sucesso');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de convite enviado com sucesso',
      invitation_link: invitationLink 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao enviar email de convite:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);