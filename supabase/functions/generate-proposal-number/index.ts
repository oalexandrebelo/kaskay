import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Não autorizado' }, { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401, headers: corsHeaders });
    }

    // Gerar ano/mês atual
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PROP-${yearMonth}-`;

    // Buscar última proposta do mês atual para sequência
    const { data: lastProposal } = await supabaseAdmin
      .from('proposals')
      .select('numero')
      .like('numero', `${prefix}%`)
      .order('numero', { ascending: false })
      .limit(1);

    let nextSeq = 1;
    if (lastProposal && lastProposal.length > 0) {
      const lastNum = lastProposal[0].numero;
      const match = lastNum.match(/PROP-\d{6}-(\d+)/);
      if (match) {
        nextSeq = parseInt(match[1]) + 1;
      }
    }

    const proposalNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    return Response.json({ proposal_number: proposalNumber }, { headers: corsHeaders });

  } catch (error) {
    console.error('Erro ao gerar número de proposta:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
