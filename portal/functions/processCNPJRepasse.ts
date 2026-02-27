import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cnpj, convenio_id, periodo, arquivo_retorno } = await req.json();

    // Buscar empresa
    const companies = await base44.asServiceRole.entities.CompanyCredential.filter({ cnpj });
    if (!companies || companies.length === 0) {
      return Response.json({ error: 'CNPJ não encontrado' }, { status: 404 });
    }
    const company = companies[0];

    // Buscar propostas deste CNPJ no convênio
    const allProposals = await base44.asServiceRole.entities.Proposal.filter({ 
      operating_cnpj: cnpj,
      convenio_id,
      status: 'disbursed',
    });

    // Buscar parcelas do período
    const allInstallments = await base44.asServiceRole.entities.Installment.list();
    const periodStart = new Date(periodo + '-01');
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const installmentsPeriodo = allInstallments.filter(inst => {
      const dueDate = new Date(inst.due_date);
      return dueDate >= periodStart && dueDate < periodEnd && 
             allProposals.some(p => p.id === inst.proposal_id);
    });

    // Calcular valor esperado
    const valorEsperado = installmentsPeriodo.reduce((sum, i) => sum + (i.expected_amount || 0), 0);

    // Simular parsing do arquivo de retorno (na prática, parse CSV/TXT real)
    const contratosRetorno = parseArquivoRetorno(arquivo_retorno);
    
    // Calcular valor recebido e identificar não descontados
    let valorRecebido = 0;
    const contratosInclusos = [];

    for (const inst of installmentsPeriodo) {
      const contratoRetorno = contratosRetorno.find(c => c.cpf === inst.client_cpf);
      
      if (!contratoRetorno) {
        contratosInclusos.push({
          proposal_id: inst.proposal_id,
          client_cpf: inst.client_cpf,
          valor_parcela: inst.expected_amount,
          status: 'nao_descontado',
          motivo_nao_desconto: 'não_encontrado_arquivo',
        });
      } else if (contratoRetorno.valor_descontado < inst.expected_amount) {
        valorRecebido += contratoRetorno.valor_descontado;
        contratosInclusos.push({
          proposal_id: inst.proposal_id,
          client_cpf: inst.client_cpf,
          valor_parcela: inst.expected_amount,
          status: 'desconto_parcial',
          motivo_nao_desconto: contratoRetorno.motivo || 'desconto_parcial',
        });
      } else {
        valorRecebido += contratoRetorno.valor_descontado;
        contratosInclusos.push({
          proposal_id: inst.proposal_id,
          client_cpf: inst.client_cpf,
          valor_parcela: inst.expected_amount,
          status: 'descontado',
        });
      }
    }

    const divergencia = valorEsperado - valorRecebido;
    const percentualDivergencia = valorEsperado > 0 ? (divergencia / valorEsperado) * 100 : 0;

    // Criar registro de repasse
    const repasse = await base44.asServiceRole.entities.CNPJRepasse.create({
      cnpj,
      company_name: company.razao_social,
      convenio_id,
      periodo,
      valor_esperado: valorEsperado,
      valor_recebido: valorRecebido,
      valor_divergencia: divergencia,
      percentual_divergencia: percentualDivergencia,
      contratos_inclusos: contratosInclusos,
      status: Math.abs(divergencia) > 100 ? 'divergente' : 'conciliado',
      data_repasse: new Date().toISOString(),
    });

    // Gerar alertas para contratos não descontados
    const naoDescontados = contratosInclusos.filter(c => c.status !== 'descontado');
    
    if (naoDescontados.length > 0) {
      await base44.asServiceRole.entities.Alert.create({
        title: `${naoDescontados.length} contratos não descontados - ${company.razao_social}`,
        description: `CNPJ ${cnpj} - Período ${periodo}`,
        severity: 'warning',
        category: 'financial',
        entity_type: 'CNPJRepasse',
        entity_id: repasse.id,
        status: 'active',
      });
    }

    return Response.json({
      success: true,
      repasse_id: repasse.id,
      summary: {
        valor_esperado: valorEsperado,
        valor_recebido: valorRecebido,
        divergencia,
        percentual_divergencia: percentualDivergencia.toFixed(2),
        contratos_total: contratosInclusos.length,
        nao_descontados: naoDescontados.length,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function parseArquivoRetorno(arquivo) {
  // Placeholder: na prática, parse CSV/TXT do arquivo de retorno da gestora
  // Retorna array de { cpf, valor_descontado, motivo }
  return [];
}