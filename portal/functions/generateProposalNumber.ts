import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar última proposta para gerar número sequencial
    const proposals = await base44.asServiceRole.entities.Proposal.list('-created_date', 1);
    
    let nextNumber = 1;
    if (proposals.length > 0 && proposals[0].proposal_number) {
      // Extrair número da última proposta (formato: PROP-YYYYMM-XXXX)
      const lastNumber = proposals[0].proposal_number;
      const match = lastNumber.match(/PROP-\d{6}-(\d+)/);
      if (match) {
        const lastSeq = parseInt(match[1]);
        const lastMonth = lastNumber.substring(5, 11); // YYYYMM
        const currentMonth = new Date().toISOString().substring(0, 7).replace('-', '');
        
        // Se mudou o mês, reinicia contador
        if (lastMonth === currentMonth) {
          nextNumber = lastSeq + 1;
        }
      }
    }

    // Gerar número no formato PROP-YYYYMM-XXXX
    const yearMonth = new Date().toISOString().substring(0, 7).replace('-', '');
    const proposalNumber = `PROP-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;

    return Response.json({ proposal_number: proposalNumber });
    
  } catch (error) {
    console.error('Erro ao gerar número de proposta:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});