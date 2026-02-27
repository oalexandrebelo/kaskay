import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { proposal_id } = await req.json();

    // Buscar proposta
    const proposal = await base44.asServiceRole.entities.Proposal.filter({ id: proposal_id });
    if (!proposal || proposal.length === 0) {
      return Response.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const prop = proposal[0];

    // Buscar CNPJs credenciados para este convênio
    const allCredentials = await base44.asServiceRole.entities.CompanyCredential.filter({ is_active: true });
    const eligibleCNPJs = allCredentials.filter(cred => 
      cred.convenios_vinculados?.includes(prop.convenio_id)
    );

    if (eligibleCNPJs.length === 0) {
      return Response.json({ 
        error: 'Nenhum CNPJ credenciado para este convênio',
        proposal_id 
      }, { status: 400 });
    }

    // Ordenar por prioridade e limite disponível
    const sortedCNPJs = eligibleCNPJs
      .map(cnpj => ({
        ...cnpj,
        limite_disponivel: (cnpj.limite_producao_mensal || Infinity) - (cnpj.producao_atual_mes || 0),
      }))
      .filter(cnpj => cnpj.limite_disponivel > prop.approved_amount) // Só CNPJs com limite
      .sort((a, b) => {
        // Primeiro por prioridade, depois por limite disponível
        if (a.prioridade !== b.prioridade) {
          return a.prioridade - b.prioridade;
        }
        return b.limite_disponivel - a.limite_disponivel;
      });

    if (sortedCNPJs.length === 0) {
      return Response.json({ 
        error: 'Todos os CNPJs atingiram limite de produção',
        proposal_id 
      }, { status: 400 });
    }

    // Selecionar o primeiro (melhor) CNPJ
    const selectedCNPJ = sortedCNPJs[0];

    // Buscar rubrica correta para o produto
    const rubrica = selectedCNPJ.rubricas_averbacao?.find(r => 
      r.produto_type === prop.product_type
    );

    if (!rubrica) {
      return Response.json({ 
        error: `Rubrica não encontrada para produto ${prop.product_type}`,
        cnpj: selectedCNPJ.cnpj 
      }, { status: 400 });
    }

    // Atualizar proposta com CNPJ e rubrica
    await base44.asServiceRole.entities.Proposal.update(proposal_id, {
      operating_cnpj: selectedCNPJ.cnpj,
      operating_company: selectedCNPJ.razao_social,
      rubrica_averbacao: rubrica.codigo_rubrica,
      rubrica_descricao: rubrica.descricao,
    });

    // Atualizar produção do CNPJ
    await base44.asServiceRole.entities.CompanyCredential.update(selectedCNPJ.id, {
      producao_atual_mes: (selectedCNPJ.producao_atual_mes || 0) + prop.approved_amount,
    });

    // Log de orquestração
    await base44.asServiceRole.entities.OrchestrationLog.create({
      entity_type: 'Proposal',
      entity_id: proposal_id,
      service: 'CNPJ_Routing',
      action: 'route_to_cnpj',
      status: 'success',
      details: {
        cnpj: selectedCNPJ.cnpj,
        company: selectedCNPJ.razao_social,
        rubrica: rubrica.codigo_rubrica,
        amount: prop.approved_amount,
        prioridade: selectedCNPJ.prioridade,
      },
    });

    return Response.json({
      success: true,
      proposal_id,
      selected_cnpj: {
        cnpj: selectedCNPJ.cnpj,
        razao_social: selectedCNPJ.razao_social,
        rubrica: rubrica.codigo_rubrica,
        limite_disponivel: selectedCNPJ.limite_disponivel,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});