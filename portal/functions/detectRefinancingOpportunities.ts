import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar propostas desembolsadas
    const proposals = await base44.asServiceRole.entities.Proposal.filter({
      status: 'disbursed',
    });

    const installments = await base44.asServiceRole.entities.Installment.list();
    const clients = await base44.asServiceRole.entities.Client.list();

    const opportunities = [];
    const today = new Date();

    for (const proposal of proposals) {
      // Buscar parcelas desta proposta
      const proposalInstallments = installments.filter(i => i.proposal_id === proposal.id);
      
      const paidInstallments = proposalInstallments.filter(i => i.status === 'paid');
      const pendingInstallments = proposalInstallments.filter(i => i.status === 'pending');
      
      const totalInstallments = proposalInstallments.length;
      const installmentsPaid = paidInstallments.length;
      const paymentProgress = totalInstallments > 0 ? (installmentsPaid / totalInstallments) * 100 : 0;

      // Calcular saldo devedor
      const currentBalance = pendingInstallments.reduce((sum, i) => sum + (i.expected_amount || 0), 0);

      // === REGRAS DE REFINANCIAMENTO ===

      // 1. Refin por taxa reduzida (cliente bom pagador)
      const minInstallmentsForRateReduction = 6;
      const hasOverdue = proposalInstallments.some(i => {
        const dueDate = new Date(i.due_date);
        return dueDate < today && i.status !== 'paid';
      });

      if (installmentsPaid >= minInstallmentsForRateReduction && !hasOverdue && paymentProgress >= 40) {
        const currentRate = proposal.interest_rate || 2.5;
        const suggestedRate = currentRate * 0.85; // 15% de redução
        const refinAmount = currentBalance;

        opportunities.push({
          client_id: proposal.client_id,
          client_cpf: proposal.client_cpf,
          client_name: proposal.client_name,
          current_proposal_id: proposal.id,
          current_balance: currentBalance,
          installments_paid: installmentsPaid,
          total_installments: totalInstallments,
          payment_progress: paymentProgress,
          current_rate: currentRate,
          suggested_rate: suggestedRate,
          refinancing_amount: refinAmount,
          cashout_amount: 0,
          refin_type: 'rate_reduction',
          opportunity_score: 85,
          min_installments_required: minInstallmentsForRateReduction,
          status: 'detected',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        });
      }

      // 2. Refin com troco (cashout)
      const minInstallmentsForCashout = 8;
      const minCashoutAmount = 500; // R$ 500 mínimo de troco

      if (installmentsPaid >= minInstallmentsForCashout && !hasOverdue && paymentProgress >= 50) {
        const client = clients.find(c => c.id === proposal.client_id);
        const availableMargin = client?.available_margin || 0;
        
        if (availableMargin > currentBalance + minCashoutAmount) {
          const cashoutAmount = (availableMargin - currentBalance) * 0.7; // 70% do disponível
          const refinAmount = currentBalance + cashoutAmount;

          if (cashoutAmount >= minCashoutAmount) {
            opportunities.push({
              client_id: proposal.client_id,
              client_cpf: proposal.client_cpf,
              client_name: proposal.client_name,
              current_proposal_id: proposal.id,
              current_balance: currentBalance,
              installments_paid: installmentsPaid,
              total_installments: totalInstallments,
              payment_progress: paymentProgress,
              current_rate: proposal.interest_rate || 2.5,
              suggested_rate: proposal.interest_rate || 2.5,
              refinancing_amount: refinAmount,
              cashout_amount: cashoutAmount,
              refin_type: 'cashout',
              opportunity_score: 75,
              min_installments_required: minInstallmentsForCashout,
              status: 'detected',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }
      }

      // 3. Refin para recuperação de inadimplência
      if (hasOverdue && installmentsPaid >= 3) {
        const overdueAmount = proposalInstallments
          .filter(i => {
            const dueDate = new Date(i.due_date);
            return dueDate < today && i.status !== 'paid';
          })
          .reduce((sum, i) => sum + (i.expected_amount || 0), 0);

        const suggestedRate = (proposal.interest_rate || 2.5) * 0.75; // 25% de redução para incentivar

        opportunities.push({
          client_id: proposal.client_id,
          client_cpf: proposal.client_cpf,
          client_name: proposal.client_name,
          current_proposal_id: proposal.id,
          current_balance: currentBalance,
          installments_paid: installmentsPaid,
          total_installments: totalInstallments,
          payment_progress: paymentProgress,
          current_rate: proposal.interest_rate || 2.5,
          suggested_rate: suggestedRate,
          refinancing_amount: currentBalance,
          cashout_amount: 0,
          refin_type: 'delinquency_recovery',
          opportunity_score: 60,
          min_installments_required: 3,
          status: 'detected',
          expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias
          notes: `Cliente com ${overdueAmount.toFixed(2)} em atraso. Oportunidade de regularização.`,
        });
      }
    }

    // Salvar oportunidades detectadas
    for (const opp of opportunities) {
      // Verificar se já existe
      const existing = await base44.asServiceRole.entities.RefinancingOpportunity.filter({
        current_proposal_id: opp.current_proposal_id,
        refin_type: opp.refin_type,
        status: 'detected',
      });

      if (existing.length === 0) {
        await base44.asServiceRole.entities.RefinancingOpportunity.create(opp);
      }
    }

    return Response.json({
      success: true,
      opportunities_detected: opportunities.length,
      breakdown: {
        rate_reduction: opportunities.filter(o => o.refin_type === 'rate_reduction').length,
        cashout: opportunities.filter(o => o.refin_type === 'cashout').length,
        delinquency_recovery: opportunities.filter(o => o.refin_type === 'delinquency_recovery').length,
      },
    });

  } catch (error) {
    console.error('Refinancing Detection Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});