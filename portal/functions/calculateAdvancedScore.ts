import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { client_id, proposal_id } = body;

    if (!client_id && !proposal_id) {
      return Response.json({ error: 'Missing client_id or proposal_id' }, { status: 400 });
    }

    // Get client and proposal data
    const clients = await base44.asServiceRole.entities.Client.list();
    const proposals = await base44.asServiceRole.entities.Proposal.list();
    const installments = await base44.asServiceRole.entities.Installment.list();

    const client = clients.find(c => c.id === client_id);
    const proposal = proposals.find(p => p.id === proposal_id);

    if (!client && !proposal) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    const targetCPF = client?.cpf || proposal?.client_cpf;

    // Calculate score components
    const paymentHistory = calculatePaymentHistory(installments, targetCPF);
    const velocityScore = calculateVelocityScore(proposals, targetCPF);
    const stabilityScore = calculateStabilityScore(client);
    const documentScore = await calculateDocumentScore(base44, client_id);

    // Weighted average
    const overallScore = (
      paymentHistory * 0.40 +
      velocityScore * 0.20 +
      stabilityScore * 0.25 +
      documentScore * 0.15
    );

    // Risk level
    let riskLevel = 'low';
    if (overallScore < 40) riskLevel = 'critical';
    else if (overallScore < 55) riskLevel = 'high';
    else if (overallScore < 70) riskLevel = 'medium';
    else if (overallScore < 85) riskLevel = 'low';
    else riskLevel = 'very_low';

    // Action recommendation
    let action = 'approve';
    if (riskLevel === 'critical') action = 'block';
    else if (riskLevel === 'high') action = 'reject';
    else if (riskLevel === 'medium') action = 'manual_review';

    const scoreData = {
      entity_type: proposal_id ? 'Proposal' : 'Client',
      entity_id: proposal_id || client_id,
      client_cpf: targetCPF,
      overall_score: Math.round(overallScore),
      risk_level: riskLevel,
      action_taken: action,
      analyzed_at: new Date().toISOString(),
      fraud_indicators: [],
    };

    // Save score
    const savedScore = await base44.asServiceRole.entities.FraudScore.create(scoreData);

    return Response.json({
      score_id: savedScore.id,
      overall_score: Math.round(overallScore),
      risk_level: riskLevel,
      action: action,
      components: {
        payment_history: Math.round(paymentHistory),
        velocity: Math.round(velocityScore),
        stability: Math.round(stabilityScore),
        documents: Math.round(documentScore),
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculatePaymentHistory(installments, cpf) {
  const clientInstallments = installments.filter(i => i.client_cpf === cpf);
  
  if (clientInstallments.length === 0) return 70; // Neutral for new clients

  const paid = clientInstallments.filter(i => i.status === 'paid').length;
  const overdue = clientInstallments.filter(i => i.status === 'overdue').length;
  const defaulted = clientInstallments.filter(i => i.status === 'defaulted').length;

  const total = clientInstallments.length;
  const paymentRate = (paid / total) * 100;

  // Penalize defaults heavily
  return Math.max(0, paymentRate - (defaulted * 15) - (overdue * 5));
}

function calculateVelocityScore(proposals, cpf) {
  const now = new Date();
  const last24h = proposals.filter(p => 
    p.client_cpf === cpf && 
    (now - new Date(p.created_date)) < 24 * 60 * 60 * 1000
  ).length;

  const last7d = proposals.filter(p => 
    p.client_cpf === cpf && 
    (now - new Date(p.created_date)) < 7 * 24 * 60 * 60 * 1000
  ).length;

  // High velocity = fraud risk
  if (last24h > 3) return 20;
  if (last24h > 1) return 50;
  if (last7d > 5) return 40;
  if (last7d > 2) return 60;

  return 85; // Normal velocity
}

function calculateStabilityScore(client) {
  if (!client) return 50;

  let score = 70;

  // Employer stability
  if (client.employer_type === 'federal') score += 15;
  else if (client.employer_type === 'estadual') score += 10;
  else if (client.employer_type === 'municipal') score += 5;

  // Salary level
  if (client.gross_salary > 5000) score += 10;
  else if (client.gross_salary > 3000) score += 5;

  return Math.min(100, score);
}

async function calculateDocumentScore(base44, client_id) {
  if (!client_id) return 50;

  try {
    const docs = await base44.asServiceRole.entities.Document.filter({ entity_id: client_id });
    
    if (docs.length === 0) return 30; // No docs = risk

    const approved = docs.filter(d => d.status === 'approved').length;
    const total = docs.length;

    return (approved / total) * 100;
  } catch {
    return 50;
  }
}