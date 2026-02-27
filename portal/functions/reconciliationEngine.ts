import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { remessa_file_id, retorno_file_id } = body;

    if (!remessa_file_id || !retorno_file_id) {
      return Response.json({ error: 'Missing file IDs' }, { status: 400 });
    }

    // Get files
    const remessaFile = (await base44.asServiceRole.entities.PayrollFile.list()).find(f => f.id === remessa_file_id);
    const retornoFile = (await base44.asServiceRole.entities.PayrollFile.list()).find(f => f.id === retorno_file_id);

    if (!remessaFile || !retornoFile) {
      return Response.json({ error: 'Files not found' }, { status: 404 });
    }

    // Create reconciliation record
    const reconciliation = await base44.asServiceRole.entities.FinancialReconciliation.create({
      employer: remessaFile.employer,
      period: remessaFile.period,
      remessa_file_id,
      retorno_file_id,
      remessa_total: remessaFile.total_amount,
      retorno_total: retornoFile.total_amount,
      status: 'reconciling',
      processed_at: new Date().toISOString(),
    });

    // Fetch installments and proposals
    const installments = await base44.asServiceRole.entities.Installment.list();
    const proposals = await base44.asServiceRole.entities.Proposal.list();

    // Parse files (simulated - in real scenario parse CSV/TXT)
    const remessaRecords = parsePayrollFile(remessaFile);
    const retornoRecords = parsePayrollFile(retornoFile);

    const divergencies = [];
    let receivedTotal = 0;

    // Compare retorno with actual receipts
    for (const retorno of retornoRecords) {
      // Find matching installment
      const installment = installments.find(i => i.client_cpf === retorno.cpf && i.proposal_id === retorno.proposal_id);
      
      if (!installment) {
        divergencies.push({
          type: 'missing_return',
          cpf: retorno.cpf,
          retorno_amount: retorno.amount,
          description: `Registro no retorno sem proposta correspondente`,
        });
        continue;
      }

      // Check amount match
      if (retorno.amount !== installment.expected_amount) {
        divergencies.push({
          type: 'amount_mismatch',
          cpf: retorno.cpf,
          proposal_id: retorno.proposal_id,
          retorno_amount: retorno.amount,
          received_amount: installment.expected_amount,
          description: `Valor no retorno (R$ ${retorno.amount}) diferente do esperado (R$ ${installment.expected_amount})`,
        });
      }

      receivedTotal += retorno.amount;
    }

    // Check for missing returns
    for (const remessa of remessaRecords) {
      const retorno = retornoRecords.find(r => r.cpf === remessa.cpf && r.proposal_id === remessa.proposal_id);
      
      if (!retorno) {
        divergencies.push({
          type: 'missing_return',
          cpf: remessa.cpf,
          remessa_amount: remessa.amount,
          description: `Proposta enviada na remessa mas não retornada`,
        });
      }
    }

    // Calculate variance
    const variance = retornoFile.total_amount - receivedTotal;
    const variancePercentage = (variance / retornoFile.total_amount) * 100;

    // Update reconciliation
    const finalStatus = divergencies.length === 0 ? 'reconciled' : 'with_divergencies';
    
    await base44.asServiceRole.entities.FinancialReconciliation.update(reconciliation.id, {
      received_total: receivedTotal,
      variance_amount: variance,
      variance_percentage: variancePercentage,
      divergencies,
      status: finalStatus,
    });

    // Create alerts for significant divergencies
    if (Math.abs(variancePercentage) > 5) {
      await base44.asServiceRole.entities.Alert.create({
        alert_type: 'reconciliation_divergence',
        severity: variance > 0 ? 'high' : 'critical',
        title: `Divergência de reconciliação - ${remessaFile.employer}`,
        description: `Variância de ${variancePercentage.toFixed(2)}% no período ${remessaFile.period}`,
        metrics: {
          remessa_total: remessaFile.total_amount,
          retorno_total: retornoFile.total_amount,
          received_total: receivedTotal,
          variance: variance,
          variance_percentage: variancePercentage,
        },
        triggered_at: new Date().toISOString(),
      });
    }

    return Response.json({
      reconciliation_id: reconciliation.id,
      status: finalStatus,
      remessa_total: remessaFile.total_amount,
      retorno_total: retornoFile.total_amount,
      received_total: receivedTotal,
      variance: variance,
      variance_percentage: variancePercentage,
      divergencies_count: divergencies.length,
      divergencies,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Simulated payroll file parser
function parsePayrollFile(file) {
  // In real scenario, parse actual CSV/TXT format
  return [
    {
      cpf: '12345678901',
      proposal_id: 'PROP001',
      amount: 1000,
      date: new Date().toISOString(),
    },
    {
      cpf: '12345678902',
      proposal_id: 'PROP002',
      amount: 1500,
      date: new Date().toISOString(),
    },
  ];
}