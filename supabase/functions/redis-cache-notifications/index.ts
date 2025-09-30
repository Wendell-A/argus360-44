import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const REDIS_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const REDIS_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedisCommand {
  action: 'get' | 'set' | 'delete' | 'invalidate' | 'notifications_count';
  key?: string;
  value?: any;
  ttl?: number;
  pattern?: string;
  userId?: string;
}

async function redisRequest(commands: string[]): Promise<any> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.warn('Redis not configured, skipping cache');
    return null;
  }

  try {
    const response = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.error('Redis request failed:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Redis error:', error);
    return null;
  }
}

async function handleNotificationsCount(userId: string) {
  const cacheKey = `user:${userId}:unread_notifications_count`;
  
  // Tentar obter do cache
  const cached = await redisRequest([['GET', cacheKey]]);
  
  if (cached && cached[0]?.result !== null) {
    console.log('Cache HIT para notificações do usuário:', userId);
    return {
      count: parseInt(cached[0].result),
      source: 'cache',
      cached_at: new Date().toISOString(),
    };
  }
  
  console.log('Cache MISS para notificações do usuário:', userId);
  
  // Se não está no cache, buscar do banco e cachear
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('Erro ao buscar notificações:', error);
    throw error;
  }
  
  const notificationCount = count || 0;
  
  // Cachear por 10 minutos (600 segundos)
  await redisRequest([
    ['SET', cacheKey, notificationCount.toString()],
    ['EXPIRE', cacheKey, '600'],
  ]);
  
  return {
    count: notificationCount,
    source: 'database',
    fetched_at: new Date().toISOString(),
  };
}

async function handleGet(key: string) {
  const result = await redisRequest([['GET', key]]);
  
  if (!result || !result[0]) {
    return { value: null, cached: false };
  }
  
  const value = result[0].result;
  
  if (value === null) {
    return { value: null, cached: false };
  }
  
  try {
    return { value: JSON.parse(value), cached: true };
  } catch {
    return { value, cached: true };
  }
}

async function handleSet(key: string, value: any, ttl?: number) {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  const commands: string[][] = [['SET', key, stringValue]];
  
  if (ttl && ttl > 0) {
    commands.push(['EXPIRE', key, ttl.toString()]);
  }
  
  await redisRequest(commands);
  
  return { success: true, key, ttl };
}

async function handleDelete(key: string) {
  await redisRequest([['DEL', key]]);
  return { success: true, deleted: key };
}

async function handleInvalidate(pattern?: string, userId?: string) {
  if (userId) {
    // Invalidar cache de notificações de um usuário específico
    const userKey = `user:${userId}:unread_notifications_count`;
    await redisRequest([['DEL', userKey]]);
    console.log('Invalidado cache de notificações para usuário:', userId);
    return { success: true, invalidated: userKey };
  }
  
  if (pattern) {
    // Buscar e deletar chaves que correspondem ao padrão
    const keys = await redisRequest([['KEYS', pattern]]);
    
    if (keys && keys[0]?.result && Array.isArray(keys[0].result)) {
      const deleteCommands = keys[0].result.map((k: string) => ['DEL', k]);
      if (deleteCommands.length > 0) {
        await redisRequest(deleteCommands);
      }
      return { success: true, invalidated: keys[0].result.length };
    }
  }
  
  return { success: true, invalidated: 0 };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const command: RedisCommand = await req.json();
    
    console.log('Redis command received:', command.action);
    
    let result;
    
    switch (command.action) {
      case 'notifications_count':
        if (!command.userId) {
          throw new Error('userId é obrigatório para notifications_count');
        }
        result = await handleNotificationsCount(command.userId);
        break;
        
      case 'get':
        if (!command.key) {
          throw new Error('key é obrigatória para get');
        }
        result = await handleGet(command.key);
        break;
        
      case 'set':
        if (!command.key || command.value === undefined) {
          throw new Error('key e value são obrigatórios para set');
        }
        result = await handleSet(command.key, command.value, command.ttl);
        break;
        
      case 'delete':
        if (!command.key) {
          throw new Error('key é obrigatória para delete');
        }
        result = await handleDelete(command.key);
        break;
        
      case 'invalidate':
        result = await handleInvalidate(command.pattern, command.userId);
        break;
        
      default:
        throw new Error(`Ação desconhecida: ${command.action}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
