import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { period, employer } = await req.json();

    // Validação
    if (!period) {
      return Response.json({ error: 'Período obrigatório (YYYY-MM)' }, { status: 400 });
    }

    // Buscar arquivos de remessa e retorno do período
    const payrollFiles = await base44.asServiceRole.entities.PayrollFile.filter({ period });
    const remessaFile = payrollFiles.find(f => f.file_type === 'remessa' && (!employer || f.employer === employer));
    const retornoFile = payrollFiles.find(f => f.file_type === 'retorno' && (!employer || f.employer === employer));

    if (!remessaFile) {
      return Response.json({ error: 'Arquivo de remessa não encontrado', status: 'missing_remessa' }, { status: 404 });
    }

    if (!retornoFile) {
      return Response.json({ error: 'Arquivo de retorno não encontrado', status: 'missing_retorno' }, { status: 404 });
    }

    // Buscar propostas e parcelas do período
    const proposals = await base44.asServiceRole.entities.Proposal.filter({
      status: 'disbursed',
    });

    const installments = await base44.asServiceRole.entities.Installment.list();

    // === LÓGICA DE CONCILIAÇÃO ===
    const reconciliation = {
      period,
      employer: remessaFile.employer,
      remessa_file_id: remessaFile.id,
      retorno_file_id: retornoFile.id,
      remessa_total: remessaFile.total_amount || 0,
      remessa_records: remessaFile.total_records || 0,
      retorno_total: retornoFile.total_amount || 0,
      retorno_records: retornoFile.total_records || 0,
      matched_records: 0,
      matched_amount: 0,
      divergencies: [],
      status: 'reconciling',
    };

    // Simular parsing dos arquivos (em produção, ler CSV/TXT)
    const remessaRecords = [];
    const retornoRecords = [];

    // Criar registros simulados baseados em parcelas reais
    const periodStart = new Date(period + '-01');
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const relevantInstallments = installments.filter(inst => {
      const dueDate = new Date(inst.due_date);
      return dueDate >= periodStart && dueDate < periodEnd && inst.status === 'pending';
    });

    relevantInstallments.forEach(inst => {
      const proposal = proposals.find(p => p.id === inst.proposal_id);
      if (proposal) {
        remessaRecords.push({
          cpf: inst.client_cpf,
          proposal_id: inst.proposal_id,
          amount: inst.expected_amount,
          installment_id: inst.id,
        });

        // Simular retorno (95% com sucesso)
        if (Math.random() > 0.05) {
          retornoRecords.push({
            cpf: inst.client_cpf,
            proposal_id: inst.proposal_id,
            amount: inst.expected_amount,
            installment_id: inst.id,
            status: 'paid',
          });
        }
      }
    });

    // === ANÁLISE DE DIVERGÊNCIAS ===
    for (const remessa of remessaRecords) {
      const retorno = retornoRecords.find(r =>
        r.cpf === remessa.cpf &&
        r.proposal_id === remessa.proposal_id &&
        r.installment_id === remessa.installment_id
      );

      if (!retorno) {
        // NÃO RETORNOU - pagamento não efetuado
        reconciliation.divergencies.push({
          type: 'missing_return',
          cpf: remessa.cpf,
          proposal_id: remessa.proposal_id,
          installment_id: remessa.installment_id,
          remessa_amount: remessa.amount,
          retorno_amount: 0,
          description: 'Desconto enviado mas não retornado - verificar com órgão',
        });

        // Criar issue de pagamento
        await base44.asServiceRole.entities.PaymentIssue.create({
          proposal_id: remessa.proposal_id,
          installment_id: remessa.installment_id,
          client_cpf: remessa.cpf,
          employer: remessaFile.employer,
          issue_type: 'non_payment',
          severity: 'high',
          outstanding_amount: remessa.amount,
          days_overdue: 1,
          status: 'open',
          collection_strategy: 'contact_employer',
        });
      } else {
        // RETORNOU - verificar valor
        if (Math.abs(retorno.amount - remessa.amount) > 0.01) {
          reconciliation.divergencies.push({
            type: 'amount_mismatch',
            cpf: remessa.cpf,
            proposal_id: remessa.proposal_id,
            installment_id: remessa.installment_id,
            remessa_amount: remessa.amount,
            retorno_amount: retorno.amount,
            description: `Valor divergente: R$ ${remessa.amount.toFixed(2)} (enviado) vs R$ ${retorno.amount.toFixed(2)} (retornado)`,
          });
        } else {
          // MATCH PERFEITO
          reconciliation.matched_records++;
          reconciliation.matched_amount += retorno.amount;

          // Atualizar parcela como paga
          await base44.asServiceRole.entities.Installment.update(remessa.installment_id, {
            status: 'paid',
            paid_amount: retorno.amount,
            paid_date: new Date().toISOString(),
          });
        }
      }
    }

    // Verificar registros extras no retorno (não enviados na remessa)
    for (const retorno of retornoRecords) {
      const remessa = remessaRecords.find(r =>
        r.cpf === retorno.cpf &&
        r.proposal_id === retorno.proposal_id &&
        r.installment_id === retorno.installment_id
      );

      if (!remessa) {
        reconciliation.divergencies.push({
          type: 'extra_return',
          cpf: retorno.cpf,
          proposal_id: retorno.proposal_id,
          installment_id: retorno.installment_id,
          remessa_amount: 0,
          retorno_amount: retorno.amount,
          description: 'Desconto retornado mas não enviado - verificar origem',
        });
      }
    }

    // === CALCULAR VARIAÇÃO ===
    const variance_amount = reconciliation.remessa_total - reconciliation.matched_amount;
    const variance_percentage = reconciliation.remessa_total > 0
      ? (variance_amount / reconciliation.remessa_total) * 100
      : 0;

    reconciliation.variance_amount = variance_amount;
    reconciliation.variance_percentage = variance_percentage;

    // Status final
    if (reconciliation.divergencies.length === 0) {
      reconciliation.status = 'reconciled';
    } else if (Math.abs(variance_percentage) > 5) {
      reconciliation.status = 'with_divergencies';
    } else {
      reconciliation.status = 'reconciled';
    }

    // Salvar reconciliação
    const savedRec = await base44.asServiceRole.entities.FinancialReconciliation.create(reconciliation);

    // === CRIAR ALERTAS SE NECESSÁRIO ===
    if (Math.abs(variance_percentage) > 5) {
      await base44.asServiceRole.entities.Alert.create({
        alert_type: 'reconciliation_divergence',
        severity: variance_percentage > 10 ? 'critical' : 'high',
        title: `Divergência na conciliação - ${remessaFile.employer}`,
        description: `Variação de ${variance_percentage.toFixed(2)}% no período ${period}. ${reconciliation.divergencies.length} divergências detectadas.`,
        metrics: {
          period,
          employer: remessaFile.employer,
          remessa_total: reconciliation.remessa_total,
          matched_amount: reconciliation.matched_amount,
          variance_amount,
          variance_percentage,
          divergencies_count: reconciliation.divergencies.length,
        },
        related_entity_id: savedRec.id,
        related_entity_type: 'FinancialReconciliation',
        status: 'active',
        action_required: true,
        suggested_action: 'Revisar divergências e contatar órgão empregador',
        triggered_at: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      reconciliation_id: savedRec.id,
      status: reconciliation.status,
      period,
      employer: remessaFile.employer,
      summary: {
        remessa_total: reconciliation.remessa_total,
        remessa_records: reconciliation.remessa_records,
        matched_amount: reconciliation.matched_amount,
        matched_records: reconciliation.matched_records,
        variance_amount,
        variance_percentage: variance_percentage.toFixed(2),
        divergencies_count: reconciliation.divergencies.length,
      },
      divergencies: reconciliation.divergencies,
    });

  } catch (error) {
    console.error('Auto Reconciliation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});