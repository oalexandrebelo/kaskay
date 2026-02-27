import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { client_id } = body;

    if (!client_id) {
      return Response.json({ error: 'Missing client_id' }, { status: 400 });
    }

    // Get client and historical data
    const clients = await base44.asServiceRole.entities.Client.list();
    const client = clients.find(c => c.id === client_id);

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const proposals = await base44.asServiceRole.entities.Proposal.list();
    const installments = await base44.asServiceRole.entities.Installment.list();
    const interactions = await base44.asServiceRole.entities.Interaction.list();

    const clientProposals = proposals.filter(p => p.client_cpf === client.cpf);
    const clientInstallments = installments.filter(i => i.client_cpf === client.cpf);
    const clientInteractions = interactions.filter(i => i.client_id === client_id);

    // Feature engineering
    const daysSinceLastProposal = clientProposals.length > 0 
      ? Math.floor((new Date() - new Date(clientProposals[0].created_date)) / (1000 * 60 * 60 * 24))
      : 999;

    const paymentIssues = clientInstallments.filter(i => i.status === 'overdue' || i.status === 'defaulted').length;
    const totalProposals = clientProposals.length;
    const daysSinceLastInteraction = clientInteractions.length > 0
      ? Math.floor((new Date() - new Date(clientInteractions[0].created_date)) / (1000 * 60 * 60 * 24))
      : 999;

    // Simple churn prediction model (ML would be better in production)
    let churnScore = 0;

    // Recency factors
    if (daysSinceLastProposal > 180) churnScore += 30;
    else if (daysSinceLastProposal > 90) churnScore += 15;
    else if (daysSinceLastProposal > 60) churnScore += 5;

    // Payment behavior
    if (paymentIssues > 2) churnScore += 25;
    else if (paymentIssues > 0) churnScore += 10;

    // Engagement
    if (daysSinceLastInteraction > 90) churnScore += 20;
    else if (daysSinceLastInteraction > 30) churnScore += 10;

    // Loyalty (low proposals = higher churn risk)
    if (totalProposals === 1) churnScore += 15;
    else if (totalProposals === 2) churnScore += 5;
    else churnScore -= 10; // Loyal customers

    churnScore = Math.max(0, Math.min(100, churnScore));

    let churnRisk = 'low';
    if (churnScore > 70) churnRisk = 'critical';
    else if (churnScore > 50) churnRisk = 'high';
    else if (churnScore > 30) churnRisk = 'medium';

    // Recommended actions
    const actions = [];
    if (daysSinceLastProposal > 60) actions.push('Enviar oferta personalizada');
    if (paymentIssues > 0) actions.push('Revisar histórico de pagamento');
    if (daysSinceLastInteraction > 30) actions.push('Engajar via WhatsApp');
    if (churnScore > 70) actions.push('Ativar campanha de retenção urgente');

    return Response.json({
      client_id,
      client_name: client.full_name,
      churn_score: churnScore,
      churn_risk: churnRisk,
      features: {
        days_since_last_proposal: daysSinceLastProposal,
        payment_issues: paymentIssues,
        total_proposals: totalProposals,
        days_since_last_interaction: daysSinceLastInteraction,
      },
      recommended_actions: actions,
      predicted_at: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});