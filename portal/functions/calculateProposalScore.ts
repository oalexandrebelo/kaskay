import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { proposal_id } = await req.json();

        if (!proposal_id) {
            return Response.json({ error: 'proposal_id required' }, { status: 400 });
        }

        // Buscar proposta e cliente
        const proposal = await base44.asServiceRole.entities.Proposal.filter({ id: proposal_id });
        if (!proposal?.length) {
            return Response.json({ error: 'Proposal not found' }, { status: 404 });
        }

        const prop = proposal[0];
        const client = await base44.asServiceRole.entities.Client.filter({ full_name: prop.client_name });
        const clientData = client?.[0];

        // Cálculo de score (0-100)
        let score = 50; // base

        // Fatores positivos
        if (clientData?.gross_salary >= 5000) score += 10;
        if (clientData?.gross_salary >= 10000) score += 10;
        if (prop.requested_amount <= (clientData?.available_margin || 0)) score += 15;
        
        // Histórico de pagamento
        const payments = await base44.asServiceRole.entities.Installment.filter({ 
            client_id: clientData?.id 
        });
        const paidOnTime = payments?.filter(p => p.status === 'paid')?.length || 0;
        const totalPayments = payments?.length || 0;
        if (totalPayments > 0) {
            score += (paidOnTime / totalPayments) * 20;
        }

        // CPF válido check
        if (prop.client_cpf && prop.client_cpf.length === 11) score += 5;

        // Fatores negativos
        const overduePayments = payments?.filter(p => p.status === 'overdue')?.length || 0;
        if (overduePayments > 0) score -= overduePayments * 10;

        const finalScore = Math.max(0, Math.min(100, Math.round(score)));

        // Salvar score
        await base44.asServiceRole.entities.FraudScore.create({
            proposal_id,
            client_id: clientData?.id,
            decision_score: finalScore,
            decision_result: finalScore >= 70 ? 'approved' : finalScore >= 50 ? 'manual_review' : 'rejected',
            details: {
                salary_check: clientData?.gross_salary >= 5000,
                margin_available: prop.requested_amount <= (clientData?.available_margin || 0),
                payment_history: `${paidOnTime}/${totalPayments} on time`,
                overdue_count: overduePayments
            }
        });

        // Atualizar proposta com score
        await base44.asServiceRole.entities.Proposal.update(prop.id, {
            decision_score: finalScore,
            decision_result: finalScore >= 70 ? 'approved' : finalScore >= 50 ? 'manual_review' : 'rejected'
        });

        return Response.json({ 
            score: finalScore,
            result: finalScore >= 70 ? 'approved' : finalScore >= 50 ? 'manual_review' : 'rejected'
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});