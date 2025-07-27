import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  invitation_id: string;
  email: string;
  tenant_id: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { 
      invitation_id,
      email, 
      tenant_id,
      role
    }: InvitationRequest = await req.json();

    console.log('📧 Processando convite automático:', { invitation_id, email, role });

    // Buscar informações do tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('name, slug')
      .eq('id', tenant_id)
      .single();

    if (tenantError) {
      console.error('❌ Erro ao buscar tenant:', tenantError);
      throw tenantError;
    }

    const tenantName = tenantData?.name || 'Organização';
    const redirectTo = `${req.headers.get('origin') || supabaseUrl}/dashboard`;

    console.log('🚀 Enviando convite via Supabase Auth Admin API...');

    // Usar a API Admin do Supabase para convidar usuário
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectTo,
        data: {
          tenant_id: tenant_id,
          role: role,
          tenant_name: tenantName,
          invitation_id: invitation_id
        }
      }
    );

    if (inviteError) {
      console.error('❌ Erro ao enviar convite:', inviteError);
      throw inviteError;
    }

    console.log('✅ Convite enviado com sucesso via Supabase Auth:', inviteData.user?.email);

    // Atualizar convite com informações do envio
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        metadata: {
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          supabase_user_id: inviteData.user?.id,
          redirect_to: redirectTo,
          tenant_name: tenantName
        }
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar metadata do convite:', updateError);
      // Não falha a operação se não conseguir atualizar metadata
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Convite enviado automaticamente via Supabase Auth',
      user_id: inviteData.user?.id,
      email: inviteData.user?.email
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro no envio automático de convite:', error);
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