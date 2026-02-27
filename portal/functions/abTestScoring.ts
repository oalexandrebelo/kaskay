import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { proposal_id } = await req.json();

        if (!proposal_id) {
            return Response.json({ error: 'proposal_id required' }, { status: 400 });
        }

        const proposal = await base44.asServiceRole.entities.Proposal.filter({ id: proposal_id });
        if (!proposal?.length) {
            return Response.json({ error: 'Not found' }, { status: 404 });
        }

        const prop = proposal[0];
        const client = await base44.asServiceRole.entities.Client.filter({ full_name: prop.client_name });
        const clientData = client?.[0];

        // MODELO A (Atual)
        let scoreA = 50;
        if (clientData?.gross_salary >= 5000) scoreA += 10;
        if (clientData?.gross_salary >= 10000) scoreA += 10;
        if (prop.requested_amount <= (clientData?.available_margin || 0)) scoreA += 15;

        const payments = await base44.asServiceRole.entities.Installment.filter({ 
            client_id: clientData?.id 
        });
        const paidOnTime = payments?.filter(p => p.status === 'paid')?.length || 0;
        const totalPayments = payments?.length || 0;
        if (totalPayments > 0) scoreA += (paidOnTime / totalPayments) * 20;

        const overduePayments = payments?.filter(p => p.status === 'overdue')?.length || 0;
        if (overduePayments > 0) scoreA -= overduePayments * 10;

        scoreA = Math.max(0, Math.min(100, Math.round(scoreA)));

        // MODELO B (Novo - dá mais peso ao histórico de pagamento)
        let scoreB = 50;
        if (clientData?.gross_salary >= 5000) scoreB += 8;
        if (clientData?.gross_salary >= 10000) scoreB += 8;
        if (prop.requested_amount <= (clientData?.available_margin || 0)) scoreB += 12;

        if (totalPayments > 0) {
            scoreB += (paidOnTime / totalPayments) * 30; // Mais peso ao histórico
        }

        if (overduePayments > 0) scoreB -= overduePayments * 15; // Penalidade maior

        scoreB = Math.max(0, Math.min(100, Math.round(scoreB)));

        // Registrar teste
        await base44.asServiceRole.entities.OrchestrationLog.create({
            orchestration_id: `ab_test_${proposal_id}`,
            status: 'completed',
            log_details: {
                proposal_id,
                model_a_score: scoreA,
                model_b_score: scoreB,
                difference: Math.abs(scoreA - scoreB),
                test_date: new Date().toISOString(),
                model_a_result: scoreA >= 70 ? 'approved' : scoreA >= 50 ? 'manual_review' : 'rejected',
                model_b_result: scoreB >= 70 ? 'approved' : scoreB >= 50 ? 'manual_review' : 'rejected'
            },
            created_date: new Date().toISOString()
        });

        // Usar modelo mais conservador (B) por enquanto
        const finalScore = scoreB;
        const result = finalScore >= 70 ? 'approved' : finalScore >= 50 ? 'manual_review' : 'rejected';

        await base44.asServiceRole.entities.Proposal.update(prop.id, {
            decision_score: finalScore,
            decision_result: result
        });

        return Response.json({ 
            scoreA,
            scoreB,
            winner: scoreB > scoreA ? 'Model B' : 'Model A',
            final_score: finalScore,
            final_result: result
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});