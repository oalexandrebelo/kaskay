import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { compare } from 'https://esm.sh/bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_type, identifier, password } = await req.json();

    if (!user_type || !identifier || !password || !['client', 'server'].includes(user_type)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const table = user_type === 'client' ? 'client_users' : 'server_users';

    // Buscar usuário por CPF
    const { data: users, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('cpf', identifier.replace(/\D/g, ''))
      .limit(1);

    if (fetchError) throw fetchError;

    if (!users || users.length === 0) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401, headers: corsHeaders });
    }

    const user = users[0];

    // Verificar se completou primeiro acesso (apenas server_users)
    if (user_type === 'server' && !user.convite_aceito) {
      return Response.json({ error: 'Convite não aceito. Verifique seu e-mail.' }, { status: 403, headers: corsHeaders });
    }

    // Verificar se está ativo
    if (!user.ativo) {
      return Response.json({ error: 'Usuário inativo' }, { status: 403, headers: corsHeaders });
    }

    // Autenticar via Supabase Auth usando o e-mail associado ao CPF
    if (!user.email) {
      return Response.json({ error: 'Usuário sem e-mail configurado' }, { status: 403, headers: corsHeaders });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (authError) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401, headers: corsHeaders });
    }

    // Atualizar último login
    await supabaseAdmin
      .from(table)
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', user.id);

    return Response.json({
      success: true,
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      user: {
        id: user.id,
        cpf: user.cpf,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        role: user.role ?? 'cliente',
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Portal Login Error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
